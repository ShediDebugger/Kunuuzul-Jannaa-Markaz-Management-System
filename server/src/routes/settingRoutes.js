const express = require('express');
const settingController = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Any authenticated user can read settings (e.g. school name, calendar preference)
router.get('/', authenticate, settingController.getSettings);

// Only Admin can update settings
router.put('/', authenticate, authorize('admin'), settingController.updateSettings);

module.exports = router;
