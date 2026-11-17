const portalService = require('../services/portalService');
const { successResponse, errorResponse } = require('../utils/response');

class PortalController {
  async getParentDashboard(req, res, next) {
    try {
      const data = await portalService.getParentDashboard(req.user.id);
      return successResponse(res, data, 'Parent portal dashboard fetched');
    } catch (error) {
      next(error);
    }
  }

  async getStudentDashboard(req, res, next) {
    try {
      const data = await portalService.getStudentDashboard(req.user.id);
      return successResponse(res, data, 'Student portal dashboard fetched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PortalController();
