/**
 * custom handlers, module-specific loggers, and request tracking
 */

// Import Node.js modules for file system operations
import * as fs from 'fs';
import * as path from 'path';

// Import Pino adapter
import { createPinoHandler } from './pino-adapter';

/**
 * Available log levels in order of increasing severity
 *
 * The log level determines which messages are output and which are filtered.
 * Messages with a level lower than the configured minimum level will be ignored.
 */
export enum LogLevel {
  /** Detailed debug information */
  DEBUG = 'debug',

  /** General information about system operation */
  INFO = 'info',

  /** Warning messages that indicate potential issues */
  WARN = 'warn',

  /** Error conditions that should be addressed */
  ERROR = 'error',

  /** Special level that disables all logging */
  NONE = 'none',
}

/**
 * Structure of a log entry
 *
 * This interface defines the standard format for all log messages
 * processed by the logging system.
 */
export interface LogEntry {
  /**
   * ISO 8601 timestamp of when the log entry was created
   */
  timestamp: string;

  /**
   * Severity level of the log entry
   */
  level: LogLevel;

  /**
   * Human-readable log message
   */
  message: string;

  /**
   * Optional structured data to include with the log
   * This can be any JavaScript object with additional context
   */
  data?: any;

  /**
   * Optional name of the module or component that generated the log
   * Useful for filtering and categorizing logs
   */
  module?: string;

  /**
   * Optional request ID for correlating logs across a single request
   * Enables distributed tracing of requests through the system
   */
  requestId?: string;
}

/**
 * Function signature for custom log handlers
 *
 * Log handlers receive log entries and determine how they are processed
 * (e.g., console output, file storage, sending to a logging service)
 */
export type LogHandler = (level: LogLevel, message: string, metadata?: any) => void;

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  /**
   * Minimum level of logs to process
   * Any logs with a level lower than this will be ignored
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;

  /**
   * Whether to include ISO 8601 timestamps in log entries
   * @default true
   */
  includeTimestamps?: boolean;

  /**
   * Array of custom log handlers
   * Each handler will be called for every log entry that meets the minimum level
   * @default [consoleHandler]
   */
  handlers?: LogHandler[];

  /**
   * Default module name to use when not specified in individual log calls
   * Useful for creating module-specific loggers
   */
  defaultModule?: string;

  /**
   * Whether to enable request ID tracking for distributed tracing
   * @default true
   */
  enableRequestTracking?: boolean;
}

/**
 * Logger for SDK operations
 *
 * The Logger class provides a flexible logging system with support for:
 * - Multiple log levels (debug, info, warn, error)
 * - Custom log handlers
 * - Module-specific logging
 * - Request tracking for distributed tracing
 *
 * @example
 * ```typescript
 * // Create a basic logger
 * const logger = new Logger();
 *
 * // Log messages at different levels
 * logger.debug('Detailed debugging information');
 * logger.info('Operation completed successfully', { itemCount: 42 });
 * logger.warn('Resource usage high', { memoryUsage: '85%' });
 * logger.error('Failed to connect to API', new Error('Connection timeout'));
 *
 * // Create a module-specific child logger
 * const authLogger = logger.createChildLogger('auth');
 * authLogger.info('User authenticated', { userId: 'user123' });
 * ```
 */
export class Logger {
  /**
   * Minimum log level to output
   * @private
   */
  private minLevel: LogLevel;

  /**
   * Whether to include timestamps in log entries
   * @private
   */
  private includeTimestamps: boolean;

  /**
   * Array of log handlers to process log entries
   * @private
   */
  private handlers: LogHandler[];

  /**
   * Default module name for this logger instance
   * @private
   */
  private defaultModule?: string;

  /**
   * Whether request ID tracking is enabled
   * @private
   */
  private enableRequestTracking: boolean;

  /**
   * Current request ID for distributed tracing
   * @private
   */
  private currentRequestId?: string;

