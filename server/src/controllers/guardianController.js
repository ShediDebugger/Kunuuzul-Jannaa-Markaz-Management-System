const guardianService = require('../services/guardianService');
const { successResponse, errorResponse } = require('../utils/response');

const getAllGuardians = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await guardianService.getAllGuardians({ search, page, limit });
    return successResponse(res, result, 'Guardians retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getGuardianById = async (req, res) => {
  try {
    const guardian = await guardianService.getGuardianById(req.params.id);
    return successResponse(res, guardian, 'Guardian retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const findByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return errorResponse(res, 'Phone query parameter is required', 400);
    }
    const guardian = await guardianService.findGuardianByPhone(phone);
    return successResponse(res, guardian, guardian ? 'Guardian found' : 'No guardian found with this phone');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createGuardian = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const guardian = await guardianService.createGuardian(req.body, req.user.id, ipAddress);
    return successResponse(res, guardian, 'Guardian created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateGuardian = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const guardian = await guardianService.updateGuardian(req.params.id, req.body, req.user.id, ipAddress);
    return successResponse(res, guardian, 'Guardian updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const deleteGuardian = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await guardianService.deleteGuardian(req.params.id, req.user.id, ipAddress);
    return successResponse(res, null, 'Guardian deleted successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getAllGuardians,
  getGuardianById,
  findByPhone,
  createGuardian,
  updateGuardian,
  deleteGuardian,
};
