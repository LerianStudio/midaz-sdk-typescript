/**
 * Entity factory - Centralized access point to all entity services
 */

import { ApiFactory } from '../api/api-factory';
import { MidazConfig } from '../client';
import { ConfigService } from '../util/config';
import { HttpClient } from '../util/network/http-client';
import { Observability } from '../util/observability/observability';

import { AccountsService } from './accounts';
import { AssetRatesService } from './asset-rates';
import { AssetsService } from './assets';
import { BalancesService } from './balances';
import { LedgersService } from './ledgers';
import { OperationsService } from './operations';
import { OrganizationsService } from './organizations';
import { PortfoliosService } from './portfolios';
import { SegmentsService } from './segments';
import { TransactionsService } from './transactions';

import { AccountsServiceImpl } from './implementations/accounts-impl';
import { AssetRatesServiceImpl } from './implementations/asset-rates-impl';
import { AssetsServiceImpl } from './implementations/assets-impl';
import { BalancesServiceImpl } from './implementations/balances-impl';
import { LedgersServiceImpl } from './implementations/ledgers-impl';
import { OperationsServiceImpl } from './implementations/operations-impl';
import { OrganizationsServiceImpl } from './implementations/organizations-impl';
import { PortfoliosServiceImpl } from './implementations/portfolios-impl';
import { SegmentsServiceImpl } from './implementations/segments-impl';
import { TransactionsServiceImpl } from './implementations/transactions-impl';

/**
 * Entity factory providing access to all entity service interfaces
 *
 * @example
 * ```typescript
 * // Access entity services through the client
 * const organizations = await client.entities.organizations.listOrganizations();
 * const accounts = await client.entities.accounts.listAccounts("org_123", "ldg_456");
 * ```
 */
export class Entity {
  /** Organizations service */
  public readonly organizations: OrganizationsService;

  /** Accounts service */
  public readonly accounts: AccountsService;

  /** Ledgers service */
  public readonly ledgers: LedgersService;

  /** Transactions service */
  public readonly transactions: TransactionsService;

  /** Assets service */
  public readonly assets: AssetsService;

  /** Balances service */
  public readonly balances: BalancesService;

  /** Portfolios service */
  public readonly portfolios: PortfoliosService;

  /** Segments service */
  public readonly segments: SegmentsService;

  /** Operations service */
  public readonly operations: OperationsService;

  /** Asset rates service */
  public readonly assetRates: AssetRatesService;

  /** API factory for creating API clients */
  private readonly apiFactory: ApiFactory;

  /** Observability instance */
  private readonly observability: Observability;

  /**
   * Creates a new Entity instance with all service interfaces
   * @param httpClient HTTP client instance
   * @param config Midaz configuration (optional)
   * @param observability Observability instance (optional)
   */
  constructor(
    private readonly httpClient: HttpClient,
    config?: MidazConfig,
    observability?: Observability
  ) {
    // Initialize ConfigService
    const configService = ConfigService.getInstance();
    
    // Initialize observability using ConfigService
    const observabilityConfig = configService.getObservabilityConfig();
    this.observability = observability || new Observability({
      serviceName: 'midaz-entity-factory',
      enableTracing: observabilityConfig.enableTracing,
      enableMetrics: observabilityConfig.enableMetrics,
      enableLogging: observabilityConfig.enableLogging,
    });

    // Create an empty config if not provided (will be updated via configure())
    const initialConfig: MidazConfig = config || {
      environment: 'development',
      baseUrls: {},
    };

    // Create API factory
    this.apiFactory = new ApiFactory(httpClient, initialConfig, this.observability);

    this.transactions = new TransactionsServiceImpl(
      this.apiFactory.createTransactionApiClient(),
      this.observability
    );

    this.organizations = new OrganizationsServiceImpl(
      this.apiFactory.createOrganizationApiClient(),
      this.observability
    );

    this.ledgers = new LedgersServiceImpl(
      this.apiFactory.createLedgerApiClient(),
      this.observability
    );

    this.assets = new AssetsServiceImpl(this.apiFactory.createAssetApiClient(), this.observability);

    this.balances = new BalancesServiceImpl(
      this.apiFactory.createBalanceApiClient(),
      this.observability
    );

    this.accounts = new AccountsServiceImpl(
      this.apiFactory.createAccountApiClient(),
      this.observability
    );

    this.portfolios = new PortfoliosServiceImpl(
      this.apiFactory.createPortfolioApiClient(),
      this.observability
    );

    this.segments = new SegmentsServiceImpl(
      this.apiFactory.createSegmentApiClient(),
      this.observability
    );

    this.operations = new OperationsServiceImpl(
      this.apiFactory.createOperationApiClient(),
      this.observability
    );

    this.assetRates = new AssetRatesServiceImpl(
      this.apiFactory.createAssetRateApiClient(),
      this.observability
    );
  }

  /**
   * Configures all entity services with the provided configuration
   * @param config Midaz configuration
   */
  public configure(config: MidazConfig): void {
    this.httpClient.updateConfig({
      baseUrls: config.baseUrls || {},
      apiKey: config.authToken || config.apiKey,
      timeout: config.timeout,
    });

    if (config.debug) {
      console.debug('Entity services configured with updated settings');
    }
  }

  /**
   * Returns the HTTP client used by the entity
   * @returns HTTP client instance
   */
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }
}
