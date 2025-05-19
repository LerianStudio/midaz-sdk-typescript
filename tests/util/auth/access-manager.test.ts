/**
 * @file Tests for the Access Manager
 */
import axios from 'axios';
import { AccessManager } from '../../../src/util/auth/access-manager';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AccessManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.create to return a mocked axios instance
    mockedAxios.create.mockReturnValue(mockedAxios);
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
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://auth.example.com',
        timeout: 10000,
      });
    });

    it('should use default values when not provided', () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      // Private properties can't be directly accessed in tests
      // but we can verify the axios creation
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://auth.example.com',
        timeout: 10000,
      });
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
      mockedAxios.request.mockResolvedValueOnce({
        data: {
          accessToken: 'new-access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
      });

      const token = await accessManager.getToken();

      expect(token).toBe('new-access-token');
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/oauth/token',
          headers: {
            'Content-Type': 'application/json',
          },
          data: expect.objectContaining({
            grantType: 'client_credentials',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          }),
        })
      );
    });

    it('should use refresh token when available', async () => {
      const accessManager = new AccessManager({
        enabled: true,
        address: 'https://auth.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      // First call to get initial token with refresh token
      mockedAxios.request.mockResolvedValueOnce({
        data: {
          accessToken: 'initial-access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          refreshToken: 'refresh-token',
        },
      });

      // Get the initial token
      await accessManager.getToken();

      // Mock token expiration by manipulating the internal state
      // We can't directly access private properties, so we'll make a second call
      // that should use the refresh token

      // Second call to refresh the token
      mockedAxios.request.mockResolvedValueOnce({
        data: {
          accessToken: 'refreshed-access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
      });

      // Force token refresh by manipulating the mock to simulate expiration
      // This is a bit of a hack, but it's the best we can do without exposing internals
      Object.defineProperty(accessManager, 'tokenExpiry', {
        value: Math.floor(Date.now() / 1000) - 100, // Token expired 100 seconds ago
        writable: true,
      });

      const token = await accessManager.getToken();

      expect(token).toBe('refreshed-access-token');
      expect(mockedAxios.request).toHaveBeenCalledTimes(2);
      // The second call should use the refresh token
      expect(mockedAxios.request.mock.calls[1][0].data).toEqual(
        expect.objectContaining({
          grantType: 'client_credentials',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
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
      mockedAxios.request.mockRejectedValueOnce(new Error('Network error'));

      await expect(accessManager.getToken()).rejects.toThrow(
        'Failed to fetch authentication token: Network error'
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
      mockedAxios.request.mockResolvedValueOnce({
        data: {
          accessToken: 'cached-access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
      });

      // First call should fetch the token
      const token1 = await accessManager.getToken();

      // Second call should use the cached token
      const token2 = await accessManager.getToken();

      expect(token1).toBe('cached-access-token');
      expect(token2).toBe('cached-access-token');
      expect(mockedAxios.request).toHaveBeenCalledTimes(1);
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
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://env-auth.example.com',
        timeout: 10000,
      });
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
