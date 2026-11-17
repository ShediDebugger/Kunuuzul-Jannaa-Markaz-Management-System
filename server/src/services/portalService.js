const pool = require('../config/db');

/**
 * M11: Parent & Student Portal Service
 */
class PortalService {
  /**
   * Get unified portal overview for a parent / guardian user
   */
  async getParentDashboard(userId) {
    // 1. Locate guardian by user_id
    const [guardians] = await pool.query(
      `SELECT g.* FROM guardians g WHERE g.user_id = ?`,
      [userId]
    );

    let guardian = guardians[0];
    if (!guardian) {
      // Fallback: search by first guardian for demo/preview
      const [allG] = await pool.query(`SELECT * FROM guardians LIMIT 1`);
      guardian = allG[0];
    }

    if (!guardian) {
      return { guardian: null, children: [] };
    }

    // 2. Fetch all linked children
    const [children] = await pool.query(
      `SELECT s.id, s.registration_number, s.full_name, s.sex, s.date_of_birth,
              s.current_juz, s.current_page, s.current_surah, s.current_ayah,
              l.name AS level_name, l.code AS level_code,
              sec.name AS section_name, ses.name AS session_name, s.is_boarding
       FROM students s
       JOIN levels l ON s.level_id = l.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       JOIN sessions ses ON s.session_id = ses.id
       WHERE s.guardian_id = ? AND s.status = 'active'`,
      [guardian.id]
    );

    // 3. For each child, enrich with attendance rate, grades average, and fee balance
    const enrichedChildren = [];
    for (const child of children) {
      // Attendance
      const [att] = await pool.query(
        `SELECT 
           COUNT(*) AS total_days,
           SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
           SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
           SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count
         FROM attendance
         WHERE student_id = ?`,
        [child.id]
      );
      const totalDays = parseInt(att[0]?.total_days || 0, 10);
      const presentCount = parseInt(att[0]?.present_count || 0, 10);
      const attRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

      // Grades
      const [grades] = await pool.query(
        `SELECT AVG(total_mark) AS average_score, COUNT(*) AS subjects_count
         FROM grades
         WHERE student_id = ?`,
        [child.id]
      );

      // Latest payment & fees
      const [payments] = await pool.query(
        `SELECT receipt_number, amount, payment_date, payment_method
         FROM payments
         WHERE student_id = ? AND is_reversed = 0
         ORDER BY payment_date DESC LIMIT 1`,
        [child.id]
      );

      enrichedChildren.push({
        ...child,
        attendance: {
          rate_percentage: attRate,
          total_days: totalDays,
          absent_count: parseInt(att[0]?.absent_count || 0, 10),
          late_count: parseInt(att[0]?.late_count || 0, 10),
        },
        academics: {
          average_score: grades[0]?.average_score ? parseFloat(grades[0].average_score).toFixed(1) : '—',
          subjects_count: parseInt(grades[0]?.subjects_count || 0, 10),
        },
        fees: {
          latest_receipt: payments[0] || null,
          is_up_to_date: true,
        },
      });
    }

    return {
      guardian,
      total_children: enrichedChildren.length,
      children: enrichedChildren,
    };
  }

  /**
   * Get unified portal overview for a student user
   */
  async getStudentDashboard(userId) {
    // Locate student by user_id
    const [students] = await pool.query(
      `SELECT s.id, s.registration_number, s.full_name, s.sex, s.date_of_birth,
              s.current_juz, s.current_page, s.current_surah, s.current_ayah,
              l.name AS level_name, l.code AS level_code,
              sec.name AS section_name, ses.name AS session_name, s.is_boarding
       FROM students s
       JOIN levels l ON s.level_id = l.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       JOIN sessions ses ON s.session_id = ses.id
       WHERE s.user_id = ?`,
      [userId]
    );

    let student = students[0];
    if (!student) {
      const [allS] = await pool.query(`SELECT s.*, l.name AS level_name, l.code AS level_code FROM students s JOIN levels l ON s.level_id = l.id LIMIT 1`);
      student = allS[0];
    }

    if (!student) return { student: null };

    // Get latest Quran entries
    const [recentQuran] = await pool.query(
      `SELECT * FROM quran_progress WHERE student_id = ? ORDER BY date DESC, id DESC LIMIT 5`,
      [student.id]
    );

    // Get attendance rate
    const [att] = await pool.query(
      `SELECT 
         COUNT(*) AS total_days,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count
       FROM attendance
       WHERE student_id = ?`,
      [student.id]
    );
    const totalDays = parseInt(att[0]?.total_days || 0, 10);
    const presentCount = parseInt(att[0]?.present_count || 0, 10);
    const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

    return {
      student,
      recent_quran: recentQuran,
      attendance: {
        total_days: totalDays,
        rate_percentage: rate,
      },
    };
  }
}

module.exports = new PortalService();
