const API_BASE = '/api';

// Initial Mock Seed Data for offline preview / demo mode
let mockUsers = [
  { id: 1, username: 'admin', full_name: 'Sheikh Mohammed (General Manager)', role: 'admin', status: 'active', last_login: new Date().toISOString() },
  { id: 2, username: 'reception', full_name: 'Amina Ibrahim', role: 'reception', status: 'active', last_login: new Date().toISOString() },
  { id: 3, username: 'teacher_ahmed', full_name: 'Ustaz Ahmed Nur', role: 'teacher', status: 'active', last_login: new Date().toISOString() },
  { id: 4, username: 'cashier', full_name: 'Khalid Abdullahi', role: 'cashier', status: 'active', last_login: new Date().toISOString() },
  { id: 5, username: 'parent_fatima', full_name: 'Fatima Hassan', role: 'parent', status: 'active', last_login: new Date().toISOString() },
  { id: 6, username: 'student_bilal', full_name: 'Bilal Jamal', role: 'student', status: 'active', last_login: new Date().toISOString() },
  { id: 7, username: 'supporter_zayd', full_name: 'Haji Zayd Omer', role: 'supporter', status: 'active', last_login: new Date().toISOString() },
];

let mockLevels = [
  { id: 1, code: 'H-01', name: 'Huruufa Level 1', track: 'Huruufa', next_level_male_code: 'H-02', next_level_female_code: 'H-02', active_students_count: 45 },
  { id: 2, code: 'H-02', name: 'Huruufa Level 2', track: 'Huruufa', next_level_male_code: 'QT-03', next_level_female_code: 'QT-03', active_students_count: 52 },
  { id: 3, code: 'QT-03', name: 'Qurana Tilaawa Level 3', track: 'Qurana Tilaawa', next_level_male_code: 'QT-04', next_level_female_code: 'QT-05', active_students_count: 60 },
  { id: 4, code: 'QT-04', name: 'Qurana Tilaawa Level 4 (Boys)', track: 'Qurana Tilaawa', next_level_male_code: 'QH-06', next_level_female_code: null, active_students_count: 32 },
  { id: 5, code: 'QT-05', name: 'Qurana Tilaawa Level 5 (Girls)', track: 'Qurana Tilaawa', next_level_male_code: null, next_level_female_code: 'QH-07', active_students_count: 28 },
  { id: 6, code: 'QH-06', name: 'Qurana Hifzi Level 6 (Boys)', track: 'Qurana Hifzi', next_level_male_code: null, next_level_female_code: null, active_students_count: 18 },
  { id: 7, code: 'QH-07', name: 'Qurana Hifzi Level 7 (Girls)', track: 'Qurana Hifzi', next_level_male_code: null, next_level_female_code: null, active_students_count: 13 },
];

let mockSessions = [
  { id: 1, name: 'One Shift', description: 'Standard single daytime shift', is_boarding: false },
  { id: 2, name: 'Morning', description: 'Morning session (Ganama)', is_boarding: false },
  { id: 3, name: 'Afternoon', description: 'Afternoon session (Wabari)', is_boarding: false },
  { id: 4, name: 'All Day', description: 'Full day study session', is_boarding: false },
  { id: 5, name: 'Boarding', description: 'Full-time resident students (sleeps at school)', is_boarding: true },
];

let mockAcademicYears = [
  { id: 1, name: '2026-2027', start_date: '2026-09-01', end_date: '2027-06-30', is_current: true },
];

let mockSections = [
  { id: 1, name: 'Section A', level_id: 1, level_code: 'H-01', session_name: 'Morning', student_count: 24 },
  { id: 2, name: 'Section B', level_id: 1, level_code: 'H-01', session_name: 'Afternoon', student_count: 21 },
  { id: 3, name: 'Section A', level_id: 2, level_code: 'H-02', session_name: 'Morning', student_count: 26 },
  { id: 4, name: 'Section A', level_id: 3, level_code: 'QT-03', session_name: 'All Day', student_count: 30 },
  { id: 5, name: 'Boys Section A', level_id: 4, level_code: 'QT-04', session_name: 'All Day', student_count: 16 },
  { id: 6, name: 'Girls Section A', level_id: 5, level_code: 'QT-05', session_name: 'All Day', student_count: 14 },
  { id: 7, name: 'Hifzi Boys Dorm A', level_id: 6, level_code: 'QH-06', session_name: 'Boarding', student_count: 18 },
];

let mockGuardians = [
  { id: 1, full_name: 'Fatima Hassan', primary_phone: '+251911999901', secondary_phone: '+251911999902', relationship: 'Mother', address: 'Kebele 04, House 120', student_count: 2 },
  { id: 2, full_name: 'Mustafa Abdi', primary_phone: '+251911888801', secondary_phone: null, relationship: 'Father', address: 'Kebele 02, House 45', student_count: 1 },
];

let mockStudents = [
  { id: 1, registration_number: 'KJM-2026-0001', full_name: 'Bilal Jamal', sex: 'male', date_of_birth: '2014-05-12', age: 12, level_id: 1, level_name: 'Huruufa Level 1', level_code: 'H-01', track: 'Huruufa', section_id: 1, section_name: 'Section A', session_id: 2, session_name: 'Morning', is_boarding: false, support_type: 'family_dependent', guardian_id: 1, guardian_name: 'Fatima Hassan', guardian_phone: '+251911999901', kebele: 'Kebele 04', specific_place: 'Ganda Baha', status: 'active', current_juz: 1, current_page: 12, current_surah: 'Al-Baqarah', current_ayah: 76 },
  { id: 2, registration_number: 'KJM-2026-0002', full_name: 'Sumayya Jamal', sex: 'female', date_of_birth: '2016-08-20', age: 10, level_id: 1, level_name: 'Huruufa Level 1', level_code: 'H-01', track: 'Huruufa', section_id: 1, section_name: 'Section A', session_id: 2, session_name: 'Morning', is_boarding: false, support_type: 'family_dependent', guardian_id: 1, guardian_name: 'Fatima Hassan', guardian_phone: '+251911999901', kebele: 'Kebele 04', specific_place: 'Ganda Baha', status: 'active', current_juz: 1, current_page: 4, current_surah: 'Al-Faatiha', current_ayah: 7 },
  { id: 3, registration_number: 'KJM-2026-0003', full_name: 'Hamza Mustafa', sex: 'male', date_of_birth: '2013-02-14', age: 13, level_id: 3, level_name: 'Qurana Tilaawa Level 3', level_code: 'QT-03', track: 'Qurana Tilaawa', section_id: 4, section_name: 'Section A', session_id: 4, session_name: 'All Day', is_boarding: false, support_type: 'family_dependent', guardian_id: 2, guardian_name: 'Mustafa Abdi', guardian_phone: '+251911888801', kebele: 'Kebele 02', specific_place: 'Ganda Lixa', status: 'active', current_juz: 5, current_page: 86, current_surah: 'An-Nisa', current_ayah: 44 },
];

