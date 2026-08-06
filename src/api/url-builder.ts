/**
 */

import { MidazConfig } from '../client';
import { MidazConfigError } from '../util/error/error-types';
import { getLogger } from '../util/observability/logger';
import { getEnv } from '../util/runtime/environment';

const LEDGER_KEY = 'ledger';

const LEGACY_ONBOARDING_KEY = 'onboarding';

const LEGACY_TRANSACTION_KEY = 'transaction';

const DEFAULT_LEDGER_URL = 'http://localhost:3002';

const DEFAULT_ONBOARDING_URL = 'http://localhost:3000';

const DEFAULT_TRANSACTION_URL = 'http://localhost:3001';

/**
 * Maps every known service name to the legacy base URL key that used to serve it
 */
const LEGACY_SERVICE_FAMILY: Record<string, string> = {
  onboarding: LEGACY_ONBOARDING_KEY,
  organizations: LEGACY_ONBOARDING_KEY,
  ledgers: LEGACY_ONBOARDING_KEY,
  accounts: LEGACY_ONBOARDING_KEY,
  'account-types': LEGACY_ONBOARDING_KEY,
  assets: LEGACY_ONBOARDING_KEY,
  portfolios: LEGACY_ONBOARDING_KEY,
  segments: LEGACY_ONBOARDING_KEY,
  transaction: LEGACY_TRANSACTION_KEY,
  transactions: LEGACY_TRANSACTION_KEY,
  'transaction-routes': LEGACY_TRANSACTION_KEY,
  'operation-routes': LEGACY_TRANSACTION_KEY,
  operations: LEGACY_TRANSACTION_KEY,
  balances: LEGACY_TRANSACTION_KEY,
  'asset-rates': LEGACY_TRANSACTION_KEY,
};

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
   * Legacy base URL keys explicitly supplied by the caller, through config or environment
   */
  private readonly suppliedLegacyKeys: Set<string>;

  /**
   * Guards the deprecation warning so it is emitted at most once per instance
   */
  private legacyWarningEmitted = false;

  /**
   * Creates a new UrlBuilder instance
   *
   */
  constructor(config: MidazConfig) {
    this.baseUrls = { ...config.baseUrls };
    this.apiVersion = config.apiVersion || 'v1';

    const ledgerEnvUrl = getEnv('MIDAZ_LEDGER_URL');
    if (ledgerEnvUrl) {
      this.baseUrls[LEDGER_KEY] = ledgerEnvUrl;
    }

    if (!this.baseUrls[LEDGER_KEY]) {
      const onboardingEnvUrl = getEnv('MIDAZ_ONBOARDING_URL');
      if (onboardingEnvUrl) {
        this.baseUrls[LEGACY_ONBOARDING_KEY] = onboardingEnvUrl;
      }
      const transactionEnvUrl = getEnv('MIDAZ_TRANSACTION_URL');
      if (transactionEnvUrl) {
        this.baseUrls[LEGACY_TRANSACTION_KEY] = transactionEnvUrl;
      }
    }

    this.suppliedLegacyKeys = new Set(
      [LEGACY_ONBOARDING_KEY, LEGACY_TRANSACTION_KEY].filter((key) => this.baseUrls[key])
    );

    if (!this.baseUrls[LEDGER_KEY]) {
      if (this.suppliedLegacyKeys.size === 0) {
        this.baseUrls[LEDGER_KEY] = DEFAULT_LEDGER_URL;
      }
      if (!this.baseUrls[LEGACY_ONBOARDING_KEY]) {
        this.baseUrls[LEGACY_ONBOARDING_KEY] = DEFAULT_ONBOARDING_URL;
      }
      if (!this.baseUrls[LEGACY_TRANSACTION_KEY]) {
        this.baseUrls[LEGACY_TRANSACTION_KEY] = DEFAULT_TRANSACTION_URL;
      }
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
   * Resolution order: explicit service key, unified `ledger` key, legacy key of the
   * service family. Throws when none of them is configured.
   *
   * @returns The base URL for the service
   */
  public getBaseUrl(service: string): string {
    const explicitUrl = this.baseUrls[service];
    if (explicitUrl) {
      this.warnOnLegacyKeyOnce(service);
      return explicitUrl;
    }

    const ledgerUrl = this.baseUrls[LEDGER_KEY];
    if (ledgerUrl) {
      return ledgerUrl;
    }

    const legacyKey = LEGACY_SERVICE_FAMILY[service];
    const legacyUrl = legacyKey ? this.baseUrls[legacyKey] : undefined;
    if (legacyUrl) {
      this.warnOnLegacyKeyOnce(legacyKey);
      return legacyUrl;
    }

    throw new MidazConfigError(
      `No base URL configured for service '${service}'. Set baseUrls.ledger or MIDAZ_LEDGER_URL.`,
      { operation: 'getBaseUrl' }
    );
  }

  private warnOnLegacyKeyOnce(key: string): void {
    if (this.legacyWarningEmitted || !this.suppliedLegacyKeys.has(key)) {
      return;
    }

    this.legacyWarningEmitted = true;
    getLogger('url-builder').warn(
      `baseUrls.${key} is deprecated, use baseUrls.ledger or MIDAZ_LEDGER_URL instead`,
      { service: key }
    );
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
   * Builds the URL for the asset rate collection, which serves the upsert
   *
   * @returns The constructed URL
   */
  public buildAssetRateUrl(orgId: string, ledgerId: string): string {
    const baseUrl = this.getBaseUrl('asset-rates');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    return `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/asset-rates`;
  }

  /**
   * Builds the URL listing every asset rate originating from a source asset code
   *
   * @returns The constructed URL
   */
  public buildAssetRateFromUrl(orgId: string, ledgerId: string, assetCode: string): string {
    return `${this.buildAssetRateUrl(orgId, ledgerId)}/from/${assetCode}`;
  }

  /**
   * Builds the URL for a single asset rate addressed by its external identifier
   *
   * @returns The constructed URL
   */
  public buildAssetRateByExternalIdUrl(
    orgId: string,
    ledgerId: string,
    externalId: string
  ): string {
    return `${this.buildAssetRateUrl(orgId, ledgerId)}/${externalId}`;
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

  /**
   * Builds the URL for account type endpoints
   *
   * @returns The constructed URL
   */
  public buildAccountTypeUrl(orgId: string, ledgerId: string, accountTypeId?: string): string {
    const baseUrl = this.getBaseUrl('onboarding');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/account-types`;

    if (accountTypeId) {
      url += `/${accountTypeId}`;
    }

    return url;
  }

  /**
   * Builds the URL for operation route endpoints
   *
   * @returns The constructed URL
   */
  public buildOperationRouteUrl(
    orgId: string,
    ledgerId: string,
    operationRouteId?: string
  ): string {
    const baseUrl = this.getBaseUrl('transaction');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/operation-routes`;

    if (operationRouteId) {
      url += `/${operationRouteId}`;
    }

    return url;
  }

  /**
   * Builds the URL for transaction route endpoints
   *
   * @returns The constructed URL
   */
  public buildTransactionRouteUrl(
    orgId: string,
    ledgerId: string,
    transactionRouteId?: string
  ): string {
    const baseUrl = this.getBaseUrl('transaction');
    const versionedUrl = this.getVersionedUrl(baseUrl);
    let url = `${versionedUrl}/organizations/${orgId}/ledgers/${ledgerId}/transaction-routes`;

    if (transactionRouteId) {
      url += `/${transactionRouteId}`;
    }

    return url;
  }
}

/**
 * Builds a URL from a base URL and path segments
 */
export function buildUrl(baseUrl: string, ...pathSegments: string[]): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanSegments = pathSegments
    .filter((segment) => segment && segment.trim() !== '')
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''));

  return [cleanBaseUrl, ...cleanSegments].join('/');
}

/**
 * Builds query parameters string from an object
 */
export function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
