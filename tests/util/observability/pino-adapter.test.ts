import { LogLevel } from '../../../src/util/observability/logger';
import { createPinoHandler } from '../../../src/util/observability/pino-adapter';

// Pino is no longer used in the pure TypeScript SDK

describe.skip('PinoAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log messages at appropriate levels', () => {
    const handler = createPinoHandler();
    const testData = { key: 'value' };

    // Debug level
    handler(LogLevel.DEBUG, 'Debug message', testData);

    // Info level
    handler(LogLevel.INFO, 'Info message', testData);

    // Warning level
    handler(LogLevel.WARN, 'Warning message', testData);

    // Error level
    handler(LogLevel.ERROR, 'Error message', testData);

    // Get the mock pino instance
    const pino = require('pino')();

    expect(pino.debug).toHaveBeenCalledWith(testData, 'Debug message');
    expect(pino.info).toHaveBeenCalledWith(testData, 'Info message');
    expect(pino.warn).toHaveBeenCalledWith(testData, 'Warning message');
    expect(pino.error).toHaveBeenCalledWith(testData, 'Error message');
  });

  it('should include module name when provided', () => {
    const handler = createPinoHandler();
    const metadata = { module: 'test-module' };

    handler(LogLevel.INFO, 'Test message', metadata);

    const pino = require('pino')();
    expect(pino.info).toHaveBeenCalledWith(metadata, 'Test message');
  });

  it('should include request ID when provided', () => {
    const handler = createPinoHandler();
    const metadata = { requestId: 'test-request-id' };

    handler(LogLevel.INFO, 'Test message', metadata);

    const pino = require('pino')();
    expect(pino.info).toHaveBeenCalledWith(metadata, 'Test message');
  });

  it('should not log when level is NONE', () => {
    const handler = createPinoHandler();

    handler(LogLevel.NONE, 'Should not log');

    const pino = require('pino')();
    expect(pino.debug).not.toHaveBeenCalled();
    expect(pino.info).not.toHaveBeenCalled();
    expect(pino.warn).not.toHaveBeenCalled();
    expect(pino.error).not.toHaveBeenCalled();
  });
});
