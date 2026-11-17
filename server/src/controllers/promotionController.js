const promotionService = require('../services/promotionService');
const { successResponse, errorResponse } = require('../utils/response');

class PromotionController {
  async getProposal(req, res, next) {
    try {
      const { academic_year_id, level_id } = req.query;
      const data = await promotionService.generatePromotionProposal({
        academic_year_id,
        level_id,
      });
      return successResponse(res, data, 'Promotion proposals calculated');
    } catch (error) {
      next(error);
    }
  }

  async executePromotions(req, res, next) {
    try {
      const { academic_year_id, decisions } = req.body;
      if (!academic_year_id || !Array.isArray(decisions)) {
        return errorResponse(res, 'academic_year_id and decisions array are required', 400);
      }

      const result = await promotionService.executePromotions({
        academic_year_id,
        decisions,
        user_id: req.user.id,
      });

      return successResponse(res, result, 'Promotions executed and committed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { academic_year_id, limit } = req.query;
      const data = await promotionService.getPromotionHistory({ academic_year_id, limit });
      return successResponse(res, data, 'Promotion history records fetched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PromotionController();
