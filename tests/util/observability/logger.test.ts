import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Logger, LogLevel, LogHandler, createFileLogger } from '../../../src/util/observability/logger';
import { createPinoHandler } from '../../../src/util/observability/pino-adapter';

// Create mock Pino logger
const mockPinoLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
};

// Mock pino-adapter
jest.mock('../../../src/util/observability/pino-adapter', () => {
  return {
    createPinoHandler: jest.fn().mockImplementation(() => {
      return (level: LogLevel, message: string, metadata?: any) => {
        switch (level) {
          case LogLevel.DEBUG:
            mockPinoLogger.debug(metadata || {}, message);
            break;
          case LogLevel.INFO:
            mockPinoLogger.info(metadata || {}, message);
            break;
          case LogLevel.WARN:
            mockPinoLogger.warn(metadata || {}, message);
            break;
          case LogLevel.ERROR:
            mockPinoLogger.error(metadata || {}, message);
            break;
          default:
            mockPinoLogger.info(metadata || {}, message);
        }
      };
    }),
  };
});

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const mockFs = jest.mocked(require('fs'));
const mockPath = jest.mocked(require('path'));

describe('Logger', () => {
  let logger: Logger;
  let originalToISOString: () => string;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new Logger({
      minLevel: LogLevel.DEBUG,
      includeTimestamps: false,
      handlers: [createPinoHandler()]
    });

    // Mock Date.toISOString to return a consistent timestamp
    const mockTimestamp = '2023-01-01T00:00:00.000Z';
    originalToISOString = Date.prototype.toISOString;
    Date.prototype.toISOString = jest.fn(() => mockTimestamp);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Date.prototype.toISOString = originalToISOString;
  });

  it('should initialize with default options', () => {
    const logger = new Logger({ includeTimestamps: false });
    expect(logger).toBeDefined();
  });

  describe('debug', () => {
    it('should log debug messages when minLevel is DEBUG', () => {
      logger.debug('test message');
      expect(mockPinoLogger.debug).toHaveBeenCalledWith({}, 'test message');
    });

    it('should not log debug messages when minLevel is INFO', () => {
      logger = new Logger({ minLevel: LogLevel.INFO, includeTimestamps: false, handlers: [createPinoHandler()] });
      logger.debug('test message');
      expect(mockPinoLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages when minLevel is INFO or lower', () => {
      logger.info('test message');
      expect(mockPinoLogger.info).toHaveBeenCalledWith({}, 'test message');
    });

    it('should not log info messages when minLevel is WARN', () => {
      logger = new Logger({ minLevel: LogLevel.WARN, includeTimestamps: false, handlers: [createPinoHandler()] });
      logger.info('test message');
      expect(mockPinoLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warn messages when minLevel is WARN or lower', () => {
      logger.warn('test message');
      expect(mockPinoLogger.warn).toHaveBeenCalledWith({}, 'test message');
    });

    it('should not log warn messages when minLevel is ERROR', () => {
      logger = new Logger({ minLevel: LogLevel.ERROR, includeTimestamps: false, handlers: [createPinoHandler()] });
      logger.warn('test message');
      expect(mockPinoLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should always log error messages', () => {
      logger.error('test message');
      expect(mockPinoLogger.error).toHaveBeenCalledWith({}, 'test message');

      logger = new Logger({ minLevel: LogLevel.NONE, includeTimestamps: false, handlers: [createPinoHandler()] });
      logger.error('test message');
      expect(mockPinoLogger.error).toHaveBeenCalledWith({}, 'test message');
    });
  });

  it('should change minimum log level dynamically', () => {
    logger.setMinLevel(LogLevel.INFO);
    logger.debug('test message');
    expect(mockPinoLogger.debug).not.toHaveBeenCalled();

    logger.setMinLevel(LogLevel.DEBUG);
    logger.debug('test message');
    expect(mockPinoLogger.debug).toHaveBeenCalledWith({}, 'test message');
  });

  it('should include metadata in logs', () => {
    const metadata = { requestId: '123', userId: '456' };
    logger.debug('test message', metadata);
    expect(mockPinoLogger.debug).toHaveBeenCalledWith(metadata, 'test message');
  });

  it('should include module name in logs', () => {
    logger.debug('test message', undefined, 'TestModule');
    expect(mockPinoLogger.debug).toHaveBeenCalledWith({ module: 'TestModule' }, 'test message');
  });

  it('should include request ID in logs when tracking is enabled', () => {
    const requestId = 'test-request-123';
    logger.setRequestId(requestId);

    logger.info('test message');
    expect(mockPinoLogger.info).toHaveBeenCalledWith({ requestId }, 'test message');
  });

  it('should not include request ID in logs when tracking is disabled', () => {
    const requestId = 'test-request-123';
    logger = new Logger({ enableRequestTracking: false });
    logger.setRequestId(requestId);

    logger.info('test message');
    expect(mockPinoLogger.info).toHaveBeenCalledWith({ timestamp: '2023-01-01T00:00:00.000Z' }, 'test message');
  });

  it('should propagate request ID to child loggers', () => {
    const parentRequestId = 'parent-request-123';
    logger.setRequestId(parentRequestId);

    const childLogger = logger.createChildLogger('child-module');

    childLogger.info('Child message');
    expect(mockPinoLogger.info).toHaveBeenCalledWith(
      { module: 'child-module', requestId: parentRequestId },
      'Child message'
    );
  });

  it('should support child loggers with request ID inheritance', () => {
    const parentRequestId = 'parent-request';
    logger.setRequestId(parentRequestId);

    const childLogger = logger.createChildLogger('child-module');

    childLogger.info('Child message');
    expect(mockPinoLogger.info).toHaveBeenCalledWith(
      { module: 'child-module', requestId: parentRequestId },
      'Child message'
    );
  });

  it('should create child loggers with inherited settings', () => {
    // Create parent logger with custom settings
    const parentLogger = new Logger({
      minLevel: LogLevel.INFO,
      includeTimestamps: false,
      handlers: [createPinoHandler()]
    });

    // Create child loggers with different module names
    const childLogger1 = parentLogger.createChildLogger('module1');
    const childLogger2 = parentLogger.createChildLogger('module2');

    // Test that child loggers inherit parent settings but maintain their own module names
    childLogger1.info('message from module1');
    expect(mockPinoLogger.info).toHaveBeenCalledWith(
      { module: 'module1' },
      'message from module1'
    );

    childLogger2.warn('message from module2');
    expect(mockPinoLogger.warn).toHaveBeenCalledWith(
      { module: 'module2' },
      'message from module2'
    );
  });

  it('should support multiple child loggers', () => {
    const logger = new Logger({ includeTimestamps: false });

    const childLogger1 = logger.createChildLogger('module1');
    const childLogger2 = logger.createChildLogger('module2');

    childLogger1.info('message from module1');
    expect(mockPinoLogger.info).toHaveBeenCalledWith(
      { module: 'module1' },
      'message from module1'
    );

    childLogger2.warn('message from module2');
    expect(mockPinoLogger.warn).toHaveBeenCalledWith(
      { module: 'module2' },
      'message from module2'
    );
  });

  // Test error handling in log handlers
  test('should handle errors in log handlers', () => {
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Handler error');
    }) as LogHandler;

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation to suppress console output during tests
    });

    try {
      const logger = new Logger({
        handlers: [errorHandler],
      });

      logger.info('test message');

      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Error in log handler:',
        expect.any(Error)
      );
    } finally {
      consoleErrorMock.mockRestore();
    }
  });

  // Test timestamp inclusion
  test('should include timestamps when enabled', () => {
    const mockTimestamp = '2023-01-01T00:00:00.000Z';
    const originalToISOString = Date.prototype.toISOString;
    Date.prototype.toISOString = jest.fn(() => mockTimestamp);

    try {
      const logger = new Logger({ includeTimestamps: true });
      logger.info('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        { timestamp: mockTimestamp },
        'Test message'
      );
    } finally {
      Date.prototype.toISOString = originalToISOString;
    }
  });

  // Test 17: Timestamp inclusion
  test('should include timestamps when enabled', () => {
    const logger = new Logger({ includeTimestamps: true });

    // Mock Date.toISOString
    const mockTimestamp = '2023-01-01T00:00:00.000Z';
    const originalToISOString = Date.prototype.toISOString;
    Date.prototype.toISOString = jest.fn(() => mockTimestamp);

    try {
      logger.info('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: mockTimestamp
        }),
        'Test message'
      );
    } finally {
      Date.prototype.toISOString = originalToISOString;
    }
  });

});

