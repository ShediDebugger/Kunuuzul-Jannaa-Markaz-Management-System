const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Generate full database snapshot (tables + rows)
 */
const generateDatabaseBackup = async (userId, ipAddress) => {
  const tables = [
    'settings',
    'academic_years',
    'sessions',
    'levels',
    'sections',
    'users',
    'teachers',
    'teacher_sections',
    'guardians',
    'students',
    'fee_plans',
    'free_student_requests',
    'payments',
    'payment_months',
    'attendance',
    'quran_progress',
    'grades',
    'promotions',
    'donations',
    'audit_logs',
  ];

  const backupData = {
    metadata: {
      institution: 'Kunuuzul-Jannaa-Markaz',
      system_version: '0.3',
      created_at: new Date().toISOString(),
      generated_by_user_id: userId,
    },
    tables: {},
  };

  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      backupData.tables[table] = rows;
    } catch (err) {
      backupData.tables[table] = [];
    }
  }

  await logAudit({
    userId,
    action: 'DATABASE_BACKUP_GENERATED',
    tableName: 'system',
    newValues: { tablesCount: tables.length },
    ipAddress,
  });

  return backupData;
};

/**
 * Export specific dataset to clean CSV
 */
const exportToCsv = async (datasetType) => {
  if (datasetType === 'students') {
    const [rows] = await pool.query(`
      SELECT 
        s.registration_number, s.full_name, s.sex, s.date_of_birth,
        l.code AS level_code, l.name AS level_name,
        ses.name AS session_name, s.is_boarding, s.support_type,
        g.full_name AS guardian_name, g.primary_phone AS guardian_phone,
        s.kebele, s.specific_place, s.current_juz, s.status, s.registration_date
      FROM students s
      JOIN levels l ON s.level_id = l.id
      JOIN sessions ses ON s.session_id = ses.id
      JOIN guardians g ON s.guardian_id = g.id
      ORDER BY s.id ASC
    `);
    return rows;
  }

  if (datasetType === 'payments') {
    const [rows] = await pool.query(`
      SELECT 
        p.receipt_number, s.registration_number, s.full_name AS student_name,
        p.amount, p.payment_method, p.reference_number, p.payment_date,
        u.full_name AS received_by, p.is_reversed, p.reversal_reason
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON p.received_by = u.id
      ORDER BY p.id DESC
    `);
    return rows;
  }

  return [];
};

module.exports = {
  generateDatabaseBackup,
  exportToCsv,
};
