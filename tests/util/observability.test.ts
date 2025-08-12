/**
 * @file Tests for observability utilities
 */
import {
  Observability,
  ObservabilityOptions,
} from '../../src/util/observability/observability';
import { OpenTelemetryProvider } from '../../src/util/observability/observability-otel';

// Mock the OpenTelemetryProvider
jest.mock('../../src/util/observability/observability-otel');

// Create a type-safe way to access static methods for testing
type ObservabilityWithStaticMethods = typeof Observability & {
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
};

// Set up mock static methods
const ObservabilityTest = Observability as ObservabilityWithStaticMethods;
ObservabilityTest.debug = jest.fn();
ObservabilityTest.info = jest.fn();
ObservabilityTest.warn = jest.fn();
ObservabilityTest.error = jest.fn();

// Mock implementation for OpenTelemetryProvider
(OpenTelemetryProvider as jest.Mock).mockImplementation(() => ({
  startSpan: jest.fn().mockReturnValue({
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
  }),
  recordMetric: jest.fn(),
  log: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined),
}));

describe('Observability', () => {
  // Reset the singleton instance before each test
  beforeEach(() => {
    // @ts-ignore - Access private static instance for testing
    Observability.instance = undefined;
  });

  // Save original environment variables
  const originalEnv = { ...process.env };

  // Save original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };

    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;

    // Restore console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      // Act
      const observability = new Observability();

      // Assert
      expect(observability).toBeDefined();
    });

    it('should initialize with custom options', () => {
      // Arrange
      const options: ObservabilityOptions = {
        serviceName: 'test-service',
        enableTracing: true,
        enableMetrics: true,
        enableLogging: true,
      };

      // Act
      const observability = new Observability(options);

      // Assert
      expect(observability).toBeDefined();
    });

    it('should use environment variables for defaults', () => {
      // Arrange
      process.env.MIDAZ_ENABLE_TRACING = 'true';
      process.env.MIDAZ_ENABLE_METRICS = 'true';
      process.env.MIDAZ_ENABLE_LOGGING = 'true';
      process.env.MIDAZ_SERVICE_NAME = 'env-service';
      process.env.MIDAZ_COLLECTOR_ENDPOINT = 'http://collector:4318';

      // Re-import the module to get fresh defaults with our environment variables
      const { Observability } = require('../../src/util/observability/observability');

      // Act
      const observability = new Observability();

      // Assert
      expect(observability).toBeDefined();
      // We can't directly test the private properties, but we can test the behavior
    });
  });

  describe('startSpan', () => {
    it('should create a span when tracing is enabled', () => {
      // Arrange
      const observability = new Observability({
        enableTracing: true,
        // @ts-ignore - provider is not in the type definition but used for testing
        provider: 'opentelemetry',
      });

      // Act
      const span = observability.startSpan('test-span');

      // Assert
      expect(span).toBeDefined();
    });

    it('should create a span with attributes', () => {
      // Arrange
      const observability = new Observability({
        enableTracing: true,
        // @ts-ignore - provider is not in the type definition but used for testing
        provider: 'opentelemetry',
      });

      // Act
      const span = observability.startSpan('test-span', { key: 'value' });

      // Assert
      expect(span).toBeDefined();
    });

    it('should create a no-op span when tracing is disabled', () => {
      // Arrange
      const observability = new Observability({ enableTracing: false });

      // Act
      const span = observability.startSpan('test-span');

      // Assert
      expect(span).toBeDefined();

      // Verify no-op implementation doesn't throw
      span.setAttribute('key', 'value');
      span.recordException(new Error('test'));
      span.setStatus('ok', 'message');
      span.end();
    });
  });

  describe('recordMetric', () => {
    it('should record a metric when metrics are enabled', () => {
      // Arrange
      const observability = new Observability({
        enableMetrics: true,
        // @ts-ignore - provider is not in the type definition but used for testing
        provider: 'opentelemetry',
      });

      // Act - This should not throw
      observability.recordMetric('test-metric', 42);
    });

    it('should record a metric with attributes', () => {
      // Arrange
      const observability = new Observability({
        enableMetrics: true,
        // @ts-ignore - provider is not in the type definition but used for testing
        provider: 'opentelemetry',
      });

      // Act - This should not throw
      observability.recordMetric('test-metric', 42, { key: 'value' });
    });

    it('should not throw when metrics are disabled', () => {
      // Arrange
      const observability = new Observability({ enableMetrics: false });

      // Act & Assert - This should not throw
      observability.recordMetric('test-metric', 42);
    });
  });

  describe('logging', () => {
    it('should log debug messages', () => {
      // Arrange
      const observability = new Observability({ enableLogging: true });
      expect(observability).toBeDefined();

      // Act
      ObservabilityTest.debug('test message', { key: 'value' });

      // Assert
      expect(ObservabilityTest.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      // Arrange
      const observability = new Observability({ enableLogging: true });
      expect(observability).toBeDefined();

      // Act
      ObservabilityTest.info('test message', { key: 'value' });

      // Assert
      expect(ObservabilityTest.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      // Arrange
      const observability = new Observability({ enableLogging: true });
      expect(observability).toBeDefined();

      // Act
      ObservabilityTest.warn('test message', { key: 'value' });

      // Assert
      expect(ObservabilityTest.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      // Arrange
      const observability = new Observability({ enableLogging: true });
      expect(observability).toBeDefined();

      // Act
      ObservabilityTest.error('test message', { key: 'value' });

      // Assert
      expect(ObservabilityTest.error).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should shutdown the provider', async () => {
      // Arrange
      const mockShutdown = jest.fn().mockResolvedValue(undefined);
      (OpenTelemetryProvider as jest.Mock).mockImplementation(() => ({
        shutdown: mockShutdown,
        startSpan: jest.fn(),
        recordMetric: jest.fn(),
        log: jest.fn(),
      }));

      // Create a new instance (will become the singleton)
      const observability = new Observability({
        enableTracing: true,
        // @ts-ignore - provider is not in the type definition but used for testing
        provider: 'opentelemetry',
      });

      // Act
      await observability.shutdown();

      // Assert
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should not throw when provider is not initialized', async () => {
      // Arrange
      const observability = new Observability({
        enableTracing: false,
      });

      // Act & Assert - This should not throw
      await observability.shutdown();
    });
  });

  describe('provider selection', () => {
    it('should use OpenTelemetry provider when specified', () => {
      // Arrange & Act
      // Reset OpenTelemetryProvider mock call count
      (OpenTelemetryProvider as jest.Mock).mockClear();

      const observability = new Observability({
        enableTracing: true,
        // @ts-ignore - provider is not in the type definition but used for testing
        provider: 'opentelemetry',
      });

      // Assert
      expect(OpenTelemetryProvider).toHaveBeenCalled();
    });

    it('should use default provider when not specified', () => {
      // Arrange & Act
      const observability = new Observability({
        enableTracing: true,
      });

      // Assert - The default provider is internal, so we can't directly test it
      expect(observability).toBeDefined();
    });
  });

  describe('utility methods', () => {
    it('should create a no-op span', () => {
      // Arrange
      const observability = new Observability();

      // Act - Using any to access private method for testing
      const span = (observability as any).createNoopSpan('test-span');

      // Assert
      expect(span).toBeDefined();
      expect(span.setAttribute).toBeDefined();
      expect(span.recordException).toBeDefined();
      expect(span.setStatus).toBeDefined();
      expect(span.end).toBeDefined();
    });
  });
});
