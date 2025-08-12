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

// Mock AccessManager
jest.mock('../src/util/auth/access-manager');

describe('ClientConfigBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
