/**
 */

import { MidazConfig } from '../client';

/**
 * UrlBuilder provides centralized URL construction logic for all API endpoints.
 * It builds URLs based on the SDK configuration and service type.
 */
export class UrlBuilder {
  /**
   * Base URLs for different services
   */
  private readonly baseUrls: Record<string, string>;

  /**
   * API version to use for requests
   */
  private readonly apiVersion: string;

  /**
   * Creates a new UrlBuilder instance
   *
   */
  constructor(config: MidazConfig) {
    this.baseUrls = config.baseUrls || {};
    this.apiVersion = config.apiVersion || 'v1';

    // Use environment variables if available
    if (process.env.MIDAZ_ONBOARDING_URL) {
      this.baseUrls.onboarding = process.env.MIDAZ_ONBOARDING_URL;
    }
    if (process.env.MIDAZ_TRANSACTION_URL) {
      this.baseUrls.transaction = process.env.MIDAZ_TRANSACTION_URL;
    }

    // Set default base URLs if not provided
    if (!this.baseUrls.onboarding) {
      this.baseUrls.onboarding = 'http://localhost:3000';
    }
    if (!this.baseUrls.transaction) {
      this.baseUrls.transaction = 'http://localhost:3001';
    }

    // Remove any trailing slashes from base URLs
    for (const service in this.baseUrls) {
      this.baseUrls[service] = this.baseUrls[service].replace(/\/+$/, '');
    }
  }

  /**
   * Gets the API version for requests
   * 
   * @returns The API version
   */
  public getApiVersion(): string {
    return this.apiVersion;
  }

  /**
   * Gets the base URL for a specific service
   *
   * @returns The base URL for the service
   */
  public getBaseUrl(service: string): string {
    return this.baseUrls[service] || this.baseUrls.onboarding;
  }

  /**
   * Builds the versioned API URL
   * 
   * @returns URL with version path
   */
  private getVersionedUrl(baseUrl: string): string {
    return `${baseUrl}/${this.apiVersion}`;
  }

  /**
   * Builds the URL for organization endpoints
   *
   * @returns The constructed URL
   */
  public buildOrganizationUrl(orgId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations`;

    if (orgId) {
      url += `/${orgId}`;
    }

    return url;
  }

  /**
   * Builds the URL for ledger endpoints
   *
   * @returns The constructed URL
   */
  public buildLedgerUrl(orgId: string, ledgerId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers`;

    if (ledgerId) {
      url += `/${ledgerId}`;
    }

    return url;
  }

  /**
   * Builds the URL for account endpoints
   *
   * @returns The constructed URL
   */
  public buildAccountUrl(orgId: string, ledgerId: string, accountId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/accounts`;

    if (accountId) {
      url += `/${accountId}`;
    }

    return url;
  }

  /**
   * Builds the URL for transaction endpoints
   *
   * @returns The constructed URL
   */
  public buildTransactionUrl(
    orgId: string,
    ledgerId: string,
    transactionId?: string,
    isCreate = false
  ): string {
    const baseUrl = this.getBaseUrl('transaction');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/transactions`;

    if (transactionId) {
      url += `/${transactionId}`;
    } else if (isCreate) {
      url += '/json';
    }

    return url;
  }

  /**
   * Builds the URL for asset endpoints
   *
   * @returns The constructed URL
   */
  public buildAssetUrl(orgId: string, ledgerId: string, assetId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/assets`;

    if (assetId) {
      url += `/${assetId}`;
    }

    return url;
  }

  /**
   * Builds the URL for asset rate endpoints
   *
   * @returns The constructed URL
   */
  public buildAssetRateUrl(orgId: string, ledgerId: string, assetId: string): string {
    const baseUrl = this.getBaseUrl('transaction');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    return `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/assets/${assetId}/rates`;
  }

  /**
   * Builds the URL for balance endpoints
   *
   * @returns The constructed URL
   */
  public buildBalanceUrl(orgId: string, ledgerId: string, accountId?: string): string {
    const baseUrl = this.getBaseUrl('transaction');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/balances`;

    if (accountId) {
      url += `/${accountId}`;
    }

    return url;
  }

  /**
   * Builds the URL for operation endpoints
   *
   * @returns The constructed URL
   */
  public buildOperationUrl(orgId: string, ledgerId: string, operationId?: string): string {
    const baseUrl = this.getBaseUrl('transaction');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/operations`;

    if (operationId) {
      url += `/${operationId}`;
    }

    return url;
  }

  /**
   * Builds the URL for portfolio endpoints
   *
   * @returns The constructed URL
   */
  public buildPortfolioUrl(orgId: string, ledgerId: string, portfolioId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/portfolios`;

    if (portfolioId) {
      url += `/${portfolioId}`;
    }

    return url;
  }

  /**
   * Builds the URL for segment endpoints
   *
   * @returns The constructed URL
   */
  public buildSegmentUrl(orgId: string, ledgerId: string, segmentId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/segments`;

    if (segmentId) {
      url += `/${segmentId}`;
    }

    return url;
  }
}
