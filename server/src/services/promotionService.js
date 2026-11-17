const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * M10: Student Promotion Workflow Service
 * Evaluates academic progression based on stored level path:
 * H-01 -> H-02 -> QT-03
 * After QT-03: Boys -> QT-04, Girls -> QT-05
 * After QT-04: Boys -> QH-06
 * After QT-05: Girls -> QH-07
 */
class PromotionService {
  /**
   * Generate proposed promotions list for students in a given level or entire school
   */
  async generatePromotionProposal({ academic_year_id, level_id }) {
    // 1. Fetch levels with next level references for male and female
    const [levels] = await pool.query(
      `SELECT l.id, l.code, l.name, l.track,
              lm.id AS next_male_id, lm.code AS next_male_code, lm.name AS next_male_name,
              lf.id AS next_female_id, lf.code AS next_female_code, lf.name AS next_female_name
       FROM levels l
       LEFT JOIN levels lm ON l.next_level_male_id = lm.id
       LEFT JOIN levels lf ON l.next_level_female_id = lf.id`
    );

    const levelMap = new Map();
    for (const lvl of levels) {
      levelMap.set(lvl.id, lvl);
    }

    // 2. Fetch active students
    let query = `
      SELECT s.id, s.registration_number, s.full_name, s.sex, s.current_juz, s.current_page,
             s.level_id, l.code AS current_level_code, l.name AS current_level_name,
             sec.name AS section_name, ses.name AS session_name
      FROM students s
      JOIN levels l ON s.level_id = l.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      JOIN sessions ses ON s.session_id = ses.id
      WHERE s.status = 'active'
    `;
    const params = [];

    if (level_id) {
      query += ` AND s.level_id = ?`;
      params.push(level_id);
    }

    query += ` ORDER BY s.level_id ASC, s.full_name ASC`;
    const [students] = await pool.query(query, params);

    // 3. Propose target level for each student based on gender path
    const proposals = students.map((stu) => {
      const currentLevel = levelMap.get(stu.level_id);
      let toLevelId = null;
      let toLevelCode = null;
      let toLevelName = null;
      let defaultDecision = 'promoted';

      if (currentLevel) {
        if (stu.sex === 'male') {
          toLevelId = currentLevel.next_male_id;
          toLevelCode = currentLevel.next_male_code;
          toLevelName = currentLevel.next_male_name;
        } else {
          toLevelId = currentLevel.next_female_id;
          toLevelCode = currentLevel.next_female_code;
          toLevelName = currentLevel.next_female_name;
        }
      }

      // If no next level exists, this is the highest level (QH-06 or QH-07) -> candidate for graduation / left
      if (!toLevelId) {
        defaultDecision = 'promoted';
        toLevelName = 'Graduation / Completed Hifz';
      }

      return {
        student_id: stu.id,
        registration_number: stu.registration_number,
        full_name: stu.full_name,
        sex: stu.sex,
        current_juz: stu.current_juz,
        current_page: stu.current_page,
        from_level_id: stu.level_id,
        from_level_code: stu.current_level_code,
        from_level_name: stu.current_level_name,
        to_level_id: toLevelId,
        to_level_code: toLevelCode,
        to_level_name: toLevelName,
        proposed_decision: defaultDecision,
        decision: defaultDecision,
        note: '',
      };
    });

    return {
      academic_year_id: parseInt(academic_year_id || 1, 10),
      total_students: proposals.length,
      proposals,
    };
  }

  /**
   * Execute and commit bulk promotions
   */
  async executePromotions({ academic_year_id, decisions, user_id }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const today = new Date().toISOString().split('T')[0];
      const results = {
        promoted: 0,
        repeated: 0,
        left: 0,
      };

      for (const item of decisions) {
        const { student_id, from_level_id, to_level_id, decision, note } = item;

        // 1. Insert promotion history record
        await connection.query(
          `INSERT INTO promotions 
           (student_id, from_level_id, to_level_id, academic_year_id, decision, decision_date, decided_by, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            student_id,
            from_level_id,
            decision === 'promoted' ? to_level_id : from_level_id,
            academic_year_id,
            decision,
            today,
            user_id || 1,
            note || null,
          ]
        );

        // 2. Update student status or level accordingly
        if (decision === 'promoted' && to_level_id) {
          await connection.query(
            `UPDATE students SET level_id = ?, section_id = NULL WHERE id = ?`,
            [to_level_id, student_id]
          );
          results.promoted++;
        } else if (decision === 'left') {
          await connection.query(
            `UPDATE students SET status = 'inactive' WHERE id = ?`,
            [student_id]
          );
          results.left++;
        } else if (decision === 'repeated') {
          // Keep same level, reset section for new academic year
          await connection.query(
            `UPDATE students SET section_id = NULL WHERE id = ?`,
            [student_id]
          );
          results.repeated++;
        }

        // 3. Log audit entry
        await logAudit({
          actor_id: user_id || 1,
          action: 'UPDATE',
          table_name: 'students',
          record_id: student_id,
          old_values: { level_id: from_level_id },
          new_values: { level_id: decision === 'promoted' ? to_level_id : from_level_id, decision },
          connection,
        });
      }

      await connection.commit();

      return {
        success: true,
        summary: results,
        total_processed: decisions.length,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get promotion history records
   */
  async getPromotionHistory({ academic_year_id, limit = 100 }) {
    let query = `
      SELECT p.*, s.full_name AS student_name, s.registration_number, s.sex,
             fl.code AS from_level_code, fl.name AS from_level_name,
             tl.code AS to_level_code, tl.name AS to_level_name,
             u.full_name AS decided_by_name, ay.name AS academic_year_name
      FROM promotions p
      JOIN students s ON p.student_id = s.id
      JOIN levels fl ON p.from_level_id = fl.id
      LEFT JOIN levels tl ON p.to_level_id = tl.id
      JOIN users u ON p.decided_by = u.id
      JOIN academic_years ay ON p.academic_year_id = ay.id
    `;
    const params = [];

    if (academic_year_id) {
      query += ` WHERE p.academic_year_id = ?`;
      params.push(academic_year_id);
    }

    query += ` ORDER BY p.decision_date DESC, p.id DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const [rows] = await pool.query(query, params);
    return { total: rows.length, history: rows };
  }
}

module.exports = new PromotionService();