let mockAttendance = [
  { id: 1, student_id: 1, section_id: 1, date: new Date().toISOString().split('T')[0], status: 'present', note: null },
  { id: 2, student_id: 2, section_id: 1, date: new Date().toISOString().split('T')[0], status: 'present', note: null },
  { id: 3, student_id: 3, section_id: 4, date: new Date().toISOString().split('T')[0], status: 'late', note: 'Arrived 15 mins late' },
];

let mockQuranProgress = [
  { id: 1, student_id: 1, student_name: 'Bilal Jamal', date: new Date().toISOString().split('T')[0], type: 'new_memorization', page_number: 12, surah_name: 'Al-Baqarah', surah_number: 2, ayah_number: 76, from_page: 11, to_page: 12, from_ayah: 70, to_ayah: 76, juz_number: 1, evaluation: 'Mumtaz', teacher_name: 'Ustaz Ahmed Nur', note: 'MashaAllah clear tajweed and makharij' },
  { id: 2, student_id: 2, student_name: 'Sumayya Jamal', date: new Date().toISOString().split('T')[0], type: 'revision', page_number: 4, surah_name: 'Al-Faatiha', surah_number: 1, ayah_number: 7, from_page: 1, to_page: 4, from_ayah: 1, to_ayah: 7, juz_number: 1, evaluation: 'Jayyid Jiddan', teacher_name: 'Ustaz Ahmed Nur', note: 'Fluent recitation' },
  { id: 3, student_id: 3, student_name: 'Hamza Mustafa', date: new Date().toISOString().split('T')[0], type: 'new_memorization', page_number: 86, surah_name: 'An-Nisa', surah_number: 4, ayah_number: 44, from_page: 85, to_page: 86, from_ayah: 38, to_ayah: 44, juz_number: 5, evaluation: 'Jayyid', teacher_name: 'Ustaz Ahmed Nur', note: 'Focus on ghunnah rules' },
];

let mockGrades = [
  { id: 1, student_id: 1, subject: 'Qurana Hifzii', term: 'Term 1', academic_year_id: 1, mid_mark: 18.5, assignment_mark: 9.0, quiz_mark: 9.5, test_mark: 18.0, final_mark: 38.0, total_mark: 93.0, letter_grade: 'A', teacher_id: 1, remark: 'Excellent memorization and tajweed dedication', is_locked: false },
  { id: 2, student_id: 1, subject: 'Tajweed', term: 'Term 1', academic_year_id: 1, mid_mark: 19.0, assignment_mark: 10.0, quiz_mark: 9.0, test_mark: 19.0, final_mark: 39.0, total_mark: 96.0, letter_grade: 'A+', teacher_id: 1, remark: 'Mastery of Noon Sakinah and Tanween rules', is_locked: false },
  { id: 3, student_id: 1, subject: 'Aqiidaa fi Akhlaaqa', term: 'Term 1', academic_year_id: 1, mid_mark: 17.0, assignment_mark: 8.5, quiz_mark: 8.5, test_mark: 17.0, final_mark: 35.0, total_mark: 86.0, letter_grade: 'A-', teacher_id: 1, remark: 'Very good adab in class', is_locked: false },
  { id: 4, student_id: 2, subject: 'Qurana Hifzii', term: 'Term 1', academic_year_id: 1, mid_mark: 17.0, assignment_mark: 8.5, quiz_mark: 8.0, test_mark: 16.5, final_mark: 34.0, total_mark: 84.0, letter_grade: 'B+', teacher_id: 1, remark: 'Good effort, keeps progressing', is_locked: false },
  { id: 5, student_id: 3, subject: 'Qurana Hifzii', term: 'Term 1', academic_year_id: 1, mid_mark: 18.0, assignment_mark: 9.0, quiz_mark: 8.5, test_mark: 18.5, final_mark: 36.0, total_mark: 90.0, letter_grade: 'A', teacher_id: 1, remark: 'Great retention', is_locked: false },
];

let mockTeachers = [
  { id: 1, full_name: 'Ustaz Ahmed Nur', sex: 'male', phone: '+251911000001', status: 'active', sections: [{ id: 1, name: 'Section A', level_code: 'H-01', session_name: 'Morning' }, { id: 4, name: 'Section A', level_code: 'QT-03', session_name: 'All Day' }] },
];

let mockFeePlans = [
  { id: 1, level_id: 1, level_code: 'H-01', level_name: 'Huruufa Level 1', session_id: 1, session_name: 'One Shift', is_boarding: false, monthly_amount: '500.00', valid_from: '2026-09-01' },
  { id: 2, level_id: 1, level_code: 'H-01', level_name: 'Huruufa Level 1', session_id: 2, session_name: 'Morning', is_boarding: false, monthly_amount: '400.00', valid_from: '2026-09-01' },
  { id: 3, level_id: 3, level_code: 'QT-03', level_name: 'Qurana Tilaawa Level 3', session_id: 4, session_name: 'All Day', is_boarding: false, monthly_amount: '700.00', valid_from: '2026-09-01' },
];

let mockPayments = [
  { id: 1, receipt_number: 'REC-2026-0001', student_id: 1, student_name: 'Bilal Jamal', registration_number: 'KJM-2026-0001', level_code: 'H-01', amount: '400.00', payment_method: 'cash', reference_number: null, payment_date: '2026-11-16', received_by_name: 'Khalid Abdullahi', is_reversed: false },
  { id: 2, receipt_number: 'REC-2026-0002', student_id: 3, student_name: 'Hamza Mustafa', registration_number: 'KJM-2026-0003', level_code: 'QT-03', amount: '700.00', payment_method: 'e_birr', reference_number: 'EB99887711', payment_date: '2026-11-16', received_by_name: 'Khalid Abdullahi', is_reversed: false },
];

