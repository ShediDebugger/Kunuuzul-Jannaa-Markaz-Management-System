const studentService = require('../services/studentService');
const { successResponse, errorResponse } = require('../utils/response');

const getAllStudents = async (req, res) => {
  try {
    const {
      search,
      level_id,
      section_id,
      session_id,
      status,
      is_boarding,
      support_type,
      guardian_id,
      page,
      limit,
    } = req.query;

    const result = await studentService.getAllStudents({
      search,
      level_id,
      section_id,
      session_id,
      status,
      is_boarding,
      support_type,
      guardian_id,
      page,
      limit,
    });
    return successResponse(res, result, 'Students retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    return successResponse(res, student, 'Student retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const checkDuplicate = async (req, res) => {
  try {
    const { full_name, date_of_birth, guardian_phone } = req.query;
    if (!full_name || !date_of_birth || !guardian_phone) {
      return errorResponse(res, 'full_name, date_of_birth, and guardian_phone are required', 400);
    }
    const duplicate = await studentService.checkDuplicateStudent(full_name, date_of_birth, guardian_phone);
    return successResponse(
      res,
      { isDuplicate: !!duplicate, duplicate },
      duplicate ? 'Potential duplicate student found' : 'No duplicates found'
    );
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const registerStudent = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const student = await studentService.registerStudent(req.body, req.user.id, ipAddress);
    return successResponse(res, student, 'Student registered successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateStudent = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const student = await studentService.updateStudent(req.params.id, req.body, req.user.id, ipAddress);
    return successResponse(res, student, 'Student updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const toggleStatus = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { status } = req.body;
    const student = await studentService.toggleStudentStatus(req.params.id, status, req.user.id, ipAddress);
    return successResponse(res, student, `Student marked as ${status}`);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  checkDuplicate,
  registerStudent,
  updateStudent,
  toggleStatus,
};
