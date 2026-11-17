const pool = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Generate sequential receipt number: REC-YYYY-XXXX
 */
const generateReceiptNumber = async (year = new Date().getFullYear()) => {
  const prefix = `REC-${year}-`;
  const [rows] = await pool.query(
    'SELECT receipt_number FROM payments WHERE receipt_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].receipt_number.replace(prefix, '');
    const parsed = parseInt(lastNum, 10);
    if (!isNaN(parsed)) {
      sequence = parsed + 1;
    }
  }
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

/**
 * Get all Fee Plans
 */
const getAllFeePlans = async () => {
  const query = `
    SELECT 
      fp.*,
      l.name AS level_name, l.code AS level_code,
      ses.name AS session_name
    FROM fee_plans fp
    JOIN levels l ON fp.level_id = l.id
    JOIN sessions ses ON fp.session_id = ses.id
    ORDER BY l.id ASC, ses.id ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/**
 * Create or update a fee plan
 */
const saveFeePlan = async (data, userId, ipAddress) => {
  const { level_id, session_id, is_boarding = false, monthly_amount, valid_from } = data;
  const validDate = valid_from || new Date().toISOString().split('T')[0];

  const query = `
    INSERT INTO fee_plans (level_id, session_id, is_boarding, monthly_amount, valid_from)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE monthly_amount = VALUES(monthly_amount)
  `;
  await pool.query(query, [level_id, session_id, is_boarding ? 1 : 0, monthly_amount, validDate]);

  await logAudit({
    userId,
    action: 'SAVE_FEE_PLAN',
    tableName: 'fee_plans',
    newValues: { level_id, session_id, is_boarding, monthly_amount, valid_from: validDate },
    ipAddress,
  });

  return getAllFeePlans();
};

/**
 * Get expected fee for a specific student based on their level and session,
 * and check if they have an active free student status.
 */
const getStudentFeeInfo = async (studentId) => {
  const [studentRows] = await pool.query(
    `SELECT s.id, s.full_name, s.registration_number, s.level_id, s.session_id, s.is_boarding, s.status,
            l.name AS level_name, l.code AS level_code, ses.name AS session_name
     FROM students s
     JOIN levels l ON s.level_id = l.id
     JOIN sessions ses ON s.session_id = ses.id
     WHERE s.id = ?`,
    [studentId]
  );

  if (studentRows.length === 0) {
    throw { status: 404, message: 'Student not found' };
  }
  const student = studentRows[0];

  // Check free student request status
  const [freeRows] = await pool.query(
    'SELECT * FROM free_student_requests WHERE student_id = ? ORDER BY id DESC LIMIT 1',
    [studentId]
  );
  const freeRequest = freeRows[0] || null;
  const isApprovedFree = freeRequest && freeRequest.status === 'approved';
  const isPendingFree = freeRequest && freeRequest.status === 'pending';

  // Fetch plan amount
  const [planRows] = await pool.query(
    `SELECT monthly_amount 
     FROM fee_plans 
     WHERE level_id = ? AND session_id = ? AND is_boarding = ?
     ORDER BY valid_from DESC LIMIT 1`,
    [student.level_id, student.session_id, student.is_boarding ? 1 : 0]
  );

  const baseMonthlyAmount = planRows.length > 0 ? Number(planRows[0].monthly_amount) : 0;
  const effectiveMonthlyAmount = isApprovedFree ? 0 : baseMonthlyAmount;

  return {
    student,
    base_monthly_amount: baseMonthlyAmount,
    effective_monthly_amount: effectiveMonthlyAmount,
    is_free_student: isApprovedFree,
    is_free_pending: isPendingFree,
    free_request: freeRequest,
  };
};

/**
 * Record a payment with sequential receipt and month allocation
 */
const recordPayment = async (data, userId, ipAddress) => {
  const {
    student_id,
    amount,
    payment_method, // 'cash', 'e_birr', 'cbe'
    reference_number,
    payment_date = new Date().toISOString().split('T')[0],
    months = [], // array of month numbers: e.g. [1, 2]
    academic_year_id,
  } = data;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw { status: 400, message: 'Payment amount must be greater than zero' };
  }

  // Get active academic year if not provided
  let yearId = academic_year_id;
  if (!yearId) {
    const [yearRows] = await pool.query('SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1');
    yearId = yearRows.length > 0 ? yearRows[0].id : 1;
  }

  const receiptNumber = await generateReceiptNumber();

  // Insert payment header
  const [payResult] = await pool.query(
    `INSERT INTO payments (
      receipt_number, student_id, amount, payment_method, reference_number,
      payment_date, received_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      receiptNumber,
      student_id,
      numAmount,
      payment_method,
      reference_number || null,
      payment_date,
      userId,
    ]
  );

  const paymentId = payResult.insertId;

  // Allocate payment to months
  // If months array is provided, divide amount evenly or per month
  const monthList = Array.isArray(months) && months.length > 0 ? months : [new Date().getMonth() + 1];
  const perMonthAmount = (numAmount / monthList.length).toFixed(2);

  for (const monthNum of monthList) {
    await pool.query(
      `INSERT INTO payment_months (payment_id, academic_year_id, month_number, amount_allocated)
       VALUES (?, ?, ?, ?)`,
      [paymentId, yearId, Number(monthNum), perMonthAmount]
    );
  }

  const completePayment = await getPaymentById(paymentId);

  await logAudit({
    userId,
    action: 'RECORD_PAYMENT',
    tableName: 'payments',
    recordId: paymentId,
    newValues: completePayment,
    ipAddress,
  });

  return completePayment;
};

