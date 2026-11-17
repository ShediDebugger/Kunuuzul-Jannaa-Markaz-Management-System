const pool = require('../config/db');
const { logAudit } = require('./auditService');
const { formatPhoneNumber } = require('./guardianService');

const getAllTeachers = async ({ status, search, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (status) {
    whereClauses.push('t.status = ?');
    params.push(status);
  }

  if (search) {
    whereClauses.push('(t.full_name LIKE ? OR t.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM teachers t ${whereSql}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT 
      t.*,
      u.username,
      (SELECT COUNT(*) FROM teacher_sections ts WHERE ts.teacher_id = t.id) AS assigned_sections_count
    FROM teachers t
    LEFT JOIN users u ON t.user_id = u.id
    ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(dataQuery, [...params, Number(limit), Number(offset)]);

  // Attach sections for each teacher
  for (const teacher of rows) {
    const [sections] = await pool.query(
      `SELECT sec.id, sec.name, l.name AS level_name, l.code AS level_code, ses.name AS session_name
       FROM teacher_sections ts
       JOIN sections sec ON ts.section_id = sec.id
       JOIN levels l ON sec.level_id = l.id
       JOIN sessions ses ON sec.session_id = ses.id
       WHERE ts.teacher_id = ?`,
      [teacher.id]
    );
    teacher.sections = sections;
  }

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    teachers: rows,
  };
};

const getTeacherById = async (id) => {
  const [rows] = await pool.query(
    `SELECT t.*, u.username, u.role
     FROM teachers t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw { status: 404, message: 'Teacher not found' };
  }
  const teacher = rows[0];

  const [sections] = await pool.query(
    `SELECT sec.id, sec.name, l.name AS level_name, l.code AS level_code, ses.name AS session_name
     FROM teacher_sections ts
     JOIN sections sec ON ts.section_id = sec.id
     JOIN levels l ON sec.level_id = l.id
     JOIN sessions ses ON sec.session_id = ses.id
     WHERE ts.teacher_id = ?`,
    [id]
  );
  teacher.sections = sections;

  return teacher;
};

const getTeacherByUserId = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM teachers WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    return null;
  }
  return getTeacherById(rows[0].id);
};

const createTeacher = async (data, userId, ipAddress) => {
  const { full_name, sex, phone, user_id, section_ids = [] } = data;
  const formattedPhone = formatPhoneNumber(phone);

  const [result] = await pool.query(
    'INSERT INTO teachers (full_name, sex, phone, user_id, status) VALUES (?, ?, ?, ?, ?)',
    [full_name, sex, formattedPhone, user_id || null, 'active']
  );

  const teacherId = result.insertId;

  // Assign initial sections if provided
  if (Array.isArray(section_ids) && section_ids.length > 0) {
    const values = section_ids.map((secId) => [teacherId, secId]);
    await pool.query('INSERT IGNORE INTO teacher_sections (teacher_id, section_id) VALUES ?', [values]);
  }

  const newTeacher = await getTeacherById(teacherId);

  await logAudit({
    userId,
    action: 'CREATE_TEACHER',
    tableName: 'teachers',
    recordId: teacherId,
    newValues: newTeacher,
    ipAddress,
  });

  return newTeacher;
};

const updateTeacher = async (id, data, userId, ipAddress) => {
  const oldTeacher = await getTeacherById(id);
  const { full_name, sex, phone, user_id, status } = data;
  const formattedPhone = formatPhoneNumber(phone);

  await pool.query(
    `UPDATE teachers 
     SET full_name = ?, sex = ?, phone = ?, user_id = ?, status = ?
     WHERE id = ?`,
    [full_name, sex, formattedPhone, user_id || null, status || 'active', id]
  );

  const updatedTeacher = await getTeacherById(id);

  await logAudit({
    userId,
    action: 'UPDATE_TEACHER',
    tableName: 'teachers',
    recordId: id,
    oldValues: oldTeacher,
    newValues: updatedTeacher,
    ipAddress,
  });

  return updatedTeacher;
};

const assignSections = async (teacherId, sectionIds, userId, ipAddress) => {
  await getTeacherById(teacherId);

  // Clear existing assignments and set new
  await pool.query('DELETE FROM teacher_sections WHERE teacher_id = ?', [teacherId]);

  if (Array.isArray(sectionIds) && sectionIds.length > 0) {
    const values = sectionIds.map((secId) => [teacherId, secId]);
    await pool.query('INSERT INTO teacher_sections (teacher_id, section_id) VALUES ?', [values]);
  }

  const updatedTeacher = await getTeacherById(teacherId);

  await logAudit({
    userId,
    action: 'ASSIGN_TEACHER_SECTIONS',
    tableName: 'teacher_sections',
    recordId: teacherId,
    newValues: { assignedSections: sectionIds },
    ipAddress,
  });

  return updatedTeacher;
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeacherByUserId,
  createTeacher,
  updateTeacher,
  assignSections,
};
