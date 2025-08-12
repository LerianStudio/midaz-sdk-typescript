/**
 * @file Tests for OpenTelemetry provider
 */
import { OpenTelemetryProvider } from '../../src/util/observability/observability-otel';

describe('OpenTelemetryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Save original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('constructor', () => {
    it('should initialize tracer when tracing is enabled', () => {
      // Arrange & Act
      const provider = new OpenTelemetryProvider({ enableTracing: true });

      // Assert
      expect(provider.getTracer()).toBeDefined();
    });

    it('should not initialize tracer when tracing is disabled', () => {
      // Arrange & Act
      const provider = new OpenTelemetryProvider({});

      // Assert
      expect(provider.getTracer()).toBeUndefined();
    });

    it('should initialize meter when metrics are enabled', () => {
      // Arrange & Act
      const provider = new OpenTelemetryProvider({ enableMetrics: true });

      // Assert
      expect(provider.getMeter()).toBeDefined();
    });

    it('should not initialize meter when metrics are disabled', () => {
      // Arrange & Act
      const provider = new OpenTelemetryProvider({});

      // Assert
      expect(provider.getMeter()).toBeUndefined();
    });

    it('should initialize logger when logging is enabled', () => {
      // Arrange & Act
      const provider = new OpenTelemetryProvider({ enableLogging: true });

      // Assert
      expect(provider.getLogger()).toBeDefined();
    });

    it('should not initialize logger when logging is disabled', () => {
      // Arrange & Act
      const provider = new OpenTelemetryProvider({});

      // Assert
      expect(provider.getLogger()).toBeUndefined();
    });
  });

  describe('startSpan', () => {
    it('should throw an error when tracing is not enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({});

      // Act & Assert
      expect(() => provider.startSpan('test')).toThrow('Tracing is not enabled');
    });

    it('should create a span when tracing is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });

      // Act
      const span = provider.startSpan('test-span', { key: 'value' });

      // Assert
      expect(span).toBeDefined();
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const startSpanCall = calls.find(
        (call) => call[0] && call[0].includes('[OpenTelemetry] Starting span: test-span')
      );
      expect(startSpanCall).toBeDefined();
    });

    it('should set attributes on a span', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });
      const span = provider.startSpan('test-span');

      // Act
      span.setAttribute('key', 'value');

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const setAttributeCall = calls.find(
        (call) => call[0] && call[0].includes('[OpenTelemetry] Span attribute: key=value')
      );
      expect(setAttributeCall).toBeDefined();
    });

    it('should record exceptions on a span', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });
      const span = provider.startSpan('test-span');
      const error = new Error('test error');

      // Act
      span.recordException(error);

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const recordExceptionCall = calls.find(
        (call) => call[0] && call[0].includes('[OpenTelemetry] Span exception: test error')
      );
      expect(recordExceptionCall).toBeDefined();
    });

    it('should set status on a span', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });
      const span = provider.startSpan('test-span');

      // Act
      span.setStatus('error', 'something went wrong');

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const setStatusCall = calls.find(
        (call) =>
          call[0] && call[0].includes('[OpenTelemetry] Span status: error - something went wrong')
      );
      expect(setStatusCall).toBeDefined();
    });

    it('should end a span', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });
      const span = provider.startSpan('test-span');

      // Clear the mock to ignore the startSpan call
      jest.clearAllMocks();

      // Act
      span.end();

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const endSpanCall = calls.find(
        (call) => call[0] && call[0].includes('[OpenTelemetry] Ending span: test-span')
      );
      expect(endSpanCall).toBeDefined();
    });
  });

  describe('recordMetric', () => {
    it('should throw an error when metrics are not enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({});

      // Act & Assert
      expect(() => provider.recordMetric('test', 1)).toThrow('Metrics are not enabled');
    });

    it('should record a counter metric when metrics are enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableMetrics: true });

      // Act
      provider.recordMetric('test-counter', 5, { key: 'value' });

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const counterCall = calls.find(
        (call) => call[0] && call[0].includes('Counter test-counter += 5')
      );
      expect(counterCall).toBeDefined();
    });

    it('should record a histogram metric when metrics are enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableMetrics: true });

      // Act
      provider.recordMetric('test-histogram', -5, { key: 'value' });

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const histogramCall = calls.find(
        (call) => call[0] && call[0].includes('Histogram test-histogram = -5')
      );
      expect(histogramCall).toBeDefined();
    });
  });

  describe('log', () => {
    it('should throw an error when logging is not enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({});

      // Act & Assert
      expect(() => provider.log('info', 'test message')).toThrow('Logging is not enabled');
    });

    it('should log a debug message when logging is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({
        enableLogging: true,
        serviceName: 'test-service',
      });

      // Act
      provider.log('debug', 'test debug message', { key: 'value' });

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const debugCall = calls.find(
        (call) => call[0] && call[0].includes('[test-service] test debug message')
      );
      expect(debugCall).toBeDefined();
    });

    it('should log an info message when logging is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({
        enableLogging: true,
        serviceName: 'test-service',
      });

      // Act
      provider.log('info', 'test info message', { key: 'value' });

      // Assert
      expect(console.info).toHaveBeenCalled();
      const calls = (console.info as jest.Mock).mock.calls;
      const infoCall = calls.find(
        (call) => call[0] && call[0].includes('[test-service] test info message')
      );
      expect(infoCall).toBeDefined();
    });

    it('should log a warning message when logging is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({
        enableLogging: true,
        serviceName: 'test-service',
      });

      // Act
      provider.log('warn', 'test warning message', { key: 'value' });

      // Assert
      expect(console.warn).toHaveBeenCalled();
      const calls = (console.warn as jest.Mock).mock.calls;
      const warnCall = calls.find(
        (call) => call[0] && call[0].includes('[test-service] test warning message')
      );
      expect(warnCall).toBeDefined();
    });

    it('should log an error message when logging is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({
        enableLogging: true,
        serviceName: 'test-service',
      });

      // Act
      provider.log('error', 'test error message', { key: 'value' });

      // Assert
      expect(console.error).toHaveBeenCalled();
      const calls = (console.error as jest.Mock).mock.calls;
      const errorCall = calls.find(
        (call) => call[0] && call[0].includes('[test-service] test error message')
      );
      expect(errorCall).toBeDefined();
    });
  });

  describe('shutdown', () => {
    it('should log a debug message when shutting down', async () => {
      // Arrange
      const provider = new OpenTelemetryProvider({});

      // Act
      await provider.shutdown();

      // Assert
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const shutdownCall = calls.find(
        (call) => call[0] && call[0].includes('[OpenTelemetry] Shutting down')
      );
      expect(shutdownCall).toBeDefined();
    });
  });

  describe('getters', () => {
    it('should return tracer when tracing is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });

      // Act
      const tracer = provider.getTracer();

      // Assert
      expect(tracer).toBeDefined();
    });

    it('should return meter when metrics are enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableMetrics: true });

      // Act
      const meter = provider.getMeter();

      // Assert
      expect(meter).toBeDefined();
    });

    it('should return logger when logging is enabled', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableLogging: true });

      // Act
      const logger = provider.getLogger();

      // Assert
      expect(logger).toBeDefined();
    });
  });

  describe('tracer implementation', () => {
    it('should create a span through tracer', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableTracing: true });
      const tracer = provider.getTracer();

      // Act
      const span = tracer!.startSpan('test-span', { attributes: { key: 'value' } });

      // Assert
      expect(span).toBeDefined();
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const startSpanCall = calls.find(
        (call) => call[0] && call[0].includes('[OpenTelemetry] Starting span: test-span')
      );
      expect(startSpanCall).toBeDefined();
    });

    it('should create a counter through meter', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableMetrics: true });
      const meter = provider.getMeter();

      // Act
      const counter = meter!.createCounter('test-counter');
      counter.add(5, { key: 'value' });

      // Assert - Only check the add operation, not the creation
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const counterCall = calls.find(
        (call) => call[0] && call[0].includes('Counter test-counter += 5')
      );
      expect(counterCall).toBeDefined();
    });

    it('should create a histogram through meter', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({ enableMetrics: true });
      const meter = provider.getMeter();

      // Act
      const histogram = meter!.createHistogram('test-histogram');
      histogram.record(42, { key: 'value' });

      // Assert - Only check the record operation, not the creation
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const histogramCall = calls.find(
        (call) => call[0] && call[0].includes('Histogram test-histogram = 42')
      );
      expect(histogramCall).toBeDefined();
    });

    it('should log through logger', () => {
      // Arrange
      const provider = new OpenTelemetryProvider({
        enableLogging: true,
        serviceName: 'test-service',
      });
      const logger = provider.getLogger();

      // Act & Assert - debug
      logger?.debug('debug message', { key: 'value' });
      expect(console.debug).toHaveBeenCalled();
      const calls = (console.debug as jest.Mock).mock.calls;
      const debugCall = calls.find(
        (call) => call[0] && call[0].includes('[test-service] debug message')
      );
      expect(debugCall).toBeDefined();

      // Act & Assert - info
      logger?.info('info message', { key: 'value' });
      expect(console.info).toHaveBeenCalled();
      const callsInfo = (console.info as jest.Mock).mock.calls;
      const infoCall = callsInfo.find(
        (call) => call[0] && call[0].includes('[test-service] info message')
      );
      expect(infoCall).toBeDefined();

      // Act & Assert - warn
      logger?.warn('warn message', { key: 'value' });
      expect(console.warn).toHaveBeenCalled();
      const callsWarn = (console.warn as jest.Mock).mock.calls;
      const warnCall = callsWarn.find(
        (call) => call[0] && call[0].includes('[test-service] warn message')
      );
      expect(warnCall).toBeDefined();

      // Act & Assert - error
      logger?.error('error message', { key: 'value' });
      expect(console.error).toHaveBeenCalled();
      const callsError = (console.error as jest.Mock).mock.calls;
      const errorCall = callsError.find(
        (call) => call[0] && call[0].includes('[test-service] error message')
      );
      expect(errorCall).toBeDefined();
    });
  });
});
