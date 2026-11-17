const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/response');

const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page, limit } = req.query;
    const result = await userService.getAllUsers({ role, status, search, page, limit });
    return successResponse(res, result, 'Users retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, user, 'User retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createUser = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const newUser = await userService.createUser(req.body, req.user.id, ipAddress);
    return successResponse(res, newUser, 'User created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const updatedUser = await userService.updateUser(req.params.id, req.body, req.user.id, ipAddress);
    return successResponse(res, updatedUser, 'User updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { newPassword } = req.body;
    await userService.resetPassword(req.params.id, newPassword, req.user.id, ipAddress);
    return successResponse(res, null, 'User password reset successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
};
