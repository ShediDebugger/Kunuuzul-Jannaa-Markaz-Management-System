const pool = require('../config/db');

/**
 * M13: Comprehensive Reports Service
 */
class ReportService {
  /**
   * Get full executive dashboard reports
   */
  async getDashboardReport() {
    // 1. Student Enrollment & Demographics
    const [demographics] = await pool.query(
      `SELECT 
         COUNT(*) AS total_students,
         SUM(CASE WHEN sex = 'male' THEN 1 ELSE 0 END) AS male_students,
         SUM(CASE WHEN sex = 'female' THEN 1 ELSE 0 END) AS female_students,
         SUM(CASE WHEN is_boarding = 1 THEN 1 ELSE 0 END) AS boarding_students,
         SUM(CASE WHEN is_boarding = 0 THEN 1 ELSE 0 END) AS day_students,
         SUM(CASE WHEN support_type = 'independent' THEN 1 ELSE 0 END) AS independent_students,
         SUM(CASE WHEN support_type = 'family_dependent' THEN 1 ELSE 0 END) AS family_dependent_students
       FROM students
       WHERE status = 'active'`
    );

    // 2. Students count by Level
    const [levelDistribution] = await pool.query(
      `SELECT l.id, l.code, l.name, l.track, COUNT(s.id) AS student_count
       FROM levels l
       LEFT JOIN students s ON s.level_id = l.id AND s.status = 'active'
       GROUP BY l.id
       ORDER BY l.id ASC`
    );

    // 3. Students count by Session
    const [sessionDistribution] = await pool.query(
      `SELECT ses.id, ses.name, ses.is_boarding, COUNT(s.id) AS student_count
       FROM sessions ses
       LEFT JOIN students s ON s.session_id = ses.id AND s.status = 'active'
       GROUP BY ses.id
       ORDER BY ses.id ASC`
    );

    // 4. Financial Revenue Summary
    const [financialStats] = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS total_collected,
         COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) AS total_cash,
         COALESCE(SUM(CASE WHEN payment_method = 'e_birr' THEN amount ELSE 0 END), 0) AS total_e_birr,
         COALESCE(SUM(CASE WHEN payment_method = 'cbe' THEN amount ELSE 0 END), 0) AS total_cbe,
         COUNT(*) AS total_receipts
       FROM payments
       WHERE is_reversed = 0`
    );

    // 5. Free Students Count
    const [freeStats] = await pool.query(
      `SELECT 
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_free_count,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_free_count
       FROM free_student_requests`
    );

    // 6. Attendance Summary (This Month)
    const [attendanceStats] = await pool.query(
      `SELECT 
         COUNT(*) AS total_records,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
         SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) AS excused_count
       FROM attendance
       WHERE date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    );

    // 7. Quran Memorization by Juz
    const [juzDistribution] = await pool.query(
      `SELECT current_juz, COUNT(*) AS count
       FROM students
       WHERE status = 'active'
       GROUP BY current_juz
       ORDER BY current_juz ASC`
    );

    const attRecs = parseInt(attendanceStats[0]?.total_records || 0, 10);
    const attPresent = parseInt(attendanceStats[0]?.present_count || 0, 10);
    const monthlyAttendanceRate = attRecs > 0 ? Math.round((attPresent / attRecs) * 100) : 100;

    return {
      demographics: demographics[0] || {},
      levels: levelDistribution,
      sessions: sessionDistribution,
      finance: {
        ...financialStats[0],
        approved_free_count: freeStats[0]?.approved_free_count || 0,
        pending_free_count: freeStats[0]?.pending_free_count || 0,
      },
      attendance: {
        ...attendanceStats[0],
        monthly_rate: monthlyAttendanceRate,
      },
      quran: {
        juz_distribution: juzDistribution,
      },
    };
  }

  /**
   * Export detailed dataset for reports
   */
  async getExportData(reportType) {
    if (reportType === 'students') {
      const [rows] = await pool.query(
        `SELECT s.registration_number, s.full_name, s.sex, s.date_of_birth,
                l.code AS level_code, sec.name AS section_name, ses.name AS session_name,
                s.is_boarding, s.support_type, g.full_name AS guardian_name, g.primary_phone,
                s.current_juz, s.current_page, s.current_surah, s.current_ayah, s.status, s.registration_date
         FROM students s
         JOIN levels l ON s.level_id = l.id
         LEFT JOIN sections sec ON s.section_id = sec.id
         JOIN sessions ses ON s.session_id = ses.id
         JOIN guardians g ON s.guardian_id = g.id
         ORDER BY s.id ASC`
      );
      return rows;
    }

    if (reportType === 'finance') {
      const [rows] = await pool.query(
        `SELECT p.receipt_number, s.registration_number, s.full_name AS student_name,
                p.amount, p.payment_method, p.reference_number, p.payment_date,
                u.full_name AS cashier_name, p.is_reversed, p.reversal_reason
         FROM payments p
         JOIN students s ON p.student_id = s.id
         JOIN users u ON p.received_by = u.id
         ORDER BY p.payment_date DESC`
      );
      return rows;
    }

    return [];
  }
}

module.exports = new ReportService();
