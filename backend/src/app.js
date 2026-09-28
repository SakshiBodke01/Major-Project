const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const requestLogger = require('./middlewares/requestLogger.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { sendError } = require('./utils/responseHandler');

// Import routes
const healthRoutes = require('./routes/health.routes');
const versionRoutes = require('./routes/version.routes');
const driverRoutes = require('./routes/driver.routes');
const tripRoutes = require('./routes/trip.routes');
const riskEventRoutes = require('./routes/riskEvent.routes');
const scoreSnapshotRoutes = require('./routes/scoreSnapshot.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

// Request Logging Middleware
app.use(requestLogger);

// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Express body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Register Core Health & Version Routes
app.use('/api/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/v1/version', versionRoutes);

// Register Telemetry & Domain Routes
app.use('/api/drivers', driverRoutes);
app.use('/api/v1/drivers', driverRoutes);

app.use('/api/trips', tripRoutes);
app.use('/api/v1/trips', tripRoutes);

app.use('/api/risk-events', riskEventRoutes);
app.use('/api/v1/risk-events', riskEventRoutes);

app.use('/api/score-snapshots', scoreSnapshotRoutes);
app.use('/api/v1/score-snapshots', scoreSnapshotRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  return sendError(res, `Resource not found - ${req.originalUrl}`, 404);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