/**
 * Get single payment by ID with student, receiver, and covered months
 */
const getPaymentById = async (id) => {
  const query = `
    SELECT 
      p.*,
      s.full_name AS student_name, s.registration_number, s.sex AS student_sex,
      l.name AS level_name, l.code AS level_code,
      ses.name AS session_name,
      g.full_name AS guardian_name, g.primary_phone AS guardian_phone,
      u.full_name AS received_by_name, u.username AS received_by_username,
      rev.full_name AS reversed_by_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    JOIN levels l ON s.level_id = l.id
    JOIN sessions ses ON s.session_id = ses.id
    JOIN guardians g ON s.guardian_id = g.id
    JOIN users u ON p.received_by = u.id
    LEFT JOIN users rev ON p.reversed_by = rev.id
    WHERE p.id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) {
    throw { status: 404, message: 'Payment record not found' };
  }
  const payment = rows[0];

  const [months] = await pool.query(
    `SELECT pm.*, ay.name AS academic_year_name 
     FROM payment_months pm
     JOIN academic_years ay ON pm.academic_year_id = ay.id
     WHERE pm.payment_id = ?`,
    [id]
  );
  payment.months = months;

  return payment;
};

/**
 * Get all payments with search & filter
 */
const getAllPayments = async ({
  search,
  student_id,
  payment_method,
  payment_date,
  is_reversed,
  page = 1,
  limit = 20,
}) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push(
      '(p.receipt_number LIKE ? OR p.reference_number LIKE ? OR s.full_name LIKE ? OR s.registration_number LIKE ?)'
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (student_id) {
    whereClauses.push('p.student_id = ?');
    params.push(student_id);
  }

  if (payment_method) {
    whereClauses.push('p.payment_method = ?');
    params.push(payment_method);
  }

  if (payment_date) {
    whereClauses.push('p.payment_date = ?');
    params.push(payment_date);
  }

  if (is_reversed !== undefined && is_reversed !== '') {
    whereClauses.push('p.is_reversed = ?');
    params.push(is_reversed === 'true' || is_reversed === 1 ? 1 : 0);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM payments p
    JOIN students s ON p.student_id = s.id
    ${whereSql}
  `;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT 
      p.*,
      s.full_name AS student_name, s.registration_number,
      l.code AS level_code,
      u.full_name AS received_by_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    JOIN levels l ON s.level_id = l.id
    JOIN users u ON p.received_by = u.id
    ${whereSql}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(dataQuery, [...params, Number(limit), Number(offset)]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    payments: rows,
  };
};

