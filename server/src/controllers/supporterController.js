const supporterService = require('../services/supporterService');
const { successResponse, errorResponse } = require('../utils/response');

class SupporterController {
  async recordDonation(req, res, next) {
    try {
      const { supporter_name, amount } = req.body;
      if (!supporter_name || !amount) {
        return errorResponse(res, 'supporter_name and amount are required', 400);
      }

      const result = await supporterService.recordDonation({
        ...req.body,
        user_id: req.user.id,
      });

      return successResponse(res, result, 'Donation recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getDonations(req, res, next) {
    try {
      const { purpose, limit, page } = req.query;
      const data = await supporterService.getDonations({ purpose, limit, page });
      return successResponse(res, data, 'Donations list fetched');
    } catch (error) {
      next(error);
    }
  }

  async getAchievements(req, res, next) {
    try {
      const data = await supporterService.getAchievements();
      return successResponse(res, data, 'Institutional achievements fetched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupporterController();