  /**
   * Creates a new Logger instance
   *
   * @param options Configuration options for the logger
   */
  constructor(options: LoggerOptions = {}) {
    // Set instance properties
    this.minLevel = options.minLevel || LogLevel.INFO;
    this.includeTimestamps = options.includeTimestamps ?? true;
    this.defaultModule = options.defaultModule;
    this.enableRequestTracking = options.enableRequestTracking ?? true;
    this.currentRequestId = '';

    // Initialize handlers
    this.handlers = [];

    // Add provided handlers or use Pino handler by default
    if (options.handlers && options.handlers.length > 0) {
      this.handlers.push(...options.handlers);
    } else {
      this.handlers.push(createPinoHandler());
    }
  }

  /**
   * Logs a debug message
   *
   * Debug messages contain detailed information useful during development
   * and troubleshooting but are typically too verbose for production use.
   *
   *
   * @example
   * ```typescript
   * logger.debug('Processing item', { itemId: 123, properties: { ... } });
   * ```
   */
  public debug(message: string, data?: any, module?: string): void {
    this.log(LogLevel.DEBUG, message, data, module);
  }

  /**
   * Logs an info message
   *
   * Info messages provide general information about system operation
   * and are typically included in production logs.
   *
   *
   * @example
   * ```typescript
   * logger.info('User login successful', { userId: 'user123' });
   * ```
   */
  public info(message: string, data?: any, module?: string): void {
    this.log(LogLevel.INFO, message, data, module);
  }

  /**
   * Logs a warning message
   *
   * Warning messages indicate potential issues or unexpected conditions
   * that don't prevent the system from functioning but should be addressed.
   *
   *
   * @example
   * ```typescript
   * logger.warn('API rate limit approaching', { currentUsage: '85%' });
   * ```
   */
  public warn(message: string, data?: any, module?: string): void {
    this.log(LogLevel.WARN, message, data, module);
  }

  /**
   * Logs an error message
   *
   * Error messages indicate problems that prevented an operation from completing
   * successfully and require attention.
   *
   *
   * @example
   * ```typescript
   * try {
   *   // Some operation that might fail
   * } catch (error) {
   *   logger.error('Failed to process transaction', error);
   * }
   * ```
   */
  public error(message: string, data?: any, module?: string): void {
    this.log(LogLevel.ERROR, message, data, module);
  }

  /**
   * Logs a message with the specified level
   *
   * This is the core logging method that all other logging methods use.
   * It handles level filtering, formatting, and dispatching to handlers.
   *
   */
  private log(level: LogLevel, message: string, data?: any, module?: string): void {
    // Check if this level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    // Build metadata object
    const metadata: any = {};

    // Add any additional data first
    if (data) {
      Object.assign(metadata, data);
    }

    // Add module name if specified (overwrite if in data)
    if (module || this.defaultModule) {
      metadata.module = module || this.defaultModule;
    }

    // Add request ID if tracking is enabled (overwrite if in data)
    if (this.enableRequestTracking && this.currentRequestId) {
      metadata.requestId = this.currentRequestId;
    }

    // Add timestamp if enabled (overwrite if in data)
    if (this.includeTimestamps) {
      metadata.timestamp = new Date().toISOString();
    }

    // Call each handler
    for (const handler of this.handlers) {
      try {
        handler(level, message, metadata);
      } catch (error) {
        console.error('Error in log handler:', error);
      }
    }
  }

