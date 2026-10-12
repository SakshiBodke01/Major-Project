import axios from 'axios';
import { config } from '../config/env.config';
import { logger } from '../utils/logger';

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('driveguard_token') || sessionStorage.getItem('driveguard_token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    logger.info(`API Request: ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`);
    return reqConfig;
  },
  (error) => {
    logger.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    logger.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || { success: false, message: error.message });
  }
);

export const healthService = {
  getHealth: () => apiClient.get('/health'),
};

export const driverService = {
  getDrivers: (params) => apiClient.get('/drivers', { params }),
  getDriverById: (id) => apiClient.get(`/drivers/${id}`),
  createDriver: (data) => apiClient.post('/drivers', data),
};

export const tripService = {
  getTrips: (params) => apiClient.get('/trips', { params }),
  getActiveTrips: (params) => apiClient.get('/trips/active', { params }),
  getTripById: (id) => apiClient.get(`/trips/${id}`),
};

export const riskEventService = {
  getEvents: (params) => apiClient.get('/risk-events', { params }),
  getEventsByTrip: (tripId, params) => apiClient.get(`/risk-events/trip/${tripId}`, { params }),
  getSummary: () => apiClient.get('/risk-events/summary'),
};

export const scoreSnapshotService = {
  getScoreHistoryByTrip: (tripId, params) => apiClient.get(`/score-snapshots/trip/${tripId}`, { params }),
};

export const analyticsService = {
  getOverview: (params) => apiClient.get('/analytics/overview', { params }),
};

export const authService = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
};

export const webhookService = {
  getStatus: () => apiClient.get('/webhooks/status'),
  triggerTest: (payload) => apiClient.post('/webhooks/test', payload || {}),
  sendWebhook: (payload) => apiClient.post('/webhooks/telemetry', payload),
};

export default apiClient;
