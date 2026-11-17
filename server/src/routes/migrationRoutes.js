const express = require('express');
const { body, param, query } = require('express-validator');
const migrationController = require('../controllers/migrationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate, authorize('admin'));

// Preview & validation of Excel/CSV migration data
router.post(
  '/preview',
  [body('rows').isArray().withMessage('Rows must be an array of objects')],
  validate,
  migrationController.previewMigration
);

// Execute batch import into MySQL
router.post(
  '/execute',
  [body('validRows').isArray().withMessage('Valid rows array is required')],
  validate,
  migrationController.executeMigration
);

// Audit logs
router.get('/audit-logs', migrationController.getAuditLogs);

// Backup snapshot
router.get('/backup', migrationController.createBackup);

// Export dataset to CSV data
router.get('/export/:dataset', migrationController.exportData);

module.exports = router;
