/**
 * @file Tests for the ConfigService
 */
import { ConfigService } from '../../../src/util/config';

// Store original environment variables to restore them after tests
const originalEnv = { ...process.env };

// Helper function to reset the environment variables
function resetEnv(): void {
  process.env = { ...originalEnv };
  ConfigService.reset();
}

describe('ConfigService', () => {
  beforeEach(() => {
    resetEnv();
  });

  afterAll(() => {
    resetEnv();
  });

  describe('getObservabilityConfig', () => {
    it('should return default values when no environment variables are set', () => {
      const config = ConfigService.getInstance().getObservabilityConfig();
      expect(config).toEqual({
        enableTracing: false,
        enableMetrics: false,
        enableLogging: false,
        serviceName: 'midaz-typescript-sdk',
        collectorEndpoint: '',
      });
    });

    it('should use environment variables when they are set', () => {
      process.env.MIDAZ_ENABLE_TRACING = 'true';
      process.env.MIDAZ_ENABLE_METRICS = 'true';
      process.env.MIDAZ_SERVICE_NAME = 'custom-service';
      process.env.MIDAZ_COLLECTOR_ENDPOINT = 'http://collector.example.com';

      const config = ConfigService.getInstance().getObservabilityConfig();
      expect(config).toEqual({
        enableTracing: true,
        enableMetrics: true,
        enableLogging: false,
        serviceName: 'custom-service',
        collectorEndpoint: 'http://collector.example.com',
      });
    });

    it('should prioritize overrides over environment variables', () => {
      process.env.MIDAZ_ENABLE_TRACING = 'true';
      process.env.MIDAZ_SERVICE_NAME = 'env-service-name';

      ConfigService.configure({
        observability: {
          enableTracing: false,
          serviceName: 'override-service-name',
        },
      });

      const config = ConfigService.getInstance().getObservabilityConfig();
      expect(config.enableTracing).toBe(false);
      expect(config.serviceName).toBe('override-service-name');
    });
  });

  describe('getApiUrlConfig', () => {
    it('should return default values when no environment variables are set', () => {
      const config = ConfigService.getInstance().getApiUrlConfig();
      expect(config).toEqual({
        onboardingUrl: 'http://localhost:3000/v1',
        transactionUrl: 'http://localhost:3001/v1',
        apiVersion: 'v1',
      });
    });

    it('should use environment variables when they are set', () => {
      process.env.MIDAZ_ONBOARDING_URL = 'http://custom-onboarding.example.com';
      process.env.MIDAZ_TRANSACTION_URL = 'http://custom-transaction.example.com';
      process.env.MIDAZ_API_VERSION = 'v1';

      const config = ConfigService.getInstance().getApiUrlConfig();
      expect(config).toEqual({
        onboardingUrl: 'http://custom-onboarding.example.com',
        transactionUrl: 'http://custom-transaction.example.com',
        apiVersion: 'v1',
      });
    });
  });

  describe('getRetryPolicyConfig', () => {
    it('should return default values when no environment variables are set', () => {
      const config = ConfigService.getInstance().getRetryPolicyConfig();
      expect(config).toEqual({
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      });
    });

    it('should use environment variables when they are set', () => {
      process.env.MIDAZ_RETRY_MAX_RETRIES = '5';
      process.env.MIDAZ_RETRY_INITIAL_DELAY = '200';
      process.env.MIDAZ_RETRY_MAX_DELAY = '2000';
      process.env.MIDAZ_RETRY_STATUS_CODES = '429,503';

      const config = ConfigService.getInstance().getRetryPolicyConfig();
      expect(config).toEqual({
        maxRetries: 5,
        initialDelay: 200,
        maxDelay: 2000,
        retryableStatusCodes: [429, 503],
      });
    });
  });

  describe('getHttpClientConfig', () => {
    it('should return default values when no environment variables are set', () => {
      const config = ConfigService.getInstance().getHttpClientConfig();
      expect(config.timeout).toBe(30000);
      expect(config.keepAlive).toBe(true);
      expect(config.maxSockets).toBe(10);
      expect(config.keepAliveMsecs).toBe(60000);
      expect(config.enableHttp2).toBe(true);
      expect(config.dnsCacheTtl).toBe(300000);
    });

    it('should use environment variables when they are set', () => {
      process.env.MIDAZ_HTTP_TIMEOUT = '10000';
      process.env.MIDAZ_API_KEY = 'test-api-key';
      process.env.MIDAZ_DEBUG = 'true';
      process.env.MIDAZ_HTTP_MAX_SOCKETS = '20';

      const config = ConfigService.getInstance().getHttpClientConfig();
      expect(config.timeout).toBe(10000);
      expect(config.apiKey).toBe('test-api-key');
      expect(config.debug).toBe(true);
      expect(config.maxSockets).toBe(20);
    });
  });

  describe('ConfigService.reset', () => {
    it('should reset overrides', () => {
      // Set an override
      ConfigService.configure({
        observability: {
          enableTracing: true,
        },
      });

      // Verify the override is used
      expect(ConfigService.getInstance().getObservabilityConfig().enableTracing).toBe(true);

      // Reset the overrides
      ConfigService.reset();

      // Verify the override is no longer used
      expect(ConfigService.getInstance().getObservabilityConfig().enableTracing).toBe(false);
    });
  });
});
