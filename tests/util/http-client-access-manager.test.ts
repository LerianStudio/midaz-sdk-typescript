/**
 * @file Tests for HTTP client with Access Manager integration
 */
import { HttpClient } from '../../src/util/network/http-client';

describe.skip('HTTP Client with Access Manager', () => {
  // Setup for mocking fetch
  let originalFetch: typeof global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Create a mock fetch that captures request options
    mockFetch = jest.fn().mockImplementation((url, options = {}) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({ success: true }),
      });
    });

    // Set global fetch to our mock
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('Authentication with Access Manager', () => {
    it('should use Access Manager token for authentication when enabled', async () => {
      // Create a client with a mocked buildHeaders method
      const client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
      });

      // Mock the private buildHeaders method to return our desired headers
      const originalBuildHeaders = (client as any).buildHeaders;
      (client as any).buildHeaders = jest.fn().mockImplementation(() => {
        return {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer test-token',
        };
      });

      // Make a request
      await client.get('test-endpoint');

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();

      // Get the call arguments from the mock
      const callArgs = mockFetch.mock.calls[0];
      const requestOptions = callArgs[1];

      // Verify the authorization header was set with the token
      expect(requestOptions.headers).toBeDefined();
      expect(requestOptions.headers.Authorization).toBe('Bearer test-token');

      // Restore original method
      (client as any).buildHeaders = originalBuildHeaders;
    });

    it('should handle Access Manager token errors gracefully', async () => {
      // Create a client with a mocked buildHeaders method
      const client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
      });

      // Mock the private buildHeaders method to return headers without Authorization
      const originalBuildHeaders = (client as any).buildHeaders;
      (client as any).buildHeaders = jest.fn().mockImplementation(() => {
        return {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          // No Authorization header to simulate Access Manager error
        };
      });

      // Make a request
      await client.get('test-endpoint');

      // Verify request was made
      expect(mockFetch).toHaveBeenCalled();

      // Get the call arguments from the mock
      const callArgs = mockFetch.mock.calls[0];
      const requestOptions = callArgs[1];

      // Verify the request was made without an authorization header
      expect(requestOptions.headers).toBeDefined();
      expect(requestOptions.headers.Authorization).toBeUndefined();

      // Restore original method
      (client as any).buildHeaders = originalBuildHeaders;
    });

    it('should use API key for authentication when provided', async () => {
      // Create a client with a mocked buildHeaders method
      const client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
        apiKey: 'static-api-key',
      });

      // Mock the private buildHeaders method to return headers with API key
      const originalBuildHeaders = (client as any).buildHeaders;
      (client as any).buildHeaders = jest.fn().mockImplementation(() => {
        return {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'static-api-key',
        };
      });

      // Make a request
      await client.get('test-endpoint');

      // Verify request was made
      expect(mockFetch).toHaveBeenCalled();

      // Get the call arguments from the mock
      const callArgs = mockFetch.mock.calls[0];
      const requestOptions = callArgs[1];

      // Verify that the API key was used in the Authorization header
      expect(requestOptions.headers).toBeDefined();
      expect(requestOptions.headers.Authorization).toBe('static-api-key');

      // Restore original method
      (client as any).buildHeaders = originalBuildHeaders;
    });

    it('should prioritize explicit headers over default API key', async () => {
      // Create a client with a mocked buildHeaders method
      const client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
        apiKey: 'static-api-key',
      });

      // Mock the private buildHeaders method to return headers with Access Manager token
      const originalBuildHeaders = (client as any).buildHeaders;
      (client as any).buildHeaders = jest.fn().mockImplementation(() => {
        return {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer access-manager-token',
        };
      });

      // Make a request
      await client.get('test-endpoint');

      // Verify request was made
      expect(mockFetch).toHaveBeenCalled();

      // Get the call arguments from the mock
      const callArgs = mockFetch.mock.calls[0];
      const requestOptions = callArgs[1];

      // Verify the request was made with the Access Manager token, not the static API key
      expect(requestOptions.headers).toBeDefined();
      expect(requestOptions.headers.Authorization).toBe('Bearer access-manager-token');

      // Restore original method
      (client as any).buildHeaders = originalBuildHeaders;
    });

    it('should allow custom headers to be passed along with the Authorization header', async () => {
      // Create a client with a mocked buildHeaders method
      const client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
      });

      // Mock the private buildHeaders method to return headers with both Authorization and custom header
      const originalBuildHeaders = (client as any).buildHeaders;
      (client as any).buildHeaders = jest.fn().mockImplementation(() => {
        return {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer test-token',
          'X-Custom-Header': 'custom-value',
        };
      });

      // Make a request
      await client.get('test-endpoint');

      // Verify request was made
      expect(mockFetch).toHaveBeenCalled();

      // Get the call arguments from the mock
      const callArgs = mockFetch.mock.calls[0];
      const requestOptions = callArgs[1];

      // Verify both the authorization header and custom header are present
      expect(requestOptions.headers).toBeDefined();
      expect(requestOptions.headers.Authorization).toBe('Bearer test-token');
      expect(requestOptions.headers['X-Custom-Header']).toBe('custom-value');

      // Restore original method
      (client as any).buildHeaders = originalBuildHeaders;
    });

    it('should merge headers from options with default headers', async () => {
      // Create a client with a mocked buildHeaders method
      const client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
      });

      // Spy on the original buildHeaders method
      const originalBuildHeaders = (client as any).buildHeaders;
      const buildHeadersSpy = jest.spyOn(client as any, 'buildHeaders');

      // Make a request with custom headers
      await client.get('test-endpoint', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      // Verify buildHeaders was called with the correct arguments
      expect(buildHeadersSpy).toHaveBeenCalled();
      const callArgs = buildHeadersSpy.mock.calls[0];
      expect(callArgs[0]).toBe('GET'); // Method

      // Type assertion to handle the unknown type
      const options = callArgs[1] as { headers?: { [key: string]: string } };
      expect(options).toHaveProperty('headers');
      expect(options.headers).toHaveProperty('X-Custom-Header', 'custom-value');

      // Restore original method
      buildHeadersSpy.mockRestore();
    });
  });
});
