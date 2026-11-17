const express = require('express');
const { body, param, query } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'reception', 'teacher', 'parent', 'student'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  validate,
  studentController.getAllStudents
);

router.get('/check-duplicate', authorize('admin', 'reception'), studentController.checkDuplicate);

router.get('/:id', authorize('admin', 'reception', 'teacher', 'parent', 'student'), studentController.getStudentById);

router.post(
  '/',
  authorize('admin', 'reception'),
  [
    body('full_name').trim().notEmpty().withMessage('Student full name is required'),
    body('sex').isIn(['male', 'female']).withMessage('Sex must be male or female'),
    body('date_of_birth').isDate().withMessage('Valid date of birth is required'),
    body('level_id').isInt().withMessage('Valid level is required'),
    body('session_id').isInt().withMessage('Valid session is required'),
    body('support_type')
      .optional()
      .isIn(['independent', 'family_dependent'])
      .withMessage('Support type must be independent or family_dependent'),
  ],
  validate,
  studentController.registerStudent
);

router.put(
  '/:id',
  authorize('admin', 'reception'),
  [
    param('id').isInt().withMessage('Valid student ID is required'),
    body('sex').optional().isIn(['male', 'female']).withMessage('Sex must be male or female'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  validate,
  studentController.updateStudent
);

router.patch(
  '/:id/status',
  authorize('admin', 'reception'),
  [
    param('id').isInt().withMessage('Valid student ID is required'),
    body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  validate,
  studentController.toggleStatus
);

module.exports = router;