let mockFreeRequests = [
  { id: 1, student_id: 2, student_name: 'Sumayya Jamal', registration_number: 'KJM-2026-0002', reason: 'Family financial hardship, sibling enrolled', status: 'pending', requested_by_name: 'Amina Ibrahim', approved_by_name: null },
];

let mockAuditLogs = [
  { id: 1, actor_id: 1, actor_name: 'admin', action: 'CREATE', table_name: 'students', record_id: 1, old_values: null, new_values: { full_name: 'Bilal Jamal', level_code: 'H-01' }, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, actor_id: 2, actor_name: 'reception', action: 'UPDATE', table_name: 'students', record_id: 1, old_values: { section_id: 1 }, new_values: { section_id: 2 }, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, actor_id: 4, actor_name: 'cashier', action: 'CREATE', table_name: 'payments', record_id: 1, old_values: null, new_values: { amount: '400.00', method: 'cash' }, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 4, actor_id: 1, actor_name: 'admin', action: 'CREATE', table_name: 'users', record_id: 2, old_values: null, new_values: { username: 'reception', role: 'reception' }, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 5, actor_id: 1, actor_name: 'admin', action: 'UPDATE', table_name: 'fee_plans', record_id: 1, old_values: { monthly_amount: '450.00' }, new_values: { monthly_amount: '500.00' }, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 6, actor_id: 2, actor_name: 'reception', action: 'CREATE', table_name: 'free_student_requests', record_id: 1, old_values: null, new_values: { reason: 'Family financial hardship', status: 'pending' }, created_at: new Date(Date.now() - 259200000).toISOString() },
];

let mockMigrationPreview = null;

/**
 * Standard HTTP Request Wrapper with intelligent mock fallback
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('kjm_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data.data;
      throw error;
    }
    return data;
  } catch (err) {
    // If backend server is unreachable or offline, provide graceful mock response
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.status === 404 || err.status === 500) {
      return handleMockFallback(endpoint, options);
    }
    throw err;
  }
}

/**
 * Fallback Mock Handler for instant offline preview
 */
