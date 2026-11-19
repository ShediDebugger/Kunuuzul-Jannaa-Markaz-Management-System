const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logAudit } = require('./auditService');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Handle user login with rate limiting / temporary lock
 */
const login = async (username, password, ipAddress) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (rows.length === 0) {
    throw { status: 401, message: 'Invalid username or password' };
  }

  const user = rows[0];

  if (user.status === 'blocked') {
    throw { status: 403, message: 'Your account is blocked. Please contact the administrator.' };
  }

  // Check if account is temporarily locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw {
      status: 429,
      message: `Account is temporarily locked due to repeated wrong passwords. Please try again in ${minutesLeft} minute(s).`,
    };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    const newAttempts = (user.failed_attempts || 0) + 1;
    let lockUntil = null;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await pool.query(
        'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
        [newAttempts, lockUntil, user.id]
      );
      await logAudit({
        userId: user.id,
        action: 'ACCOUNT_LOCKED',
        tableName: 'users',
        recordId: user.id,
        newValues: { failed_attempts: newAttempts, locked_until: lockUntil },
        ipAddress,
      });
      throw {
        status: 429,
        message: `Account locked for ${LOCKOUT_MINUTES} minutes due to repeated failed login attempts.`,
      };
    } else {
      await pool.query(
        'UPDATE users SET failed_attempts = ? WHERE id = ?',
        [newAttempts, user.id]
      );
      await logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        tableName: 'users',
        recordId: user.id,
        newValues: { failed_attempts: newAttempts },
        ipAddress,
      });
      throw {
        status: 401,
        message: `Invalid username or password. (${MAX_FAILED_ATTEMPTS - newAttempts} attempts remaining before temporary lock)`,
      };
    }
  }

  // Reset failed attempts and update last_login
  await pool.query(
    'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
    [user.id]
  );

  await logAudit({
    userId: user.id,
    action: 'LOGIN',
    tableName: 'users',
    recordId: user.id,
    ipAddress,
  });

  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      last_login: new Date(),
    },
  };
};

/**
 * Change own password
 */
const changePassword = async (userId, currentPassword, newPassword, ipAddress) => {
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) {
    throw { status: 404, message: 'User not found' };
  }

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    throw { status: 400, message: 'Current password is incorrect' };
  }

  const saltRounds = 10;
  const newHash = await bcrypt.hash(newPassword, saltRounds);

  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

  await logAudit({
    userId,
    action: 'PASSWORD_CHANGE',
    tableName: 'users',
    recordId: userId,
    ipAddress,
  });

  return true;
};

/**
 * Get user profile by ID
 */
const getProfile = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, role, status, last_login, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) {
    throw { status: 404, message: 'User not found' };
  }
  return rows[0];
};

module.exports = {
  login,
  changePassword,
  getProfile,
};
