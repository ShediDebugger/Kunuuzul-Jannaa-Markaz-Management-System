const feeService = require('../services/feeService');
const { successResponse, errorResponse } = require('../utils/response');

const getFeePlans = async (req, res) => {
  try {
    const plans = await feeService.getAllFeePlans();
    return successResponse(res, plans, 'Fee plans retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const saveFeePlan = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const plans = await feeService.saveFeePlan(req.body, req.user.id, ipAddress);
    return successResponse(res, plans, 'Fee plan saved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getStudentFee = async (req, res) => {
  try {
    const info = await feeService.getStudentFeeInfo(req.params.studentId);
    return successResponse(res, info, 'Student fee details retrieved');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const recordPayment = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const payment = await feeService.recordPayment(req.body, req.user.id, ipAddress);
    return successResponse(res, payment, 'Payment recorded successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { search, student_id, payment_method, payment_date, is_reversed, page, limit } = req.query;
    const result = await feeService.getAllPayments({
      search,
      student_id,
      payment_method,
      payment_date,
      is_reversed,
      page,
      limit,
    });
    return successResponse(res, result, 'Payments retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await feeService.getPaymentById(req.params.id);
    return successResponse(res, payment, 'Payment details retrieved');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const reversePayment = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return errorResponse(res, 'Reversal reason is required', 400);
    }
    const payment = await feeService.reversePayment(req.params.id, reason, req.user.id, ipAddress);
    return successResponse(res, payment, 'Payment reversed successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const summary = await feeService.getDailyCashierSummary(date);
    return successResponse(res, summary, 'Cashier daily summary retrieved');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getUnpaidList = async (req, res) => {
  try {
    const { academic_year_id, month_number, level_id } = req.query;
    const result = await feeService.getUnpaidList({ academic_year_id, month_number, level_id });
    return successResponse(res, result, 'Unpaid students list retrieved');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const createFreeRequest = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { student_id, reason } = req.body;
    if (!student_id || !reason) {
      return errorResponse(res, 'Student ID and written reason are required', 400);
    }
    const requests = await feeService.createFreeStudentRequest({ student_id, reason }, req.user.id, ipAddress);
    return successResponse(res, requests, 'Free student request recorded and pending approval', 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getFreeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await feeService.getFreeStudentRequests(status);
    return successResponse(res, requests, 'Free student requests retrieved');
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const decideFreeRequest = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { decision } = req.body; // 'approved' or 'rejected'
    const requests = await feeService.decideFreeStudentRequest(req.params.id, decision, req.user.id, ipAddress);
    return successResponse(res, requests, `Free student request marked as ${decision}`);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = {
  getFeePlans,
  saveFeePlan,
  getStudentFee,
  recordPayment,
  getAllPayments,
  getPaymentById,
  reversePayment,
  getDailySummary,
  getUnpaidList,
  createFreeRequest,
  getFreeRequests,
  decideFreeRequest,
};
