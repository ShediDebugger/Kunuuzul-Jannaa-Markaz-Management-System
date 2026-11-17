const express = require('express');
const { body, param, query } = require('express-validator');
const feeController = require('../controllers/feeController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

// --- Fee Plans ---
router.get('/plans', feeController.getFeePlans);
router.post(
  '/plans',
  authorize('admin'),
  [
    body('level_id').isInt().withMessage('Valid level ID is required'),
    body('session_id').isInt().withMessage('Valid session ID is required'),
    body('monthly_amount').isFloat({ min: 0 }).withMessage('Monthly amount must be at least 0'),
  ],
  validate,
  feeController.saveFeePlan
);

// --- Student Fee Calculation & Status ---
router.get('/student/:studentId', feeController.getStudentFee);

// --- Record Payment (Cashier, Admin) ---
router.post(
  '/payments',
  authorize('cashier', 'admin'),
  [
    body('student_id').isInt().withMessage('Valid student ID is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Payment amount must be greater than zero'),
    body('payment_method')
      .isIn(['cash', 'e_birr', 'cbe'])
      .withMessage('Payment method must be cash, e_birr, or cbe'),
  ],
  validate,
  feeController.recordPayment
);

// --- Payments List & Single Receipt ---
router.get(
  '/payments',
  authorize('cashier', 'admin', 'parent'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  feeController.getAllPayments
);

router.get('/payments/:id', authorize('cashier', 'admin', 'parent'), feeController.getPaymentById);

// --- Reverse Payment (Admin only) ---
router.post(
  '/payments/:id/reverse',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Valid payment ID is required'),
    body('reason').trim().notEmpty().withMessage('A reason for reversal is required'),
  ],
  validate,
  feeController.reversePayment
);

// --- Cashier Daily Summary ---
router.get('/daily-summary', authorize('cashier', 'admin'), feeController.getDailySummary);

// --- Unpaid List ---
router.get('/unpaid-list', authorize('cashier', 'admin'), feeController.getUnpaidList);

// --- Free Student Requests Workflow ---
router.get('/free-requests', authorize('admin', 'reception'), feeController.getFreeRequests);

router.post(
  '/free-requests',
  authorize('reception', 'admin'),
  [
    body('student_id').isInt().withMessage('Valid student ID is required'),
    body('reason').trim().notEmpty().withMessage('Written reason is required'),
  ],
  validate,
  feeController.createFreeRequest
);

router.post(
  '/free-requests/:id/decision',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Valid request ID is required'),
    body('decision').isIn(['approved', 'rejected']).withMessage("Decision must be 'approved' or 'rejected'"),
  ],
  validate,
  feeController.decideFreeRequest
);

module.exports = router;
