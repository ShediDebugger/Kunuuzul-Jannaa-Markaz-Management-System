const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Record bulk attendance for a section (Teacher, Admin)
router.post('/bulk', authorize('admin', 'teacher'), attendanceController.recordBulk);

// Get section attendance list (Teacher, Admin, Reception)
router.get('/section/:sectionId', authorize('admin', 'teacher', 'reception'), attendanceController.getSectionAttendance);

// Get monthly section attendance summary
router.get('/section/:sectionId/summary', authorize('admin', 'teacher', 'reception'), attendanceController.getSectionSummary);

// Get individual student attendance (Admin, Teacher, Parent, Student)
router.get('/student/:studentId', authorize('admin', 'teacher', 'parent', 'student', 'reception'), attendanceController.getStudentAttendance);

module.exports = router;
