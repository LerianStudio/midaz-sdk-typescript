import {
  createFileLogger,
  Logger,
  LogHandler,
  LogLevel,
} from '../../../src/util/observability/logger';

describe('Logger', () => {
  // Spy on console methods
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup spies
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Clear mocks
    jest.clearAllMocks();
  });

  // Test 1: Constructor with default options
  test('should initialize with default options', () => {
    const logger = new Logger();

    // Test default log level
    expect(logger['minLevel']).toBe(LogLevel.INFO);
    expect(logger['includeTimestamps']).toBe(true);
    expect(logger['handlers'].length).toBe(1);
    expect(logger['defaultModule']).toBeUndefined();
    expect(logger['enableRequestTracking']).toBe(true);
  });

  // Test 2: Constructor with custom options
  test('should initialize with custom options', () => {
    const customHandler: LogHandler = () => {
      /* empty handler for testing */
    };
    const logger = new Logger({
      minLevel: LogLevel.DEBUG,
      includeTimestamps: false,
      handlers: [customHandler],
      defaultModule: 'test',
      enableRequestTracking: false,
    });

    expect(logger['minLevel']).toBe(LogLevel.DEBUG);
    expect(logger['includeTimestamps']).toBe(false);
    expect(logger['handlers'].length).toBe(1);
    expect(logger['handlers'][0]).toBe(customHandler);
    expect(logger['defaultModule']).toBe('test');
    expect(logger['enableRequestTracking']).toBe(false);
  });

  // Test 3: Debug level logging
  test('should log debug messages', () => {
    const logger = new Logger({ minLevel: LogLevel.DEBUG });
    logger.debug('Debug message', { key: 'value' });

    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]');
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('Debug message');
    expect(consoleDebugSpy.mock.calls[0][1]).toEqual({ key: 'value' });
  });

  // Test 4: Info level logging
  test('should log info messages', () => {
    const logger = new Logger();
    logger.info('Info message', { key: 'value' });

    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]');
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('Info message');
    expect(consoleInfoSpy.mock.calls[0][1]).toEqual({ key: 'value' });
  });

  // Test 5: Warn level logging
  test('should log warning messages', () => {
    const logger = new Logger();
    logger.warn('Warning message', { key: 'value' });

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning message');
    expect(consoleWarnSpy.mock.calls[0][1]).toEqual({ key: 'value' });
  });

  // Test 6: Error level logging
  test('should log error messages', () => {
    const logger = new Logger();
    const error = new Error('Test error');
    logger.error('Error message', error);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error message');
    expect(consoleErrorSpy.mock.calls[0][1]).toBe(error);
  });

  // Test 7: Log level filtering
  test('should filter logs below minimum level', () => {
    const logger = new Logger({ minLevel: LogLevel.WARN });

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  // Test 8: Disable all logging
  test('should disable all logging when level is NONE', () => {
    const logger = new Logger({ minLevel: LogLevel.NONE });

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  // Test 9: Set minimum log level
  test('should change minimum log level dynamically', () => {
    const logger = new Logger({ minLevel: LogLevel.INFO });

    logger.debug('Debug message 1'); // Should not log
    expect(consoleDebugSpy).not.toHaveBeenCalled();

    logger.setMinLevel(LogLevel.DEBUG);
    logger.debug('Debug message 2'); // Should log
    expect(consoleDebugSpy).toHaveBeenCalled();

    logger.setMinLevel(LogLevel.ERROR);
    logger.warn('Warning message'); // Should not log
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  // Test 10: Custom log handlers
  test('should support custom log handlers', () => {
    const customHandler = jest.fn();
    const logger = new Logger({
      handlers: [customHandler],
      minLevel: LogLevel.DEBUG,
    });

    logger.debug('Debug message');
    logger.info('Info message');

    expect(customHandler).toHaveBeenCalledTimes(2);
    expect(customHandler.mock.calls[0][0].message).toBe('Debug message');
    expect(customHandler.mock.calls[1][0].message).toBe('Info message');
  });

  // Test 11: Add and remove handlers
  test('should add and remove log handlers', () => {
    const logger = new Logger({ handlers: [] });

    // Add handlers
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    logger.addHandler(handler1);
    logger.addHandler(handler2);

    logger.info('Test message');
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    // Remove handler
    const removed = logger.removeHandler(handler1);
    expect(removed).toBe(true);

    logger.info('Another message');
    expect(handler1).toHaveBeenCalledTimes(1); // Not called again
    expect(handler2).toHaveBeenCalledTimes(2);

    // Try to remove non-existent handler
    const nonExistentRemoval = logger.removeHandler(jest.fn());
    expect(nonExistentRemoval).toBe(false);
  });

  // Test 12: Clear all handlers
  test('should clear all handlers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    const logger = new Logger({ handlers: [handler1, handler2] });

    logger.info('Test message');
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    logger.clearHandlers();

    logger.info('Another message');
    expect(handler1).toHaveBeenCalledTimes(1); // Not called again
    expect(handler2).toHaveBeenCalledTimes(1); // Not called again
  });

  // Test 13: Module name in logs
  test('should include module name in logs', () => {
    const logger = new Logger({ defaultModule: 'default-module' });

    logger.info('Message with default module');
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[default-module]');

    logger.info('Message with custom module', null, 'custom-module');
    expect(consoleInfoSpy.mock.calls[1][0]).toContain('[custom-module]');
  });

  // Test 14: Request ID tracking
  test('should include request ID in logs when tracking is enabled', () => {
    const logger = new Logger({ enableRequestTracking: true });

    const requestId = 'test-request-123';
    logger.setRequestId(requestId);

    logger.info('Message with request ID');
    expect(consoleInfoSpy.mock.calls[0][0]).toContain(`[${requestId}]`);
  });

  // Test 15: Child loggers
  test('should create child loggers with inherited settings', () => {
    const parentHandler = jest.fn();
    const parent = new Logger({
      minLevel: LogLevel.DEBUG,
      includeTimestamps: false,
      handlers: [parentHandler],
      enableRequestTracking: true,
    });

    parent.setRequestId('parent-request');

    const child = parent.createChildLogger('child-module');

    // Child should inherit settings
    expect(child['minLevel']).toBe(LogLevel.DEBUG);
    expect(child['includeTimestamps']).toBe(false);
    expect(child['handlers'][0]).toBe(parentHandler);
    expect(child['enableRequestTracking']).toBe(true);
    expect(child['defaultModule']).toBe('child-module');
    expect(child['currentRequestId']).toBe('parent-request');

    // Child logs should use the child module name
    child.info('Child message');
    expect(parentHandler).toHaveBeenCalledTimes(1);
    expect(parentHandler.mock.calls[0][0].module).toBe('child-module');
    expect(parentHandler.mock.calls[0][0].requestId).toBe('parent-request');
  });

  // Test 16: Error handling in log handlers
  test('should handle errors in log handlers', () => {
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Handler error');
    });

    const consoleErrorOriginal = console.error;
    const consoleErrorMock = jest.fn();
    console.error = consoleErrorMock;

    try {
      const logger = new Logger({ handlers: [errorHandler] });
      logger.info('Test message');

      expect(errorHandler).toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalled();
      expect(consoleErrorMock.mock.calls[0][0]).toBe('Error in log handler:');
    } finally {
      console.error = consoleErrorOriginal;
    }
  });

  // Test 17: Timestamp inclusion
  test('should include timestamps when enabled', () => {
    const logger = new Logger({ includeTimestamps: true });

    // Mock Date.toISOString
    const originalToISOString = Date.prototype.toISOString;
    const mockTimestamp = '2023-01-01T00:00:00.000Z';
    Date.prototype.toISOString = jest.fn(() => mockTimestamp);

    try {
      logger.info('Test message');
      expect(consoleInfoSpy.mock.calls[0][0]).toContain(`[${mockTimestamp}]`);
    } finally {
      Date.prototype.toISOString = originalToISOString;
    }
  });

  // Test 18: Timestamp exclusion
  test('should exclude timestamps when disabled', () => {
    const logger = new Logger({ includeTimestamps: false });

    logger.info('Test message');

    // Get the log message
    const logMessage = consoleInfoSpy.mock.calls[0][0];

    // Should not contain a timestamp in brackets at the start
    expect(logMessage).not.toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    expect(logMessage).toBe('[INFO]: Test message');
  });
});

// Tests for createFileLogger function
describe('createFileLogger', () => {
  let originalWindow: any;
  let fsExistsSyncSpy: jest.SpyInstance;
  let fsMkdirSyncSpy: jest.SpyInstance;
  let fsAppendFileSyncSpy: jest.SpyInstance;
  let pathDirnameSpy: jest.SpyInstance;

  beforeEach(() => {
    // Save original modules/globals
    originalWindow = global.window;

    // Import the actual modules
    const fs = require('fs');
    const path = require('path');

    // Set up spies on the module methods
    fsExistsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    fsMkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    fsAppendFileSyncSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
    pathDirnameSpy = jest.spyOn(path, 'dirname').mockReturnValue('/mock/dir');
  });

  afterEach(() => {
    // Restore original modules/globals
    global.window = originalWindow;
    jest.resetModules();
    jest.clearAllMocks();
  });

  // Test 19: Browser environment fallback
  test('should fall back to console logger in browser environment', () => {
    // Mock browser environment
    (global as any).window = {};

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const logger = createFileLogger('/mock/log.txt');

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'File logging is not supported in browser environments'
    );

    // Should be a regular logger
    expect(logger).toBeInstanceOf(Logger);
  });

  // Test 20: Node.js environment
  test('should create file logger in Node.js environment', () => {
    // Ensure we're in a Node.js-like environment
    (global as any).window = undefined;

    fsExistsSyncSpy.mockReturnValue(false);

    const logger = createFileLogger('/mock/log.txt', { minLevel: LogLevel.DEBUG });

    // Should create directory if it doesn't exist
    expect(pathDirnameSpy).toHaveBeenCalledWith('/mock/log.txt');
    expect(fsExistsSyncSpy).toHaveBeenCalledWith('/mock/dir');
    expect(fsMkdirSyncSpy).toHaveBeenCalledWith('/mock/dir', { recursive: true });

    // Should be a logger with file handler
    expect(logger).toBeInstanceOf(Logger);
    expect(logger['minLevel']).toBe(LogLevel.DEBUG);

    // Test file logging
    logger.info('Test message');

    // Verify that appendFileSync was called with the correct file path
    expect(fsAppendFileSyncSpy).toHaveBeenCalledWith('/mock/log.txt', expect.any(String));

    // Check log entry content
    const logEntry = JSON.parse(fsAppendFileSyncSpy.mock.calls[0][1].slice(0, -1)); // Remove trailing newline
    expect(logEntry.level).toBe(LogLevel.INFO);
    expect(logEntry.message).toBe('Test message');
  });

  // Test 21: Error handling in file logger creation
  test('should handle errors in file logger creation', () => {
    // Skip detailed implementation check, verify basic functionality still works
    jest.clearAllMocks();
    (global as any).window = undefined;

    // Mock error in fs module
    const error = new Error('File system error');
    fsExistsSyncSpy.mockImplementation(() => {
      throw error;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const logger = createFileLogger('/mock/log.txt');

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toBe('Error creating file logger:');
    expect(consoleSpy.mock.calls[0][1]).toBe(error);

    // Should fall back to regular logger
    expect(logger).toBeInstanceOf(Logger);
  });

  // Test 22: Error handling in file writing
  test('should handle errors in file writing', () => {
    // Ensure we're in a Node.js-like environment
    (global as any).window = undefined;

    fsExistsSyncSpy.mockReturnValue(true);

    // Mock error in appendFileSync
    const error = new Error('Write error');
    fsAppendFileSyncSpy.mockImplementation(() => {
      throw error;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const logger = createFileLogger('/mock/log.txt');
    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toBe('Error writing to log file:');
    expect(consoleSpy.mock.calls[0][1]).toBe(error);
  });
});
