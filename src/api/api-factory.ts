/**
 */

import { MidazConfig } from '../client';
import { HttpClient } from '../util/network/http-client';
import { Observability } from '../util/observability/observability';

import { HttpAccountApiClient } from './http/http-account-api-client';
import { HttpAccountTypeApiClient } from './http/http-account-type-api-client';
import { HttpAssetApiClient } from './http/http-asset-api-client';
import { HttpAssetRateApiClient } from './http/http-asset-rate-api-client';
import { HttpBalanceApiClient } from './http/http-balance-api-client';
import { HttpLedgerApiClient } from './http/http-ledger-api-client';
import { HttpOperationApiClient } from './http/http-operation-api-client';
import { HttpOperationRouteApiClient } from './http/http-operation-route-api-client';
import { HttpOrganizationApiClient } from './http/http-organization-api-client';
import { HttpPortfolioApiClient } from './http/http-portfolio-api-client';
import { HttpSegmentApiClient } from './http/http-segment-api-client';
import { HttpTransactionApiClient } from './http/http-transaction-api-client';
import { HttpTransactionRouteApiClient } from './http/http-transaction-route-api-client';
import { AccountApiClient } from './interfaces/account-api-client';
import { AccountTypeApiClient } from './interfaces/account-type-api-client';
import { AssetApiClient } from './interfaces/asset-api-client';
import { AssetRateApiClient } from './interfaces/asset-rate-api-client';
import { BalanceApiClient } from './interfaces/balance-api-client';
import { LedgerApiClient } from './interfaces/ledger-api-client';
import { OperationApiClient } from './interfaces/operation-api-client';
import { OperationRouteApiClient } from './interfaces/operation-route-api-client';
import { OrganizationApiClient } from './interfaces/organization-api-client';
import { PortfolioApiClient } from './interfaces/portfolio-api-client';
import { SegmentApiClient } from './interfaces/segment-api-client';
import { TransactionApiClient } from './interfaces/transaction-api-client';
import { TransactionRouteApiClient } from './interfaces/transaction-route-api-client';
import { UrlBuilder } from './url-builder';

/**
 * Factory for creating API clients
 *
 * This class centralizes the creation of API clients for different service entities,
 * ensuring consistent configuration and dependencies.
 */
export class ApiFactory {
  private readonly urlBuilder: UrlBuilder;
  private readonly observability: Observability;

  /**
   * Creates a new ApiFactory
   *
   */
  constructor(
    private readonly httpClient: HttpClient,
    config: MidazConfig,
    observability?: Observability
  ) {
    this.urlBuilder = new UrlBuilder(config);
    this.observability = observability || Observability.getInstance();
  }

  /**
   * Creates a transaction API client
   *
   * @returns TransactionApiClient implementation
   */
  public createTransactionApiClient(): TransactionApiClient {
    return new HttpTransactionApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an organization API client
   *
   * @returns OrganizationApiClient implementation
   */
  public createOrganizationApiClient(): OrganizationApiClient {
    return new HttpOrganizationApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates a ledger API client
   *
   * @returns LedgerApiClient implementation
   */
  public createLedgerApiClient(): LedgerApiClient {
    return new HttpLedgerApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an asset API client
   *
   * @returns AssetApiClient implementation
   */
  public createAssetApiClient(): AssetApiClient {
    return new HttpAssetApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates a balance API client
   *
   * @returns BalanceApiClient implementation
   */
  public createBalanceApiClient(): BalanceApiClient {
    return new HttpBalanceApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an account API client
   *
   * @returns AccountApiClient implementation
   */
  public createAccountApiClient(): AccountApiClient {
    return new HttpAccountApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates a portfolio API client
   *
   * @returns PortfolioApiClient implementation
   */
  public createPortfolioApiClient(): PortfolioApiClient {
    return new HttpPortfolioApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates a segment API client
   *
   * @returns SegmentApiClient implementation
   */
  public createSegmentApiClient(): SegmentApiClient {
    return new HttpSegmentApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an operation API client
   *
   * @returns OperationApiClient implementation
   */
  public createOperationApiClient(): OperationApiClient {
    return new HttpOperationApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an asset rate API client
   *
   * @returns AssetRateApiClient implementation
   */
  public createAssetRateApiClient(): AssetRateApiClient {
    return new HttpAssetRateApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an account type API client
   *
   * @returns AccountTypeApiClient implementation
   */
  public createAccountTypeApiClient(): AccountTypeApiClient {
    return new HttpAccountTypeApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates an operation route API client
   *
   * @returns OperationRouteApiClient implementation
   */
  public createOperationRouteApiClient(): OperationRouteApiClient {
    return new HttpOperationRouteApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  /**
   * Creates a transaction route API client
   *
   * @returns TransactionRouteApiClient implementation
   */
  public createTransactionRouteApiClient(): TransactionRouteApiClient {
    return new HttpTransactionRouteApiClient(this.httpClient, this.urlBuilder, this.observability);
  }

  // All services have now been migrated to the API client pattern
}