/**
 * Reverse a payment (Admin only, reversal-only rule, reason required)
 */
const reversePayment = async (paymentId, reason, adminUserId, ipAddress) => {
  const payment = await getPaymentById(paymentId);
  if (payment.is_reversed) {
    throw { status: 400, message: 'This payment has already been reversed' };
  }

  await pool.query(
    `UPDATE payments 
     SET is_reversed = 1, reversal_reason = ?, reversed_by = ?, reversed_at = NOW()
     WHERE id = ?`,
    [reason, adminUserId, paymentId]
  );

  const updatedPayment = await getPaymentById(paymentId);

  await logAudit({
    userId: adminUserId,
    action: 'REVERSE_PAYMENT',
    tableName: 'payments',
    recordId: paymentId,
    oldValues: { is_reversed: false },
    newValues: { is_reversed: true, reversal_reason: reason, reversed_by: adminUserId },
    ipAddress,
  });

  return updatedPayment;
};

/**
 * Daily Cashier Summary
 * Breaks down total collected for a date by cash, e-birr, CBE (excluding reversed)
 */
const getDailyCashierSummary = async (date = new Date().toISOString().split('T')[0]) => {
  const query = `
    SELECT 
      payment_method,
      COUNT(*) AS total_receipts,
      COALESCE(SUM(amount), 0) AS total_amount
    FROM payments
    WHERE payment_date = ? AND is_reversed = 0
    GROUP BY payment_method
  `;
  const [rows] = await pool.query(query, [date]);

  let totalDayAmount = 0;
  let totalDayReceipts = 0;
  const breakdown = {
    cash: { count: 0, amount: 0 },
    e_birr: { count: 0, amount: 0 },
    cbe: { count: 0, amount: 0 },
  };

  rows.forEach((row) => {
    const amt = parseFloat(row.total_amount);
    const cnt = parseInt(row.total_receipts, 10);
    totalDayAmount += amt;
    totalDayReceipts += cnt;
    if (breakdown[row.payment_method]) {
      breakdown[row.payment_method] = { count: cnt, amount: amt };
    }
  });

  return {
    date,
    total_amount: totalDayAmount,
    total_receipts: totalDayReceipts,
    breakdown,
  };
};

/**
 * Unpaid List per month
 * Calculates active students who owe fees for a given month in the active academic year.
 * Excludes approved free students; marks pending free requests.
 */
const getUnpaidList = async ({ academic_year_id, month_number = new Date().getMonth() + 1, level_id }) => {
  let yearId = academic_year_id;
  if (!yearId) {
    const [yearRows] = await pool.query('SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1');
    yearId = yearRows.length > 0 ? yearRows[0].id : 1;
  }

  const params = [yearId, Number(month_number)];
  let levelFilter = '';
  if (level_id) {
    levelFilter = 'AND s.level_id = ?';
    params.push(level_id);
  }

  const query = `
    SELECT 
      s.id AS student_id, s.full_name, s.registration_number, s.sex,
      l.name AS level_name, l.code AS level_code,
      ses.name AS session_name, s.is_boarding,
      g.full_name AS guardian_name, g.primary_phone AS guardian_phone,
      COALESCE(fp.monthly_amount, 0) AS expected_amount,
      COALESCE(paid.total_paid, 0) AS amount_paid,
      (COALESCE(fp.monthly_amount, 0) - COALESCE(paid.total_paid, 0)) AS balance_due,
      fsr.status AS free_status,
      fsr.reason AS free_reason
    FROM students s
    JOIN levels l ON s.level_id = l.id
    JOIN sessions ses ON s.session_id = ses.id
    JOIN guardians g ON s.guardian_id = g.id
    LEFT JOIN fee_plans fp ON fp.level_id = s.level_id 
                          AND fp.session_id = s.session_id 
                          AND fp.is_boarding = s.is_boarding
    LEFT JOIN (
      SELECT pm.academic_year_id, pm.month_number, p.student_id, SUM(pm.amount_allocated) AS total_paid
      FROM payment_months pm
      JOIN payments p ON pm.payment_id = p.id
      WHERE p.is_reversed = 0 AND pm.academic_year_id = ? AND pm.month_number = ?
      GROUP BY p.student_id
    ) paid ON paid.student_id = s.id
    LEFT JOIN (
      SELECT student_id, status, reason
      FROM free_student_requests
      WHERE id IN (SELECT MAX(id) FROM free_student_requests GROUP BY student_id)
    ) fsr ON fsr.student_id = s.id
    WHERE s.status = 'active'
      ${levelFilter}
      AND (fsr.status IS NULL OR fsr.status != 'approved')
      AND (COALESCE(fp.monthly_amount, 0) > COALESCE(paid.total_paid, 0))
    ORDER BY l.id ASC, s.full_name ASC
  `;

  const [rows] = await pool.query(query, params);

  const totalUnpaidAmount = rows.reduce((sum, r) => sum + parseFloat(r.balance_due || 0), 0);

  return {
    academic_year_id: yearId,
    month_number: Number(month_number),
    unpaid_count: rows.length,
    total_unpaid_amount: totalUnpaidAmount,
    students: rows,
  };
};

