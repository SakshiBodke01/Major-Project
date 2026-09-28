const healthService = require('../services/health.service');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * Health Controller
 */
const getHealth = async (req, res, next) => {
  try {
    const metrics = await healthService.getHealthMetrics();
    const statusCode = metrics.status === 'UP' ? 200 : 503;
    return sendSuccess(res, metrics, `Server status: ${metrics.status}`, statusCode);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
