const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Standard Quran Juz mapping helper by page number (Standard 604-page Madani Mushaf)
 * 20 pages per Juz approximately (Juz 1: pages 1-21, Juz 2: 22-41, etc.)
 */
function calculateJuzFromPage(page) {
  if (!page || page < 1) return 1;
  if (page > 604) return 30;
  return Math.min(30, Math.max(1, Math.ceil((page - 1) / 20)));
}

/**
 * M8: Quran Progress Service
 * Specifically tracks progress by page number and specific Ayah number where the student stopped.
 */
class QuranProgressService {
  /**
   * Add a new Quran progress entry
   */
  async addProgress({
    student_id,
    date,
    type, // 'new_memorization', 'revision', 'recitation'
    page_number, // specific page number (1-604)
    surah_name, // e.g., 'Al-Baqarah'
    surah_number, // e.g., 2
    ayah_number, // specific ayah number where student stopped
    from_page,
    to_page,
    from_ayah,
    to_ayah,
    from_unit,
    to_unit,
    juz_number,
    evaluation, // 'Mumtaz', 'Jayyid Jiddan', 'Jayyid', 'Maqbool', 'Daif'
    teacher_id,
    note,
    user_id,
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const progressDate = date || new Date().toISOString().split('T')[0];
      const pageNum = parseInt(page_number || to_page || 1, 10);
      const ayahNum = parseInt(ayah_number || to_ayah || 1, 10);
      const calculatedJuz = juz_number ? parseInt(juz_number, 10) : calculateJuzFromPage(pageNum);

      // 1. Insert progress entry
      const [insertResult] = await connection.query(
        `INSERT INTO quran_progress 
         (student_id, date, type, page_number, surah_name, surah_number, ayah_number,
          from_page, to_page, from_ayah, to_ayah, from_unit, to_unit, juz_number,
          evaluation, teacher_id, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student_id,
          progressDate,
          type,
          pageNum,
          surah_name || 'Al-Faatiha',
          surah_number || 1,
          ayahNum,
          from_page || pageNum,
          to_page || pageNum,
          from_ayah || 1,
          to_ayah || ayahNum,
          from_unit || `Page ${from_page || pageNum}`,
          to_unit || `Page ${pageNum} (Ayah ${ayahNum})`,
          calculatedJuz,
          evaluation || 'Jayyid',
          teacher_id || 1,
          note || null,
        ]
      );

      // 2. Automatically update student's current Quran coordinates if it's new memorization or recitation
      if (type === 'new_memorization' || type === 'recitation') {
        const [studentRows] = await connection.query(
          'SELECT current_page, current_juz, current_surah, current_ayah FROM students WHERE id = ?',
          [student_id]
        );

        if (studentRows.length > 0) {
          const s = studentRows[0];
          // Update student progress to new coordinates
          await connection.query(
            `UPDATE students 
             SET current_page = ?, current_juz = ?, current_surah = ?, current_ayah = ?
             WHERE id = ?`,
            [pageNum, calculatedJuz, surah_name || s.current_surah, ayahNum, student_id]
          );

          await logAudit({
            actor_id: user_id || 1,
            action: 'UPDATE',
            table_name: 'students',
            record_id: student_id,
            old_values: { current_page: s.current_page, current_juz: s.current_juz, current_ayah: s.current_ayah },
            new_values: { current_page: pageNum, current_juz: calculatedJuz, current_ayah: ayahNum },
            connection,
          });
        }
      }

      // 3. Log audit for the progress entry
      await logAudit({
        actor_id: user_id || 1,
        action: 'CREATE',
        table_name: 'quran_progress',
        record_id: insertResult.insertId,
        old_values: null,
        new_values: {
          student_id,
          date: progressDate,
          type,
          page_number: pageNum,
          surah_name,
          ayah_number: ayahNum,
          evaluation,
        },
        connection,
      });

      await connection.commit();

      return {
        id: insertResult.insertId,
        student_id,
        date: progressDate,
        type,
        page_number: pageNum,
        surah_name,
        ayah_number: ayahNum,
        juz_number: calculatedJuz,
        evaluation,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get student's progress history with pagination and filters
   */
  async getStudentProgress(studentId, { type, limit = 50, page = 1 } = {}) {
    let query = `
      SELECT qp.*, t.full_name AS teacher_name
      FROM quran_progress qp
      LEFT JOIN teachers t ON qp.teacher_id = t.id
      WHERE qp.student_id = ?
    `;
    const params = [studentId];

    if (type) {
      query += ` AND qp.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY qp.date DESC, qp.id DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit, 10), offset);

    const [rows] = await pool.query(query, params);

    // Get student info with current coordinates
    const [students] = await pool.query(
      `SELECT s.id, s.full_name, s.registration_number, s.current_juz, s.current_page, s.current_surah, s.current_ayah,
              sec.name AS section_name, l.name AS level_name, l.code AS level_code
       FROM students s
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN levels l ON s.level_id = l.id
       WHERE s.id = ?`,
      [studentId]
    );

    return {
      student: students[0] || null,
      total: rows.length,
      page: parseInt(page, 10),
      records: rows,
    };
  }

  /**
   * Get latest progress coordinates for all students in a section (Classroom Progress Grid)
   */
  async getSectionProgress(sectionId) {
    const [students] = await pool.query(
      `SELECT s.id, s.registration_number, s.full_name, s.sex,
              s.current_juz, s.current_page, s.current_surah, s.current_ayah,
              (SELECT MAX(date) FROM quran_progress WHERE student_id = s.id) AS last_recorded_date,
              (SELECT evaluation FROM quran_progress WHERE student_id = s.id ORDER BY date DESC, id DESC LIMIT 1) AS last_evaluation,
              (SELECT type FROM quran_progress WHERE student_id = s.id ORDER BY date DESC, id DESC LIMIT 1) AS last_type
       FROM students s
       WHERE s.section_id = ? AND s.status = 'active'
       ORDER BY s.full_name ASC`,
      [sectionId]
    );

    return {
      section_id: parseInt(sectionId, 10),
      total_students: students.length,
      students,
    };
  }

  /**
   * Get Markaz-wide Quran progress summary statistics
   */
  async getInstitutionStats() {
    // Breakdown by Juz distribution
    const [juzDist] = await pool.query(
      `SELECT current_juz, COUNT(*) as count 
       FROM students 
       WHERE status = 'active' 
       GROUP BY current_juz 
       ORDER BY current_juz ASC`
    );

    // Recent progress counts (last 30 days)
    const [recentTypes] = await pool.query(
      `SELECT type, COUNT(*) as count 
       FROM quran_progress 
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY type`
    );

    return {
      juz_distribution: juzDist,
      recent_activity: recentTypes,
    };
  }
}

module.exports = new QuranProgressService();
