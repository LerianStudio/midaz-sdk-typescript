/**
 * Account Type model and related types
 *
 * Account types define templates or categories for accounts, specifying
 * their behavior and characteristics within the ledger system.
 */

import { BaseModel, Metadata } from './common';

/**
 * Account Type represents a template or category for accounts
 */
export interface AccountType extends BaseModel {
  /** Unique identifier for the account type */
  id: string;

  /** Organization ID that owns this account type */
  organizationId: string;

  /** Ledger ID where this account type belongs */
  ledgerId: string;

  /** Human-readable name for the account type */
  name: string;

  /** Detailed description of the account type's purpose */
  description?: string;

  /** Unique identifier within the organization/ledger */
  keyValue: string;

  /** Custom attributes for account type configuration */
  metadata?: Metadata;

  /** Timestamp when the account type was created */
  createdAt: string;

  /** Timestamp when the account type was last updated */
  updatedAt: string;

  /** Timestamp when the account type was deleted (if applicable) */
  deletedAt?: string;
}

/**
 * Input for creating a new account type
 */
export interface CreateAccountTypeInput {
  /** Human-readable name for the account type */
  name: string;

  /** Unique identifier within the organization/ledger */
  keyValue: string;

  /** Detailed description of the account type's purpose */
  description?: string;

  /** Custom attributes for account type configuration */
  metadata?: Metadata;
}

/**
 * Input for updating an existing account type
 */
export interface UpdateAccountTypeInput {
  /** Human-readable name for the account type */
  name?: string;

  /** Detailed description of the account type's purpose */
  description?: string;

  /** Custom attributes for account type configuration */
  metadata?: Metadata;
}

/**
 * Builder for creating account type input
 */
export class AccountTypeBuilder {
  private input: CreateAccountTypeInput;

  constructor(name: string, keyValue: string) {
    this.input = {
      name,
      keyValue,
    };
  }

  /**
   * Set description for the account type
   */
  withDescription(description: string): AccountTypeBuilder {
    this.input.description = description;
    return this;
  }

  /**
   * Set metadata for the account type
   */
  withMetadata(metadata: Metadata): AccountTypeBuilder {
    this.input.metadata = metadata;
    return this;
  }

  /**
   * Build the final CreateAccountTypeInput
   */
  build(): CreateAccountTypeInput {
    return { ...this.input };
  }
}

/**
 * Builder for updating account type input
 */
export class UpdateAccountTypeBuilder {
  private input: UpdateAccountTypeInput;

  constructor() {
    this.input = {};
  }

  /**
   * Set name for the account type
   */
  withName(name: string): UpdateAccountTypeBuilder {
    this.input.name = name;
    return this;
  }

  /**
   * Set description for the account type
   */
  withDescription(description: string): UpdateAccountTypeBuilder {
    this.input.description = description;
    return this;
  }

  /**
   * Set metadata for the account type
   */
  withMetadata(metadata: Metadata): UpdateAccountTypeBuilder {
    this.input.metadata = metadata;
    return this;
  }

  /**
   * Build the final UpdateAccountTypeInput
   */
  build(): UpdateAccountTypeInput {
    return { ...this.input };
  }
}

/**
 * Helper function to create an account type builder
 */
export function createAccountTypeBuilder(name: string, keyValue: string): AccountTypeBuilder {
  return new AccountTypeBuilder(name, keyValue);
}

/**
 * Helper function to create an update account type builder
 */
export function createUpdateAccountTypeBuilder(): UpdateAccountTypeBuilder {
  return new UpdateAccountTypeBuilder();
}
