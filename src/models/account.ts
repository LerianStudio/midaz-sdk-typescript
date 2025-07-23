/**
 * Account model definitions
 */

import { Status, StatusCode } from './common';
import { Builder, ModelBuilder } from './common-helpers';

/**
 * Account model
 */
export interface Account {
  /** Unique system-generated identifier */
  id: string;

  /** Human-readable name describing the account purpose */
  name: string;

  /** Optional parent account ID for hierarchical structures */
  parentAccountId?: string;

  /** Optional external identifier to link account to external systems */
  entityId?: string;

  /** Asset code identifying the asset type held in this account */
  assetCode: string;

  /** Portfolio ID that this account belongs to */
  portfolioId?: string;

  /** Segment ID for categorizing this account */
  segmentId?: string;

  /** Current status determining whether the account can be used in transactions */
  status: Status;

  /** Optional alias for the account (unique within a ledger) */
  alias?: string;

  /** Account type classification */
  type: string;

  /** Ledger ID containing this account */
  ledgerId: string;

  /** Organization ID that owns this account */
  organizationId: string;

  /** Timestamp when the account was created */
  createdAt: string;

  /** Timestamp when the account was last updated */
  updatedAt: string;

  /** Timestamp when the account was deleted, if applicable */
  deletedAt?: string;

  /** Custom metadata fields for the account */
  metadata?: Record<string, any>;
}

/**
 * Input for creating an account
 */
export interface CreateAccountInput {
  /** Human-readable name for the account */
  name: string;

  /** Optional parent account ID for hierarchical structures */
  parentAccountId?: string;

  /** Optional external identifier to link account to external systems */
  entityId?: string;

  /** Asset code identifying the asset type held in this account */
  assetCode: string;

  /** Portfolio ID that this account belongs to */
  portfolioId?: string;

  /** Segment ID for categorizing this account */
  segmentId?: string;

  /** Initial status code for the account */
  status?: StatusCode;

  /** Optional alias for the account (unique within a ledger) */
  alias?: string;

  /** Account type classification */
  type: string;

  /** Custom metadata fields for the account */
  metadata?: Record<string, any>;
}

/**
 * Input for updating an account
 */
export interface UpdateAccountInput {
  /** Updated human-readable name for the account */
  name?: string;

  /** Updated segment ID for categorizing this account */
  segmentId?: string;

  /** Updated portfolio ID that this account belongs to */
  portfolioId?: string;

  /** Updated status code for the account */
  status?: StatusCode;

  /** Updated custom metadata fields for the account */
  metadata?: Record<string, any>;
}

/**
 * Account Builder interface
 */
export interface AccountBuilder extends Builder<CreateAccountInput, AccountBuilder> {
  /** Set the asset code for the account */
  withAssetCode(assetCode: string): AccountBuilder;

  /** Set the account type */
  withType(accountType: string): AccountBuilder;

  /** Set the parent account ID */
  withParentAccountId(parentId: string): AccountBuilder;

  /** Set the portfolio ID */
  withPortfolioId(portfolioId: string): AccountBuilder;

  /** Set the segment ID */
  withSegmentId(segmentId: string): AccountBuilder;

  /** Set the account alias */
  withAlias(alias: string): AccountBuilder;
}

/**
 * Account Builder implementation
 */
export class AccountBuilderImpl
  extends ModelBuilder<CreateAccountInput, AccountBuilder>
  implements AccountBuilder
{
  constructor(model: CreateAccountInput) {
    super(model);
  }

  withAssetCode(assetCode: string): AccountBuilder {
    this.model.assetCode = assetCode;
    return this;
  }

  withType(accountType: string): AccountBuilder {
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
 * Creates a new account builder with method chaining
 */
export function createAccountBuilder(
  name: string,
  assetCode: string,
  accountType: string
): AccountBuilder {
  const model: CreateAccountInput = {
    name,
    assetCode,
    type: accountType,
  };

  return new AccountBuilderImpl(model);
}

/**
 * Account Update Builder interface
 */
export interface UpdateAccountBuilder extends Builder<UpdateAccountInput, UpdateAccountBuilder> {
  /** Set the name for the account update */
  withName(name: string): UpdateAccountBuilder;

  /** Set the segment ID for the account update */
  withSegmentId(segmentId: string): UpdateAccountBuilder;

  /** Set the portfolio ID for the account update */
  withPortfolioId(portfolioId: string): UpdateAccountBuilder;
}

/**
 * Account Update Builder implementation
 */
export class UpdateAccountBuilderImpl
  extends ModelBuilder<UpdateAccountInput, UpdateAccountBuilder>
  implements UpdateAccountBuilder
{
  constructor(model: UpdateAccountInput) {
    super(model);
  }

  withName(name: string): UpdateAccountBuilder {
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
 * Creates a new account update builder with method chaining
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
  type: string
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
  type: string,
  alias: string
): CreateAccountInput {
  return createAccountBuilder(name, assetCode, type).withAlias(alias).build();
}
