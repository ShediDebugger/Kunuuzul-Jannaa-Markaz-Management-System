const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Promotions are Admin-controlled
router.get('/proposal', authorize('admin'), promotionController.getProposal);
router.post('/execute', authorize('admin'), promotionController.executePromotions);
router.get('/history', authorize('admin'), promotionController.getHistory);

module.exports = router;
