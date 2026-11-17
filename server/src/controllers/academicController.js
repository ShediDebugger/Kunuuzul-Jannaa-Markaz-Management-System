const academicService = require('../services/academicService');
const { successResponse, errorResponse } = require('../utils/response');

// Levels
const getLevels = async (req, res) => {
  try {
    const levels = await academicService.getAllLevels();
    return successResponse(res, levels, 'Levels retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createLevel = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const level = await academicService.createLevel(req.body, req.user.id, ipAddress);
    return successResponse(res, level, 'Level created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateLevel = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const level = await academicService.updateLevel(req.params.id, req.body, req.user.id, ipAddress);
    return successResponse(res, level, 'Level updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const deleteLevel = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await academicService.deleteLevel(req.params.id, req.user.id, ipAddress);
    return successResponse(res, null, 'Level deleted successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

// Sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await academicService.getAllSessions();
    return successResponse(res, sessions, 'Sessions retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createSession = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const session = await academicService.createSession(req.body, req.user.id, ipAddress);
    return successResponse(res, session, 'Session created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

// Academic Years
const getAcademicYears = async (req, res) => {
  try {
    const years = await academicService.getAllAcademicYears();
    return successResponse(res, years, 'Academic years retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createAcademicYear = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const year = await academicService.createAcademicYear(req.body, req.user.id, ipAddress);
    return successResponse(res, year, 'Academic year created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const setCurrentAcademicYear = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await academicService.setCurrentAcademicYear(req.params.id, req.user.id, ipAddress);
    return successResponse(res, null, 'Current academic year updated');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

// Sections
const getSections = async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    const sections = await academicService.getAllSections(academic_year_id);
    return successResponse(res, sections, 'Sections retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createSection = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const section = await academicService.createSection(req.body, req.user.id, ipAddress);
    return successResponse(res, section, 'Section created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  getSessions,
  createSession,
  getAcademicYears,
  createAcademicYear,
  setCurrentAcademicYear,
  getSections,
  createSection,
};
