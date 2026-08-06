/**
 * @file Tests for ClientConfigBuilder with Access Manager support
 */
import {
  ClientConfigBuilder,
  createClientConfigBuilder,
  createClientConfigWithAccessManager,
  createDevelopmentConfig,
  createDevelopmentConfigWithAccessManager,
  createSandboxConfig,
  createSandboxConfigWithAccessManager,
  createProductionConfig,
  createProductionConfigWithAccessManager,
  createLocalConfig,
  createLocalConfigWithAccessManager,
} from '../src/client-config-builder';
import { UrlBuilder } from '../src/api/url-builder';

// Mock AccessManager
jest.mock('../src/util/auth/access-manager');

const URL_ENV_KEYS = [
  'MIDAZ_LEDGER_URL',
  'MIDAZ_ONBOARDING_URL',
  'MIDAZ_TRANSACTION_URL',
  'MIDAZ_LOCAL_PORT',
];

describe('ClientConfigBuilder', () => {
  const savedUrlEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of URL_ENV_KEYS) {
      savedUrlEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of URL_ENV_KEYS) {
      if (savedUrlEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedUrlEnv[key];
      }
    }
  });

  describe('createClientConfigBuilder', () => {
    it('should create a basic builder without authentication', () => {
      const builder = createClientConfigBuilder();
      const config = builder.build();

      // No authentication should be configured by default
      expect(config.accessManager).toBeUndefined();
      expect(config.environment).toBe('production'); // default environment
    });
  });

  describe('createClientConfigWithAccessManager', () => {
    it('should create a builder with Access Manager authentication', () => {
      const accessManagerConfig = {
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      };

      const builder = createClientConfigWithAccessManager(accessManagerConfig);
      const config = builder.build();

      expect(config.accessManager).toBeDefined();
      expect(config.accessManager?.enabled).toBe(true);
      expect(config.accessManager?.address).toBe('https://auth.example.com');
      expect(config.accessManager?.clientId).toBe('test-client-id');
      expect(config.accessManager?.clientSecret).toBe('test-client-secret');
    });

    it('should allow custom token endpoint and refresh threshold', () => {
      const accessManagerConfig = {
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tokenEndpoint: '/custom/token',
        refreshThresholdSeconds: 600,
      };

      const builder = createClientConfigWithAccessManager(accessManagerConfig);
      const config = builder.build();

      expect(config.accessManager).toBeDefined();
      expect(config.accessManager?.enabled).toBe(true);
      expect(config.accessManager?.tokenEndpoint).toBe('/custom/token');
      expect(config.accessManager?.refreshThresholdSeconds).toBe(600);
    });
  });

  describe('Environment-specific configurations', () => {
    describe('Development', () => {
      it('should create development config', () => {
        const builder = createDevelopmentConfig('v1');
        const config = builder.build();

        expect(config.environment).toBe('development');
        expect(config.debug).toBe(true);
        expect(config.apiVersion).toBe('v1');
        // No authentication configured by default
        expect(config.accessManager).toBeUndefined();
      });

      it('should create development config with Access Manager', () => {
        const accessManagerConfig = {
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        const builder = createDevelopmentConfigWithAccessManager(accessManagerConfig);
        const config = builder.build();

        expect(config.accessManager).toBeDefined();
        expect(config.accessManager?.enabled).toBe(true);
        expect(config.accessManager?.address).toBe('https://auth.example.com');
        expect(config.environment).toBe('development');
        expect(config.debug).toBe(true);
      });
    });

    describe('Sandbox', () => {
      it('should create sandbox config', () => {
        const builder = createSandboxConfig('v1');
        const config = builder.build();

        expect(config.environment).toBe('sandbox');
        expect(config.apiVersion).toBe('v1');
        // No authentication configured by default
        expect(config.accessManager).toBeUndefined();
      });

      it('should create sandbox config with Access Manager', () => {
        const accessManagerConfig = {
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        const builder = createSandboxConfigWithAccessManager(accessManagerConfig);
        const config = builder.build();

        expect(config.accessManager).toBeDefined();
        expect(config.accessManager?.enabled).toBe(true);
        expect(config.accessManager?.address).toBe('https://auth.example.com');
        expect(config.environment).toBe('sandbox');
      });
    });

    describe('Production', () => {
      it('should create production config', () => {
        const builder = createProductionConfig('v1');
        const config = builder.build();

        expect(config.environment).toBe('production');
        expect(config.apiVersion).toBe('v1');
        // No authentication configured by default
        expect(config.accessManager).toBeUndefined();
      });

      it('should create production config with Access Manager', () => {
        const accessManagerConfig = {
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        const builder = createProductionConfigWithAccessManager(accessManagerConfig);
        const config = builder.build();

        expect(config.accessManager).toBeDefined();
        expect(config.accessManager?.enabled).toBe(true);
        expect(config.accessManager?.address).toBe('https://auth.example.com');
        expect(config.environment).toBe('production');
      });
    });

    describe('Local', () => {
      it('should create local config', () => {
        const builder = createLocalConfig(3000);
        const config = builder.build();

        expect(config.debug).toBe(true);
        expect(config.apiVersion).toBeDefined(); // Should have some API version
        expect(config.baseUrls).toBeDefined();
        expect(config.baseUrls?.onboarding).toContain('localhost:3000');
        expect(config.baseUrls?.transaction).toContain('localhost:3001');
        // No authentication configured by default
        expect(config.accessManager).toBeUndefined();
      });

      it('should create local config with Access Manager', () => {
        const accessManagerConfig = {
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        const builder = createLocalConfigWithAccessManager(accessManagerConfig);
        const config = builder.build();

        expect(config.accessManager).toBeDefined();
        expect(config.accessManager?.enabled).toBe(true);
        expect(config.accessManager?.address).toBe('https://auth.example.com');
        expect(config.debug).toBe(true);
      });
    });
  });

  describe('ClientConfigBuilder methods', () => {
    it('should allow setting Access Manager after creation', () => {
      const builder = createClientConfigBuilder();

      // Create an AccessManagerConfig object
      const accessManagerConfig = {
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tokenEndpoint: '/oauth/token',
        refreshThresholdSeconds: 300,
      };

      builder.withAccessManager(accessManagerConfig);
      const config = builder.build();

      // Verify Access Manager configuration is set
      expect(config.accessManager).toBeDefined();
      expect(config.accessManager?.enabled).toBe(true);
      expect(config.accessManager?.address).toBe('https://auth.example.com');
      expect(config.accessManager?.tokenEndpoint).toBe('/oauth/token');
      expect(config.accessManager?.refreshThresholdSeconds).toBe(300);
    });

    it('should allow chaining configuration methods', () => {
      const accessManagerConfig = {
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      };

      const builder = createClientConfigWithAccessManager(accessManagerConfig)
        .withEnvironment('development')
        .withTimeout(15000)
        .withDebugMode(true);
      const config = builder.build();

      expect(config.accessManager).toBeDefined();
      expect(config.environment).toBe('development');
      expect(config.timeout).toBe(15000);
      expect(config.debug).toBe(true);
    });

    it('should handle deprecated withApiKey method', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const builder = createClientConfigBuilder();

      // This should not throw and should show a deprecation warning
      expect(() => {
        builder.withApiKey('deprecated-key');
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'WARNING: withApiKey is deprecated. API key authentication is no longer supported. Use Access Manager instead.'
      );

      const config = builder.build();
      // API key should not be set in the configuration
      expect(config.accessManager).toBeUndefined();

      consoleSpy.mockRestore();
    });

    describe('withAccessManager validation', () => {
      let builder: ClientConfigBuilder;

      beforeEach(() => {
        builder = createClientConfigBuilder('test-api-key');
      });

      it('should throw error when enabled property is missing', () => {
        const invalidConfig = {
          // enabled is missing
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          // @ts-ignore - We're intentionally passing an invalid config for testing
          builder.withAccessManager(invalidConfig);
        }).toThrow('AccessManagerConfig: "enabled" property is required');
      });

      it('should throw error when address property is missing', () => {
        const invalidConfig = {
          enabled: true,
          // address is missing
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          // @ts-ignore - We're intentionally passing an invalid config for testing
          builder.withAccessManager(invalidConfig);
        }).toThrow('AccessManagerConfig: "address" property is required');
      });

      it('should throw error when address property is empty', () => {
        const invalidConfig = {
          enabled: true,
          address: '', // empty address
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          builder.withAccessManager(invalidConfig as any);
        }).toThrow('AccessManagerConfig: "address" property is required');
      });

      it('should throw error when clientId property is missing', () => {
        const invalidConfig = {
          enabled: true,
          address: 'https://auth.example.com',
          // clientId is missing
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          // @ts-ignore - We're intentionally passing an invalid config for testing
          builder.withAccessManager(invalidConfig);
        }).toThrow('AccessManagerConfig: "clientId" property is required');
      });

      it('should throw error when clientId property is empty', () => {
        const invalidConfig = {
          enabled: true,
          address: 'https://auth.example.com',
          clientId: '', // empty clientId
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          builder.withAccessManager(invalidConfig as any);
        }).toThrow('AccessManagerConfig: "clientId" property is required');
      });

      it('should throw error when clientSecret property is missing', () => {
        const invalidConfig = {
          enabled: true,
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          // clientSecret is missing
        };

        expect(() => {
          // @ts-ignore - We're intentionally passing an invalid config for testing
          builder.withAccessManager(invalidConfig);
        }).toThrow('AccessManagerConfig: "clientSecret" property is required');
      });

      it('should throw error when clientSecret property is empty', () => {
        const invalidConfig = {
          enabled: true,
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: '', // empty clientSecret
        };

        expect(() => {
          builder.withAccessManager(invalidConfig as any);
        }).toThrow('AccessManagerConfig: "clientSecret" property is required');
      });

      it('should accept valid config with all required properties', () => {
        const validConfig = {
          enabled: true,
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          builder.withAccessManager(validConfig);
        }).not.toThrow();
      });

      it('should accept valid config with enabled set to false', () => {
        const validConfig = {
          enabled: false,
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        };

        expect(() => {
          builder.withAccessManager(validConfig);
        }).not.toThrow();
      });
    });
  });

  describe('Unified ledger base URL', () => {
    const ENV_KEYS = [
      'MIDAZ_LEDGER_URL',
      'MIDAZ_ONBOARDING_URL',
      'MIDAZ_TRANSACTION_URL',
      'MIDAZ_LOCAL_PORT',
    ];
    let savedEnv: Record<string, string | undefined>;

    beforeEach(() => {
      savedEnv = {};
      for (const key of ENV_KEYS) {
        savedEnv[key] = process.env[key];
        delete process.env[key];
      }
    });

    afterEach(() => {
      for (const key of ENV_KEYS) {
        if (savedEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = savedEnv[key];
        }
      }
      jest.resetModules();
    });

    const loadBuilderModule = (): typeof import('../src/client-config-builder') => {
      let loaded: typeof import('../src/client-config-builder') | undefined;
      jest.isolateModules(() => {
        loaded = require('../src/client-config-builder');
      });
      return loaded as typeof import('../src/client-config-builder');
    };

    it('should expose a ledger base URL for the development environment', () => {
      const { createDevelopmentConfig } = loadBuilderModule();

      const config = createDevelopmentConfig('v1').build();

      expect(config.baseUrls).toEqual({
        onboarding: 'http://localhost:3000',
        transaction: 'http://localhost:3001',
        ledger: 'http://localhost:3002',
      });
    });

    it('should expose a ledger base URL for sandbox and production environments', () => {
      const { createSandboxConfig, createProductionConfig } = loadBuilderModule();

      expect(createSandboxConfig('v1').build().baseUrls?.ledger).toBe(
        'https://yourdomain.sandbox.midaz.io'
      );
      expect(createProductionConfig('v1').build().baseUrls?.ledger).toBe(
        'https://yourdomain.api.midaz.io'
      );
    });

    it('should emit only the ledger key when MIDAZ_LEDGER_URL is the sole URL variable', () => {
      process.env.MIDAZ_LEDGER_URL = 'http://ledger.test:3002';
      const { createDevelopmentConfig } = loadBuilderModule();

      const config = createDevelopmentConfig('v1').build();

      expect(config.baseUrls).toEqual({ ledger: 'http://ledger.test:3002' });
    });

    it('should drive every UrlBuilder path from a MIDAZ_LEDGER_URL-only configuration', () => {
      process.env.MIDAZ_LEDGER_URL = 'http://ledger.test:3002';
      const { createDevelopmentConfig } = loadBuilderModule();
      const config = createDevelopmentConfig('v1').build();
      delete process.env.MIDAZ_LEDGER_URL;

      const urlBuilder = new UrlBuilder(config);

      expect(urlBuilder.buildOrganizationUrl()).toBe('http://ledger.test:3002/v1/organizations');
      expect(urlBuilder.buildTransactionUrl('org_1', 'ledger_1')).toBe(
        'http://ledger.test:3002/v1/organizations/org_1/ledgers/ledger_1/transactions'
      );
    });

    it('should keep legacy environment variables working unchanged', () => {
      process.env.MIDAZ_ONBOARDING_URL = 'http://legacy-onboarding:9000';
      process.env.MIDAZ_TRANSACTION_URL = 'http://legacy-transaction:9001';
      const { createDevelopmentConfig } = loadBuilderModule();

      const config = createDevelopmentConfig('v1').build();

      expect(config.baseUrls?.onboarding).toBe('http://legacy-onboarding:9000');
      expect(config.baseUrls?.transaction).toBe('http://legacy-transaction:9001');
    });

    it('should keep a legacy URL winning for its own family while the ledger serves the rest', () => {
      process.env.MIDAZ_LEDGER_URL = 'http://ledger.test:3002';
      process.env.MIDAZ_ONBOARDING_URL = 'http://legacy-onboarding:9000';
      const { createDevelopmentConfig } = loadBuilderModule();
      const config = createDevelopmentConfig('v1').build();
      delete process.env.MIDAZ_LEDGER_URL;
      delete process.env.MIDAZ_ONBOARDING_URL;

      const urlBuilder = new UrlBuilder(config);

      expect(config.baseUrls).toEqual({
        ledger: 'http://ledger.test:3002',
        onboarding: 'http://legacy-onboarding:9000',
      });
      expect(urlBuilder.buildOrganizationUrl()).toBe(
        'http://legacy-onboarding:9000/v1/organizations'
      );
      expect(urlBuilder.buildTransactionUrl('org_1', 'ledger_1')).toBe(
        'http://ledger.test:3002/v1/organizations/org_1/ledgers/ledger_1/transactions'
      );
    });

    it('should add a ledger port to local configurations while keeping the legacy pair', () => {
      const { createLocalConfig } = loadBuilderModule();

      expect(createLocalConfig().build().baseUrls).toEqual({
        onboarding: 'http://localhost:3000',
        transaction: 'http://localhost:3001',
        ledger: 'http://localhost:3002',
      });
      expect(createLocalConfig(4000).build().baseUrls).toEqual({
        onboarding: 'http://localhost:4000',
        transaction: 'http://localhost:4001',
        ledger: 'http://localhost:4002',
      });
    });

    it('should honour MIDAZ_LEDGER_URL in local configurations', () => {
      process.env.MIDAZ_LEDGER_URL = 'http://ledger.test:3002';
      const { createLocalConfig, createLocalConfigWithAccessManager } = loadBuilderModule();

      expect(createLocalConfig().build().baseUrls).toEqual({ ledger: 'http://ledger.test:3002' });
      expect(
        createLocalConfigWithAccessManager({
          address: 'https://auth.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        }).build().baseUrls
      ).toEqual({ ledger: 'http://ledger.test:3002' });
    });
  });

  describe('MidazClient HTTP client base URL', () => {
    const captureHttpClientOptions = (baseUrls: Record<string, string>): Record<string, any> => {
      let captured: Record<string, any> = {};

      jest.isolateModules(() => {
        jest.doMock('../src/util/network/http-client', () => ({
          HttpClient: jest.fn().mockImplementation((options: Record<string, any>) => {
            captured = options;
            return {
              get: jest.fn(),
              post: jest.fn(),
              put: jest.fn(),
              patch: jest.fn(),
              delete: jest.fn(),
              shutdown: jest.fn(),
            };
          }),
        }));

        const { MidazClient } = require('../src/client');
        new MidazClient({ apiVersion: 'v1', baseUrls });
      });

      jest.dontMock('../src/util/network/http-client');
      return captured;
    };

    it('should prefer the ledger base URL', () => {
      const options = captureHttpClientOptions({ ledger: 'http://ledger.test:3002' });

      expect(options.baseURL).toBe('http://ledger.test:3002');
    });

    it('should prefer the ledger base URL over a legacy onboarding URL', () => {
      const options = captureHttpClientOptions({
        ledger: 'http://ledger.test:3002',
        onboarding: 'http://legacy-onboarding:9000',
      });

      expect(options.baseURL).toBe('http://ledger.test:3002');
    });

    it('should fall back to the legacy onboarding base URL', () => {
      const options = captureHttpClientOptions({ onboarding: 'http://legacy-onboarding:9000' });

      expect(options.baseURL).toBe('http://legacy-onboarding:9000');
    });
  });
});
