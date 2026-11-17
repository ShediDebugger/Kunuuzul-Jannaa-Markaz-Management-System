const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await authService.login(username, password, ipAddress);
    return successResponse(res, result, 'Login successful');
  } catch (err) {
    const statusCode = err.status || 500;
    const message = err.message || 'Login failed';
    return errorResponse(res, message, statusCode);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return successResponse(res, user, 'Profile fetched successfully');
  } catch (err) {
    const statusCode = err.status || 500;
    return errorResponse(res, err.message, statusCode);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.changePassword(req.user.id, currentPassword, newPassword, ipAddress);
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    const statusCode = err.status || 500;
    return errorResponse(res, err.message, statusCode);
  }
};

module.exports = {
  login,
  getProfile,
  changePassword,
};
