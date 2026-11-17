const attendanceService = require('../services/attendanceService');
const { successResponse, errorResponse } = require('../utils/response');

class AttendanceController {
  async recordBulk(req, res, next) {
    try {
      const { section_id, date, records } = req.body;
      if (!section_id || !Array.isArray(records)) {
        return errorResponse(res, 'section_id and records array are required', 400);
      }

      const result = await attendanceService.recordBulkAttendance({
        section_id,
        date,
        records,
        user_id: req.user.id,
      });

      return successResponse(res, result, 'Attendance recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSectionAttendance(req, res, next) {
    try {
      const { sectionId } = req.params;
      const { date } = req.query;
      const data = await attendanceService.getSectionAttendance(sectionId, date);
      return successResponse(res, data, 'Section attendance fetched');
    } catch (error) {
      next(error);
    }
  }

  async getStudentAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const { month, limit } = req.query;
      const data = await attendanceService.getStudentAttendance(studentId, { month, limit });
      return successResponse(res, data, 'Student attendance history fetched');
    } catch (error) {
      next(error);
    }
  }

  async getSectionSummary(req, res, next) {
    try {
      const { sectionId } = req.params;
      const { month } = req.query;
      const data = await attendanceService.getMonthlySectionSummary(sectionId, month);
      return successResponse(res, data, 'Section monthly summary fetched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
