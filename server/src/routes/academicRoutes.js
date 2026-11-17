const express = require('express');
const { body, param } = require('express-validator');
const academicController = require('../controllers/academicController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

// --- Levels ---
router.get('/levels', academicController.getLevels);
router.post(
  '/levels',
  authorize('admin'),
  [
    body('code').trim().notEmpty().withMessage('Level code is required (e.g. H-01)'),
    body('name').trim().notEmpty().withMessage('Level name is required'),
    body('track').isIn(['Huruufa', 'Qurana Tilaawa', 'Qurana Hifzi']).withMessage('Invalid track'),
  ],
  validate,
  academicController.createLevel
);
router.put('/levels/:id', authorize('admin'), academicController.updateLevel);
router.delete('/levels/:id', authorize('admin'), academicController.deleteLevel);

// --- Sessions ---
router.get('/sessions', academicController.getSessions);
router.post(
  '/sessions',
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Session name is required')],
  validate,
  academicController.createSession
);

// --- Academic Years ---
router.get('/academic-years', academicController.getAcademicYears);
router.post(
  '/academic-years',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Academic year name is required (e.g. 2026-2027)'),
    body('start_date').isDate().withMessage('Valid start date is required'),
    body('end_date').isDate().withMessage('Valid end date is required'),
  ],
  validate,
  academicController.createAcademicYear
);
router.put('/academic-years/:id/set-current', authorize('admin'), academicController.setCurrentAcademicYear);

// --- Sections ---
router.get('/sections', academicController.getSections);
router.post(
  '/sections',
  authorize('admin'),
  [
    body('level_id').isInt().withMessage('Valid level ID is required'),
    body('session_id').isInt().withMessage('Valid session ID is required'),
    body('academic_year_id').isInt().withMessage('Valid academic year ID is required'),
    body('name').trim().notEmpty().withMessage('Section name is required'),
  ],
  validate,
  academicController.createSection
);

module.exports = router;
