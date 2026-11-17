/**
 * Standard API Response Envelopes
 * Format: { success: boolean, data: any, message: string }
 */

const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    data: errors,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
