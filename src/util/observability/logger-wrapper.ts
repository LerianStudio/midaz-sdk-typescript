/**
 * Logger Wrapper - Provides backward compatibility while using the universal logger
 */

import { UniversalLogger, LogLevel as UniversalLogLevel, createLogger as createUniversalLogger, ConsoleOutput, MemoryOutput } from '../logger/universal-logger';

/**
 * Available log levels (backward compatible)
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  NONE = 'none',
}

/**
 * Structure of a log entry (backward compatible)
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  module?: string;
  error?: Error;
}

/**
 * Key-value pairs for structured logging context
 */
export interface LogContext {
  [key: string]: any;
}

/**
 * Function that processes log entries
 */
export type LogHandler = (entry: LogEntry) => void;

/**
 * Configuration options for logger initialization
 */
export interface LoggerConfig {
  level?: LogLevel;
  format?: 'json' | 'pretty';
  handler?: LogHandler;
  file?: string;
  module?: string;
  contextDefaults?: LogContext;
}

/**
 * Logger class (backward compatible wrapper)
 */
export class Logger {
  private universalLogger: UniversalLogger;
  private module?: string;
  private contextDefaults: LogContext;
  private customHandler?: LogHandler;

  constructor(config: LoggerConfig = {}) {
    // Map log level
    const level = config.level === LogLevel.NONE ? 'silent' : (config.level || LogLevel.INFO) as UniversalLogLevel;

    // Create universal logger
    this.universalLogger = createUniversalLogger({
      level,
      name: config.module,
      context: config.contextDefaults,
    });

    this.module = config.module;
    this.contextDefaults = config.contextDefaults || {};
    this.customHandler = config.handler;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childConfig: LoggerConfig = {
      level: this.getLevel(),
      module: this.module,
      contextDefaults: { ...this.contextDefaults, ...context },
      handler: this.customHandler,
    };
    return new Logger(childConfig);
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    const level = this.universalLogger.getLevel();
    return level === 'silent' ? LogLevel.NONE : level as LogLevel;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    const universalLevel = level === LogLevel.NONE ? 'silent' : level as UniversalLogLevel;
    this.universalLogger.setLevel(universalLevel);
  }

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    if (level === LogLevel.NONE) return false;
    return this.universalLogger.isLevelEnabled(level as UniversalLogLevel);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    // Log using universal logger
    if (level === LogLevel.ERROR && error) {
      this.universalLogger.error(message, error, context);
    } else {
      const universalLevel = level as UniversalLogLevel;
      this.universalLogger.log(universalLevel, message, context, error);
    }

    // Call custom handler if provided
    if (this.customHandler) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        context: { ...this.contextDefaults, ...context },
        message,
        module: this.module,
        error,
      };
      this.customHandler(entry);
    }
  }

  // Convenience methods
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, context, error);
    } else {
      this.log(LogLevel.ERROR, message, error);
    }
  }
}

/**
 * Global logger registry
 */
const loggerRegistry = new Map<string, Logger>();

/**
 * Default logger instance
 */
let defaultLogger: Logger | undefined;

/**
 * Get or create a logger for a specific module
 */
export function getLogger(module?: string): Logger {
  if (!module) {
    if (!defaultLogger) {
      defaultLogger = new Logger();
    }
    return defaultLogger;
  }

  let logger = loggerRegistry.get(module);
  if (!logger) {
    logger = new Logger({ module });
    loggerRegistry.set(module, logger);
  }
  return logger;
}

/**
 * Configure the default logger
 */
export function configureLogger(config: LoggerConfig): void {
  defaultLogger = new Logger(config);
  
  // Update all existing module loggers with new level
  if (config.level) {
    for (const logger of loggerRegistry.values()) {
      logger.setLevel(config.level);
    }
  }
}

/**
 * Create console handler (for compatibility)
 */
export function createConsoleHandler(format: 'json' | 'pretty' = 'pretty'): LogHandler {
  return (entry: LogEntry) => {
    // Handled by universal logger's console output
  };
}

/**
 * Create file handler (no-op in browser, for compatibility)
 */
export function createFileHandler(filepath: string, format: 'json' | 'pretty' = 'json'): LogHandler {
  console.warn('File logging is not supported in browser environments');
  return (entry: LogEntry) => {
    // No-op in browser
  };
}

/**
 * Create Pino handler (for compatibility)
 */
export function createPinoHandler(): LogHandler {
  console.warn('Pino logging is not supported in pure TypeScript SDK, using console instead');
  return createConsoleHandler('json');
}