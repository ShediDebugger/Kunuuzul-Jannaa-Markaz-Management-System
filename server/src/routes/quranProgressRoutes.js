const express = require('express');
const router = express.Router();
const quranProgressController = require('../controllers/quranProgressController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Add progress entry (Teacher, Admin)
router.post('/', authorize('admin', 'teacher'), quranProgressController.addProgress);

// Get section latest progress matrix
router.get('/section/:sectionId', authorize('admin', 'teacher', 'reception'), quranProgressController.getSectionProgress);

// Get institution-wide stats
router.get('/stats', authorize('admin', 'teacher', 'reception', 'supporter'), quranProgressController.getStats);

// Get individual student progress history
router.get('/student/:studentId', authorize('admin', 'teacher', 'parent', 'student', 'reception'), quranProgressController.getStudentProgress);

module.exports = router;
