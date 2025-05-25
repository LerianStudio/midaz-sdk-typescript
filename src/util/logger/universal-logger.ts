/**
 * Universal Logger - Works in any JavaScript environment
 * Replaces pino with a lightweight, cross-platform logging solution
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

export interface LoggerOptions {
  level?: LogLevel;
  name?: string;
  context?: LogContext;
  output?: LogOutput;
  format?: LogFormatter;
}

export interface LogOutput {
  write(entry: LogEntry): void;
}

export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * Log level priorities
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: 100,
};

/**
 * Console output - works in all environments
 */
export class ConsoleOutput implements LogOutput {
  write(entry: LogEntry): void {
    const method = this.getConsoleMethod(entry.level);
    const message = this.formatMessage(entry);

    if (entry.error) {
      (console as any)[method](message, entry.error);
    } else {
      (console as any)[method](message);
    }
  }

  private getConsoleMethod(level: LogLevel): keyof Console {
    switch (level) {
      case 'trace':
      case 'debug':
        return 'debug';
      case 'info':
        return 'info';
      case 'warn':
        return 'warn';
      case 'error':
      case 'fatal':
        return 'error';
      default:
        return 'log';
    }
  }

  private formatMessage(entry: LogEntry): string {
    const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    return parts.join(' ');
  }
}

/**
 * Memory output - stores logs in memory
 */
export class MemoryOutput implements LogOutput {
  private logs: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  write(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * JSON formatter
 */
export class JsonFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}

/**
 * Pretty formatter
 */
export class PrettyFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const parts = [`${entry.timestamp}`, `${entry.level.toUpperCase().padEnd(5)}`, entry.message];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`\n  Context: ${JSON.stringify(entry.context, null, 2)}`);
    }

    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }
}

/**
 * Universal Logger implementation
 */
export class UniversalLogger {
  private level: LogLevel;
  private name?: string;
  private context: LogContext;
  private output: LogOutput;
  private formatter: LogFormatter;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.name = options.name;
    this.context = options.context || {};
    this.output = options.output || new ConsoleOutput();
    this.formatter = options.format || new PrettyFormatter();
  }

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Log a message at the specified level
   */
  log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
      error,
    };

    if (this.name) {
      entry.context = { name: this.name, ...entry.context };
    }

    this.output.write(entry);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): UniversalLogger {
    return new UniversalLogger({
      level: this.level,
      name: this.name,
      context: { ...this.context, ...context },
      output: this.output,
      format: this.formatter,
    });
  }

  // Convenience methods
  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (errorOrContext instanceof Error) {
      this.log('error', message, context, errorOrContext);
    } else {
      this.log('error', message, errorOrContext);
    }
  }

  fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (errorOrContext instanceof Error) {
      this.log('fatal', message, context, errorOrContext);
    } else {
      this.log('fatal', message, errorOrContext);
    }
  }

  // Getters and setters
  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getName(): string | undefined {
    return this.name;
  }

  getContext(): LogContext {
    return { ...this.context };
  }
}

/**
 * Default logger instance
 */
export const logger = new UniversalLogger();

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): UniversalLogger {
  return new UniversalLogger(options);
}
