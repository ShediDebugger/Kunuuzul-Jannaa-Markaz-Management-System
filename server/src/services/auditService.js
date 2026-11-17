const pool = require('../config/db');

/**
 * Log an audit action into audit_logs table
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.action - e.g., 'LOGIN', 'INSERT', 'UPDATE', 'REVERSE'
 * @param {string} params.tableName - e.g., 'users', 'students', 'payments'
 * @param {number|null} params.recordId
 * @param {Object|null} params.oldValues
 * @param {Object|null} params.newValues
 * @param {string|null} params.ipAddress
 */
const logAudit = async ({
  userId = null,
  action,
  tableName,
  recordId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
}) => {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const oldValJson = oldValues ? JSON.stringify(oldValues) : null;
    const newValJson = newValues ? JSON.stringify(newValues) : null;

    await pool.query(query, [
      userId,
      action,
      tableName,
      recordId,
      oldValJson,
      newValJson,
      ipAddress,
    ]);
  } catch (err) {
    // Audit logging should not crash the main transaction, but log the error
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = {
  logAudit,
};
