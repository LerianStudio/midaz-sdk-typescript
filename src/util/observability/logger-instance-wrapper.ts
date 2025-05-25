/**
 * Logger Instance Wrapper - Provides backward compatibility
 */

import { getLogger, LogContext } from './logger';

// Get default logger instance
export const logger = getLogger();

// Export convenience methods with backward compatible signatures
export const debug = (message: string, data?: any, module?: string) => {
  const context: LogContext = module ? { module, ...data } : data;
  logger.debug(message, context);
};

export const info = (message: string, data?: any, module?: string) => {
  const context: LogContext = module ? { module, ...data } : data;
  logger.info(message, context);
};

export const warn = (message: string, data?: any, module?: string) => {
  const context: LogContext = module ? { module, ...data } : data;
  logger.warn(message, context);
};

export const error = (message: string, data?: any, module?: string) => {
  const context: LogContext = module ? { module, ...data } : data;
  logger.error(message, context);
};