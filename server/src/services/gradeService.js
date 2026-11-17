const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Letter grade calculation from total score out of 100
 */
function calculateLetterGrade(total) {
  const score = parseFloat(total);
  if (isNaN(score)) return 'F';
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Standard subjects taught at Kunuuzul-Jannaa-Markaz
 */
const DEFAULT_SUBJECTS = [
  'Qurana Hifzii',
  'Qurana Tilaawaa',
  'Tajweed',
  'Aqiidaa fi Akhlaaqa',
  'Fiqhi',
  'Afaan Arabaa',
];

/**
 * M9: Grades and Report Cards Service
 */
class GradeService {
  /**
   * Save or update marks for a student in a subject and term
   */
  async recordGrade({
    student_id,
    subject,
    term,
    academic_year_id,
    mid_mark = 0,
    assignment_mark = 0,
    quiz_mark = 0,
    test_mark = 0,
    final_mark = 0,
    teacher_id,
    remark,
    user_id,
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clamp numeric values to bounds
      const mid = Math.min(20, Math.max(0, parseFloat(mid_mark) || 0));
      const assignment = Math.min(10, Math.max(0, parseFloat(assignment_mark) || 0));
      const quiz = Math.min(10, Math.max(0, parseFloat(quiz_mark) || 0));
      const test = Math.min(20, Math.max(0, parseFloat(test_mark) || 0));
      const finalVal = Math.min(40, Math.max(0, parseFloat(final_mark) || 0));
      const total = mid + assignment + quiz + test + finalVal;
      const letter = calculateLetterGrade(total);

      // Check if record already exists
      const [existing] = await connection.query(
        `SELECT id, is_locked, mid_mark, assignment_mark, quiz_mark, test_mark, final_mark, total_mark, letter_grade 
         FROM grades 
         WHERE student_id = ? AND academic_year_id = ? AND term = ? AND subject = ?`,
        [student_id, academic_year_id, term, subject]
      );

      let recordId;
      if (existing.length > 0) {
        if (existing[0].is_locked) {
          throw new Error('This term and subject is locked. Marks cannot be changed.');
        }

        recordId = existing[0].id;
        await connection.query(
          `UPDATE grades 
           SET mid_mark = ?, assignment_mark = ?, quiz_mark = ?, test_mark = ?, final_mark = ?,
               letter_grade = ?, teacher_id = ?, remark = ?
           WHERE id = ?`,
          [mid, assignment, quiz, test, finalVal, letter, teacher_id || 1, remark || null, recordId]
        );

        await logAudit({
          actor_id: user_id || 1,
          action: 'UPDATE',
          table_name: 'grades',
          record_id: recordId,
          old_values: { mid_mark: existing[0].mid_mark, final_mark: existing[0].final_mark, total: existing[0].total_mark },
          new_values: { mid_mark: mid, final_mark: finalVal, total_mark: total, letter_grade: letter },
          connection,
        });
      } else {
        const [insertRes] = await connection.query(
          `INSERT INTO grades 
           (student_id, subject, term, academic_year_id, mid_mark, assignment_mark, quiz_mark, test_mark, final_mark, letter_grade, teacher_id, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [student_id, subject, term, academic_year_id, mid, assignment, quiz, test, finalVal, letter, teacher_id || 1, remark || null]
        );
        recordId = insertRes.insertId;

        await logAudit({
          actor_id: user_id || 1,
          action: 'CREATE',
          table_name: 'grades',
          record_id: recordId,
          old_values: null,
          new_values: { student_id, subject, term, total_mark: total, letter_grade: letter },
          connection,
        });
      }

      await connection.commit();

      return {
        id: recordId,
        student_id,
        subject,
        term,
        mid_mark: mid,
        assignment_mark: assignment,
        quiz_mark: quiz,
        test_mark: test,
        final_mark: finalVal,
        total_mark: total,
        letter_grade: letter,
        remark,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Save batch marks for an entire section in a subject and term
   */
  async recordBatchSectionGrades({ section_id, subject, term, academic_year_id, grades, teacher_id, user_id }) {
    const results = [];
    for (const g of grades) {
      const res = await this.recordGrade({
        student_id: g.student_id,
        subject,
        term,
        academic_year_id,
        mid_mark: g.mid_mark,
        assignment_mark: g.assignment_mark,
        quiz_mark: g.quiz_mark,
        test_mark: g.test_mark,
        final_mark: g.final_mark,
        teacher_id,
        remark: g.remark,
        user_id,
      });
      results.push(res);
    }
    return { success: true, count: results.length, subject, term, results };
  }

  /**
   * Get Section Marks Grid for a specific subject and term
   */
  async getSectionGrades(sectionId, { subject, term, academic_year_id }) {
    const [students] = await pool.query(
      `SELECT s.id, s.registration_number, s.full_name, s.sex,
              g.id AS grade_id, g.mid_mark, g.assignment_mark, g.quiz_mark, g.test_mark, g.final_mark,
              g.total_mark, g.letter_grade, g.remark, g.is_locked
       FROM students s
       LEFT JOIN grades g ON g.student_id = s.id 
          AND g.subject = ? 
          AND g.term = ? 
          AND (? IS NULL OR g.academic_year_id = ?)
       WHERE s.section_id = ? AND s.status = 'active'
       ORDER BY s.full_name ASC`,
      [subject || DEFAULT_SUBJECTS[0], term || 'Term 1', academic_year_id || null, academic_year_id || null, sectionId]
    );

    return {
      section_id: parseInt(sectionId, 10),
      subject: subject || DEFAULT_SUBJECTS[0],
      term: term || 'Term 1',
      students,
    };
  }

  /**
   * Get full printable Report Card for a student
   */
  async getStudentReportCard(studentId, { term, academic_year_id } = {}) {
    const targetTerm = term || 'Term 1';

    // Student profile
    const [students] = await pool.query(
      `SELECT s.id, s.registration_number, s.full_name, s.sex, s.current_juz, s.current_page, s.current_surah, s.current_ayah,
              sec.name AS section_name, l.name AS level_name, l.code AS level_code,
              g.full_name AS guardian_name, g.primary_phone AS guardian_phone
       FROM students s
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN levels l ON s.level_id = l.id
       LEFT JOIN guardians g ON s.guardian_id = g.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (students.length === 0) throw new Error('Student not found');
    const student = students[0];

    // Subject grades
    const [grades] = await pool.query(
      `SELECT g.*, t.full_name AS teacher_name
       FROM grades g
       LEFT JOIN teachers t ON g.teacher_id = t.id
       WHERE g.student_id = ? AND g.term = ?
       ORDER BY g.subject ASC`,
      [studentId, targetTerm]
    );

    // Calculate overall average
    const totalPossible = grades.length * 100;
    const totalEarned = grades.reduce((acc, g) => acc + (parseFloat(g.total_mark) || 0), 0);
    const averageScore = grades.length > 0 ? (totalEarned / grades.length).toFixed(1) : 0;
    const overallGrade = calculateLetterGrade(averageScore);

    return {
      student,
      term: targetTerm,
      grades,
      summary: {
        subjects_count: grades.length,
        total_score: totalEarned,
        total_possible: totalPossible,
        average_score: parseFloat(averageScore),
        overall_letter_grade: overallGrade,
      },
      default_subjects: DEFAULT_SUBJECTS,
    };
  }

  /**
   * Lock or unlock marks for a term
   */
  async setTermLock({ academic_year_id, term, is_locked, user_id }) {
    await pool.query(
      'UPDATE grades SET is_locked = ? WHERE academic_year_id = ? AND term = ?',
      [Boolean(is_locked), academic_year_id, term]
    );

    await logAudit({
      actor_id: user_id || 1,
      action: 'UPDATE',
      table_name: 'grades',
      record_id: 0,
      old_values: null,
      new_values: { term, is_locked: Boolean(is_locked) },
    });

    return { success: true, term, is_locked: Boolean(is_locked) };
  }
}

module.exports = new GradeService();
