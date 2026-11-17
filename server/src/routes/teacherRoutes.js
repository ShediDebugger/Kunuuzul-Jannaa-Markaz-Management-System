const express = require('express');
const { body, param, query } = require('express-validator');
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'reception'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  teacherController.getAllTeachers
);

router.get('/:id', authorize('admin', 'teacher'), teacherController.getTeacherById);

router.post(
  '/',
  authorize('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Teacher full name is required'),
    body('sex').isIn(['male', 'female']).withMessage('Sex must be male or female'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
  ],
  validate,
  teacherController.createTeacher
);

router.put(
  '/:id',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Valid ID required'),
    body('full_name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('sex').optional().isIn(['male', 'female']).withMessage('Sex must be male or female'),
  ],
  validate,
  teacherController.updateTeacher
);

router.post(
  '/:id/assign-sections',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Valid teacher ID required'),
    body('section_ids').isArray().withMessage('section_ids must be an array of section IDs'),
  ],
  validate,
  teacherController.assignSections
);

module.exports = router;
