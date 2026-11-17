const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * M12: Financial Supporters & Donations Registry Service
 */
class SupporterService {
  /**
   * Record a new donation
   */
  async recordDonation({
    supporter_name,
    organization,
    contact,
    amount,
    donation_date,
    method,
    purpose,
    note,
    user_id,
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const date = donation_date || new Date().toISOString().split('T')[0];
      const parsedAmount = parseFloat(amount) || 0;

      const [insertRes] = await connection.query(
        `INSERT INTO donations 
         (supporter_name, organization, contact, amount, donation_date, method, purpose, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supporter_name,
          organization || null,
          contact || null,
          parsedAmount,
          date,
          method || 'cash',
          purpose || 'General Markaz Fund',
          note || null,
        ]
      );

      await logAudit({
        actor_id: user_id || 1,
        action: 'CREATE',
        table_name: 'donations',
        record_id: insertRes.insertId,
        old_values: null,
        new_values: { supporter_name, amount: parsedAmount, purpose, method },
        connection,
      });

      await connection.commit();

      return {
        id: insertRes.insertId,
        supporter_name,
        organization,
        contact,
        amount: parsedAmount,
        donation_date: date,
        method,
        purpose,
        note,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all donations with summary metrics
   */
  async getDonations({ purpose, limit = 50, page = 1 } = {}) {
    let query = `SELECT * FROM donations`;
    const params = [];

    if (purpose) {
      query += ` WHERE purpose = ?`;
      params.push(purpose);
    }

    query += ` ORDER BY donation_date DESC, id DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit, 10), offset);

    const [rows] = await pool.query(query, params);

    // Summary calculations
    const [summaryRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total_donations,
         COUNT(DISTINCT supporter_name) AS unique_donors,
         COALESCE(SUM(amount), 0) AS total_amount,
         COALESCE(SUM(CASE WHEN method = 'cash' THEN amount ELSE 0 END), 0) AS total_cash,
         COALESCE(SUM(CASE WHEN method = 'e_birr' THEN amount ELSE 0 END), 0) AS total_e_birr,
         COALESCE(SUM(CASE WHEN method = 'cbe' THEN amount ELSE 0 END), 0) AS total_cbe
       FROM donations`
    );

    // Group by purpose
    const [purposeBreakdown] = await pool.query(
      `SELECT purpose, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total_amount
       FROM donations
       GROUP BY purpose
       ORDER BY total_amount DESC`
    );

    return {
      donations: rows,
      summary: summaryRows[0] || {},
      purpose_breakdown: purposeBreakdown,
    };
  }

  /**
   * Institutional achievements presentation for supporters
   */
  async getAchievements() {
    const [studentStats] = await pool.query(
      `SELECT 
         COUNT(*) AS current_enrolled,
         SUM(CASE WHEN is_boarding = 1 THEN 1 ELSE 0 END) AS boarding_students,
         SUM(CASE WHEN current_juz >= 15 THEN 1 ELSE 0 END) AS advanced_memorizers,
         SUM(CASE WHEN current_juz = 30 THEN 1 ELSE 0 END) AS completed_quran_students
       FROM students
       WHERE status = 'active'`
    );

    const [donationStats] = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS total_donations_raised,
         COUNT(DISTINCT supporter_name) AS total_benefactors
       FROM donations`
    );

    const projects = [
      {
        id: 1,
        title: 'Hifzi Students Dormitory Wing',
        target_amount: 500000,
        raised_amount: 385000,
        category: 'Infrastructure',
        status: 'in_progress',
      },
      {
        id: 2,
        title: 'Mushaf Printing & Quran Library',
        target_amount: 150000,
        raised_amount: 125000,
        category: 'Education',
        status: 'in_progress',
      },
      {
        id: 3,
        title: 'Needy Students Sponsorship (Iftaam)',
        target_amount: 300000,
        raised_amount: 280000,
        category: 'Sponsorship',
        status: 'active',
      },
    ];

    return {
      achievements: {
        current_enrolled: studentStats[0]?.current_enrolled || 0,
        boarding_capacity: studentStats[0]?.boarding_students || 0,
        advanced_memorizers: studentStats[0]?.advanced_memorizers || 0,
        completed_quran_students: studentStats[0]?.completed_quran_students || 0,
        total_donations_raised: donationStats[0]?.total_donations_raised || 0,
        total_benefactors: donationStats[0]?.total_benefactors || 0,
      },
      active_projects: projects,
    };
  }
}

module.exports = new SupporterService();
