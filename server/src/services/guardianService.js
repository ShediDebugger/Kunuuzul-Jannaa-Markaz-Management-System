const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Standardize phone number format
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
    cleaned = '+251' + cleaned.substring(1);
  }
  return cleaned;
};

const getAllGuardians = async ({ search, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push('(g.full_name LIKE ? OR g.primary_phone LIKE ? OR g.secondary_phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM guardians g ${whereSql}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT 
      g.*,
      u.username AS linked_username,
      (SELECT COUNT(*) FROM students s WHERE s.guardian_id = g.id) AS student_count
    FROM guardians g
    LEFT JOIN users u ON g.user_id = u.id
    ${whereSql}
    ORDER BY g.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(dataQuery, [...params, Number(limit), Number(offset)]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    guardians: rows,
  };
};

const getGuardianById = async (id) => {
  const [rows] = await pool.query(
    `SELECT g.*, u.username AS linked_username 
     FROM guardians g 
     LEFT JOIN users u ON g.user_id = u.id 
     WHERE g.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw { status: 404, message: 'Guardian not found' };
  }
  const guardian = rows[0];

  // Also fetch linked students
  const [students] = await pool.query(
    `SELECT s.id, s.registration_number, s.full_name, s.sex, s.status, l.name AS level_name, sec.name AS section_name
     FROM students s
     JOIN levels l ON s.level_id = l.id
     LEFT JOIN sections sec ON s.section_id = sec.id
     WHERE s.guardian_id = ?`,
    [id]
  );
  guardian.students = students;

  return guardian;
};

const findGuardianByPhone = async (phone) => {
  const formattedPhone = formatPhoneNumber(phone);
  const [rows] = await pool.query(
    'SELECT * FROM guardians WHERE primary_phone = ? OR secondary_phone = ?',
    [formattedPhone, formattedPhone]
  );
  return rows[0] || null;
};

const createGuardian = async (data, userId, ipAddress) => {
  const { full_name, primary_phone, secondary_phone, relationship, address, user_id } = data;
  const formattedPrimary = formatPhoneNumber(primary_phone);
  const formattedSecondary = formatPhoneNumber(secondary_phone);

  const [result] = await pool.query(
    `INSERT INTO guardians (full_name, primary_phone, secondary_phone, relationship, address, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [full_name, formattedPrimary, formattedSecondary, relationship || null, address || null, user_id || null]
  );

  const newGuardian = await getGuardianById(result.insertId);

  await logAudit({
    userId,
    action: 'CREATE_GUARDIAN',
    tableName: 'guardians',
    recordId: result.insertId,
    newValues: newGuardian,
    ipAddress,
  });

  return newGuardian;
};

const updateGuardian = async (id, data, userId, ipAddress) => {
  const oldGuardian = await getGuardianById(id);
  const { full_name, primary_phone, secondary_phone, relationship, address, user_id } = data;

  const formattedPrimary = formatPhoneNumber(primary_phone);
  const formattedSecondary = formatPhoneNumber(secondary_phone);

  await pool.query(
    `UPDATE guardians 
     SET full_name = ?, primary_phone = ?, secondary_phone = ?, relationship = ?, address = ?, user_id = ?
     WHERE id = ?`,
    [full_name, formattedPrimary, formattedSecondary, relationship || null, address || null, user_id || null, id]
  );

  const updatedGuardian = await getGuardianById(id);

  await logAudit({
    userId,
    action: 'UPDATE_GUARDIAN',
    tableName: 'guardians',
    recordId: id,
    oldValues: oldGuardian,
    newValues: updatedGuardian,
    ipAddress,
  });

  return updatedGuardian;
};

const deleteGuardian = async (id, userId, ipAddress) => {
  const [students] = await pool.query('SELECT COUNT(*) AS count FROM students WHERE guardian_id = ?', [id]);
  if (students[0].count > 0) {
    throw { status: 400, message: 'Cannot delete guardian while linked to students' };
  }

  const oldGuardian = await getGuardianById(id);
  await pool.query('DELETE FROM guardians WHERE id = ?', [id]);

  await logAudit({
    userId,
    action: 'DELETE_GUARDIAN',
    tableName: 'guardians',
    recordId: id,
    oldValues: oldGuardian,
    ipAddress,
  });

  return true;
};

module.exports = {
  getAllGuardians,
  getGuardianById,
  findGuardianByPhone,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  formatPhoneNumber,
};
