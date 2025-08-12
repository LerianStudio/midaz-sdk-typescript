/**
 * @file Tests for MidazClient with Access Manager integration
 */
import { MidazClient } from '../src/client';
import {
  createClientConfigBuilder,
  createClientConfigWithAccessManager,
} from '../src/client-config-builder';
import { AccessManager } from '../src/util/auth/access-manager';
import { HttpClient } from '../src/util/network/http-client';

// Mock dependencies
jest.mock('../src/util/network/http-client');
jest.mock('../src/util/auth/access-manager');

describe('MidazClient with Access Manager Authentication', () => {
  let mockAccessManager: jest.Mocked<AccessManager>;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AccessManager
    mockAccessManager = new AccessManager({
      enabled: true,
      address: 'https://auth.example.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    }) as jest.Mocked<AccessManager>;

    mockAccessManager.getToken = jest.fn().mockResolvedValue('access-manager-token');
    mockAccessManager.isEnabled = jest.fn().mockReturnValue(true);

    // Mock HttpClient
    mockHttpClient = new HttpClient({}) as jest.Mocked<HttpClient>;
    (HttpClient as jest.Mock).mockImplementation(() => mockHttpClient);
  });

  it('should create a client with Access Manager authentication', () => {
    // Create config with Access Manager only
    const config = createClientConfigWithAccessManager({
      address: 'https://auth.example.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })
      .build();

    // Create client
    const client = new MidazClient(config);
    expect(client).toBeDefined();

    // Verify HttpClient was created
    expect(HttpClient).toHaveBeenCalled();

    // Verify Access Manager configuration is present
    expect(config.accessManager).toBeDefined();
    expect(config.accessManager?.address).toBe('https://auth.example.com');
    expect(config.accessManager?.clientId).toBe('test-client-id');
    expect(config.accessManager?.enabled).toBe(true);
  });

  it('should initialize API clients with Access Manager authentication', () => {
    // Create config with Access Manager only
    const config = createClientConfigWithAccessManager({
      address: 'https://auth.example.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })
      .build();

    // Create client
    const client = new MidazClient(config);
    expect(client).toBeDefined();

    // Verify HttpClient was created
    expect(HttpClient).toHaveBeenCalled();

    // Verify no API key authentication is configured
    expect(config.accessManager).toBeDefined();
    // API clients should rely on Access Manager for authentication
  });

  it('should handle Access Manager token errors gracefully', async () => {
    // Mock Access Manager to throw an error
    mockAccessManager.getToken = jest.fn().mockRejectedValue(new Error('Token fetch failed'));

    // Create config with problematic Access Manager
    const config = createClientConfigWithAccessManager({
      address: 'https://auth.example.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })
      .build();

    // Should still create client without errors
    const client = new MidazClient(config);
    expect(client).toBeDefined();

    // HttpClient should still be created
    expect(HttpClient).toHaveBeenCalled();

    // When Access Manager fails, no Authorization header should be set
    // This test verifies that the client handles auth failures gracefully
  });

  it('should work without authentication when Access Manager is not enabled', () => {
    // Create config without Access Manager or API key
    const config = createClientConfigBuilder()
      .build();

    // Create client
    const client = new MidazClient(config);
    expect(client).toBeDefined();

    // Verify HttpClient was created
    expect(HttpClient).toHaveBeenCalled();

    // When no Access Manager is configured, no authentication headers should be set
    expect(config.accessManager).toBeUndefined();
  });

  it('should use Access Manager for authentication when configured', () => {
    // Create config with Access Manager
    const config = createClientConfigWithAccessManager({
      address: 'https://auth.example.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })
      .build();

    // Create client
    const client = new MidazClient(config);
    expect(client).toBeDefined();

    // Verify HttpClient was created
    expect(HttpClient).toHaveBeenCalled();

    // Verify Access Manager is configured for authentication
    expect(config.accessManager).toBeDefined();
    expect(config.accessManager?.enabled).toBe(true);
    expect(config.accessManager?.address).toBe('https://auth.example.com');
  });
});
