const express = require('express');
const { body, param, query } = require('express-validator');
const guardianController = require('../controllers/guardianController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'reception'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  guardianController.getAllGuardians
);

router.get('/by-phone', authorize('admin', 'reception'), guardianController.findByPhone);
router.get('/:id', authorize('admin', 'reception'), guardianController.getGuardianById);

router.post(
  '/',
  authorize('admin', 'reception'),
  [
    body('full_name').trim().notEmpty().withMessage('Guardian full name is required'),
    body('primary_phone').trim().notEmpty().withMessage('Primary phone is required'),
  ],
  validate,
  guardianController.createGuardian
);

router.put(
  '/:id',
  authorize('admin', 'reception'),
  [
    param('id').isInt().withMessage('Valid ID required'),
    body('full_name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('primary_phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  ],
  validate,
  guardianController.updateGuardian
);

router.delete('/:id', authorize('admin'), guardianController.deleteGuardian);

module.exports = router;
