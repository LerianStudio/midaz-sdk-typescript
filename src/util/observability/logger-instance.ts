import { Logger } from './logger';
import { createPinoHandler } from './pino-adapter';

// Create a singleton logger instance for the entire application
export const logger = new Logger({
  handlers: [createPinoHandler()],
  includeTimestamps: true,
  enableRequestTracking: true,
});

// Export convenience methods
export const debug = (message: string, data?: any, module?: string) =>
  logger.debug(message, data, module);
export const info = (message: string, data?: any, module?: string) =>
  logger.info(message, data, module);
export const warn = (message: string, data?: any, module?: string) =>
  logger.warn(message, data, module);
export const error = (message: string, data?: any, module?: string) =>
  logger.error(message, data, module);
