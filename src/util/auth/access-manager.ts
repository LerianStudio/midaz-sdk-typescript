/**
 * Access Manager for plugin-based authentication with external identity providers
 * 
 * This module provides a flexible authentication mechanism that integrates with
 * external identity providers, eliminating the need for hardcoded tokens.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
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
  
  private httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
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

    // Initialize HTTP client for auth service communication
    this.httpClient = axios.create({
      baseURL: this.address,
      timeout: 10000,
    });
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
      const requestConfig: AxiosRequestConfig = {
        method: 'POST',
        url: this.tokenEndpoint,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          grant_type: this.refreshToken ? 'refresh_token' : 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          ...(this.refreshToken ? { refresh_token: this.refreshToken } : {}),
        }).toString(),
      };

      const response = await this.httpClient.request<TokenResponse>(requestConfig);
      
      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid token response from auth service');
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + response.data.expires_in;
      
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
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
    
    // Use the private methods through a wrapper to avoid TypeScript errors
    const getEnv = (name: string, defaultValue = ''): string => {
      return process.env[name] || defaultValue;
    };
    
    const getBooleanEnv = (name: string, defaultValue: boolean): boolean => {
      const value = process.env[name];
      return value ? value.toLowerCase() === 'true' : defaultValue;
    };
    
    const getNumberEnv = (name: string, defaultValue: number): number => {
      const value = process.env[name];
      return value ? parseInt(value, 10) : defaultValue;
    };
    
    const enabled = getBooleanEnv('PLUGIN_AUTH_ENABLED', false);
    const address = getEnv('PLUGIN_AUTH_ADDRESS', '');
    const clientId = getEnv('MIDAZ_CLIENT_ID', '');
    const clientSecret = getEnv('MIDAZ_CLIENT_SECRET', '');
    
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
      tokenEndpoint: getEnv('PLUGIN_AUTH_TOKEN_ENDPOINT', '/oauth/token'),
      refreshThresholdSeconds: getNumberEnv('PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS', 300),
    });
  }
}
