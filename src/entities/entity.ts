/**
 * @file Entity factory for the Midaz SDK
 * @description Provides a centralized access point to all entity services in the Midaz system
 */

import { ApiFactory } from '../api/api-factory';
import { MidazConfig } from '../client';
import { HttpClient } from '../util/network/http-client';
import { Observability } from '../util/observability/observability';

import { AccountsService } from './accounts';
import { AssetRatesService } from './asset-rates';
import { AssetsService } from './assets';
import { BalancesService } from './balances';
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
import { LedgersService } from './ledgers';
import { OperationsService } from './operations';
import { OrganizationsService } from './organizations';
import { PortfoliosService } from './portfolios';
import { SegmentsService } from './segments';
import { TransactionsService } from './transactions';

/**
 * Entity provides a centralized access point to all entity types in the Midaz SDK.
 *
 * It acts as a factory for creating specific entity interfaces for different resource types
 * and operations. Each property exposes a service interface that provides methods for
 * interacting with a specific type of entity in the Midaz system.
 *
 * The Entity class follows the facade pattern, providing a simplified interface to the
 * complex subsystem of API endpoints and entity operations.
 *
 * @example
 * ```typescript
 * // Create a Midaz client
 * const midazClient = new MidazClient({
 *   apiKey: "your-api-key",
 *   environment: "sandbox"
 * });
 *
 * // Access entity services through the client
 * const organizations = await midazClient.entities.organizations.listOrganizations();
 * const accounts = await midazClient.entities.accounts.listAccounts("org_id", "ledger_id");
 * const transactions = await midazClient.entities.transactions.listTransactions("org_id", "ledger_id");
 * ```
 */
export class Entity {
  /**
   * Service for managing organizations
   */
  public readonly organizations: OrganizationsService;

  /**
   * Service for managing accounts
   */
  public readonly accounts: AccountsService;

  /**
   * Service for managing ledgers
   */
  public readonly ledgers: LedgersService;

  /**
   * Service for managing transactions
   */
  public readonly transactions: TransactionsService;

  /**
   * Service for managing assets
   */
  public readonly assets: AssetsService;

  /**
   * Service for managing balances
   */
  public readonly balances: BalancesService;

  /**
   * Service for managing portfolios
   */
  public readonly portfolios: PortfoliosService;

  /**
   * Service for managing segments
   */
  public readonly segments: SegmentsService;

  /**
   * Service for managing operations
   */
  public readonly operations: OperationsService;

  /**
   * Service for managing asset rates
   */
  public readonly assetRates: AssetRatesService;

  /**
   * API factory for creating API clients
   */
  private readonly apiFactory: ApiFactory;

  /**
   * Observability instance for tracing and metrics
   */
  private readonly observability: Observability;

  /**
   * Creates a new Entity instance
   *
   * Initializes all service interfaces with the HTTP client and configuration.
   *
   * @param httpClient - The HTTP client to use for API requests
   * @param config - Optional configuration (if not provided, it will be passed later via configure())
   * @param observability - Optional observability provider
   */
  constructor(
    private readonly httpClient: HttpClient,
    config?: MidazConfig,
    observability?: Observability
  ) {
    // Import ConfigService
    const { ConfigService } = require('../util/config');
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

    // Initialize services with API clients from the factory
    // Services that have been migrated to the new pattern
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

    // Services migrated to the new pattern
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

    // All services now use the API client pattern
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
   *
   * This method should be called after creating the Entity instance to ensure
   * that all services have the correct configuration.
   *
   * @param config - The Midaz client configuration
   */
  public configure(config: MidazConfig): void {
    // Since we can't reassign the readonly properties, we need to update the
    // underlying URL configuration in the httpClient
    this.httpClient.updateConfig({
      baseUrls: config.baseUrls || {},
      apiKey: config.authToken || config.apiKey,
      timeout: config.timeout,
    });

    // The httpClient is used by all API clients, so this will update
    // the configuration for all service implementations

    // Log the configuration update for debugging purposes
    if (config.debug) {
      console.debug('Entity services configured with updated settings');
    }
  }

  /**
   * Returns the HTTP client used by the entity
   */
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }
}