  /**
   * Sets the minimum log level
   *
   * This can be used to dynamically change the logging verbosity at runtime.
   *
   *
   * @example
   * ```typescript
   * // Enable debug logging for troubleshooting
   * logger.setMinLevel(LogLevel.DEBUG);
   *
   * // Later, restore normal logging
   * logger.setMinLevel(LogLevel.INFO);
   *
   * // Disable all logging
   * logger.setMinLevel(LogLevel.NONE);
   * ```
   */
  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Adds a custom log handler
   *
   * Log handlers receive log entries and determine how they are processed.
   * Multiple handlers can be added to route logs to different destinations.
   *
   *
   * @example
   * ```typescript
   * // Add a custom handler to send logs to a monitoring service
   * logger.addHandler((entry) => {
   *   if (entry.level === LogLevel.ERROR) {
   *     monitoringService.reportError(entry.message, entry.data);
   *   }
   * });
   * ```
   */
  public addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Removes a previously added log handler
   *
   * @returns True if the handler was found and removed, false otherwise
   */
  public removeHandler(handler: LogHandler): boolean {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes all log handlers
   *
   * This effectively disables all logging output until new handlers are added.
   */
  public clearHandlers(): void {
    this.handlers = [];
  }

  /**
   * Sets the request ID for the current context
   *
   * The request ID is used for distributed tracing to correlate logs across
   * different components handling the same request.
   *
   *
   * @example
   * ```typescript
   * // In a request handler
   * function handleRequest(req, res) {
   *   const requestId = generateUniqueId();
   *   logger.setRequestId(requestId);
   *
   *   // All subsequent logs will include this request ID
   *   logger.info('Processing request', { path: req.path });
   * }
   * ```
   */
  public setRequestId(requestId?: string): void {
    this.currentRequestId = requestId;
  }

  /**
   * Creates a child logger with a specific module name
   *
   * Child loggers inherit all settings from the parent but use a different
   * module name. This is useful for creating loggers for specific components.
   *
   * @returns A new Logger instance with the specified module name
   *
   * @example
   * ```typescript
   * // Create module-specific loggers
   * const authLogger = logger.createChildLogger('auth');
   * const apiLogger = logger.createChildLogger('api');
   *
   * authLogger.info('User authenticated'); // Logs with module=[auth]
   * apiLogger.error('API error'); // Logs with module=[api]
   * ```
   */
  public createChildLogger(module: string): Logger {
    const childLogger = new Logger({
      minLevel: this.minLevel,
      includeTimestamps: this.includeTimestamps,
      handlers: this.handlers,
      defaultModule: module,
      enableRequestTracking: this.enableRequestTracking,
    });

    // Share the request ID with the child logger
    if (this.enableRequestTracking) {
      childLogger.setRequestId(this.currentRequestId);
    }

    return childLogger;
  }

  /**
   * Checks if a log level should be logged based on the minimum level
   *
   * @private
   * @returns True if the level should be logged, false otherwise
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.minLevel === LogLevel.NONE) {
      return false;
    }

    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);

    return levelIndex >= minLevelIndex;
  }

  /**
   * Default console log handler
   *
   * This handler formats log entries and outputs them to the console
   * using the appropriate console method for each log level.
   *
   * @private
   */
  private consoleHandler(level: LogLevel, message: string, metadata?: any): void {
    // Format the log message
    let formattedMessage = '';

    if (this.includeTimestamps) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }

    formattedMessage += `[${level.toUpperCase()}]`;

    if (metadata?.module) {
      formattedMessage += ` [${metadata.module}]`;
    }

    if (metadata?.requestId) {
      formattedMessage += ` [${metadata.requestId}]`;
    }

    formattedMessage += `: ${message}`;

    // Log to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, metadata || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, metadata || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, metadata || '');
        break;
    }
  }
}

// Already imported at the top of the file

/**
 * Configuration options for file logging
 */
export interface FileLoggerOptions {
  /**
   * Minimum log level for file logging
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;

  /**
   * Log format for file logging
   * @default 'json'
   */
  format?: 'json' | 'text';

  /**
   * Whether to append to the file instead of overwriting
   * @default true
   */
  append?: boolean;
}

/**
 * Creates a logger that writes to a file
 *
 * @returns A logger instance that writes to the specified file
 */
export function createFileLogger(
  filePath: string,
  options: FileLoggerOptions = {}
): Logger {
  // Default options
  const { minLevel = LogLevel.INFO, ..._rest } = options;

  // Check if running in browser environment
  if (typeof window !== 'undefined') {
    console.warn('File logging is not supported in browser environments');
    return new Logger();
  }

  // In Node.js, use the fs module to write to a file
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Create a file log handler
    const fileHandler: LogHandler = (level: LogLevel, message: string, metadata?: any) => {
      try {
        // Format the log entry as JSON
        const entry = {
          timestamp: new Date().toISOString(),
          level,
          message,
          ...metadata
        };
        const logLine = JSON.stringify(entry) + '\n';
        
        // Append to the file
        fs.appendFileSync(filePath, logLine);
      } catch (error) {
        console.error('Error writing to log file:', error);
      }
    };

    // Create a logger with both console and file handlers
    return new Logger({
      minLevel: minLevel,
      handlers: [fileHandler],
    });
  } catch (error) {
    console.error('Error creating file logger:', error);
    return new Logger();
  }
}
