const gradeService = require('../services/gradeService');
const { successResponse, errorResponse } = require('../utils/response');

class GradeController {
  async recordGrade(req, res, next) {
    try {
      const { student_id, subject, term, academic_year_id } = req.body;
      if (!student_id || !subject || !term || !academic_year_id) {
        return errorResponse(res, 'student_id, subject, term, and academic_year_id are required', 400);
      }

      const result = await gradeService.recordGrade({
        ...req.body,
        user_id: req.user.id,
      });

      return successResponse(res, result, 'Grade recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async recordBatch(req, res, next) {
    try {
      const { section_id, subject, term, academic_year_id, grades } = req.body;
      if (!section_id || !subject || !term || !academic_year_id || !Array.isArray(grades)) {
        return errorResponse(res, 'section_id, subject, term, academic_year_id, and grades array are required', 400);
      }

      const result = await gradeService.recordBatchSectionGrades({
        section_id,
        subject,
        term,
        academic_year_id,
        grades,
        user_id: req.user.id,
      });

      return successResponse(res, result, 'Batch section grades recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSectionGrades(req, res, next) {
    try {
      const { sectionId } = req.params;
      const { subject, term, academic_year_id } = req.query;
      const data = await gradeService.getSectionGrades(sectionId, { subject, term, academic_year_id });
      return successResponse(res, data, 'Section grades fetched');
    } catch (error) {
      next(error);
    }
  }

  async getStudentReportCard(req, res, next) {
    try {
      const { studentId } = req.params;
      const { term, academic_year_id } = req.query;
      const data = await gradeService.getStudentReportCard(studentId, { term, academic_year_id });
      return successResponse(res, data, 'Student report card generated');
    } catch (error) {
      next(error);
    }
  }

  async setTermLock(req, res, next) {
    try {
      const { academic_year_id, term, is_locked } = req.body;
      if (!academic_year_id || !term || is_locked === undefined) {
        return errorResponse(res, 'academic_year_id, term, and is_locked are required', 400);
      }

      const result = await gradeService.setTermLock({
        academic_year_id,
        term,
        is_locked,
        user_id: req.user.id,
      });

      return successResponse(res, result, `Term ${is_locked ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();
