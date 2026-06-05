/**
 * Standard API response helpers
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, statusCode = 500, message = 'Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

const paginatedResponse = (res, statusCode = 200, message = 'Success', data, pagination) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