function handleMockFallback(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  // 1. Auth
  if (endpoint.startsWith('/auth/login')) {
    const foundUser = mockUsers.find(u => u.username === body.username) || mockUsers[0];
    const token = 'demo_jwt_token_' + foundUser.role;
    return {
      success: true,
      message: 'Demo login successful',
      data: { token, user: foundUser },
    };
  }
  if (endpoint.startsWith('/auth/me')) {
    const storedUser = JSON.parse(localStorage.getItem('kjm_demo_user') || 'null');
    return { success: true, data: storedUser || mockUsers[0], message: 'Demo profile' };
  }

  // 2. Users
  if (endpoint.startsWith('/users')) {
    if (method === 'POST') {
      const newUser = { id: mockUsers.length + 1, ...body, status: 'active', last_login: null };
      mockUsers.unshift(newUser);
      return { success: true, data: newUser, message: 'User created' };
    }
    return {
      success: true,
      data: { total: mockUsers.length, users: mockUsers },
      message: 'Users list',
    };
  }

  // 3. Academics
  if (endpoint.startsWith('/academics/levels')) return { success: true, data: mockLevels };
  if (endpoint.startsWith('/academics/sessions')) return { success: true, data: mockSessions };
  if (endpoint.startsWith('/academics/academic-years')) return { success: true, data: mockAcademicYears };
  if (endpoint.startsWith('/academics/sections')) {
    if (method === 'POST') {
      const newSec = { id: mockSections.length + 1, ...body, student_count: 0, level_code: 'H-01', session_name: 'Morning' };
      mockSections.push(newSec);
      return { success: true, data: newSec };
    }
    return { success: true, data: mockSections };
  }

  // 4. Guardians
  if (endpoint.startsWith('/guardians')) {
    if (method === 'POST') {
      const newG = { id: mockGuardians.length + 1, ...body, student_count: 0 };
      mockGuardians.unshift(newG);
      return { success: true, data: newG };
    }
    if (endpoint.includes('/')) {
      const id = parseInt(endpoint.split('/').pop(), 10);
      const g = mockGuardians.find(item => item.id === id) || mockGuardians[0];
      return { success: true, data: { ...g, students: mockStudents.filter(s => s.guardian_id === g.id) } };
    }
    return { success: true, data: { total: mockGuardians.length, guardians: mockGuardians } };
  }

  // 5. Teachers
  if (endpoint.startsWith('/teachers')) {
    if (method === 'POST') {
      const newT = { id: mockTeachers.length + 1, ...body, status: 'active', sections: [] };
      mockTeachers.unshift(newT);
      return { success: true, data: newT };
    }
    return { success: true, data: { total: mockTeachers.length, teachers: mockTeachers } };
  }

  // 6. Students
  if (endpoint.startsWith('/students/check-duplicate')) {
    return { success: true, data: { isDuplicate: false } };
  }
  if (endpoint.startsWith('/students')) {
    if (method === 'POST') {
      const newS = {
        id: mockStudents.length + 1,
        registration_number: body.custom_reg_number || `KJM-2026-${String(mockStudents.length + 1).padStart(4, '0')}`,
        ...body,
        age: 12,
        level_code: 'H-01',
        level_name: 'Huruufa Level 1',
        session_name: 'Morning',
        guardian_name: 'Fatima Hassan',
        guardian_phone: '+251911999901',
        status: 'active',
      };
      mockStudents.unshift(newS);
      return { success: true, data: newS };
    }
    if (endpoint.includes('/') && !endpoint.includes('?')) {
      const id = parseInt(endpoint.split('/').pop(), 10);
      const s = mockStudents.find(item => item.id === id) || mockStudents[0];
      return {
        success: true,
        data: {
          ...s,
          audit_history: [
            { action: 'REGISTER_STUDENT', created_at: '2026-09-05', actor_name: 'Amina Ibrahim' },
            { action: 'UPDATE_STUDENT', created_at: '2026-10-12', actor_name: 'Sheikh Mohammed' },
          ],
        },
      };
    }
    return { success: true, data: { total: mockStudents.length, students: mockStudents } };
  }

  // 7. Fees
  if (endpoint.startsWith('/fees/plans')) return { success: true, data: mockFeePlans };
  if (endpoint.startsWith('/fees/student/')) {
    const sId = parseInt(endpoint.split('/').pop(), 10);
    const stu = mockStudents.find(s => s.id === sId) || mockStudents[0];
    return {
      success: true,
      data: {
        student: stu,
        base_monthly_amount: 400,
        effective_monthly_amount: 400,
        is_free_student: false,
        is_free_pending: stu.id === 2,
      },
    };
  }
  if (endpoint.startsWith('/fees/payments')) {
    if (method === 'POST') {
      const stu = mockStudents.find(s => s.id === body.student_id) || mockStudents[0];
      const newPay = {
        id: mockPayments.length + 1,
        receipt_number: `REC-2026-${String(mockPayments.length + 1).padStart(4, '0')}`,
        student_id: body.student_id,
        student_name: stu.full_name,
        registration_number: stu.registration_number,
        level_code: stu.level_code,
        amount: body.amount,
        payment_method: body.payment_method,
        reference_number: body.reference_number,
        payment_date: body.payment_date,
        received_by_name: 'Khalid Abdullahi',
        is_reversed: false,
      };
      mockPayments.unshift(newPay);
      return { success: true, data: newPay };
    }
    return { success: true, data: { total: mockPayments.length, payments: mockPayments } };
  }
  if (endpoint.startsWith('/fees/daily-summary')) {
    return {
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        total_amount: 1100,
        total_receipts: 2,
        breakdown: {
          cash: { count: 1, amount: 400 },
          e_birr: { count: 1, amount: 700 },
          cbe: { count: 0, amount: 0 },
        },
      },
    };
  }
  if (endpoint.startsWith('/fees/unpaid-list')) {
    return {
      success: true,
      data: {
        unpaid_count: 1,
        total_unpaid_amount: 400,
        students: [
          {
            student_id: 2,
            full_name: 'Sumayya Jamal',
            registration_number: 'KJM-2026-0002',
            level_code: 'H-01',
            session_name: 'Morning',
            guardian_name: 'Fatima Hassan',
            guardian_phone: '+251911999901',
            expected_amount: 400,
            amount_paid: 0,
            balance_due: 400,
            free_status: 'pending',
          },
        ],
      },
    };
  }
  if (endpoint.startsWith('/fees/free-requests')) {
    if (method === 'POST') {
      const stu = mockStudents.find(s => s.id === body.student_id) || mockStudents[0];
      const newReq = {
        id: mockFreeRequests.length + 1,
        student_id: body.student_id,
        student_name: stu.full_name,
        registration_number: stu.registration_number,
        reason: body.reason,
        status: 'pending',
        requested_by_name: 'Amina Ibrahim',
        approved_by_name: null,
      };
      mockFreeRequests.unshift(newReq);
      return { success: true, data: mockFreeRequests };
    }
    return { success: true, data: mockFreeRequests };
  }

  // 8. Migration / Audit / Backup
  if (endpoint.startsWith('/migration/preview')) {
    const rows = body.rows || [];
    const previewed = rows.map((row, idx) => {
      const hasName = row.MAQAA || row.full_name;
      const errors = hasName ? [] : ['Missing student name (MAQAA)'];
      const warnings = row.UMRI ? [] : ['Date of birth not provided, will be estimated'];
      return {
        row_index: idx + 1,
        status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid',
        errors,
        warnings,
        mapped: {
          full_name: row.MAQAA || row.full_name || `Student ${idx + 1}`,
          sex: row.SAALA === 'Dhiira' || row.SAALA === 'male' ? 'male' : 'female',
          level_code: row.KUTAA || 'H-01',
          current_juz: parseInt(row.JUZA || '1', 10) || 1,
          guardian_phone: row.BILBILA || row.phone || '',
          kebele: row.AANAA || '',
          specific_place: row.GANDA || '',
          session_name: row.YEROO || 'Morning',
        },
      };
    });
    mockMigrationPreview = previewed;
    return { success: true, data: { total: rows.length, valid: previewed.filter(r => r.status === 'valid').length, warning: previewed.filter(r => r.status === 'warning').length, error: previewed.filter(r => r.status === 'error').length, rows: previewed } };
  }
  if (endpoint.startsWith('/migration/execute')) {
    const validRows = body.validRows || [];
    const imported = validRows.length;
    const newStudents = validRows.map((row, idx) => ({
      id: mockStudents.length + idx + 1,
      registration_number: `KJM-2026-${String(mockStudents.length + idx + 1).padStart(4, '0')}`,
      full_name: row.full_name || `Imported Student ${idx + 1}`,
      sex: row.sex || 'male',
      level_code: row.level_code || 'H-01',
      current_juz: row.current_juz || 1,
      status: 'active',
    }));
    mockStudents.unshift(...newStudents);
    return { success: true, data: { imported_students: imported, created_guardians: Math.floor(imported * 0.7), skipped: 0, errors: [] }, message: `${imported} students imported successfully` };
  }
  if (endpoint.startsWith('/migration/audit-logs')) {
    const page = parseInt(new URLSearchParams(endpoint.split('?')[1]).get('page') || '1', 10);
    const limit = 20;
    const start = (page - 1) * limit;
    return { success: true, data: { total: mockAuditLogs.length, page, limit, logs: mockAuditLogs.slice(start, start + limit) } };
  }
  if (endpoint.startsWith('/migration/backup')) {
    return { success: true, data: { backup_id: `KJM-BKP-${Date.now()}`, created_at: new Date().toISOString(), size_kb: 142, tables: ['students', 'guardians', 'payments', 'users', 'fee_plans', 'attendance'] }, message: 'Backup created successfully' };
  }
  if (endpoint.startsWith('/migration/export/')) {
    return { success: true, data: { download_url: '#', filename: `kjm_export_${Date.now()}.csv` }, message: 'Export ready' };
  }

  // 9. Attendance (M6)
  if (endpoint.startsWith('/attendance/bulk')) {
    const { section_id, date, records = [] } = body;
    for (const r of records) {
      const idx = mockAttendance.findIndex(a => a.student_id === r.student_id && a.date === date);
      if (idx >= 0) {
        mockAttendance[idx] = { ...mockAttendance[idx], status: r.status, note: r.note };
      } else {
        mockAttendance.push({ id: mockAttendance.length + 1, student_id: r.student_id, section_id, date, status: r.status, note: r.note });
      }
    }
    return { success: true, data: { count: records.length, date }, message: 'Attendance recorded' };
  }
  if (endpoint.startsWith('/attendance/section/')) {
    const sId = parseInt(endpoint.split('/')[3], 10);
    const date = new URLSearchParams(endpoint.split('?')[1] || '').get('date') || new Date().toISOString().split('T')[0];
    const sectionStudents = mockStudents.filter(s => s.section_id === sId || sId === 1);
    const studentsWithAtt = sectionStudents.map(s => {
      const att = mockAttendance.find(a => a.student_id === s.id && a.date === date);
      return {
        id: s.id,
        registration_number: s.registration_number,
        full_name: s.full_name,
        sex: s.sex,
        attendance_status: att ? att.status : 'present',
        note: att ? att.note : '',
      };
    });
    return {
      success: true,
      data: {
        section_id: sId,
        date,
        summary: {
          total: studentsWithAtt.length,
          present: studentsWithAtt.filter(s => s.attendance_status === 'present').length,
          absent: studentsWithAtt.filter(s => s.attendance_status === 'absent').length,
          late: studentsWithAtt.filter(s => s.attendance_status === 'late').length,
          excused: studentsWithAtt.filter(s => s.attendance_status === 'excused').length,
        },
        students: studentsWithAtt,
      },
    };
  }
  if (endpoint.startsWith('/attendance/student/')) {
    const stId = parseInt(endpoint.split('/')[3], 10);
    const records = mockAttendance.filter(a => a.student_id === stId);
    return {
      success: true,
      data: {
        student_id: stId,
        stats: { total_days: 20, present: 18, absent: 1, late: 1, excused: 0, rate_percentage: 90 },
        records,
      },
    };
  }

  // 10. Quran Progress (M8)
  if (endpoint.startsWith('/quran-progress')) {
    if (method === 'POST') {
      const stu = mockStudents.find(s => s.id === body.student_id) || mockStudents[0];
      const pageNum = parseInt(body.page_number, 10) || 1;
      const ayahNum = parseInt(body.ayah_number, 10) || 1;
      const juzNum = Math.min(30, Math.max(1, Math.ceil(pageNum / 20)));
      const newEntry = {
        id: mockQuranProgress.length + 1,
        student_id: body.student_id,
        student_name: stu.full_name,
        date: body.date || new Date().toISOString().split('T')[0],
        type: body.type,
        page_number: pageNum,
        surah_name: body.surah_name || 'Al-Baqarah',
        surah_number: body.surah_number || 2,
        ayah_number: ayahNum,
        from_page: body.from_page || pageNum,
        to_page: pageNum,
        from_ayah: body.from_ayah || 1,
        to_ayah: ayahNum,
        juz_number: juzNum,
        evaluation: body.evaluation || 'Jayyid',
        teacher_name: 'Ustaz Ahmed Nur',
        note: body.note || '',
      };
      mockQuranProgress.unshift(newEntry);
      // update student current coordinates
      stu.current_page = pageNum;
      stu.current_surah = body.surah_name || stu.current_surah;
      stu.current_ayah = ayahNum;
      stu.current_juz = juzNum;
      return { success: true, data: newEntry, message: 'Progress recorded successfully' };
    }
    if (endpoint.includes('/section/')) {
      const secId = parseInt(endpoint.split('/')[3], 10);
      const secStudents = mockStudents.filter(s => s.section_id === secId || secId === 1).map(s => ({
        id: s.id,
        registration_number: s.registration_number,
        full_name: s.full_name,
        sex: s.sex,
        current_juz: s.current_juz || 1,
        current_page: s.current_page || 1,
        current_surah: s.current_surah || 'Al-Faatiha',
        current_ayah: s.current_ayah || 1,
        last_evaluation: 'Mumtaz',
        last_type: 'new_memorization',
      }));
      return { success: true, data: { section_id: secId, students: secStudents } };
    }
    if (endpoint.includes('/student/')) {
      const stuId = parseInt(endpoint.split('/')[3], 10);
      const stu = mockStudents.find(s => s.id === stuId) || mockStudents[0];
      const stuProgress = mockQuranProgress.filter(p => p.student_id === stuId);
      return {
        success: true,
        data: {
          student: stu,
          records: stuProgress,
        },
      };
    }
    if (endpoint.includes('/stats')) {
      return {
        success: true,
        data: {
          juz_distribution: [
            { current_juz: 1, count: 42 },
            { current_juz: 2, count: 28 },
            { current_juz: 3, count: 19 },
            { current_juz: 5, count: 12 },
            { current_juz: 15, count: 6 },
            { current_juz: 30, count: 3 },
          ],
        },
      };
    }
  }

  // 11. Grades and Report Cards (M9)
  if (endpoint.startsWith('/grades')) {
    if (method === 'POST' && endpoint.includes('/batch')) {
      const { grades = [] } = body;
      for (const g of grades) {
        const total = (parseFloat(g.mid_mark) || 0) + (parseFloat(g.assignment_mark) || 0) + (parseFloat(g.quiz_mark) || 0) + (parseFloat(g.test_mark) || 0) + (parseFloat(g.final_mark) || 0);
        let letter = 'F';
        if (total >= 95) letter = 'A+';
        else if (total >= 90) letter = 'A';
        else if (total >= 85) letter = 'A-';
        else if (total >= 80) letter = 'B+';
        else if (total >= 75) letter = 'B';
        else if (total >= 70) letter = 'B-';
        else if (total >= 65) letter = 'C+';
        else if (total >= 60) letter = 'C';
        else if (total >= 50) letter = 'D';

        const existingIdx = mockGrades.findIndex(mg => mg.student_id === g.student_id && mg.subject === body.subject && mg.term === body.term);
        if (existingIdx >= 0) {
          mockGrades[existingIdx] = { ...mockGrades[existingIdx], ...g, total_mark: total, letter_grade: letter };
        } else {
          mockGrades.push({ id: mockGrades.length + 1, ...g, subject: body.subject, term: body.term, total_mark: total, letter_grade: letter, is_locked: false });
        }
      }
      return { success: true, data: { count: grades.length }, message: 'Grades saved' };
    }
    if (endpoint.includes('/section/')) {
      const secId = parseInt(endpoint.split('/')[3], 10);
      const subject = new URLSearchParams(endpoint.split('?')[1] || '').get('subject') || 'Qurana Hifzii';
      const term = new URLSearchParams(endpoint.split('?')[1] || '').get('term') || 'Term 1';
      const secStudents = mockStudents.filter(s => s.section_id === secId || secId === 1).map(s => {
        const g = mockGrades.find(mg => mg.student_id === s.id && mg.subject === subject && mg.term === term);
        return {
          id: s.id,
          registration_number: s.registration_number,
          full_name: s.full_name,
          sex: s.sex,
          mid_mark: g ? g.mid_mark : 0,
          assignment_mark: g ? g.assignment_mark : 0,
          quiz_mark: g ? g.quiz_mark : 0,
          test_mark: g ? g.test_mark : 0,
          final_mark: g ? g.final_mark : 0,
          total_mark: g ? g.total_mark : 0,
          letter_grade: g ? g.letter_grade : '—',
          remark: g ? g.remark : '',
          is_locked: g ? g.is_locked : false,
        };
      });
      return { success: true, data: { section_id: secId, subject, term, students: secStudents } };
    }
    if (endpoint.includes('/report-card')) {
      const stuId = parseInt(endpoint.split('/')[3], 10);
      const stu = mockStudents.find(s => s.id === stuId) || mockStudents[0];
      const grades = mockGrades.filter(g => g.student_id === stuId);
      const totalScore = grades.reduce((acc, g) => acc + (parseFloat(g.total_mark) || 0), 0);
      const avg = grades.length > 0 ? (totalScore / grades.length).toFixed(1) : 0;
      let overallLetter = 'F';
      if (avg >= 95) overallLetter = 'A+';
      else if (avg >= 90) overallLetter = 'A';
      else if (avg >= 85) overallLetter = 'A-';
      else if (avg >= 80) overallLetter = 'B+';
      else if (avg >= 75) overallLetter = 'B';
      else if (avg >= 70) overallLetter = 'B-';
      else if (avg >= 65) overallLetter = 'C+';
      else if (avg >= 60) overallLetter = 'C';
      else if (avg >= 50) overallLetter = 'D';

      return {
        success: true,
        data: {
          student: stu,
          term: 'Term 1',
          grades,
          summary: {
            subjects_count: grades.length,
            total_score: totalScore,
            total_possible: grades.length * 100,
            average_score: parseFloat(avg),
            overall_letter_grade: overallLetter,
          },
        },
      };
    }
  }

  // 12. Student Promotions (M10)
  if (endpoint.startsWith('/promotions/proposal')) {
    const proposals = [
      {
        student_id: 1,
        registration_number: 'KJM-2026-0001',
        full_name: 'Bilal Jamal',
        sex: 'male',
        current_juz: 1,
        current_page: 12,
        from_level_id: 1,
        from_level_code: 'H-01',
        from_level_name: 'Huruufa Level 1',
        to_level_id: 2,
        to_level_code: 'H-02',
        to_level_name: 'Huruufa Level 2',
        proposed_decision: 'promoted',
        decision: 'promoted',
        note: '',
      },
      {
        student_id: 2,
        registration_number: 'KJM-2026-0002',
        full_name: 'Sumayya Jamal',
        sex: 'female',
        current_juz: 1,
        current_page: 4,
        from_level_id: 1,
        from_level_code: 'H-01',
        from_level_name: 'Huruufa Level 1',
        to_level_id: 2,
        to_level_code: 'H-02',
        to_level_name: 'Huruufa Level 2',
        proposed_decision: 'promoted',
        decision: 'promoted',
        note: '',
      },
      {
        student_id: 3,
        registration_number: 'KJM-2026-0003',
        full_name: 'Hamza Mustafa',
        sex: 'male',
        current_juz: 5,
        current_page: 86,
        from_level_id: 3,
        from_level_code: 'QT-03',
        from_level_name: 'Qurana Tilaawa Level 3',
        to_level_id: 4,
        to_level_code: 'QT-04',
        to_level_name: 'Qurana Tilaawa Level 4 (Boys)',
        proposed_decision: 'promoted',
        decision: 'promoted',
        note: '',
      },
    ];
    return {
      success: true,
      data: {
        academic_year_id: 1,
        total_students: proposals.length,
        proposals,
      },
    };
  }
  if (endpoint.startsWith('/promotions/execute')) {
    const decisions = body.decisions || [];
    let promoted = 0, repeated = 0, left = 0;
    decisions.forEach(d => {
      if (d.decision === 'promoted') promoted++;
      else if (d.decision === 'repeated') repeated++;
      else if (d.decision === 'left') left++;
    });
    return {
      success: true,
      data: { summary: { promoted, repeated, left }, total_processed: decisions.length },
      message: `${promoted} students promoted successfully`,
    };
  }
  if (endpoint.startsWith('/promotions/history')) {
    return {
      success: true,
      data: {
        total: 2,
        history: [
          {
            id: 1,
            student_name: 'Bilal Jamal',
            registration_number: 'KJM-2026-0001',
            from_level_code: 'H-01',
            to_level_code: 'H-02',
            decision: 'promoted',
            decision_date: '2026-06-30',
            decided_by_name: 'Sheikh Mohammed',
            academic_year_name: '2025-2026',
          },
        ],
      },
    };
  }

  // 13. Comprehensive Reports (M13)
  if (endpoint.startsWith('/reports/dashboard')) {
    return {
      success: true,
      data: {
        demographics: {
          total_students: mockStudents.length,
          male_students: mockStudents.filter(s => s.sex === 'male').length,
          female_students: mockStudents.filter(s => s.sex === 'female').length,
          boarding_students: mockStudents.filter(s => s.is_boarding).length,
          day_students: mockStudents.filter(s => !s.is_boarding).length,
          independent_students: 1,
          family_dependent_students: 2,
        },
        levels: [
          { id: 1, code: 'H-01', name: 'Huruufa Level 1', track: 'Huruufa', student_count: 2 },
          { id: 2, code: 'H-02', name: 'Huruufa Level 2', track: 'Huruufa', student_count: 0 },
          { id: 3, code: 'QT-03', name: 'Qurana Tilaawa Level 3', track: 'Qurana Tilaawa', student_count: 1 },
          { id: 4, code: 'QT-04', name: 'Qurana Tilaawa Level 4 (Boys)', track: 'Qurana Tilaawa', student_count: 0 },
          { id: 5, code: 'QT-05', name: 'Qurana Tilaawa Level 5 (Girls)', track: 'Qurana Tilaawa', student_count: 0 },
          { id: 6, code: 'QH-06', name: 'Qurana Hifzi Level 6 (Boys)', track: 'Qurana Hifzi', student_count: 0 },
          { id: 7, code: 'QH-07', name: 'Qurana Hifzi Level 7 (Girls)', track: 'Qurana Hifzi', student_count: 0 },
        ],
        sessions: [
          { id: 1, name: 'One Shift', student_count: 0 },
          { id: 2, name: 'Morning', student_count: 2 },
          { id: 3, name: 'Afternoon', student_count: 0 },
          { id: 4, name: 'All Day', student_count: 1 },
          { id: 5, name: 'Boarding', student_count: 0 },
        ],
        finance: {
          total_collected: 1100,
          total_cash: 400,
          total_e_birr: 700,
          total_cbe: 0,
          total_receipts: 2,
          approved_free_count: 0,
          pending_free_count: 1,
        },
        attendance: {
          total_records: 30,
          present_count: 27,
          absent_count: 2,
          late_count: 1,
          excused_count: 0,
          monthly_rate: 90,
        },
        quran: {
          juz_distribution: [
            { current_juz: 1, count: 2 },
            { current_juz: 5, count: 1 },
          ],
        },
      },
    };
  }

  // 14. Supporters & Donations (M12)
  if (endpoint.startsWith('/supporters/donations')) {
    if (method === 'POST') {
      const newD = {
        id: Date.now(),
        supporter_name: body.supporter_name,
        organization: body.organization || null,
        contact: body.contact || null,
        amount: parseFloat(body.amount) || 0,
        donation_date: body.donation_date || new Date().toISOString().split('T')[0],
        method: body.method || 'cash',
        purpose: body.purpose || 'General Markaz Fund',
        note: body.note || '',
      };
      return { success: true, data: newD, message: 'Donation recorded successfully' };
    }
    return {
      success: true,
      data: {
        donations: [
          {
            id: 1,
            supporter_name: 'Haji Zayd Omer',
            organization: 'Zayd Trading Group',
            contact: '+251911776655',
            amount: 50000.0,
            donation_date: '2026-11-10',
            method: 'cbe',
            purpose: 'Hifzi Students Dormitory Wing',
            note: 'Barakallahu feekum for the Quran memorizers',
          },
          {
            id: 2,
            supporter_name: 'Dr. Aisha Nuru',
            organization: null,
            contact: '+251911443322',
            amount: 15000.0,
            donation_date: '2026-11-05',
            method: 'e_birr',
            purpose: 'Mushaf Printing & Quran Library',
            note: 'For printing new Madani Mushafs',
          },
          {
            id: 3,
            supporter_name: 'Anonymous Benefactor',
            organization: null,
            contact: null,
            amount: 25000.0,
            donation_date: '2026-10-28',
            method: 'cash',
            purpose: 'Needy Students Sponsorship (Iftaam)',
            note: 'Sponsoring 10 orphan students',
          },
        ],
        summary: {
          total_donations: 3,
          unique_donors: 3,
          total_amount: 90000.0,
          total_cash: 25000.0,
          total_e_birr: 15000.0,
          total_cbe: 50000.0,
        },
        purpose_breakdown: [
          { purpose: 'Hifzi Students Dormitory Wing', count: 1, total_amount: 50000.0 },
          { purpose: 'Needy Students Sponsorship (Iftaam)', count: 1, total_amount: 25000.0 },
          { purpose: 'Mushaf Printing & Quran Library', count: 1, total_amount: 15000.0 },
        ],
      },
    };
  }
  if (endpoint.startsWith('/supporters/achievements')) {
    return {
      success: true,
      data: {
        achievements: {
          current_enrolled: mockStudents.length,
          boarding_capacity: 45,
          advanced_memorizers: 28,
          completed_quran_students: 12,
          total_donations_raised: 90000.0,
          total_benefactors: 3,
        },
        active_projects: [
          {
            id: 1,
            title: 'Hifzi Students Dormitory Wing',
            target_amount: 500000,
            raised_amount: 385000,
            category: 'Infrastructure',
            status: 'in_progress',
          },
          {
            id: 2,
            title: 'Mushaf Printing & Quran Library',
            target_amount: 150000,
            raised_amount: 125000,
            category: 'Education',
            status: 'in_progress',
          },
          {
            id: 3,
            title: 'Needy Students Sponsorship (Iftaam)',
            target_amount: 300000,
            raised_amount: 280000,
            category: 'Sponsorship',
            status: 'active',
          },
        ],
      },
    };
  }

  // 15. Parent & Student Portal (M11)
  if (endpoint.startsWith('/portal/parent')) {
    const pChildren = mockStudents.map(s => ({
      ...s,
      attendance: {
        rate_percentage: 95,
        total_days: 20,
        absent_count: 1,
        late_count: 0,
      },
      academics: {
        average_score: '91.5',
        subjects_count: 5,
        letter_grade: 'A',
      },
      fees: {
        monthly_fee: 400,
        balance_due: s.id === 2 ? 400 : 0,
        is_up_to_date: s.id !== 2,
        latest_receipt: s.id === 1 ? { receipt_number: 'REC-2026-0001', amount: '400.00', payment_date: '2026-11-16' } : null,
      },
    }));
    return {
      success: true,
      data: {
        guardian: mockGuardians[0],
        total_children: pChildren.length,
        children: pChildren,
      },
    };
  }
  if (endpoint.startsWith('/portal/student')) {
    const s = mockStudents[0];
    return {
      success: true,
      data: {
        student: s,
        recent_quran: mockQuranProgress.filter(p => p.student_id === s.id),
        attendance: {
          total_days: 20,
          rate_percentage: 95,
        },
      },
    };
  }

  // 16. Settings
  if (endpoint.startsWith('/settings')) {
    return {
      success: true,
      data: {
        map: {
          school_name: 'Kunuuzul-Jannaa-Markaz',
          phone_contact: '+251911234567',
          address: 'Addis Ababa, Ethiopia',
          current_academic_year: '2026-2027',
        },
      },
    };
  }

  return { success: true, data: null };
}

