const liveStreamService = require('../services/liveStream.service');
const riskEventService = require('../services/riskEvent.service');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Webhook Ingestion Controller
 * Receives external or edge webhook notifications and streams them in real-time to the dashboard.
 */
const handleIncomingWebhook = async (req, res, next) => {
  try {
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return sendError(res, 'Webhook payload cannot be empty', 400);
    }

    const eventName = payload.event || payload.type || 'TELEMETRY_UPDATE';
    const eventData = payload.data || payload;

    logger.info(`Received incoming webhook: '${eventName}'`);

    let processedRecord = null;

    // If payload contains valid risk event properties, persist to database
    if (eventData.tripId && eventData.driverId && (eventData.type || eventName === 'RISK_EVENT')) {
      try {
        const formattedEvent = {
          eventId: eventData.eventId || `WBH_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tripId: eventData.tripId,
          driverId: eventData.driverId,
          type: eventData.type || 'DISTRACTION',
          severity: eventData.severity || 'HIGH',
          pointsDeducted: eventData.pointsDeducted !== undefined ? eventData.pointsDeducted : 20,
          latitude: eventData.latitude || 37.7749,
          longitude: eventData.longitude || -122.4194,
          confidence: eventData.confidence || 0.95,
          metadata: eventData.metadata || { source: 'WEBHOOK_UPLINK' },
          timestamp: eventData.timestamp || new Date(),
        };

        processedRecord = await riskEventService.createRiskEvent(formattedEvent);
      } catch (dbErr) {
        logger.warn(`Webhook data not persisted to DB, broadcasting payload directly: ${dbErr.message}`);
      }
    }

    // Broadcast live event via SSE to all connected dashboard clients
    const subscribers = liveStreamService.broadcast('webhook_event', {
      event: eventName,
      data: processedRecord || eventData,
      source: 'WEBHOOK',
      timestamp: new Date().toISOString(),
    });

    return sendSuccess(
      res,
      {
        event: eventName,
        subscribersNotified: subscribers,
        data: processedRecord || eventData,
      },
      `Webhook '${eventName}' processed and broadcasted to ${subscribers} live dashboard client(s)`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Test Webhook Generator - for quick dashboard verification
 */
const handleTestWebhook = async (req, res, next) => {
  try {
    const testTypes = ['DROWSINESS', 'PHONE_USE', 'DISTRACTION', 'YAWNING'];
    const chosenType = req.body.type || testTypes[Math.floor(Math.random() * testTypes.length)];
    const deductionMap = { DROWSINESS: 30, PHONE_USE: 25, DISTRACTION: 20, YAWNING: 10 };

    const sampleEvent = {
      eventId: `TEST_WBH_${Date.now()}`,
      tripId: req.body.tripId || 'TRIP_DEMO_01',
      driverId: req.body.driverId || 'DRV_101',
      type: chosenType,
      severity: chosenType === 'DROWSINESS' ? 'CRITICAL' : chosenType === 'PHONE_USE' ? 'HIGH' : 'MEDIUM',
      pointsDeducted: deductionMap[chosenType] || 15,
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
      confidence: 0.94,
      source: 'WEBHOOK_TEST_TRIGGER',
      message: `Live Webhook Alert: ${chosenType} detected!`,
      timestamp: new Date().toISOString(),
    };

    const subscribers = liveStreamService.broadcast('webhook_event', {
      event: 'LIVE_ALERT',
      data: sampleEvent,
      timestamp: new Date().toISOString(),
    });

    return sendSuccess(
      res,
      {
        event: 'LIVE_ALERT',
        subscribersNotified: subscribers,
        sampleEvent,
      },
      `Test Webhook dispatched to ${subscribers} dashboard listener(s)`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * SSE Live Stream Endpoint for Dashboard
 */
const streamLiveUpdates = (req, res) => {
  liveStreamService.subscribe(req, res);
};

/**
 * Webhook status endpoint
 */
const getWebhookStatus = (req, res) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    subscribersCount: liveStreamService.getSubscriberCount(),
    endpoints: {
      ingestWebhook: 'POST /api/webhooks/telemetry',
      testWebhook: 'POST /api/webhooks/test',
      liveStream: 'GET /api/stream/live',
    },
  });
};

module.exports = {
  handleIncomingWebhook,
  handleTestWebhook,
  streamLiveUpdates,
  getWebhookStatus,
};
