import pino from 'pino';
import { LogHandler, LogLevel } from './logger';

/**
 * Configuration options for Pino logger
 */
export interface PinoLoggerOptions {
  /**
   * Logger name
   * @default 'midaz-sdk'
   */
  name?: string;

  /**
   * Pretty print logs (only in development)
   * @default true in development, false in production
   */
  prettyPrint?: boolean;

  /**
   * Additional fields to include in every log
   */
  baseFields?: Record<string, any>;
}

/**
 * Creates a Pino-based log handler
 *
 * @param options Pino logger configuration options
 * @returns A log handler that uses Pino for logging
 */
export function createPinoHandler(options: PinoLoggerOptions = {}): LogHandler {
  const {
    name = 'midaz-sdk',
    prettyPrint = process.env.NODE_ENV !== 'production',
    baseFields = {},
  } = options;

  // Create Pino logger instance
  const pinoLogger = pino({
    name,
    level: 'debug', // We'll handle level filtering in our Logger class
    transport: prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    base: {
      env: process.env.NODE_ENV || 'development',
      ...baseFields,
    },
  });

  // Map our log levels to Pino levels
  const levelMap: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error',
    [LogLevel.NONE]: 'silent',
  };

  // Return the handler function
  return (level: LogLevel, message: string, metadata?: any) => {
    const pinoLevel = levelMap[level];

    // Log through Pino
    switch (pinoLevel) {
      case 'debug':
        pinoLogger.debug(metadata || {}, message);
        break;
      case 'info':
        pinoLogger.info(metadata || {}, message);
        break;
      case 'warn':
        pinoLogger.warn(metadata || {}, message);
        break;
      case 'error':
        pinoLogger.error(metadata || {}, message);
        break;
      case 'silent':
        // Do nothing for silent level
        break;
    }
  };
}
