import { config } from '../config/env.config';

export const logger = {
  info: (message, ...args) => {
    if (config.enableLogging) {
      console.log(`[INFO] [${new Date().toISOString()}]: ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (config.enableLogging) {
      console.warn(`[WARN] [${new Date().toISOString()}]: ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`[ERROR] [${new Date().toISOString()}]: ${message}`, ...args);
  },
};
