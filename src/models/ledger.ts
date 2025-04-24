/**
 * @file Ledger model definitions for the Midaz SDK
 * @description Defines the ledger data structures and helper functions for managing ledgers in the Midaz system
 */

import { Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Ledger model representing a financial record-keeping system.
 *
 * A ledger is a financial record-keeping system that contains accounts
 * and tracks all transactions between those accounts. Each ledger belongs
 * to a specific organization and can have multiple accounts.
 *
 * Ledgers are the primary containers for financial data in the Midaz system and provide:
 * - Isolation of financial records between different business units or clients
 * - Enforcement of accounting rules and constraints
 * - A boundary for transaction processing and reporting
 * - Multi-currency support through associated assets
 *
 * @example
 * ```typescript
 * // Example of a complete Ledger object
 * const ledger: Ledger = {
 *   id: "ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   name: "Corporate General Ledger",
 *   organizationId: "org_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   status: {
 *     code: "ACTIVE",
 *     description: "Ledger is active and operational",
 *     timestamp: "2023-09-15T14:30:00Z"
 *   },
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   metadata: {
 *     fiscalYear: "2023",
 *     accountingStandard: "GAAP",
 *     baseCurrency: "USD"
 *   }
 * };
 * ```
 */
export interface Ledger {
  /**
   * Unique identifier
   * System-generated UUID that uniquely identifies this ledger
   * across the entire Midaz platform.
   */
  id: string;

  /**
   * Human-readable name of the ledger
   * Descriptive name that helps identify the purpose of the ledger.
   * Examples include "Corporate General Ledger", "Client Trust Accounting",
   * or "Investment Portfolio Tracking".
   */
  name: string;

  /**
   * ID of the organization that owns this ledger
   * All ledgers must belong to an organization, which provides the
   * top-level ownership and access control.
   */
  organizationId: string;

  /**
   * Current status of the ledger
   * Controls whether the ledger can be used for new accounts or transactions.
   * Includes a code, optional description, and timestamp of the status change.
   */
  status: Status;

  /**
   * Additional custom data
   * Arbitrary key-value pairs for storing application-specific information.
   * Can include fiscal year, accounting standards, base currency, etc.
   */
  metadata?: Record<string, any>;

  /**
   * Creation timestamp
   * ISO 8601 formatted date-time string.
   * Automatically set by the system and cannot be modified.
   */
  createdAt: string;

  /**
   * Last update timestamp
   * ISO 8601 formatted date-time string.
   * Automatically updated by the system whenever the ledger is modified.
   */
  updatedAt: string;

  /**
   * Deletion timestamp, if applicable
   * ISO 8601 formatted date-time string.
   * Set when a ledger is soft-deleted, allowing for potential recovery.
   */
  deletedAt?: string;
}

/**
 * Input for creating a ledger
 *
 * This structure contains all the fields that can be specified when creating a new ledger.
 * Only fields marked as required must be provided; others are optional and will use system defaults
 * if not specified.
 *
 * @example
 * ```typescript
 * // Create input for a new general ledger
 * const createInput: CreateLedgerInput = {
 *   name: "Corporate General Ledger",
 *   metadata: {
 *     fiscalYear: "2023",
 *     accountingStandard: "GAAP",
 *     baseCurrency: "USD"
 *   }
 * };
 *
 * // The ledger can also be created using the helper function
 * const helperInput = newCreateLedgerInput("Corporate General Ledger");
 * ```
 */
export interface CreateLedgerInput extends BuildableModel {
  /**
   * Human-readable name for the ledger (required, max length: 256 characters)
   * Descriptive name that helps identify the purpose of the ledger.
   * Should be meaningful to users and reflect the ledger's intended use.
   */
  name: string;

  /**
   * Initial status code
   * Optional field that defaults to ACTIVE if not specified.
   * Controls whether the ledger can be used immediately after creation.
   */
  status?: StatusCode;

  /**
   * Additional custom data
   * Optional field for storing application-specific information.
   * Can include fiscal year, accounting standards, base currency, etc.
   */
  metadata?: Record<string, any>;
}

/**
 * Input for updating a ledger
 *
 * This structure contains the fields that can be modified when updating an existing ledger.
 * Only fields that are set will be updated; omitted fields will remain unchanged.
 *
 * @example
 * ```typescript
 * // Update an existing ledger with new name and metadata
 * const updateInput: UpdateLedgerInput = {
 *   name: "Corporate General Ledger 2023",
 *   metadata: {
 *     fiscalYear: "2023",
 *     accountingStandard: "IFRS",
 *     baseCurrency: "USD",
 *     lastReconciled: "2023-09-30"
 *   }
 * };
 * ```
 */
export interface UpdateLedgerInput extends BuildableModel {
  /**
   * Human-readable name for the ledger
   * Optional field that helps identify the purpose of the ledger.
   * Should be meaningful to users and reflect the ledger's intended use.
   */
  name?: string;

  /**
   * Status code
   * Optional field that controls whether the ledger can be used for new accounts or transactions.
   * Common status changes include activating, suspending, or closing a ledger.
   */
  status?: StatusCode;

  /**
   * Additional custom data
   * Optional field for storing application-specific information.
   * If provided, replaces the entire metadata object.
   */
  metadata?: Record<string, any>;
}

/**
 * Ledger Builder interface
 * Defines the specific methods available for building ledger objects
 */
export interface LedgerBuilder extends Builder<CreateLedgerInput, LedgerBuilder> {
  /**
   * Set the name for the ledger
   */
  withName(name: string): LedgerBuilder;
}

/**
 * Ledger Builder implementation
 * Implements the LedgerBuilder interface with method chaining
 */
export class LedgerBuilderImpl
  extends ModelBuilder<CreateLedgerInput, LedgerBuilder>
  implements LedgerBuilder
{
  constructor(model: CreateLedgerInput) {
    super(model);
  }

  withName(name: string): LedgerBuilder {
    if (!name) {
      throw new Error('Ledger name is required');
    }

    this.model.name = name;
    return this;
  }
}

/**
 * Creates a new ledger builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct a ledger with a more fluent API.
 *
 * @param name - Human-readable name for the ledger
 * @returns A ledger builder with method chaining
 *
 * @example
 * ```typescript
 * // Create a ledger using method chaining
 * const ledgerInput = createLedgerBuilder("Corporate General Ledger")
 *   .withMetadata({
 *     fiscalYear: "2023",
 *     accountingStandard: "GAAP",
 *     baseCurrency: "USD",
 *     departments: ["Finance", "Operations", "Sales"]
 *   })
 *   .withStatus(StatusCode.ACTIVE)
 *   .build();
 * ```
 */
export function createLedgerBuilder(name: string): LedgerBuilder {
  // Validate required fields
  if (!name) {
    throw new Error('Ledger name is required');
  }

  const input: CreateLedgerInput = {
    name,
    status: StatusCode.ACTIVE, // Default status
  };

  return new LedgerBuilderImpl(input);
}

/**
 * Update Ledger Builder interface
 * Defines the specific methods available for building ledger update objects
 */
export interface UpdateLedgerBuilder extends Builder<UpdateLedgerInput, UpdateLedgerBuilder> {
  /**
   * Set the name for the ledger update
   */
  withName(name: string): UpdateLedgerBuilder;
}

/**
 * Update Ledger Builder implementation
 * Implements the UpdateLedgerBuilder interface with method chaining
 */
export class UpdateLedgerBuilderImpl
  extends ModelBuilder<UpdateLedgerInput, UpdateLedgerBuilder>
  implements UpdateLedgerBuilder
{
  constructor(model: UpdateLedgerInput) {
    super(model);
  }

  withName(name: string): UpdateLedgerBuilder {
    if (!name) {
      throw new Error('Ledger name is required');
    }

    this.model.name = name;
    return this;
  }
}

/**
 * Creates a new ledger update builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct a ledger update with a more fluent API.
 *
 * @returns A ledger update builder with method chaining
 *
 * @example
 * ```typescript
 * // Create a ledger update using method chaining
 * const ledgerUpdate = createUpdateLedgerBuilder()
 *   .withName("Corporate General Ledger 2023")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withMetadata({
 *     fiscalYear: "2023",
 *     accountingStandard: "IFRS",
 *     baseCurrency: "USD",
 *     lastReconciled: "2023-09-30"
 *   })
 *   .build();
 * ```
 */
export function createUpdateLedgerBuilder(): UpdateLedgerBuilder {
  return new UpdateLedgerBuilderImpl({});
}

/**
 * Helper function to create a new ledger input
 *
 * This constructor ensures that all mandatory fields are provided when creating a ledger input.
 * It sets sensible defaults for optional fields where appropriate.
 *
 * @param name Human-readable name for the ledger
 * @returns New CreateLedgerInput object with required fields set and default status
 *
 * @example
 * ```typescript
 * // Create a basic ledger input
 * const ledgerInput = newCreateLedgerInput("Corporate General Ledger");
 *
 * // Ledger input can be further customized with other helper methods
 * const customizedInput = withMetadata(ledgerInput, {
 *   fiscalYear: "2023",
 *   accountingStandard: "GAAP"
 * });
 * ```
 */
export function newCreateLedgerInput(name: string): CreateLedgerInput {
  return {
    name,
    status: StatusCode.ACTIVE, // Default status
  };
}

/**
 * Helper function to create a new update ledger input
 *
 * This initializes an empty update input that can be customized
 * using the With* methods. It's useful as a starting point for
 * building an update request.
 *
 * @returns New UpdateLedgerInput object
 *
 * @example
 * ```typescript
 * // Create and customize an update input
 * const updateInput = newUpdateLedgerInput();
 *
 * // Chain multiple updates together
 * const fullUpdate = withName(
 *   withMetadata(
 *     withStatus(updateInput, StatusCode.ACTIVE),
 *     { fiscalYear: "2023", lastReconciled: "2023-09-30" }
 *   ),
 *   "Corporate General Ledger 2023"
 * );
 * ```
 */
export function newUpdateLedgerInput(): UpdateLedgerInput {
  return {};
}

/**
 * Helper method to set name on an UpdateLedgerInput
 *
 * This updates the human-readable name of the ledger.
 * The name should be descriptive and meaningful to users.
 *
 * @param input UpdateLedgerInput object to modify
 * @param name The new name for the ledger
 * @returns The modified UpdateLedgerInput for chaining
 *
 * @example
 * ```typescript
 * // Update just the name of a ledger
 * const updateInput = newUpdateLedgerInput();
 * const nameUpdate = withName(
 *   updateInput,
 *   "Corporate General Ledger 2023"
 * );
 * ```
 */
export function withName(input: UpdateLedgerInput, name: string): UpdateLedgerInput {
  input.name = name;
  return input;
}

/**
 * Helper method to set status on an UpdateLedgerInput
 *
 * This updates the status of the ledger.
 * The status controls whether the ledger can be used for new accounts or transactions.
 *
 * @param input UpdateLedgerInput object to modify
 * @param status The new status for the ledger
 * @returns The modified UpdateLedgerInput for chaining
 *
 * @example
 * ```typescript
 * // Update the status of a ledger to inactive
 * const updateInput = newUpdateLedgerInput();
 * const statusUpdate = withStatus(
 *   updateInput,
 *   StatusCode.INACTIVE
 * );
 * ```
 */
export function withStatus(input: UpdateLedgerInput, status: StatusCode): UpdateLedgerInput {
  input.status = status;
  return input;
}

/**
 * Helper method to set metadata on an input object
 *
 * Metadata can store additional custom information about the ledger.
 * This can include fiscal year, accounting standards, base currency,
 * or any other application-specific data.
 *
 * @param input CreateLedgerInput or UpdateLedgerInput object to modify
 * @param metadata The metadata to set
 * @returns The modified input object for chaining
 *
 * @example
 * ```typescript
 * // Add metadata to a ledger input
 * const ledgerInput = newCreateLedgerInput("Corporate General Ledger");
 * const enhancedInput = withMetadata(ledgerInput, {
 *   fiscalYear: "2023",
 *   accountingStandard: "GAAP",
 *   baseCurrency: "USD",
 *   departments: ["Finance", "Operations", "Sales"]
 * });
 *
 * // Update a ledger's metadata
 * const updateInput = newUpdateLedgerInput();
 * const updateMetadata = withMetadata(updateInput, {
 *   fiscalYear: "2023",
 *   lastReconciled: "2023-09-30"
 * });
 * ```
 */
export function withMetadata<T extends { metadata?: Record<string, any> }>(
  input: T,
  metadata: Record<string, any>
): T {
  input.metadata = metadata;
  return input;
}