/**
 * Free Student Request Workflow (M7)
 * Reception records request with reason -> Admin approves or rejects
 */
const createFreeStudentRequest = async ({ student_id, reason }, userId, ipAddress) => {
  const [result] = await pool.query(
    'INSERT INTO free_student_requests (student_id, requested_by, reason, status) VALUES (?, ?, ?, ?)',
    [student_id, userId, reason, 'pending']
  );

  const requestId = result.insertId;

  await logAudit({
    userId,
    action: 'CREATE_FREE_STUDENT_REQUEST',
    tableName: 'free_student_requests',
    recordId: requestId,
    newValues: { student_id, reason, status: 'pending' },
    ipAddress,
  });

  return getFreeStudentRequests();
};

const getFreeStudentRequests = async (statusFilter = null) => {
  let where = '';
  const params = [];
  if (statusFilter) {
    where = 'WHERE fsr.status = ?';
    params.push(statusFilter);
  }

  const query = `
    SELECT 
      fsr.*,
      s.full_name AS student_name, s.registration_number,
      l.code AS level_code,
      req.full_name AS requested_by_name,
      app.full_name AS approved_by_name
    FROM free_student_requests fsr
    JOIN students s ON fsr.student_id = s.id
    JOIN levels l ON s.level_id = l.id
    JOIN users req ON fsr.requested_by = req.id
    LEFT JOIN users app ON fsr.approved_by = app.id
    ${where}
    ORDER BY fsr.created_at DESC
  `;
  const [rows] = await pool.query(query, params);
  return rows;
};

const decideFreeStudentRequest = async (requestId, decision, adminUserId, ipAddress) => {
  if (!['approved', 'rejected'].includes(decision)) {
    throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
  }

  await pool.query(
    `UPDATE free_student_requests 
     SET status = ?, approved_by = ?, decision_date = NOW()
     WHERE id = ?`,
    [decision, adminUserId, requestId]
  );

  await logAudit({
    userId: adminUserId,
    action: `FREE_STUDENT_${decision.toUpperCase()}`,
    tableName: 'free_student_requests',
    recordId: requestId,
    newValues: { status: decision, approved_by: adminUserId },
    ipAddress,
  });

  return getFreeStudentRequests();
};

module.exports = {
  generateReceiptNumber,
  getAllFeePlans,
  saveFeePlan,
  getStudentFeeInfo,
  recordPayment,
  getPaymentById,
  getAllPayments,
  reversePayment,
  getDailyCashierSummary,
  getUnpaidList,
  createFreeStudentRequest,
  getFreeStudentRequests,
  decideFreeStudentRequest,
};
