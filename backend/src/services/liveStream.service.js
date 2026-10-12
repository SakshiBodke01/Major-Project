const logger = require('../utils/logger');

/**
 * Real-time Event Stream Service using Server-Sent Events (SSE).
 * Manages active connected dashboard clients and broadcasts live telemetry/webhook updates.
 */
class LiveStreamService {
  constructor() {
    this.clients = new Set();
  }

  /**
   * Register a new client for live streaming
   */
  subscribe(req, res) {
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Disable nginx buffering if proxied
    });

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const client = { id: clientId, res };
    this.clients.add(client);

    logger.info(`Dashboard connected to live stream. Client: ${clientId}. Total subscribers: ${this.clients.size}`);

    // Send initial handshake
    this.sendEventToClient(client, 'connected', {
      clientId,
      status: 'CONNECTED',
      subscribers: this.clients.size,
      timestamp: new Date().toISOString(),
      message: 'DriveGuard AI Live Webhook & Telemetry Stream Active',
    });

    // Keep-alive heartbeat every 20 seconds
    const heartbeat = setInterval(() => {
      this.sendEventToClient(client, 'ping', { timestamp: new Date().toISOString() });
    }, 20000);

    // Clean up when client disconnects
    req.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(client);
      logger.info(`Dashboard disconnected from live stream: ${clientId}. Remaining subscribers: ${this.clients.size}`);
    });
  }

  /**
   * Send SSE message to a single client
   */
  sendEventToClient(client, eventType, data) {
    try {
      client.res.write(`event: ${eventType}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      logger.error(`Error writing SSE to client ${client.id}: ${err.message}`);
      this.clients.delete(client);
    }
  }

  /**
   * Broadcast event to all active dashboard subscribers
   */
  broadcast(eventType, data) {
    if (this.clients.size === 0) {
      logger.debug(`Broadcast '${eventType}' skipped (0 active subscribers)`);
      return 0;
    }

    const payload = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    let delivered = 0;
    for (const client of this.clients) {
      this.sendEventToClient(client, eventType, payload);
      delivered++;
    }

    logger.info(`Broadcasted '${eventType}' to ${delivered} live dashboard subscriber(s)`);
    return delivered;
  }

  /**
   * Current number of connected dashboard listeners
   */
  getSubscriberCount() {
    return this.clients.size;
  }
}

const liveStreamService = new LiveStreamService();
module.exports = liveStreamService;
