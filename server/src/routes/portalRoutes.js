const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Parent personal portal (Parent, Admin)
router.get('/parent', authorize('parent', 'admin'), portalController.getParentDashboard);

// Student personal portal (Student, Admin)
router.get('/student', authorize('student', 'admin'), portalController.getStudentDashboard);

module.exports = router;
