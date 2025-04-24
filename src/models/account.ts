/**
 * @file Account model definitions for the Midaz SDK
 * @description Defines the account data structures and helper functions for managing accounts in the Midaz ledger system
 */

import { Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Valid account types in the system
 */
export type AccountType =
  | 'deposit'
  | 'savings'
  | 'loans'
  | 'marketplace'
  | 'creditCard'
  | 'external';

/**
 * Account model
 *
 * Accounts are the fundamental entities for tracking assets and their movements
 * within the ledger system. Each account represents a container for a specific type
 * of asset and belongs to an organization within a ledger.
 *
 * Accounts can be organized hierarchically (with parent-child relationships),
 * grouped into portfolios, and segmented for reporting and analysis purposes.
 *
 * Account types include:
 * - Asset accounts: Track what an entity owns (e.g., cash, investments)
 * - Liability accounts: Track what an entity owes (e.g., loans, payables)
 * - Equity accounts: Track the residual interest in assets (e.g., capital, retained earnings)
 * - Revenue accounts: Track income sources (e.g., sales, interest income)
 * - Expense accounts: Track costs and expenditures (e.g., salaries, rent)
 */
export interface Account {
  /** Unique system-generated identifier */
  id: string;

  /** Human-readable name describing the account purpose (e.g., "Operating Cash") */
  name: string;

  /** Optional parent account ID for hierarchical structures and roll-up reporting */
  parentAccountId?: string;

  /** Optional external identifier to link account to external systems */
  entityId?: string;

  /** Asset code identifying the asset type held in this account (e.g., "USD", "BTC") */
  assetCode: string;

  /** Organization ID that owns this account, providing top-level access control */
  organizationId: string;

  /** Ledger ID containing this account, defining accounting boundaries and rules */
  ledgerId: string;

  /** Optional portfolio ID for grouping accounts for investment management and reporting */
  portfolioId?: string;

  /** Optional segment ID for business unit reporting and cost center analysis */
  segmentId?: string;

  /** Account status controlling whether transactions can be posted */
  status: Status;

  /** Optional human-friendly identifier (e.g., "primary-cash", "tax-reserve") */
  alias?: string;

  /**
   * Account type (required)
   * Categorizes the account according to standard accounting principles
   * Must be one of: "deposit", "savings", "loans", "marketplace", "creditCard", "external"
   */
  type: AccountType;

  /** Arbitrary key-value pairs for additional information and application-specific data */
  metadata?: Record<string, any>;

  /** Creation timestamp (ISO 8601), automatically set by the system */
  createdAt: string;

  /** Last update timestamp (ISO 8601), automatically updated on changes */
  updatedAt: string;

  /** Optional deletion timestamp (ISO 8601) for soft-deleted accounts */
  deletedAt?: string;
}

/**
 * Input for creating an account
 *
 * This structure contains all the fields that can be specified when creating a new account.
 * Only fields marked as required must be provided; others are optional and will use system defaults
 * if not specified.
 */
export interface CreateAccountInput {
  /**
   * Account name (required)
   * Human-readable name that describes the purpose or content of the account
   * Maximum length is typically 256 characters
   */
  name: string;

  /**
   * Parent account ID (optional)
   * Reference to a parent account if this account should be part of a hierarchical structure
   * The parent account must exist and be in the same ledger
   */
  parentAccountId?: string;

  /**
   * Entity ID (optional)
   * External identifier for the account owner
   * Can be used to link the account to an external system or entity
   */
  entityId?: string;

  /**
   * Asset code (required)
   * Identifies the type of asset held in this account
   * Must reference a valid asset code defined in the system
   */
  assetCode: string;

  /**
   * Portfolio ID (optional)
   * ID of the portfolio this account should belong to
   * The portfolio must exist and be in the same organization
   */
  portfolioId?: string;

  /**
   * Segment ID (optional)
   * ID of the segment this account should belong to
   * The segment must exist and be in the same organization
   */
  segmentId?: string;

  /**
   * Initial status code (optional)
   * Sets the initial status of the account
   * Defaults to ACTIVE if not specified
   */
  status?: StatusCode;

  /**
   * Account alias (optional)
   * Human-friendly identifier for the account
   * Must be unique within the organization if specified
   */
  alias?: string;

  /**
   * Account type (required)
   * Categorizes the account according to standard accounting principles
   * Must be one of: "deposit", "savings", "loans", "marketplace", "creditCard", "external"
   */
  type: AccountType;

  /**
   * Custom metadata (optional)
   * Arbitrary key-value pairs for storing additional information
   * Maximum size is typically limited (e.g., 64KB)
   */
  metadata?: Record<string, any>;
}

/**
 * Input for updating an account
 *
 * This structure contains the fields that can be modified when updating an existing account.
 * Only fields that are set will be updated; omitted fields will remain unchanged.
 * Some fields (like id, assetCode, ledgerId) cannot be changed after account creation.
 */
export interface UpdateAccountInput {
  /**
   * Account name (optional)
   * New human-readable name for the account
   * Maximum length is typically 256 characters
   */
  name?: string;

  /**
   * Segment ID (optional)
   * New segment assignment for the account
   * Set to null to remove the account from its current segment
   */
  segmentId?: string;

  /**
   * Portfolio ID (optional)
   * New portfolio assignment for the account
   * Set to null to remove the account from its current portfolio
   */
  portfolioId?: string;

  /**
   * Status code (optional)
   * New status for the account
   * Controls whether transactions can be posted to this account
   */
  status?: StatusCode;

  /**
   * Custom metadata (optional)
   * New metadata for the account
   * Replaces the entire metadata object if specified
   */
  metadata?: Record<string, any>;
}

/**
 * Account Builder interface
 * Defines the specific methods available for building account objects
 */
export interface AccountBuilder extends Builder<CreateAccountInput, AccountBuilder> {
  /**
   * Set the asset code for the account
   */
  withAssetCode(assetCode: string): AccountBuilder;

  /**
   * Set the account type
   */
  withType(accountType: AccountType): AccountBuilder;

  /**
   * Set the parent account ID
   */
  withParentAccountId(parentId: string): AccountBuilder;

  /**
   * Set the portfolio ID
   */
  withPortfolioId(portfolioId: string): AccountBuilder;

  /**
   * Set the segment ID
   */
  withSegmentId(segmentId: string): AccountBuilder;

  /**
   * Set the account alias
   */
  withAlias(alias: string): AccountBuilder;
}

/**
 * Account Builder implementation
 * Implements the AccountBuilder interface with method chaining
 */
export class AccountBuilderImpl
  extends ModelBuilder<CreateAccountInput, AccountBuilder>
  implements AccountBuilder
{
  constructor(model: CreateAccountInput) {
    super(model);
  }

  withAssetCode(assetCode: string): AccountBuilder {
    if (!assetCode) {
      throw new Error('Asset code is required and cannot be empty');
    }

    this.model.assetCode = assetCode;
    return this;
  }

  withType(accountType: AccountType): AccountBuilder {
    // Validate account type at runtime
    const validTypes: AccountType[] = [
      'deposit',
      'savings',
      'loans',
      'marketplace',
      'creditCard',
      'external',
    ];

    if (!validTypes.includes(accountType)) {
      throw new Error(
        `Invalid account type: ${accountType}. Valid types are: ${validTypes.join(', ')}`
      );
    }

    this.model.type = accountType;
    return this;
  }

  withParentAccountId(parentId: string): AccountBuilder {
    this.model.parentAccountId = parentId;
    return this;
  }

  withPortfolioId(portfolioId: string): AccountBuilder {
    this.model.portfolioId = portfolioId;
    return this;
  }

  withSegmentId(segmentId: string): AccountBuilder {
    this.model.segmentId = segmentId;
    return this;
  }

  withAlias(alias: string): AccountBuilder {
    this.model.alias = alias;
    return this;
  }
}

/**
 * Creates a new account builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an account with a more fluent API.
 *
 * @param name - Human-readable name for the account
 * @param assetCode - Code of the asset to be held in this account
 * @param accountType - Type of account (e.g., "deposit", "loans")
 * @returns An account builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an account using method chaining
 * const account = createAccountBuilder("Operating Cash", "USD", "deposit")
 *   .withAlias("primary-cash")
 *   .withPortfolioId("portfolio_12345")
 *   .withMetadata({
 *     department: "Treasury",
 *     purpose: "Daily operations"
 *   })
 *   .build();
 * ```
 */
export function createAccountBuilder(
  name: string,
  assetCode: string,
  accountType: AccountType
): AccountBuilder {
  // Validate required fields
  if (!name) {
    throw new Error('Account name is required');
  }

  if (!assetCode) {
    throw new Error('Asset code is required and cannot be empty');
  }

  if (!accountType) {
    throw new Error('Account type is required');
  }

  // Validate account type at runtime
  const validTypes: AccountType[] = [
    'deposit',
    'savings',
    'loans',
    'marketplace',
    'creditCard',
    'external',
  ];

  if (!validTypes.includes(accountType)) {
    throw new Error(
      `Invalid account type: ${accountType}. Valid types are: ${validTypes.join(', ')}`
    );
  }

  const input: CreateAccountInput = {
    name,
    assetCode,
    type: accountType,
    status: StatusCode.ACTIVE, // Default status
  };

  return new AccountBuilderImpl(input);
}

/**
 * Account Update Builder interface
 * Defines the specific methods available for building account update objects
 */
export interface UpdateAccountBuilder extends Builder<UpdateAccountInput, UpdateAccountBuilder> {
  /**
   * Set the name for the account update
   */
  withName(name: string): UpdateAccountBuilder;

  /**
   * Set the segment ID for the account update
   */
  withSegmentId(segmentId: string): UpdateAccountBuilder;

  /**
   * Set the portfolio ID for the account update
   */
  withPortfolioId(portfolioId: string): UpdateAccountBuilder;
}

/**
 * Account Update Builder implementation
 * Implements the UpdateAccountBuilder interface with method chaining
 */
export class UpdateAccountBuilderImpl
  extends ModelBuilder<UpdateAccountInput, UpdateAccountBuilder>
  implements UpdateAccountBuilder
{
  constructor(model: UpdateAccountInput) {
    super(model);
  }

  withName(name: string): UpdateAccountBuilder {
    if (!name) {
      throw new Error('Account name is required');
    }

    this.model.name = name;
    return this;
  }

  withSegmentId(segmentId: string): UpdateAccountBuilder {
    this.model.segmentId = segmentId;
    return this;
  }

  withPortfolioId(portfolioId: string): UpdateAccountBuilder {
    this.model.portfolioId = portfolioId;
    return this;
  }
}

/**
 * Creates a new account update builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an account update with a more fluent API.
 *
 * @returns An account update builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an account update using method chaining
 * const accountUpdate = createUpdateAccountBuilder()
 *   .withName("Updated Cash Account")
 *   .withPortfolioId("portfolio_12345")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withMetadata({
 *     department: "Treasury",
 *     purpose: "Daily operations",
 *     lastUpdated: new Date().toISOString()
 *   })
 *   .build();
 * ```
 */
export function createUpdateAccountBuilder(): UpdateAccountBuilder {
  return new UpdateAccountBuilderImpl({});
}

// Compatibility factory functions for backward compatibility
/**
 * Creates a new account input object
 * @deprecated Use createAccountBuilder instead
 */
export function newCreateAccountInput(
  name: string,
  assetCode: string,
  type: AccountType
): CreateAccountInput {
  return createAccountBuilder(name, assetCode, type).build();
}

/**
 * Creates a new account input object with alias
 * @deprecated Use createAccountBuilder instead
 */
export function newCreateAccountInputWithAlias(
  name: string,
  assetCode: string,
  type: AccountType,
  alias: string
): CreateAccountInput {
  return createAccountBuilder(name, assetCode, type)
    .withAlias(alias)
    .build();
}
