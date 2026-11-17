const settingService = require('../services/settingService');
const { successResponse, errorResponse } = require('../utils/response');

const getSettings = async (req, res) => {
  try {
    const settings = await settingService.getSettings();
    return successResponse(res, settings, 'Settings retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateSettings = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const updated = await settingService.updateMultipleSettings(req.body, req.user.id, ipAddress);
    return successResponse(res, updated, 'Settings updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
