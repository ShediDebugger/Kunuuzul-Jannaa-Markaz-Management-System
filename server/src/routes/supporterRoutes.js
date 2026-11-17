const express = require('express');
const router = express.Router();
const supporterController = require('../controllers/supporterController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Record donation (Admin only)
router.post('/donations', authorize('admin'), supporterController.recordDonation);

// View donations registry (Admin and Supporter)
router.get('/donations', authorize('admin', 'supporter'), supporterController.getDonations);

// Institutional achievements view (Admin, Supporter, Reception)
router.get('/achievements', authorize('admin', 'supporter', 'reception'), supporterController.getAchievements);

module.exports = router;
