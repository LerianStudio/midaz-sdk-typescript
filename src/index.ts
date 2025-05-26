// ============================================================================
// MIDAZ SDK - Main exports
// ============================================================================

// ------------------------------
// Client and Configuration
// ------------------------------
export { MidazClient, MidazConfig } from './client';

export {
  ClientConfigBuilder,
  createClientConfigBuilder,
  createClientConfigWithToken,
  createDevelopmentConfig,
  createSandboxConfig,
  createProductionConfig,
  createLocalConfig,
} from './client-config-builder';

// ------------------------------
// Common Models
// ------------------------------
export {
  Address,
  ListMetadata,
  ListOptions,
  ListResponse,
  Status,
  StatusCode,
} from './models/common';

// ------------------------------
// Entity Base Class
// ------------------------------
export { Entity } from './entities/entity';

// ------------------------------
// Organizations
// ------------------------------
export {
  CreateOrganizationInput,
  Organization,
  OrganizationBuilder,
  UpdateOrganizationBuilder,
  UpdateOrganizationInput,
  createOrganizationBuilder,
  createUpdateOrganizationBuilder,
} from './models/organization';

export { OrganizationsService } from './entities/organizations';

// ------------------------------
// Ledgers
// ------------------------------
export {
  CreateLedgerInput,
  Ledger,
  LedgerBuilder,
  UpdateLedgerBuilder,
  createLedgerBuilder,
  createUpdateLedgerBuilder,
  UpdateLedgerInput,
  withMetadata as withLedgerMetadata,
  withStatus as withLedgerStatus,
  withName,
} from './models/ledger';

export { LedgersService } from './entities/ledgers';

// ------------------------------
// Assets
// ------------------------------
export {
  Asset,
  AssetBuilder,
  UpdateAssetBuilder,
  createAssetBuilder,
  createAssetBuilderWithType,
  createUpdateAssetBuilder,
  CreateAssetInput,
  UpdateAssetInput,
  withMetadata as withAssetMetadata,
  withStatus as withAssetStatus,
} from './models/asset';

export { AssetsService } from './entities/assets';

// ------------------------------
// Asset Rates
// ------------------------------
export { AssetRate, createUpdateAssetRateInput, UpdateAssetRateInput } from './models/asset-rate';

export { AssetRatesService } from './entities/asset-rates';

// ------------------------------
// Portfolios
// ------------------------------
export {
  CreatePortfolioInput,
  Portfolio,
  PortfolioBuilder,
  UpdatePortfolioBuilder,
  createPortfolioBuilder,
  createUpdatePortfolioBuilder,
  UpdatePortfolioInput,
} from './models/portfolio';

export { PortfoliosService } from './entities/portfolios';

// ------------------------------
// Segments
// ------------------------------
export {
  CreateSegmentInput,
  Segment,
  SegmentBuilder,
  UpdateSegmentBuilder,
  createSegmentBuilder,
  createUpdateSegmentBuilder,
  UpdateSegmentInput,
} from './models/segment';

export { SegmentsService } from './entities/segments';

// ------------------------------
// Accounts
// ------------------------------
export {
  Account,
  AccountBuilder,
  AccountType,
  CreateAccountInput,
  UpdateAccountBuilder,
  UpdateAccountInput,
  createAccountBuilder,
  createUpdateAccountBuilder,
} from './models/account';

export { AccountsService } from './entities/accounts';

// Account helper utilities
export * from './util/account/index';

// ------------------------------
// Transactions
// ------------------------------
export {
  Amount,
  AmountInput,
  CreateTransactionInput,
  Operation,
  OperationInput,
  Transaction,
  UpdateTransactionInput,
} from './models/transaction';

export { TransactionPaginator, TransactionsService } from './entities/transactions';

// Transaction builder helpers
export {
  createAmountInput,
  createDepositTransaction,
  createMultiCurrencyTransaction,
  createTransferTransaction,
  createWithdrawalTransaction,
} from './models/transaction-builders';

// Transaction pair utilities
export * from './models/transaction-pairs';

// Transaction batch processing
export * from './models/transaction-batch';

// Compatibility batch interface
export * from './models/batch';

// Common transaction patterns
export * from './models/transaction-patterns';

// ------------------------------
// Balances
// ------------------------------
export {
  Balance,
  newUpdateBalanceInput,
  UpdateBalanceInput,
  withAllowReceiving,
  withAllowSending,
} from './models/balance';

export { BalancesService } from './entities/balances';

// ------------------------------
// Utilities
// ------------------------------

// ------------------------------
// Error Utilities
// ------------------------------
export * from './util/error/index';

// ------------------------------
// Data Utilities
// ------------------------------
export * from './util/data/index';

// ------------------------------
// Core Utilities
// ------------------------------
export * from './util/observability';

export * from './util/validation';

export * from './util/config';

export * from './util/concurrency';

// ------------------------------
// Builder Pattern
// ------------------------------
export { BuildableModel, Builder, ModelBuilder } from './models/common-helpers';

// ------------------------------
// Version
// ------------------------------
export const VERSION = '0.1.0';
