const pool = require('../config/db');
const { logAudit } = require('./auditService');
const { formatPhoneNumber } = require('./guardianService');

/**
 * Normalizes and maps level text to existing Level ID
 */
const mapLevelToId = (classText, levels) => {
  if (!classText) return levels[0]?.id || 1;
  const cleaned = String(classText).trim().toUpperCase();

  // Match codes directly
  const directMatch = levels.find(l => l.code.toUpperCase() === cleaned);
  if (directMatch) return directMatch.id;

  // Match heuristics
  if (cleaned.includes('H-01') || cleaned.includes('H1') || cleaned.includes('HURUUFA 1') || cleaned.includes('HURUFA 1')) {
    return levels.find(l => l.code === 'H-01')?.id || 1;
  }
  if (cleaned.includes('H-02') || cleaned.includes('H2') || cleaned.includes('HURUUFA 2') || cleaned.includes('HURUFA 2')) {
    return levels.find(l => l.code === 'H-02')?.id || 2;
  }
  if (cleaned.includes('QT-03') || cleaned.includes('QT3') || cleaned.includes('TILAAWA 3') || cleaned.includes('03')) {
    return levels.find(l => l.code === 'QT-03')?.id || 3;
  }
  if (cleaned.includes('QT-04') || cleaned.includes('QT4') || cleaned.includes('04')) {
    return levels.find(l => l.code === 'QT-04')?.id || 4;
  }
  if (cleaned.includes('QT-05') || cleaned.includes('QT5') || cleaned.includes('05')) {
    return levels.find(l => l.code === 'QT-05')?.id || 5;
  }
  if (cleaned.includes('QH-06') || cleaned.includes('QH6') || cleaned.includes('06') || cleaned.includes('HIFZI 6')) {
    return levels.find(l => l.code === 'QH-06')?.id || 6;
  }
  if (cleaned.includes('QH-07') || cleaned.includes('QH7') || cleaned.includes('07') || cleaned.includes('HIFZI 7')) {
    return levels.find(l => l.code === 'QH-07')?.id || 7;
  }

  return levels[0]?.id || 1;
};

/**
 * Normalizes Sex: F, M, dhala, dhira -> 'male' | 'female'
 */
const mapSex = (sexInput) => {
  if (!sexInput) return 'male';
  const val = String(sexInput).trim().toLowerCase();
  if (val.startsWith('f') || val.includes('dhala') || val.includes('female') || val.includes('ሴت') || val.includes('انثى')) {
    return 'female';
  }
  return 'male';
};

/**
 * Normalizes Session and Boarding flag
 */
const mapSession = (sessionInput, sessions) => {
  const val = String(sessionInput || '').trim().toLowerCase();
  const isBoarding = val.includes('bulu') || val.includes('dorm') || val.includes('board');

  if (isBoarding) {
    const boardingSession = sessions.find(s => s.is_boarding);
    return { session_id: boardingSession?.id || sessions[0]?.id || 1, is_boarding: true };
  }
  if (val.includes('ganama') || val.includes('morning')) {
    const morningSession = sessions.find(s => s.name.toLowerCase().includes('morning'));
    return { session_id: morningSession?.id || 2, is_boarding: false };
  }
  if (val.includes('wabari') || val.includes('afternoon')) {
    const aftSession = sessions.find(s => s.name.toLowerCase().includes('afternoon'));
    return { session_id: aftSession?.id || 3, is_boarding: false };
  }
  if (val.includes('guyyaa') || val.includes('all day') || val.includes('full')) {
    const allDaySession = sessions.find(s => s.name.toLowerCase().includes('all day'));
    return { session_id: allDaySession?.id || 4, is_boarding: false };
  }

  return { session_id: sessions[0]?.id || 1, is_boarding: false };
};

/**
 * Parse & Validate Rows from Excel/CSV (Section 6 Developer Manual)
 */
