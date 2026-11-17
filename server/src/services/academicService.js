const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * --- Levels ---
 */
const getAllLevels = async () => {
  const query = `
    SELECT 
      l.id, l.code, l.name, l.track, l.description,
      l.next_level_male_id, lm.name AS next_level_male_name, lm.code AS next_level_male_code,
      l.next_level_female_id, lf.name AS next_level_female_name, lf.code AS next_level_female_code,
      (SELECT COUNT(*) FROM students s WHERE s.level_id = l.id AND s.status = 'active') AS active_students_count
    FROM levels l
    LEFT JOIN levels lm ON l.next_level_male_id = lm.id
    LEFT JOIN levels lf ON l.next_level_female_id = lf.id
    ORDER BY l.id ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

const getLevelById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM levels WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw { status: 404, message: 'Level not found' };
  }
  return rows[0];
};

const createLevel = async (data, userId, ipAddress) => {
  const { code, name, track, next_level_male_id, next_level_female_id, description } = data;
  const [result] = await pool.query(
    'INSERT INTO levels (code, name, track, next_level_male_id, next_level_female_id, description) VALUES (?, ?, ?, ?, ?, ?)',
    [code, name, track, next_level_male_id || null, next_level_female_id || null, description || null]
  );
  const newLevel = await getLevelById(result.insertId);
  await logAudit({
    userId,
    action: 'CREATE_LEVEL',
    tableName: 'levels',
    recordId: result.insertId,
    newValues: newLevel,
    ipAddress,
  });
  return newLevel;
};

const updateLevel = async (id, data, userId, ipAddress) => {
  const oldLevel = await getLevelById(id);
  const { code, name, track, next_level_male_id, next_level_female_id, description } = data;

  await pool.query(
    `UPDATE levels 
     SET code = ?, name = ?, track = ?, next_level_male_id = ?, next_level_female_id = ?, description = ?
     WHERE id = ?`,
    [code, name, track, next_level_male_id || null, next_level_female_id || null, description || null, id]
  );

  const updatedLevel = await getLevelById(id);
  await logAudit({
    userId,
    action: 'UPDATE_LEVEL',
    tableName: 'levels',
    recordId: id,
    oldValues: oldLevel,
    newValues: updatedLevel,
    ipAddress,
  });
  return updatedLevel;
};

const deleteLevel = async (id, userId, ipAddress) => {
  const [students] = await pool.query('SELECT COUNT(*) AS count FROM students WHERE level_id = ?', [id]);
  if (students[0].count > 0) {
    throw { status: 400, message: 'Cannot delete level while students are enrolled in it' };
  }

  const oldLevel = await getLevelById(id);
  await pool.query('DELETE FROM levels WHERE id = ?', [id]);
  await logAudit({
    userId,
    action: 'DELETE_LEVEL',
    tableName: 'levels',
    recordId: id,
    oldValues: oldLevel,
    ipAddress,
  });
  return true;
};

/**
 * --- Sessions ---
 */
const getAllSessions = async () => {
  const [rows] = await pool.query(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM students st WHERE st.session_id = s.id AND st.status = 'active') AS active_students_count
    FROM sessions s
    ORDER BY s.id ASC
  `);
  return rows;
};

const createSession = async (data, userId, ipAddress) => {
  const { name, description, is_boarding } = data;
  const [result] = await pool.query(
    'INSERT INTO sessions (name, description, is_boarding) VALUES (?, ?, ?)',
    [name, description || null, is_boarding ? 1 : 0]
  );
  return { id: result.insertId, name, description, is_boarding };
};

/**
 * --- Academic Years ---
 */
const getAllAcademicYears = async () => {
  const [rows] = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
  return rows;
};

const getCurrentAcademicYear = async () => {
  const [rows] = await pool.query('SELECT * FROM academic_years WHERE is_current = 1 LIMIT 1');
  if (rows.length === 0) {
    const [fallback] = await pool.query('SELECT * FROM academic_years ORDER BY id DESC LIMIT 1');
    return fallback[0] || null;
  }
  return rows[0];
};

const createAcademicYear = async (data, userId, ipAddress) => {
  const { name, start_date, end_date, is_current } = data;

  if (is_current) {
    // Reset any other current academic year
    await pool.query('UPDATE academic_years SET is_current = 0');
  }

  const [result] = await pool.query(
    'INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)',
    [name, start_date, end_date, is_current ? 1 : 0]
  );

  return { id: result.insertId, name, start_date, end_date, is_current };
};

const setCurrentAcademicYear = async (id, userId, ipAddress) => {
  await pool.query('UPDATE academic_years SET is_current = 0');
  await pool.query('UPDATE academic_years SET is_current = 1 WHERE id = ?', [id]);
  return true;
};

/**
 * --- Sections ---
 */
const getAllSections = async (academicYearId = null) => {
  let where = '';
  const params = [];
  if (academicYearId) {
    where = 'WHERE sec.academic_year_id = ?';
    params.push(academicYearId);
  }

  const query = `
    SELECT 
      sec.id, sec.name, sec.level_id, l.name AS level_name, l.code AS level_code,
      sec.session_id, ses.name AS session_name,
      sec.academic_year_id, ay.name AS academic_year_name,
      (SELECT COUNT(*) FROM students s WHERE s.section_id = sec.id AND s.status = 'active') AS student_count
    FROM sections sec
    JOIN levels l ON sec.level_id = l.id
    JOIN sessions ses ON sec.session_id = ses.id
    JOIN academic_years ay ON sec.academic_year_id = ay.id
    ${where}
    ORDER BY l.id ASC, sec.name ASC
  `;
  const [rows] = await pool.query(query, params);
  return rows;
};

const createSection = async (data, userId, ipAddress) => {
  const { level_id, session_id, academic_year_id, name } = data;
  const [result] = await pool.query(
    'INSERT INTO sections (level_id, session_id, academic_year_id, name) VALUES (?, ?, ?, ?)',
    [level_id, session_id, academic_year_id, name]
  );
  return { id: result.insertId, level_id, session_id, academic_year_id, name };
};

module.exports = {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
  getAllSessions,
  createSession,
  getAllAcademicYears,
  getCurrentAcademicYear,
  createAcademicYear,
  setCurrentAcademicYear,
  getAllSections,
  createSection,
};
