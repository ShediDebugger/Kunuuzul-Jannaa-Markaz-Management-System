const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * M6: Attendance Service
 */
class AttendanceService {
  /**
   * Record or update bulk attendance for a section on a specific date
   * @param {Object} data - { section_id, date, records: [{ student_id, status, note }], user_id }
   */
  async recordBulkAttendance({ section_id, date, records, user_id }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const attendanceDate = date || new Date().toISOString().split('T')[0];
      const results = [];

      for (const rec of records) {
        const { student_id, status, note } = rec;

        // Check if record exists for this student on this date
        const [existing] = await connection.query(
          'SELECT id, status, note FROM attendance WHERE student_id = ? AND date = ?',
          [student_id, attendanceDate]
        );

        if (existing.length > 0) {
          // Update existing
          const oldRecord = existing[0];
          await connection.query(
            'UPDATE attendance SET status = ?, note = ?, recorded_by = ?, section_id = ? WHERE id = ?',
            [status, note || null, user_id, section_id, oldRecord.id]
          );

          await logAudit({
            actor_id: user_id,
            action: 'UPDATE',
            table_name: 'attendance',
            record_id: oldRecord.id,
            old_values: { status: oldRecord.status, note: oldRecord.note },
            new_values: { status, note: note || null },
            connection,
          });

          results.push({ student_id, id: oldRecord.id, updated: true });
        } else {
          // Insert new
          const [insertRes] = await connection.query(
            'INSERT INTO attendance (student_id, section_id, date, status, recorded_by, note) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, section_id, attendanceDate, status, user_id, note || null]
          );

          await logAudit({
            actor_id: user_id,
            action: 'CREATE',
            table_name: 'attendance',
            record_id: insertRes.insertId,
            old_values: null,
            new_values: { student_id, section_id, date: attendanceDate, status, note: note || null },
            connection,
          });

          results.push({ student_id, id: insertRes.insertId, created: true });
        }
      }

      await connection.commit();
      return { success: true, count: results.length, date: attendanceDate, results };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get attendance for a section on a given date (including all students in section with their attendance status)
   */
  async getSectionAttendance(sectionId, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get section and its students
    const [students] = await pool.query(
      `SELECT s.id, s.registration_number, s.full_name, s.sex, s.current_juz,
              a.id AS attendance_id, a.status AS attendance_status, a.note, a.date AS recorded_date,
              u.full_name AS recorded_by_name
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
       LEFT JOIN users u ON a.recorded_by = u.id
       WHERE s.section_id = ? AND s.status = 'active'
       ORDER BY s.full_name ASC`,
      [targetDate, sectionId]
    );

    // Get counts
    const summary = {
      total: students.length,
      present: students.filter((s) => s.attendance_status === 'present').length,
      absent: students.filter((s) => s.attendance_status === 'absent').length,
      late: students.filter((s) => s.attendance_status === 'late').length,
      excused: students.filter((s) => s.attendance_status === 'excused').length,
      unmarked: students.filter((s) => !s.attendance_status).length,
    };

    return {
      section_id: parseInt(sectionId, 10),
      date: targetDate,
      summary,
      students,
    };
  }

  /**
   * Get attendance history for a single student (e.g. for parent or student portal)
   */
  async getStudentAttendance(studentId, { month, limit = 30 } = {}) {
    let query = `
      SELECT a.id, a.date, a.status, a.note, sec.name AS section_name,
             u.full_name AS recorded_by_name
      FROM attendance a
      JOIN sections sec ON a.section_id = sec.id
      JOIN users u ON a.recorded_by = u.id
      WHERE a.student_id = ?
    `;
    const params = [studentId];

    if (month) {
      query += ` AND a.date LIKE ?`;
      params.push(`${month}%`);
    }

    query += ` ORDER BY a.date DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const [rows] = await pool.query(query, params);

    // Summary calculations
    const [summaryRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total_days,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
         SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) AS excused_count
       FROM attendance
       WHERE student_id = ? ${month ? 'AND date LIKE ?' : ''}`,
      month ? [studentId, `${month}%`] : [studentId]
    );

    const stats = summaryRows[0] || {};
    const totalDays = parseInt(stats.total_days || 0, 10);
    const presentDays = parseInt(stats.present_count || 0, 10);
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    return {
      student_id: parseInt(studentId, 10),
      stats: {
        total_days: totalDays,
        present: presentDays,
        absent: parseInt(stats.absent_count || 0, 10),
        late: parseInt(stats.late_count || 0, 10),
        excused: parseInt(stats.excused_count || 0, 10),
        rate_percentage: attendanceRate,
      },
      records: rows,
    };
  }

  /**
   * Monthly summary for dashboard or section reports
   */
  async getMonthlySectionSummary(sectionId, month) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [stats] = await pool.query(
      `SELECT 
         COUNT(DISTINCT a.date) as active_school_days,
         COUNT(a.id) as total_attendance_marks,
         SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS total_present,
         SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS total_absent,
         SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS total_late,
         SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) AS total_excused
       FROM attendance a
       WHERE a.section_id = ? AND a.date LIKE ?`,
      [sectionId, `${targetMonth}%`]
    );

    return {
      section_id: parseInt(sectionId, 10),
      month: targetMonth,
      stats: stats[0] || {},
    };
  }
}

module.exports = new AttendanceService();
