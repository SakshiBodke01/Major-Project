const { getDBStatus } = require('../config/db');
const config = require('../config/env');

/**
 * Health Service - Gathers system and database metrics
 */
const getHealthMetrics = async () => {
  const dbStatus = getDBStatus();
  const uptimeSec = Math.floor(process.uptime());

  const memoryUsage = process.memoryUsage();
  const memoryFormatted = {
    rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
  };

  const isHealthy = dbStatus.isConnected || config.nodeEnv === 'development';

  return {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptimeSec,
    memoryUsage: memoryFormatted,
    database: dbStatus,
  };
};

module.exports = {
  getHealthMetrics,
};
