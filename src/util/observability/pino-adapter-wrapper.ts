/**
 * Pino Adapter Wrapper - Provides compatibility without using Pino
 */

import { LogHandler, LogLevel, LogEntry } from './logger';
import { getEnv } from '../runtime/environment';

/**
 * Configuration options for Pino logger (backward compatible)
 */
export interface PinoLoggerOptions {
  name?: string;
  prettyPrint?: boolean;
  baseFields?: Record<string, any>;
}

/**
 * Creates a Pino-style log handler (without actually using Pino)
 * This maintains API compatibility while using our universal logger
 */
export function createPinoHandler(options: PinoLoggerOptions = {}): LogHandler {
  const {
    name = 'midaz-sdk',
    prettyPrint = getEnv('NODE_ENV') !== 'production',
    baseFields = {},
  } = options;

  return (entry: LogEntry) => {
    // This is handled by the universal logger's console output
    // The handler is just for backward compatibility
    
    // Add base fields to context if needed
    if (baseFields && Object.keys(baseFields).length > 0) {
      entry.context = { ...baseFields, ...entry.context };
    }
    
    // Add name if specified
    if (name && !entry.context.name) {
      entry.context.name = name;
    }
  };
}