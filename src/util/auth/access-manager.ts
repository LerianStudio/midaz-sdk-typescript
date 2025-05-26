/**
 * Access Manager for plugin-based authentication with external identity providers
 *
 * This module provides a flexible authentication mechanism that integrates with
 * external identity providers, eliminating the need for hardcoded tokens.
 */

// Using fetch API instead of axios for browser compatibility
import { getEnv } from '../runtime/environment';

/**
 * Access Manager configuration options
 */
export interface AccessManagerConfig {
  /**
   * Whether the access manager is enabled
   * @default false
   */
  enabled: boolean;

  /**
   * Address of the authentication service
   */
  address: string;

  /**
   * Client ID for authentication
   */
  clientId: string;

  /**
   * Client secret for authentication
   */
  clientSecret: string;

  /**
   * Custom token endpoint path
   * @default '/oauth/token'
   */
  tokenEndpoint?: string;

  /**
   * Token refresh threshold in seconds
   * Token will be refreshed when it's this close to expiring
   * @default 300 (5 minutes)
   */
  refreshThresholdSeconds?: number;
}

/**
 * Authentication token response from the auth service
 */
interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope?: string;
}

/**
 * Access Manager provides plugin-based authentication with external identity providers
 */
export class AccessManager {
  private enabled: boolean;
  private address: string;
  private clientId: string;
  private clientSecret: string;
  private tokenEndpoint: string;
  private refreshThresholdSeconds: number;

  // Removed httpClient - using fetch API directly
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private refreshToken: string | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;

  /**
   * Creates a new Access Manager instance
   */
  constructor(config: AccessManagerConfig) {
    this.enabled = config.enabled;
    this.address = config.address;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenEndpoint = config.tokenEndpoint || '/oauth/token';
    this.refreshThresholdSeconds = config.refreshThresholdSeconds || 300;

    // No longer needed - using fetch API directly
  }

  /**
   * Checks if the Access Manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Gets an authentication token
   *
   * If a token is already available and not close to expiring, returns it.
   * Otherwise, fetches a new token from the auth service.
   *
   * @returns Promise resolving to the authentication token
   */
  async getToken(): Promise<string> {
    if (!this.enabled) {
      throw new Error('Access Manager is not enabled');
    }

    // If we're already refreshing the token, return that promise
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    const now = Math.floor(Date.now() / 1000);

    // Check if we have a valid token that's not close to expiring
    if (this.accessToken && this.tokenExpiry > now + this.refreshThresholdSeconds) {
      return this.accessToken;
    }

    // We need to refresh the token
    try {
      // Create a new promise for token refresh
      this.tokenRefreshPromise = this.fetchToken();
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      // Clear the refresh promise when done
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Fetches a new token from the auth service
   *
   * @returns Promise resolving to the authentication token
   * @private
   */
  private async fetchToken(): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.address}${this.tokenEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantType: 'client_credentials',
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as TokenResponse;

      if (!data || !data.accessToken) {
        throw new Error('Invalid token response from auth service');
      }

      this.accessToken = data.accessToken;
      this.tokenExpiry = now + data.expiresIn;

      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
      }

      return this.accessToken;
    } catch (error) {
      // Clear token state on error
      this.accessToken = null;
      this.tokenExpiry = 0;

      if (error instanceof Error) {
        throw new Error(`Failed to fetch authentication token: ${error.message}`);
      }
      throw new Error('Failed to fetch authentication token');
    }
  }

  /**
   * Creates an Access Manager instance from environment variables
   *
   * @returns Access Manager instance configured from environment variables
   */
  static fromEnvironment(): AccessManager {
    // Access environment variables directly
    const enabled = getEnv('PLUGIN_AUTH_ENABLED')?.toLowerCase() === 'true';
    const address = getEnv('PLUGIN_AUTH_ADDRESS') || '';
    const clientId = getEnv('MIDAZ_CLIENT_ID') || '';
    const clientSecret = getEnv('MIDAZ_CLIENT_SECRET') || '';

    if (enabled && (!address || !clientId || !clientSecret)) {
      throw new Error(
        'Plugin auth is enabled but required environment variables are missing. ' +
          'Please set PLUGIN_AUTH_ADDRESS, MIDAZ_CLIENT_ID, and MIDAZ_CLIENT_SECRET.'
      );
    }

    return new AccessManager({
      enabled,
      address,
      clientId,
      clientSecret,
      tokenEndpoint: getEnv('PLUGIN_AUTH_TOKEN_ENDPOINT') || '/oauth/token',
      refreshThresholdSeconds: getEnv('PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS')
        ? parseInt(getEnv('PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS')!, 10)
        : 300,
    });
  }
}
