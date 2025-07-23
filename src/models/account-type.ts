/**
 * AccountType model definitions
 */

import { Builder, ModelBuilder } from './common-helpers';

/**
 * AccountType model
 */
export interface AccountType {
  /** Unique system-generated identifier */
  id: string;

  /** Human-readable name describing the account type purpose */
  name: string;

  /** Optional description for the account type */
  description?: string;

  /** Custom value defined by the user to identify the Account Type */
  keyValue: string;

  /** Timestamp when the account type was created */
  createdAt: string;

  /** Timestamp when the account type was last updated */
  updatedAt: string;

  /** Timestamp when the account type was deleted, if applicable */
  deletedAt?: string;
}

/**
 * Input for creating an account type
 */
export interface CreateAccountTypeInput {
  /** Human-readable name for the account type */
  name: string;

  /** Optional description for the account type */
  description?: string;

  /** Custom value to identify the account type */
  keyValue: string;
}

/**
 * Input for updating an account type
 */
export interface UpdateAccountTypeInput {
  /** Human-readable name for the account type */
  name?: string;

  /** Optional description for the account type */
  description?: string;
}

/**
 * AccountType Builder for creating account type inputs.
 *
 * @example
 * ```typescript
 * const input = createAccountTypeBuilder("Cash Account", "CASH")
 *   .withDescription("For liquid assets")
 *   .build();
 * ```
 */
export interface AccountTypeBuilder extends Builder<CreateAccountTypeInput, AccountTypeBuilder> {
  /**
   * Sets the description for the account type.
   * @param description - The description text.
   * @returns The builder instance.
   */
  withDescription(description: string): AccountTypeBuilder;
}

/**
 * Implementation of the AccountTypeBuilder.
 */
class AccountTypeBuilderImpl
  extends ModelBuilder<CreateAccountTypeInput, AccountTypeBuilder>
  implements AccountTypeBuilder
{
  constructor(model: CreateAccountTypeInput) {
    super(model);
  }

  public withDescription(description: string): AccountTypeBuilder {
    this.model.description = description;
    return this;
  }
}

/**
 * Creates a new AccountTypeBuilder.
 * @param name - The name of the account type.
 * @param keyValue - The key value to identify the account type.
 * @returns A new AccountTypeBuilder instance.
 */
export const createAccountTypeBuilder = (name: string, keyValue: string): AccountTypeBuilder => {
  return new AccountTypeBuilderImpl({
    name,
    keyValue,
  });
};