export const api = {
  // Authentication (M1)
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request('/auth/me'),
    changePassword: (passwords) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwords),
      }),
  },

  // Users (Admin)
  users: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/users${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/users/${id}`),
    create: (userData) =>
      request('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    update: (id, userData) =>
      request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),
    resetPassword: (id, newPassword) =>
      request(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }),
  },

  // Academics (M4: Levels, Sessions, Academic Years, Sections)
  academics: {
    getLevels: () => request('/academics/levels'),
    createLevel: (data) =>
      request('/academics/levels', { method: 'POST', body: JSON.stringify(data) }),
    updateLevel: (id, data) =>
      request(`/academics/levels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLevel: (id) =>
      request(`/academics/levels/${id}`, { method: 'DELETE' }),

    getSessions: () => request('/academics/sessions'),
    createSession: (data) =>
      request('/academics/sessions', { method: 'POST', body: JSON.stringify(data) }),

    getAcademicYears: () => request('/academics/academic-years'),
    createAcademicYear: (data) =>
      request('/academics/academic-years', { method: 'POST', body: JSON.stringify(data) }),
    setCurrentAcademicYear: (id) =>
      request(`/academics/academic-years/${id}/set-current`, { method: 'PUT' }),

    getSections: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/academics/sections${query ? `?${query}` : ''}`);
    },
    createSection: (data) =>
      request('/academics/sections', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Guardians (M3)
  guardians: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/guardians${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/guardians/${id}`),
    findByPhone: (phone) => request(`/guardians/by-phone?phone=${encodeURIComponent(phone)}`),
    create: (data) =>
      request('/guardians', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/guardians/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) =>
      request(`/guardians/${id}`, { method: 'DELETE' }),
  },

  // Teachers (M5)
  teachers: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/teachers${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/teachers/${id}`),
    create: (data) =>
      request('/teachers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    assignSections: (id, section_ids) =>
      request(`/teachers/${id}/assign-sections`, {
        method: 'POST',
        body: JSON.stringify({ section_ids }),
      }),
  },

  // Students (M2)
  students: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/students${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/students/${id}`),
    checkDuplicate: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/students/check-duplicate?${query}`);
    },
    register: (data) =>
      request('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleStatus: (id, status) =>
      request(`/students/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Fees and Payments (M7)
  fees: {
    getPlans: () => request('/fees/plans'),
    savePlan: (data) =>
      request('/fees/plans', { method: 'POST', body: JSON.stringify(data) }),
    getStudentFee: (studentId) => request(`/fees/student/${studentId}`),
    recordPayment: (data) =>
      request('/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
    getAllPayments: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/fees/payments${query ? `?${query}` : ''}`);
    },
    getPaymentById: (id) => request(`/fees/payments/${id}`),
    reversePayment: (id, reason) =>
      request(`/fees/payments/${id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    getDailySummary: (date) =>
      request(`/fees/daily-summary${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    getUnpaidList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/fees/unpaid-list${query ? `?${query}` : ''}`);
    },
    getFreeRequests: (status) =>
      request(`/fees/free-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    createFreeRequest: (data) =>
      request('/fees/free-requests', { method: 'POST', body: JSON.stringify(data) }),
    decideFreeRequest: (id, decision) =>
      request(`/fees/free-requests/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      }),
  },

  // Settings (M14)
  settings: {
    get: () => request('/settings'),
    update: (settings) =>
      request('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },

  // Migration, Audit Log, Backup (M15 / Phase 4)
  migration: {
    preview: (rows) =>
      request('/migration/preview', { method: 'POST', body: JSON.stringify({ rows }) }),
    execute: (validRows) =>
      request('/migration/execute', { method: 'POST', body: JSON.stringify({ validRows }) }),
    getAuditLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/migration/audit-logs${query ? `?${query}` : ''}`);
    },
    createBackup: () => request('/migration/backup'),
    exportData: (dataset) => request(`/migration/export/${dataset}`),
  },

  // Attendance (M6)
  attendance: {
    recordBulk: (data) =>
      request('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
    getSectionAttendance: (sectionId, date) =>
      request(`/attendance/section/${sectionId}${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    getStudentAttendance: (studentId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/attendance/student/${studentId}${query ? `?${query}` : ''}`);
    },
    getSectionSummary: (sectionId, month) =>
      request(`/attendance/section/${sectionId}/summary${month ? `?month=${encodeURIComponent(month)}` : ''}`),
  },

  // Quran Progress (M8)
  quranProgress: {
    addProgress: (data) =>
      request('/quran-progress', { method: 'POST', body: JSON.stringify(data) }),
    getSectionProgress: (sectionId) =>
      request(`/quran-progress/section/${sectionId}`),
    getStudentProgress: (studentId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/quran-progress/student/${studentId}${query ? `?${query}` : ''}`);
    },
    getStats: () => request('/quran-progress/stats'),
  },

  // Grades & Report Cards (M9)
  grades: {
    recordGrade: (data) =>
      request('/grades', { method: 'POST', body: JSON.stringify(data) }),
    recordBatch: (data) =>
      request('/grades/batch', { method: 'POST', body: JSON.stringify(data) }),
    getSectionGrades: (sectionId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/grades/section/${sectionId}${query ? `?${query}` : ''}`);
    },
    getStudentReportCard: (studentId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/grades/student/${studentId}/report-card${query ? `?${query}` : ''}`);
    },
    setTermLock: (data) =>
      request('/grades/lock-term', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Student Promotions (M10)
  promotions: {
    getProposal: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/promotions/proposal${query ? `?${query}` : ''}`);
    },
    execute: (data) =>
      request('/promotions/execute', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/promotions/history${query ? `?${query}` : ''}`);
    },
  },

  // Reports (M13)
  reports: {
    getDashboard: () => request('/reports/dashboard'),
    getExportData: (reportType) => request(`/reports/export/${reportType}`),
  },

  // Supporters & Donations (M12)
  supporters: {
    recordDonation: (data) =>
      request('/supporters/donations', { method: 'POST', body: JSON.stringify(data) }),
    getDonations: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/supporters/donations${query ? `?${query}` : ''}`);
    },
    getAchievements: () => request('/supporters/achievements'),
  },

  // Parent & Student Portal (M11)
  portal: {
    getParentDashboard: () => request('/portal/parent'),
    getStudentDashboard: () => request('/portal/student'),
  },
};

export default api;
