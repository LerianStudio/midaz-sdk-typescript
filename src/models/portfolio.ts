/**
 */

import { Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Portfolio represents a portfolio in the Midaz system.
 *
 * A portfolio is a collection of accounts that belong to a specific entity
 * within an organization and ledger. Portfolios help organize accounts
 * for better management and reporting.
 *
 * Portfolios are commonly used for:
 * - Investment management (grouping investment accounts)
 * - Client management (grouping accounts by client)
 * - Business unit reporting (grouping accounts by department)
 * - Product line analysis (grouping accounts by product)
 *
 * @example
 * ```typescript
 * // Example of a complete Portfolio object
 * const portfolio: Portfolio = {
 *   id: "pfl_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   name: "Investment Portfolio",
 *   entityId: "client_12345",
 *   ledgerId: "ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   organizationId: "org_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   status: {
 *     code: "ACTIVE",
 *     description: "Portfolio is active and operational",
 *     timestamp: "2023-09-15T14:30:00Z"
 *   },
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   metadata: {
 *     riskProfile: "moderate",
 *     investmentStrategy: "growth",
 *     targetReturn: "8%"
 *   }
 * };
 * ```
 */
export interface Portfolio {
  /**
   * ID is the unique identifier for the portfolio
   * System-generated UUID that uniquely identifies this portfolio
   * across the entire Midaz platform.
   */
  id: string;

  /**
   * Name is the human-readable name of the portfolio
   * Descriptive name that helps identify the purpose or owner of the portfolio.
   * Examples include "Retirement Portfolio", "Client XYZ Holdings", or "Marketing Department".
   */
  name: string;

  /**
   * EntityID is the identifier of the entity that owns this portfolio
   * This can reference a client, customer, department, or any other entity
   * that the portfolio is associated with. Used for organizing portfolios
   * and establishing ownership relationships.
   */
  entityId: string;

  /**
   * LedgerID is the ID of the ledger that contains this portfolio
   * Portfolios are always created within a specific ledger, which defines
   * the accounting boundaries and rules.
   */
  ledgerId: string;

  /**
   * OrganizationID is the ID of the organization that owns this portfolio
   * All portfolios must belong to an organization, which provides the
   * top-level ownership and access control.
   */
  organizationId: string;

  /**
   * Status represents the current status of the portfolio (e.g., "ACTIVE", "INACTIVE")
   * Controls whether the portfolio can be used for new accounts or transactions.
   * Includes a code, optional description, and timestamp of the status change.
   */
  status: Status;

  /**
   * CreatedAt is the timestamp when the portfolio was created
   * ISO 8601 formatted date-time string.
   * Automatically set by the system and cannot be modified.
   */
  createdAt: string;

  /**
   * UpdatedAt is the timestamp when the portfolio was last updated
   * ISO 8601 formatted date-time string.
   * Automatically updated by the system whenever the portfolio is modified.
   */
  updatedAt: string;

  /**
   * DeletedAt is the timestamp when the portfolio was deleted, if applicable
   * ISO 8601 formatted date-time string.
   * Set when a portfolio is soft-deleted, allowing for potential recovery.
   */
  deletedAt?: string;

  /**
   * Metadata contains additional custom data associated with the portfolio
   * Arbitrary key-value pairs for storing application-specific information.
   * Can include risk profiles, investment strategies, client preferences, etc.
   */
  metadata?: Record<string, any>;
}

/**
 * CreatePortfolioInput is the input for creating a portfolio.
 *
 * This structure contains all the fields that can be specified when creating a new portfolio.
 * Only fields marked as required must be provided; others are optional and will use system defaults
 * if not specified.
 *
 * @example
 * ```typescript
 * // Create input for a new investment portfolio
 * const createInput: CreatePortfolioInput = {
 *   entityId: "client_12345",
 *   name: "Retirement Portfolio",
 *   metadata: {
 *     riskProfile: "conservative",
 *     investmentStrategy: "income",
 *     targetReturn: "5%"
 *   }
 * };
 * ```
 */
export interface CreatePortfolioInput extends BuildableModel {
  /**
   * EntityID is the identifier of the entity that will own this portfolio.
   * Required field that references a client, customer, department, or any other entity
   * that the portfolio should be associated with.
   * Max length: 256 characters.
   */
  entityId: string;

  /**
   * Name is the human-readable name for the portfolio.
   * Required field that helps identify the purpose or owner of the portfolio.
   * Should be descriptive and meaningful to users.
   * Max length: 256 characters.
   */
  name: string;

  /**
   * Status represents the initial status of the portfolio.
   * Optional field that defaults to ACTIVE if not specified.
   * Controls whether the portfolio can be used for new accounts or transactions.
   */
  status?: StatusCode;

  /**
   * Metadata contains additional custom data for the portfolio.
   * Optional field for storing application-specific information.
   * Can include risk profiles, investment strategies, client preferences, etc.
   * Keys max length: 100 characters, Values max length: 2000 characters.
   */
  metadata?: Record<string, any>;
}

/**
 * UpdatePortfolioInput is the input for updating a portfolio.
 *
 * This structure contains the fields that can be modified when updating an existing portfolio.
 * Only fields that are set will be updated; omitted fields will remain unchanged.
 * Some fields (like entityId) cannot be changed after portfolio creation.
 *
 * @example
 * ```typescript
 * // Update an existing portfolio with new name and metadata
 * const updateInput: UpdatePortfolioInput = {
 *   name: "Conservative Retirement Portfolio",
 *   metadata: {
 *     riskProfile: "very conservative",
 *     investmentStrategy: "income and preservation",
 *     targetReturn: "4%"
 *   }
 * };
 * ```
 */
export interface UpdatePortfolioInput extends BuildableModel {
  /**
   * EntityID is the updated identifier of the entity that owns this portfolio.
   * Optional field that references a client, customer, department, or any other entity
   * that the portfolio should be associated with.
   * Max length: 256 characters.
   */
  entityId?: string;

  /**
   * Name is the updated human-readable name for the portfolio.
   * Optional field that helps identify the purpose or owner of the portfolio.
   * Should be descriptive and meaningful to users.
   * Max length: 256 characters.
   */
  name?: string;

  /**
   * Status is the updated status of the portfolio.
   * Optional field that controls whether the portfolio can be used for new accounts or transactions.
   * Common status changes include activating or deactivating a portfolio.
   */
  status?: StatusCode;

  /**
   * Metadata contains updated additional custom data.
   * Optional field for storing application-specific information.
   * If provided, replaces the entire metadata object.
   * Keys max length: 100 characters, Values max length: 2000 characters.
   */
  metadata?: Record<string, any>;
}

/**
 * Portfolio Builder interface
 * Defines the specific methods available for building portfolio objects
 */
export interface PortfolioBuilder extends Builder<CreatePortfolioInput, PortfolioBuilder> {
  /**
   * Set the name for the portfolio
   */
  withName(name: string): PortfolioBuilder;

  /**
   * Set the entity ID for the portfolio
   */
  withEntityId(entityId: string): PortfolioBuilder;
}

/**
 * Portfolio Builder implementation
 * Implements the PortfolioBuilder interface with method chaining
 */
export class PortfolioBuilderImpl
  extends ModelBuilder<CreatePortfolioInput, PortfolioBuilder>
  implements PortfolioBuilder
{
  constructor(model: CreatePortfolioInput) {
    super(model);
  }

  withName(name: string): PortfolioBuilder {
    if (!name) {
      throw new Error('Portfolio name is required');
    }

    this.model.name = name;
    return this;
  }

  withEntityId(entityId: string): PortfolioBuilder {
    if (!entityId) {
      throw new Error('Entity ID is required');
    }

    this.model.entityId = entityId;
    return this;
  }
}

/**
 * Creates a new portfolio builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct a portfolio with a more fluent API.
 *
 * @returns A portfolio builder with method chaining
 *
 * @example
 * ```typescript
 * // Create a portfolio using method chaining
 * const portfolioInput = createPortfolioBuilder("client_12345", "Retirement Portfolio")
 *   .withMetadata({
 *     riskProfile: "conservative",
 *     investmentStrategy: "income",
 *     targetReturn: "5%"
 *   })
 *   .withStatus(StatusCode.ACTIVE)
 *   .build();
 * ```
 */
export function createPortfolioBuilder(entityId: string, name: string): PortfolioBuilder {
  // Validate required fields
  if (!entityId) {
    throw new Error('Entity ID is required');
  }

  if (!name) {
    throw new Error('Portfolio name is required');
  }

  const input: CreatePortfolioInput = {
    entityId,
    name,
  };

  return new PortfolioBuilderImpl(input);
}

/**
 * Update Portfolio Builder interface
 * Defines the specific methods available for building portfolio update objects
 */
export interface UpdatePortfolioBuilder
  extends Builder<UpdatePortfolioInput, UpdatePortfolioBuilder> {
  /**
   * Set the name for the portfolio update
   */
  withName(name: string): UpdatePortfolioBuilder;

  /**
   * Set the entity ID for the portfolio update
   */
  withEntityId(entityId: string): UpdatePortfolioBuilder;
}

/**
 * Update Portfolio Builder implementation
 * Implements the UpdatePortfolioBuilder interface with method chaining
 */
export class UpdatePortfolioBuilderImpl
  extends ModelBuilder<UpdatePortfolioInput, UpdatePortfolioBuilder>
  implements UpdatePortfolioBuilder
{
  constructor(model: UpdatePortfolioInput) {
    super(model);
  }

  withName(name: string): UpdatePortfolioBuilder {
    if (!name) {
      throw new Error('Portfolio name is required');
    }

    this.model.name = name;
    return this;
  }

  withEntityId(entityId: string): UpdatePortfolioBuilder {
    if (!entityId) {
      throw new Error('Entity ID is required');
    }

    this.model.entityId = entityId;
    return this;
  }
}

/**
 * Creates a new portfolio update builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct a portfolio update with a more fluent API.
 *
 * @returns A portfolio update builder with method chaining
 *
 * @example
 * ```typescript
 * // Create a portfolio update using method chaining
 * const portfolioUpdate = createUpdatePortfolioBuilder()
 *   .withName("Conservative Retirement Portfolio")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withMetadata({
 *     riskProfile: "very conservative",
 *     investmentStrategy: "income and preservation",
 *     targetReturn: "4%"
 *   })
 *   .build();
 * ```
 */
export function createUpdatePortfolioBuilder(): UpdatePortfolioBuilder {
  return new UpdatePortfolioBuilderImpl({});
}

/**
 * NewCreatePortfolioInput creates a new CreatePortfolioInput with required fields.
 *
 * This constructor ensures that all mandatory fields are provided when creating a portfolio input.
 * It sets sensible defaults for optional fields where appropriate.
 *
 * @returns A new CreatePortfolioInput object with required fields set
 *
 * @example
 * ```typescript
 * // Create a basic portfolio input
 * const portfolioInput = newCreatePortfolioInput(
 *   "client_12345",
 *   "Retirement Portfolio"
 * );
 *
 * // Portfolio input can be further customized with other helper methods
 * const customizedInput = withMetadata(portfolioInput, {
 *   riskProfile: "conservative",
 *   investmentStrategy: "income"
 * });
 * ```
 */
export function newCreatePortfolioInput(entityId: string, name: string): CreatePortfolioInput {
  return {
    entityId,
    name,
  };
}

/**
 * Helper method to set status on a CreatePortfolioInput or UpdatePortfolioInput.
 *
 * This sets the initial status of the portfolio or updates the status of an existing portfolio.
 * It can be used to create portfolios in a non-default status or to update the status
 * of existing portfolios.
 *
 * @returns The modified input object for chaining
 *
 * @example
 * ```typescript
 * // Create an inactive portfolio
 * const portfolioInput = newCreatePortfolioInput(
 *   "client_12345",
 *   "Legacy Portfolio"
 * );
 * const inactivePortfolio = withStatus(portfolioInput, StatusCode.INACTIVE);
 *
 * // Update a portfolio to active status
 * const updateInput = newUpdatePortfolioInput();
 * const activatePortfolio = withStatus(updateInput, StatusCode.ACTIVE);
 * ```
 */
export function withStatus(
  input: CreatePortfolioInput | UpdatePortfolioInput,
  status: StatusCode
): CreatePortfolioInput | UpdatePortfolioInput {
  input.status = status;
  return input;
}

/**
 * Helper method to set metadata on an input object.
 *
 * Metadata can store additional custom information about the portfolio.
 * This can include risk profiles, investment strategies, client preferences,
 * performance metrics, or any other application-specific data.
 *
 * @returns The modified input object for chaining
 *
 * @example
 * ```typescript
 * // Add metadata to a portfolio input
 * const portfolioInput = newCreatePortfolioInput(
 *   "client_12345",
 *   "Growth Portfolio"
 * );
 * const enhancedInput = withMetadata(portfolioInput, {
 *   riskProfile: "aggressive",
 *   investmentStrategy: "growth",
 *   targetReturn: "10%",
 *   assetClasses: ["equities", "alternatives"],
 *   rebalanceFrequency: "quarterly"
 * });
 *
 * // Update a portfolio's metadata
 * const updateInput = newUpdatePortfolioInput();
 * const updateMetadata = withMetadata(updateInput, {
 *   riskProfile: "moderate",
 *   targetReturn: "7%"
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

/**
 * NewUpdatePortfolioInput creates a new empty UpdatePortfolioInput.
 *
 * This initializes an empty update input that can be customized
 * using the With* methods. It's useful as a starting point for
 * building an update request.
 *
 * @returns A new UpdatePortfolioInput object
 *
 * @example
 * ```typescript
 * // Create and customize an update input
 * const updateInput = newUpdatePortfolioInput();
 *
 * // Chain multiple updates together
 * const fullUpdate = withName(
 *   withMetadata(
 *     withStatus(updateInput, StatusCode.ACTIVE),
 *     { riskProfile: "moderate" }
 *   ),
 *   "Balanced Growth Portfolio"
 * );
 * ```
 */
export function newUpdatePortfolioInput(): UpdatePortfolioInput {
  return {};
}

/**
 * Helper method to set name on an UpdatePortfolioInput.
 *
 * This updates the human-readable name of the portfolio.
 * The name should be descriptive and meaningful to users.
 *
 * @returns The modified UpdatePortfolioInput for chaining
 *
 * @example
 * ```typescript
 * // Update just the name of a portfolio
 * const updateInput = newUpdatePortfolioInput();
 * const nameUpdate = withName(
 *   updateInput,
 *   "Long-Term Growth Portfolio"
 * );
 * ```
 */
export function withName(input: UpdatePortfolioInput, name: string): UpdatePortfolioInput {
  input.name = name;
  return input;
}
