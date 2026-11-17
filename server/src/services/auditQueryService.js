const pool = require('../config/db');

/**
 * Get audit logs with filter and pagination
 */
const getAuditLogs = async ({
  table_name,
  action,
  user_id,
  search,
  page = 1,
  limit = 30,
}) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (table_name) {
    whereClauses.push('a.table_name = ?');
    params.push(table_name);
  }

  if (action) {
    whereClauses.push('a.action = ?');
    params.push(action);
  }

  if (user_id) {
    whereClauses.push('a.user_id = ?');
    params.push(user_id);
  }

  if (search) {
    whereClauses.push('(a.action LIKE ? OR a.table_name LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereSql}
  `;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT 
      a.id, a.user_id, a.action, a.table_name, a.record_id,
      a.old_values, a.new_values, a.ip_address, a.created_at,
      u.full_name AS actor_name, u.username AS actor_username, u.role AS actor_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereSql}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(dataQuery, [...params, Number(limit), Number(offset)]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    logs: rows,
  };
};

module.exports = {
  getAuditLogs,
};
