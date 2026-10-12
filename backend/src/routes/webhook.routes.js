const express = require('express');
const {
  handleIncomingWebhook,
  handleTestWebhook,
  streamLiveUpdates,
  getWebhookStatus,
} = require('../controllers/webhook.controller');

const router = express.Router();

// Live SSE Stream for Web Dashboard
router.get('/stream', streamLiveUpdates);

// Webhook Status
router.get('/status', getWebhookStatus);

// Ingest Webhook
router.post('/telemetry', handleIncomingWebhook);
router.post('/events', handleIncomingWebhook);
router.post('/', handleIncomingWebhook);

// Trigger Test Webhook
router.post('/test', handleTestWebhook);

module.exports = router;
