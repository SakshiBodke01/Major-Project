/**
 * Standardized API Response Envelopes for DMS REST API
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, pagination = null) => {
  const responseBody = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    responseBody.pagination = pagination;
  }

  return res.status(statusCode).json(responseBody);
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors ? (Array.isArray(errors) ? errors : [errors]) : null,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
