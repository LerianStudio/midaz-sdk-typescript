/**
 * @file URL builder utility for the Midaz SDK
 * @description Centralizes URL construction logic for API endpoints
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
   * Creates a new UrlBuilder instance
   *
   * @param config - The Midaz client configuration
   */
  constructor(config: MidazConfig) {
    this.baseUrls = config.baseUrls || {};

    // Use environment variables if available
    if (process.env.MIDAZ_ONBOARDING_URL) {
      this.baseUrls.onboarding = process.env.MIDAZ_ONBOARDING_URL;
    }
    if (process.env.MIDAZ_TRANSACTION_URL) {
      this.baseUrls.transaction = process.env.MIDAZ_TRANSACTION_URL;
    }

    // Set default base URLs if not provided
    if (!this.baseUrls.onboarding) {
      this.baseUrls.onboarding = 'http://localhost:3000/v1';
    }
    if (!this.baseUrls.transaction) {
      this.baseUrls.transaction = 'http://localhost:3001/v1';
    }
  }

  /**
   * Gets the base URL for a specific service
   *
   * @param service - The service name
   * @returns The base URL for the service
   */
  public getBaseUrl(service: string): string {
    return this.baseUrls[service] || this.baseUrls.onboarding;
  }

  /**
   * Builds the URL for organization endpoints
   *
   * @param orgId - Optional organization ID
   * @returns The constructed URL
   */
  public buildOrganizationUrl(orgId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    let url = `${baseUrl}/organizations`;

    if (orgId) {
      url += `/${orgId}`;
    }

    return url;
  }

  /**
   * Builds the URL for ledger endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Optional ledger ID
   * @returns The constructed URL
   */
  public buildLedgerUrl(orgId: string, ledgerId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    let url = `${baseUrl}/organizations/${orgId}/ledgers`;

    if (ledgerId) {
      url += `/${ledgerId}`;
    }

    return url;
  }

  /**
   * Builds the URL for account endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Optional account ID
   * @returns The constructed URL
   */
  public buildAccountUrl(orgId: string, ledgerId: string, accountId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/accounts`;

    if (accountId) {
      url += `/${accountId}`;
    }

    return url;
  }

  /**
   * Builds the URL for transaction endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param transactionId - Optional transaction ID
   * @param isCreate - Whether this is a create operation (adds "/json" suffix)
   * @returns The constructed URL
   */
  public buildTransactionUrl(
    orgId: string,
    ledgerId: string,
    transactionId?: string,
    isCreate = false
  ): string {
    const baseUrl = this.getBaseUrl('transaction');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/transactions`;

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
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param assetId - Optional asset ID
   * @returns The constructed URL
   */
  public buildAssetUrl(orgId: string, ledgerId: string, assetId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/assets`;

    if (assetId) {
      url += `/${assetId}`;
    }

    return url;
  }

  /**
   * Builds the URL for asset rate endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param assetId - Asset ID for which to get rates
   * @returns The constructed URL
   */
  public buildAssetRateUrl(orgId: string, ledgerId: string, assetId: string): string {
    const baseUrl = this.getBaseUrl('transaction');
    return `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/assets/${assetId}/rates`;
  }

  /**
   * Builds the URL for balance endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Optional account ID
   * @returns The constructed URL
   */
  public buildBalanceUrl(orgId: string, ledgerId: string, accountId?: string): string {
    const baseUrl = this.getBaseUrl('transaction');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/balances`;

    if (accountId) {
      url += `/${accountId}`;
    }

    return url;
  }

  /**
   * Builds the URL for operation endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param operationId - Optional operation ID
   * @returns The constructed URL
   */
  public buildOperationUrl(orgId: string, ledgerId: string, operationId?: string): string {
    const baseUrl = this.getBaseUrl('transaction');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/operations`;

    if (operationId) {
      url += `/${operationId}`;
    }

    return url;
  }

  /**
   * Builds the URL for portfolio endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param portfolioId - Optional portfolio ID
   * @returns The constructed URL
   */
  public buildPortfolioUrl(orgId: string, ledgerId: string, portfolioId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/portfolios`;

    if (portfolioId) {
      url += `/${portfolioId}`;
    }

    return url;
  }

  /**
   * Builds the URL for segment endpoints
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param segmentId - Optional segment ID
   * @returns The constructed URL
   */
  public buildSegmentUrl(orgId: string, ledgerId: string, segmentId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    let url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/segments`;

    if (segmentId) {
      url += `/${segmentId}`;
    }

    return url;
  }
}
