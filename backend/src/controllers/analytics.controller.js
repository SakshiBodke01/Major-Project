const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/responseHandler');

const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, driverId } = req.query;
    const managerId = req.user?.managerId || req.query.managerId || null;
    const result = await analyticsService.getAnalyticsOverview({
      startDate,
      endDate,
      driverId,
      managerId,
    });
    return sendSuccess(res, result, 'Analytics overview retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview,
};
