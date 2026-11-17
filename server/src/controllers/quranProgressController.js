const quranProgressService = require('../services/quranProgressService');
const { successResponse, errorResponse } = require('../utils/response');

class QuranProgressController {
  async addProgress(req, res, next) {
    try {
      const { student_id, type, page_number, ayah_number, surah_name } = req.body;
      if (!student_id || !type || page_number === undefined || ayah_number === undefined) {
        return errorResponse(res, 'student_id, type, page_number, and ayah_number are required', 400);
      }

      const result = await quranProgressService.addProgress({
        ...req.body,
        user_id: req.user.id,
      });

      return successResponse(res, result, 'Quran progress entry recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getStudentProgress(req, res, next) {
    try {
      const { studentId } = req.params;
      const { type, page, limit } = req.query;
      const data = await quranProgressService.getStudentProgress(studentId, { type, page, limit });
      return successResponse(res, data, 'Student progress history fetched');
    } catch (error) {
      next(error);
    }
  }

  async getSectionProgress(req, res, next) {
    try {
      const { sectionId } = req.params;
      const data = await quranProgressService.getSectionProgress(sectionId);
      return successResponse(res, data, 'Section Quran progress matrix fetched');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const data = await quranProgressService.getInstitutionStats();
      return successResponse(res, data, 'Markaz Quran progress statistics fetched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuranProgressController();
