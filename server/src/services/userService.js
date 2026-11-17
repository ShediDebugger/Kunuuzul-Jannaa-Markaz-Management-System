const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Get all users with optional filtering and pagination
 */
const getAllUsers = async ({ role, status, search, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (role) {
    whereClauses.push('role = ?');
    params.push(role);
  }

  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  if (search) {
    whereClauses.push('(username LIKE ? OR full_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM users ${whereSql}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT id, username, full_name, role, status, failed_attempts, locked_until, last_login, created_at, updated_at
    FROM users
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(dataQuery, [...params, Number(limit), Number(offset)]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    users: rows,
  };
};

/**
 * Get single user by ID
 */
const getUserById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, role, status, last_login, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw { status: 404, message: 'User not found' };
  }
  return rows[0];
};

/**
 * Create a new user (Admin function)
 */
const createUser = async (userData, adminUserId, ipAddress) => {
  const { username, password, full_name, role } = userData;

  // Check if username exists
  const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (existing.length > 0) {
    throw { status: 409, message: 'Username is already taken' };
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
    [username, password_hash, full_name, role, 'active']
  );

  const newUserId = result.insertId;

  await logAudit({
    userId: adminUserId,
    action: 'CREATE_USER',
    tableName: 'users',
    recordId: newUserId,
    newValues: { username, full_name, role, status: 'active' },
    ipAddress,
  });

  return getUserById(newUserId);
};

/**
 * Update an existing user
 */
const updateUser = async (id, updateData, adminUserId, ipAddress) => {
  const oldUser = await getUserById(id);

  const { full_name, role, status } = updateData;
  const updates = [];
  const params = [];

  if (full_name !== undefined) {
    updates.push('full_name = ?');
    params.push(full_name);
  }
  if (role !== undefined) {
    updates.push('role = ?');
    params.push(role);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'active') {
      // Clear any lockout if admin is reactivating
      updates.push('failed_attempts = 0', 'locked_until = NULL');
    }
  }

  if (updates.length === 0) {
    return oldUser;
  }

  params.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  const updatedUser = await getUserById(id);

  await logAudit({
    userId: adminUserId,
    action: 'UPDATE_USER',
    tableName: 'users',
    recordId: id,
    oldValues: oldUser,
    newValues: updatedUser,
    ipAddress,
  });

  return updatedUser;
};

/**
 * Admin reset user password
 */
const resetPassword = async (id, newPassword, adminUserId, ipAddress) => {
  await getUserById(id); // Ensure user exists

  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?',
    [password_hash, id]
  );

  await logAudit({
    userId: adminUserId,
    action: 'RESET_PASSWORD',
    tableName: 'users',
    recordId: id,
    ipAddress,
  });

  return true;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
};
