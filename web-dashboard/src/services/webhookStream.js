import { config } from '../config/env.config';
import { logger } from '../utils/logger';

/**
 * Live Webhook & Real-Time Event Stream Service.
 * Connects to the backend SSE endpoint to receive sub-millisecond live updates
 * from Android edge devices, external webhooks, and fleet events.
 */
export const subscribeToLiveWebhook = ({ onEvent, onStatusChange }) => {
  // Normalize base URL for live SSE stream endpoint
  const baseUrl = config.apiBaseUrl.replace(/\/v1\/?$/, '');
  const streamUrl = `${baseUrl}/stream/live`;

  logger.info(`Connecting to live webhook stream at: ${streamUrl}`);
  if (onStatusChange) onStatusChange('CONNECTING');

  let eventSource = null;
  let retryTimer = null;

  const connect = () => {
    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        logger.info('Live webhook stream established (CONNECTED)');
        if (onStatusChange) onStatusChange('CONNECTED');
      };

      eventSource.onerror = (err) => {
        logger.warn('Live webhook stream disconnected, retrying in 5s...', err);
        if (onStatusChange) onStatusChange('DISCONNECTED');
        eventSource.close();

        // Retry connection
        clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, 5000);
      };

      // Listen for incoming webhook notifications
      eventSource.addEventListener('webhook_event', (e) => {
        try {
          const payload = JSON.parse(e.data);
          logger.info('Live webhook payload received:', payload);
          if (onEvent) onEvent(payload);
        } catch (err) {
          logger.error('Failed to parse webhook event data:', err);
        }
      });

      // Listen for live edge risk events
      eventSource.addEventListener('risk_event', (e) => {
        try {
          const payload = JSON.parse(e.data);
          logger.info('Live edge risk event received:', payload);
          if (onEvent) onEvent({ eventType: 'risk_event', ...payload });
        } catch (err) {
          logger.error('Failed to parse risk event data:', err);
        }
      });

      // Listen for trip updates
      eventSource.addEventListener('trip_update', (e) => {
        try {
          const payload = JSON.parse(e.data);
          logger.info('Live trip update received:', payload);
          if (onEvent) onEvent({ eventType: 'trip_update', ...payload });
        } catch (err) {
          logger.error('Failed to parse trip update data:', err);
        }
      });
    } catch (err) {
      logger.error('Error instantiating EventSource:', err);
      if (onStatusChange) onStatusChange('ERROR');
    }
  };

  connect();

  // Return teardown function
  return () => {
    clearTimeout(retryTimer);
    if (eventSource) {
      eventSource.close();
      logger.info('Live webhook stream closed cleanly');
    }
  };
};
