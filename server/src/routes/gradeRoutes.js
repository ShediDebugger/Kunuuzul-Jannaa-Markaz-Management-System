const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Record single student grade (Teacher, Admin)
router.post('/', authorize('admin', 'teacher'), gradeController.recordGrade);

// Record batch section grades (Teacher, Admin)
router.post('/batch', authorize('admin', 'teacher'), gradeController.recordBatch);

// Get section grades grid (Teacher, Admin)
router.get('/section/:sectionId', authorize('admin', 'teacher', 'reception'), gradeController.getSectionGrades);

// Get printable report card for student (Admin, Teacher, Parent, Student)
router.get('/student/:studentId/report-card', authorize('admin', 'teacher', 'parent', 'student', 'reception'), gradeController.getStudentReportCard);

// Lock or unlock term grades (Admin only)
router.post('/lock-term', authorize('admin'), gradeController.setTermLock);

module.exports = router;