const validateMigrationData = async (rawRows) => {
  const [levels] = await pool.query('SELECT * FROM levels ORDER BY id ASC');
  const [sessions] = await pool.query('SELECT * FROM sessions ORDER BY id ASC');

  const processedRows = [];
  let validCount = 0;
  let errorCount = 0;
  let warningCount = 0;

  const currentYear = new Date().getFullYear();

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const errors = [];
    const warnings = [];

    // 1. Full Name (MAQAA)
    const rawName = raw.full_name || raw.name || raw['MAQAA'] || raw['Full Name'] || '';
    const fullName = String(rawName).replace(/\s+/g, ' ').trim();
    if (!fullName) {
      errors.push('Full name is required');
    }

    // 2. Registration Number (L/G)
    const rawReg = raw.registration_number || raw.reg_no || raw['L/G'] || raw['Reg No'] || '';
    const regNumber = String(rawReg).trim() || `KJM-${currentYear}-MIG${String(i + 1).padStart(3, '0')}`;

    // 3. Sex (SAALA)
    const rawSex = raw.sex || raw['SAALA'] || raw['Sex'] || 'M';
    const sex = mapSex(rawSex);

    // 4. Age & Date of Birth (UMRI)
    let dob = raw.date_of_birth || raw.dob || raw['Date of Birth'] || '';
    const rawAge = parseInt(raw.age || raw['UMRI'] || raw['Age'], 10);

    if (!dob && !isNaN(rawAge) && rawAge > 0) {
      const estimatedBirthYear = currentYear - rawAge;
      dob = `${estimatedBirthYear}-01-01`;
      warnings.push(`DOB estimated from age (${rawAge} yrs) as ${dob}`);
    } else if (!dob) {
      dob = `${currentYear - 10}-01-01`;
      warnings.push(`DOB missing; defaulted to 10 years old (${dob})`);
    }

    // 5. Level (KUTAA)
    const rawClass = raw.level || raw.class || raw['KUTAA'] || raw['Class'] || '';
    const levelId = mapLevelToId(rawClass, levels);
    const matchedLevel = levels.find(l => l.id === levelId);

    // 6. Current Juz (JUZA)
    const rawJuz = parseInt(raw.current_juz || raw.juz || raw['JUZA'] || raw['Juz'], 10);
    const currentJuz = (!isNaN(rawJuz) && rawJuz >= 1 && rawJuz <= 30) ? rawJuz : 1;

    // 7. Guardian (MAQAA WABII)
    const rawGuardian = raw.guardian_name || raw['MAQAA WABII'] || raw['Guardian'] || 'Parent of ' + fullName;
    const rawPhone = raw.guardian_phone || raw.phone || raw['BILBILA'] || raw['Phone'] || '+251911000000';
    const guardianPhone = formatPhoneNumber(String(rawPhone)) || '+251911000000';

    // 8. Session & Boarding (YEROO)
    const rawSession = raw.session || raw['YEROO'] || raw['Session'] || '';
    const { session_id, is_boarding } = mapSession(rawSession, sessions);
    const matchedSession = sessions.find(s => s.id === session_id);

    // 9. Location (AANAA / GANDA)
    const kebele = String(raw.kebele || raw['AANAA'] || raw['Kebele'] || '').trim();
    const specificPlace = String(raw.specific_place || raw.place || raw['GANDA'] || raw['Place'] || '').trim();

    // 10. Status (B/J)
    const rawStatus = String(raw.status || raw['B/J'] || 'active').trim().toLowerCase();
    const status = (rawStatus === 'j' || rawStatus === 'inactive' || rawStatus === 'hin jiru') ? 'inactive' : 'active';

    const isValid = errors.length === 0;
    if (isValid) validCount++; else errorCount++;
    if (warnings.length > 0) warningCount++;

    processedRows.push({
      rowNumber: i + 1,
      isValid,
      errors,
      warnings,
      mapped: {
        registration_number: regNumber,
        full_name: fullName,
        sex,
        date_of_birth: dob,
        level_id: levelId,
        level_name: matchedLevel ? `${matchedLevel.code} (${matchedLevel.name})` : 'Level 1',
        session_id,
        session_name: matchedSession ? matchedSession.name : 'Standard',
        is_boarding,
        support_type: 'family_dependent',
        guardian_name: rawGuardian,
        guardian_phone: guardianPhone,
        kebele,
        specific_place: specificPlace,
        status,
        current_juz: currentJuz,
        registration_date: new Date().toISOString().split('T')[0],
      },
    });
  }

  return {
    summary: {
      total: rawRows.length,
      valid: validCount,
      errors: errorCount,
      warnings: warningCount,
    },
    rows: processedRows,
  };
};

/**
 * Execute Batch Migration Import into MySQL within a Transaction
 */
const executeBatchImport = async (validRows, userId, ipAddress) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  let importedStudentsCount = 0;
  let importedGuardiansCount = 0;

  try {
    for (const item of validRows) {
      const data = item.mapped;

      // 1. Find or create guardian by phone
      let guardianId = null;
      const [existingG] = await connection.query(
        'SELECT id FROM guardians WHERE primary_phone = ? OR secondary_phone = ? LIMIT 1',
        [data.guardian_phone, data.guardian_phone]
      );

      if (existingG.length > 0) {
        guardianId = existingG[0].id;
      } else {
        const [newG] = await connection.query(
          'INSERT INTO guardians (full_name, primary_phone, address) VALUES (?, ?, ?)',
          [data.guardian_name, data.guardian_phone, data.kebele || 'Markaz Registry']
        );
        guardianId = newG.insertId;
        importedGuardiansCount++;
      }

      // 2. Insert or update student by registration number
      const [existingStudent] = await connection.query(
        'SELECT id FROM students WHERE registration_number = ? LIMIT 1',
        [data.registration_number]
      );

      if (existingStudent.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE students 
           SET full_name = ?, sex = ?, date_of_birth = ?, level_id = ?, session_id = ?,
               is_boarding = ?, guardian_id = ?, kebele = ?, specific_place = ?,
               status = ?, current_juz = ?
           WHERE id = ?`,
          [
            data.full_name, data.sex, data.date_of_birth, data.level_id, data.session_id,
            data.is_boarding ? 1 : 0, guardianId, data.kebele, data.specific_place,
            data.status, data.current_juz, existingStudent[0].id
          ]
        );
      } else {
        // Insert new student
        await connection.query(
          `INSERT INTO students (
            registration_number, full_name, sex, date_of_birth, level_id, session_id,
            is_boarding, support_type, guardian_id, kebele, specific_place,
            registration_date, status, current_juz
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.registration_number, data.full_name, data.sex, data.date_of_birth,
            data.level_id, data.session_id, data.is_boarding ? 1 : 0, 'family_dependent',
            guardianId, data.kebele, data.specific_place, data.registration_date,
            data.status, data.current_juz
          ]
        );
        importedStudentsCount++;
      }
    }

    await connection.commit();

    await logAudit({
      userId,
      action: 'EXCEL_MIGRATION_BATCH',
      tableName: 'students',
      newValues: {
        total_processed: validRows.length,
        imported_students: importedStudentsCount,
        imported_guardians: importedGuardiansCount,
      },
      ipAddress,
    });

    return {
      success: true,
      imported_students: importedStudentsCount,
      imported_guardians: importedGuardiansCount,
      total_processed: validRows.length,
    };
  } catch (err) {
    await connection.rollback();
    throw { status: 500, message: `Migration transaction failed: ${err.message}` };
  } finally {
    connection.release();
  }
};

module.exports = {
  validateMigrationData,
  executeBatchImport,
};
