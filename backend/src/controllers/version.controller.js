const versionService = require('../services/version.service');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * Version Controller
 */
const getVersion = async (req, res, next) => {
  try {
    const versionInfo = await versionService.getVersionInfo();
    return sendSuccess(res, versionInfo, 'Application version info');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVersion,
};
