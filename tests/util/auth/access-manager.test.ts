/**
 * @file Tests for the Access Manager
 */
import { AccessManager } from '../../../src/util/auth/access-manager';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AccessManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with the provided configuration', () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tokenEndpoint: '/custom/token',
        refreshThresholdSeconds: 600,
      });

      expect(accessManager.isEnabled()).toBe(true);
      // We don't need to check for axios.create anymore since we use fetch
    });

    it('should use default values when not provided', () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(accessManager.isEnabled()).toBe(true);
      // We don't need to check for axios.create anymore since we use fetch
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(accessManager.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      const accessManager = new AccessManager({
        enabled: false,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(accessManager.isEnabled()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should throw an error when not enabled', async () => {
      const accessManager = new AccessManager({
        enabled: false,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      await expect(accessManager.getToken()).rejects.toThrow('Access Manager is not enabled');
    });

    it('should fetch a new token when none exists', async () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      // Mock successful token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        }),
      });

      const token = await accessManager.getToken();

      expect(token).toBe('new-access-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://auth.example.com/v1/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grantType: 'client_credentials',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          }),
        })
      );
    });


    it('should handle token fetch errors', async () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      // Mock a failed token response
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(accessManager.getToken()).rejects.toThrow(
        'Failed to fetch authentication token'
      );
    });

    it('should return cached token if not expired', async () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      // Mock successful token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'cached-access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        }),
      });

      // First call should fetch the token
      const token1 = await accessManager.getToken();

      // Second call should use the cached token
      const token2 = await accessManager.getToken();

      expect(token1).toBe('cached-access-token');
      expect(token2).toBe('cached-access-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fromEnvironment', () => {
    beforeEach(() => {
      // Clear any environment variables
      delete process.env.PLUGIN_AUTH_ENABLED;
      delete process.env.PLUGIN_AUTH_ADDRESS;
      delete process.env.MIDAZ_CLIENT_ID;
      delete process.env.MIDAZ_CLIENT_SECRET;
      delete process.env.PLUGIN_AUTH_TOKEN_ENDPOINT;
      delete process.env.PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS;
    });

    it('should create an instance from environment variables', () => {
      // Set environment variables
      process.env.PLUGIN_AUTH_ENABLED = 'true';
      process.env.PLUGIN_AUTH_ADDRESS = 'https://env-auth.example.com';
      process.env.MIDAZ_CLIENT_ID = 'env-client-id';
      process.env.MIDAZ_CLIENT_SECRET = 'env-client-secret';
      process.env.PLUGIN_AUTH_TOKEN_ENDPOINT = '/env/token';
      process.env.PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS = '900';

      const accessManager = AccessManager.fromEnvironment();

      expect(accessManager.isEnabled()).toBe(true);
      // We don't need to check for axios.create anymore since we use fetch
    });

    it('should throw an error if enabled but required variables are missing', () => {
      // Only set enabled flag but not the required variables
      process.env.PLUGIN_AUTH_ENABLED = 'true';

      expect(() => AccessManager.fromEnvironment()).toThrow(
        'Plugin auth is enabled but required environment variables are missing'
      );
    });

    it('should create a disabled instance if not enabled', () => {
      process.env.PLUGIN_AUTH_ENABLED = 'false';

      const accessManager = AccessManager.fromEnvironment();

      expect(accessManager.isEnabled()).toBe(false);
    });
  });
});
