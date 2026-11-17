const reportService = require('../services/reportService');
const { successResponse, errorResponse } = require('../utils/response');

class ReportController {
  async getDashboardReport(req, res, next) {
    try {
      const data = await reportService.getDashboardReport();
      return successResponse(res, data, 'Comprehensive reports fetched');
    } catch (error) {
      next(error);
    }
  }

  async getExportData(req, res, next) {
    try {
      const { reportType } = req.params;
      const data = await reportService.getExportData(reportType);
      return successResponse(res, data, `Export data for ${reportType} generated`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