describe('createFileLogger', () => {
  let originalWindow: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Save original window reference
    originalWindow = global.window;
    // Set default mock implementations
    mockFs.existsSync.mockReturnValue(false);
    mockPath.dirname.mockReturnValue('/mock/dir');
  });

  afterEach(() => {
    // Restore original modules/globals
    global.window = originalWindow;
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('should fall back to console logger in browser environment', () => {
    // Mock browser environment
    (global as any).window = {};

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // Mock implementation to suppress console output during tests
    });

    const logger = createFileLogger('/mock/log.txt');

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'File logging is not supported in browser environments'
    );

    // Should be a regular logger
    expect(logger).toBeInstanceOf(Logger);
  });

  test('should create file logger in Node.js environment', () => {
    // Ensure we're in a Node.js-like environment
    (global as any).window = undefined;

    mockFs.existsSync.mockReturnValue(false);

    const logger = createFileLogger('/mock/log.txt', { minLevel: LogLevel.DEBUG });

    // Should create directory if it doesn't exist
    expect(mockPath.dirname).toHaveBeenCalledWith('/mock/log.txt');
    expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/dir');
    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/dir', { recursive: true });

    // Should be a logger with file handler
    expect(logger).toBeInstanceOf(Logger);
    expect(logger['minLevel']).toBe(LogLevel.DEBUG);

    // Test file logging
    logger.info('Test message');

    // Verify that appendFileSync was called with the correct file path
    expect(mockFs.appendFileSync).toHaveBeenCalledWith('/mock/log.txt', expect.any(String));

    // Check log entry content
    const logEntry = JSON.parse(mockFs.appendFileSync.mock.calls[0][1].slice(0, -1)); // Remove trailing newline
    expect(logEntry.level).toBe(LogLevel.INFO);
    expect(logEntry.message).toBe('Test message');
  });

  test('should handle errors in file logger creation', () => {
    // Skip detailed implementation check, verify basic functionality still works
    jest.clearAllMocks();
    (global as any).window = undefined;

    // Mock error in fs module
    const error = new Error('File system error');
    mockFs.existsSync.mockImplementation(() => {
      throw error;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation to suppress console output during tests
    });

    const logger = createFileLogger('/mock/log.txt');

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toBe('Error creating file logger:');
    expect(consoleSpy.mock.calls[0][1]).toBe(error);

    // Should fall back to regular logger
    expect(logger).toBeInstanceOf(Logger);
  });

  test('should handle errors in file writing', () => {
    // Ensure we're in a Node.js-like environment
    (global as any).window = undefined;

    mockFs.existsSync.mockReturnValue(true);

    // Mock error in appendFileSync
    const error = new Error('Write error');
    mockFs.appendFileSync.mockImplementation(() => {
      throw error;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation to suppress console output during tests
    });

    const logger = createFileLogger('/mock/log.txt');
    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toBe('Error writing to log file:');
    expect(consoleSpy.mock.calls[0][1]).toBe(error);
  });
});
