const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Reports dashboard (Admin, Supporter, Reception)
router.get('/dashboard', authorize('admin', 'supporter', 'reception'), reportController.getDashboardReport);

// Export datasets (Admin)
router.get('/export/:reportType', authorize('admin'), reportController.getExportData);

module.exports = router;
