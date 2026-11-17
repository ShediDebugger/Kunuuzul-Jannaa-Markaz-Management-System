const pool = require('../config/db');
const { logAudit } = require('./auditService');
const { formatPhoneNumber } = require('./guardianService');

/**
 * Generate unique registration number
 * Pattern: KJM-YYYY-XXXX (e.g., KJM-2026-0003)
 */
const generateRegistrationNumber = async (year = new Date().getFullYear()) => {
  const prefix = `KJM-${year}-`;
  const [rows] = await pool.query(
    'SELECT registration_number FROM students WHERE registration_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].registration_number.replace(prefix, '');
    const parsed = parseInt(lastNum, 10);
    if (!isNaN(parsed)) {
      sequence = parsed + 1;
    }
  }
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

/**
 * Check for duplicate student:
 * Matches full_name, date_of_birth, and guardian's primary phone
 */
const checkDuplicateStudent = async (fullName, dateOfBirth, guardianPhone) => {
  const formattedPhone = formatPhoneNumber(guardianPhone);
  const query = `
    SELECT s.id, s.registration_number, s.full_name, s.date_of_birth, g.primary_phone
    FROM students s
    JOIN guardians g ON s.guardian_id = g.id
    WHERE LOWER(TRIM(s.full_name)) = LOWER(TRIM(?))
      AND s.date_of_birth = ?
      AND (g.primary_phone = ? OR g.secondary_phone = ?)
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [fullName, dateOfBirth, formattedPhone, formattedPhone]);
  return rows[0] || null;
};

/**
 * Get all students with filtering, search, and pagination
 */
const getAllStudents = async ({
  search,
  level_id,
  section_id,
  session_id,
  status,
  is_boarding,
  support_type,
  guardian_id,
  page = 1,
  limit = 20,
}) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push(
      '(s.full_name LIKE ? OR s.registration_number LIKE ? OR g.primary_phone LIKE ? OR g.full_name LIKE ?)'
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (level_id) {
    whereClauses.push('s.level_id = ?');
    params.push(level_id);
  }

  if (section_id) {
    whereClauses.push('s.section_id = ?');
    params.push(section_id);
  }

  if (session_id) {
    whereClauses.push('s.session_id = ?');
    params.push(session_id);
  }

  if (status) {
    whereClauses.push('s.status = ?');
    params.push(status);
  }

  if (is_boarding !== undefined && is_boarding !== '') {
    whereClauses.push('s.is_boarding = ?');
    params.push(is_boarding === 'true' || is_boarding === 1 ? 1 : 0);
  }

  if (support_type) {
    whereClauses.push('s.support_type = ?');
    params.push(support_type);
  }

  if (guardian_id) {
    whereClauses.push('s.guardian_id = ?');
    params.push(guardian_id);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM students s
    JOIN guardians g ON s.guardian_id = g.id
    ${whereSql}
  `;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT 
      s.id, s.registration_number, s.full_name, s.sex, s.date_of_birth,
      TIMESTAMPDIFF(YEAR, s.date_of_birth, CURDATE()) AS age,
      s.level_id, l.name AS level_name, l.code AS level_code, l.track,
      s.section_id, sec.name AS section_name,
      s.session_id, ses.name AS session_name,
      s.is_boarding, s.support_type,
      s.guardian_id, g.full_name AS guardian_name, g.primary_phone AS guardian_phone,
      s.kebele, s.specific_place, s.registration_date, s.status, s.current_juz, s.photo_url,
      s.created_at
    FROM students s
    JOIN levels l ON s.level_id = l.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    JOIN sessions ses ON s.session_id = ses.id
    JOIN guardians g ON s.guardian_id = g.id
    ${whereSql}
    ORDER BY s.registration_number DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(dataQuery, [...params, Number(limit), Number(offset)]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    students: rows,
  };
};

/**
 * Get student by ID with full details & history
 */
const getStudentById = async (id) => {
  const query = `
    SELECT 
      s.*,
      TIMESTAMPDIFF(YEAR, s.date_of_birth, CURDATE()) AS age,
      l.name AS level_name, l.code AS level_code, l.track,
      l.next_level_male_id, l.next_level_female_id,
      sec.name AS section_name,
      ses.name AS session_name,
      g.full_name AS guardian_name, g.primary_phone AS guardian_phone, g.secondary_phone AS guardian_second_phone,
      g.relationship AS guardian_relationship, g.address AS guardian_address,
      u.username AS linked_username
    FROM students s
    JOIN levels l ON s.level_id = l.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    JOIN sessions ses ON s.session_id = ses.id
    JOIN guardians g ON s.guardian_id = g.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) {
    throw { status: 404, message: 'Student not found' };
  }
  const student = rows[0];

  // Fetch audit history for this student
  const [history] = await pool.query(
    `SELECT a.action, a.old_values, a.new_values, a.created_at, u.username, u.full_name AS actor_name
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.table_name = 'students' AND a.record_id = ?
     ORDER BY a.created_at DESC LIMIT 20`,
    [id]
  );
  student.audit_history = history;

  return student;
};

/**
 * Register a new student
 */
const registerStudent = async (studentData, userId, ipAddress) => {
  const {
    full_name,
    sex,
    date_of_birth,
    level_id,
    section_id,
    session_id,
    is_boarding = false,
    support_type = 'family_dependent',
    guardian_id,
    guardian_data,
    kebele,
    specific_place,
    registration_date,
    current_juz = 1,
    photo_url,
    custom_reg_number,
  } = studentData;

  let assignedGuardianId = guardian_id;

  // If guardian data provided instead of ID, create guardian first
  if (!assignedGuardianId && guardian_data) {
    const formattedPrimary = formatPhoneNumber(guardian_data.primary_phone);
    const [resG] = await pool.query(
      `INSERT INTO guardians (full_name, primary_phone, secondary_phone, relationship, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        guardian_data.full_name,
        formattedPrimary,
        formatPhoneNumber(guardian_data.secondary_phone),
        guardian_data.relationship || null,
        guardian_data.address || null,
      ]
    );
    assignedGuardianId = resG.insertId;
  }

  if (!assignedGuardianId) {
    throw { status: 400, message: 'Guardian information is required' };
  }

  // Generate registration number (or use custom for migrated students)
  const regNumber = custom_reg_number || (await generateRegistrationNumber());

  const regDate = registration_date || new Date().toISOString().split('T')[0];

  const [result] = await pool.query(
    `INSERT INTO students (
      registration_number, full_name, sex, date_of_birth, level_id, section_id,
      session_id, is_boarding, support_type, guardian_id, kebele, specific_place,
      registration_date, status, current_juz, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      regNumber,
      full_name.trim(),
      sex,
      date_of_birth,
      level_id,
      section_id || null,
      session_id,
      is_boarding ? 1 : 0,
      support_type,
      assignedGuardianId,
      kebele || null,
      specific_place || null,
      regDate,
      'active',
      current_juz || 1,
      photo_url || null,
    ]
  );

  const newStudentId = result.insertId;
  const newStudent = await getStudentById(newStudentId);

  await logAudit({
    userId,
    action: 'REGISTER_STUDENT',
    tableName: 'students',
    recordId: newStudentId,
    newValues: newStudent,
    ipAddress,
  });

  return newStudent;
};

/**
 * Update student record (Rule: Every edit written to audit log)
 */
const updateStudent = async (id, updateData, userId, ipAddress) => {
  const oldStudent = await getStudentById(id);

  const {
    full_name,
    sex,
    date_of_birth,
    level_id,
    section_id,
    session_id,
    is_boarding,
    support_type,
    guardian_id,
    kebele,
    specific_place,
    current_juz,
    photo_url,
    status,
  } = updateData;

  const updates = [];
  const params = [];

  if (full_name !== undefined) {
    updates.push('full_name = ?');
    params.push(full_name.trim());
  }
  if (sex !== undefined) {
    updates.push('sex = ?');
    params.push(sex);
  }
  if (date_of_birth !== undefined) {
    updates.push('date_of_birth = ?');
    params.push(date_of_birth);
  }
  if (level_id !== undefined) {
    updates.push('level_id = ?');
    params.push(level_id);
  }
  if (section_id !== undefined) {
    updates.push('section_id = ?');
    params.push(section_id || null);
  }
  if (session_id !== undefined) {
    updates.push('session_id = ?');
    params.push(session_id);
  }
  if (is_boarding !== undefined) {
    updates.push('is_boarding = ?');
    params.push(is_boarding ? 1 : 0);
  }
  if (support_type !== undefined) {
    updates.push('support_type = ?');
    params.push(support_type);
  }
  if (guardian_id !== undefined) {
    updates.push('guardian_id = ?');
    params.push(guardian_id);
  }
  if (kebele !== undefined) {
    updates.push('kebele = ?');
    params.push(kebele);
  }
  if (specific_place !== undefined) {
    updates.push('specific_place = ?');
    params.push(specific_place);
  }
  if (current_juz !== undefined) {
    updates.push('current_juz = ?');
    params.push(current_juz);
  }
  if (photo_url !== undefined) {
    updates.push('photo_url = ?');
    params.push(photo_url);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.query(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const updatedStudent = await getStudentById(id);

  await logAudit({
    userId,
    action: 'UPDATE_STUDENT',
    tableName: 'students',
    recordId: id,
    oldValues: oldStudent,
    newValues: updatedStudent,
    ipAddress,
  });

  return updatedStudent;
};

/**
 * Soft deactivate or reactivate student (Rule: No hard deletes of students)
 */
const toggleStudentStatus = async (id, status, userId, ipAddress) => {
  return updateStudent(id, { status }, userId, ipAddress);
};

module.exports = {
  getAllStudents,
  getStudentById,
  registerStudent,
  updateStudent,
  toggleStudentStatus,
  checkDuplicateStudent,
  generateRegistrationNumber,
};
