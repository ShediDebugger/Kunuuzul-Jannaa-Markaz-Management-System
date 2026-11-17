const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// All user management routes require admin role
router.use(authenticate, authorize('admin'));

router.get(
  '/',
  [
    query('role')
      .optional()
      .isIn(['admin', 'reception', 'teacher', 'cashier', 'parent', 'student', 'supporter'])
      .withMessage('Invalid role'),
    query('status').optional().isIn(['active', 'blocked']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  userController.getAllUsers
);

router.get('/:id', [param('id').isInt().withMessage('Valid ID is required')], validate, userController.getUserById);

router.post(
  '/',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('role')
      .isIn(['admin', 'reception', 'teacher', 'cashier', 'parent', 'student', 'supporter'])
      .withMessage('Role must be one of the specified system roles'),
  ],
  validate,
  userController.createUser
);

router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Valid user ID is required'),
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('role')
      .optional()
      .isIn(['admin', 'reception', 'teacher', 'cashier', 'parent', 'student', 'supporter'])
      .withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'blocked']).withMessage('Status must be active or blocked'),
  ],
  validate,
  userController.updateUser
);

router.post(
  '/:id/reset-password',
  [
    param('id').isInt().withMessage('Valid user ID is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validate,
  userController.resetPassword
);

module.exports = router;
