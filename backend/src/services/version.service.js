const config = require('../config/env');
const pkg = require('../../package.json');

/**
 * Version Service - Retrieves application version details
 */
const getVersionInfo = async () => {
  return {
    name: pkg.name || 'DriveGuard AI Backend',
    version: pkg.version || '1.0.0',
    description: pkg.description || 'REST API for DriveGuard AI',
    environment: config.nodeEnv,
    apiVersion: 'v1',
  };
};

module.exports = {
  getVersionInfo,
};
