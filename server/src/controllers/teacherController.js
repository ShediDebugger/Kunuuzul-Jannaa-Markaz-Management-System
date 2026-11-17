const teacherService = require('../services/teacherService');
const { successResponse, errorResponse } = require('../utils/response');

const getAllTeachers = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await teacherService.getAllTeachers({ status, search, page, limit });
    return successResponse(res, result, 'Teachers retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id);
    return successResponse(res, teacher, 'Teacher retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createTeacher = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const teacher = await teacherService.createTeacher(req.body, req.user.id, ipAddress);
    return successResponse(res, teacher, 'Teacher created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateTeacher = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const teacher = await teacherService.updateTeacher(req.params.id, req.body, req.user.id, ipAddress);
    return successResponse(res, teacher, 'Teacher updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const assignSections = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { section_ids } = req.body;
    const teacher = await teacherService.assignSections(req.params.id, section_ids, req.user.id, ipAddress);
    return successResponse(res, teacher, 'Sections assigned to teacher successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  assignSections,
};
