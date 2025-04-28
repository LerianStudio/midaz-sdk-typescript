/**
 * @file Asset model definitions for the Midaz SDK
 * @description Defines the asset data structures and helper functions for managing assets in the Midaz ledger system
 */

import { Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Asset represents an asset in the Midaz Ledger.
 *
 * Assets are the fundamental units of value that can be tracked and transferred
 * within the ledger system. Each asset has a unique code and belongs to a specific
 * organization and ledger.
 *
 * Asset Types:
 *   - CURRENCY: Represents fiat currencies like USD, EUR, JPY
 *   - SECURITY: Represents financial instruments like stocks, bonds, derivatives
 *   - COMMODITY: Represents physical goods like gold, oil, agricultural products
 *   - CRYPTOCURRENCY: Represents digital currencies like BTC, ETH
 *   - LOYALTY: Represents loyalty points or rewards
 *   - CUSTOM: Represents user-defined asset types
 *
 * Asset Statuses:
 *   - ACTIVE: The asset is in use and can participate in transactions
 *   - INACTIVE: The asset is temporarily not in use but can be reactivated
 *   - DEPRECATED: The asset is being phased out but still supports existing transactions
 *
 * @example
 * ```typescript
 * // Example of a complete Asset object
 * const usdAsset: Asset = {
 *   id: "ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   name: "US Dollar",
 *   type: "CURRENCY",
 *   code: "USD",
 *   status: {
 *     code: "ACTIVE",
 *     description: "Active and available for use",
 *     timestamp: "2023-09-15T14:30:00Z"
 *   },
 *   ledgerId: "ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   organizationId: "org_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   metadata: {
 *     symbol: "$",
 *     decimalPlaces: 2,
 *     isoCode: "USD"
 *   }
 * };
 * ```
 */
export interface Asset {
  /**
   * ID is the unique identifier for the asset
   * This is a system-generated UUID that uniquely identifies the asset
   * across the entire Midaz platform.
   */
  id: string;

  /**
   * Name is the human-readable name of the asset
   * This should be descriptive and meaningful to users, with a maximum
   * length of 256 characters (e.g., "US Dollar", "Apple Inc. Stock").
   */
  name: string;

  /**
   * Type defines the asset type (e.g., "CURRENCY", "SECURITY", "COMMODITY")
   * Must be one of: "currency", "crypto", "commodities", "others"
   * The type categorizes the asset and may affect how it behaves in
   * certain operations or reports.
   */
  type: string;

  /**
   * Code is a unique identifier for the asset type (e.g., "USD", "BTC", "AAPL")
   * This is typically a short, recognizable string that follows standard
   * conventions where applicable (e.g., ISO 4217 for currencies).
   */
  code: string;

  /**
   * Status represents the current status of the asset (e.g., "ACTIVE", "INACTIVE")
   * The status determines whether the asset can be used in new transactions.
   */
  status: Status;

  /**
   * LedgerID is the ID of the ledger that contains this asset
   * Assets are always created within a specific ledger, which defines
   * the accounting boundaries and rules.
   */
  ledgerId: string;

  /**
   * OrganizationID is the ID of the organization that owns this asset
   * All assets must belong to an organization, which provides the
   * top-level ownership and access control.
   */
  organizationId: string;

  /**
   * CreatedAt is the timestamp when the asset was created
   * This is automatically set by the system and cannot be modified.
   */
  createdAt: string;

  /**
   * UpdatedAt is the timestamp when the asset was last updated
   * This is automatically updated by the system whenever the asset is modified.
   */
  updatedAt: string;

  /**
   * DeletedAt is the timestamp when the asset was deleted, if applicable
   * This is set when an asset is soft-deleted, allowing for potential recovery.
   */
  deletedAt?: string;

  /**
   * Metadata contains additional custom data associated with the asset
   * This can include any arbitrary key-value pairs for application-specific
   * data that doesn't fit into the standard asset fields, such as:
   * - For currencies: symbol, decimal places, ISO code
   * - For securities: exchange, sector, ISIN, CUSIP
   * - For commodities: unit of measure, grade, origin
   */
  metadata?: Record<string, any>;
}

/**
 * CreateAssetInput is the input for creating an asset.
 *
 * This structure contains all the fields that can be specified when creating a new asset.
 * Only fields marked as required must be provided; others are optional and will use
 * system defaults if not specified.
 *
 * @example
 * ```typescript
 * // Create input for a new USD currency asset
 * const createUsdInput: CreateAssetInput = {
 *   name: "US Dollar",
 *   code: "USD",
 *   type: "CURRENCY",
 *   metadata: {
 *     symbol: "$",
 *     decimalPlaces: 2
 *   }
 * };
 * ```
 */
export interface CreateAssetInput extends BuildableModel {
  /**
   * Name is the human-readable name for the asset
   * Required field with a maximum length of 256 characters
   */
  name: string;

  /**
   * Type defines the asset type (e.g., "CURRENCY", "SECURITY", "COMMODITY")
   * Optional field that defaults to a system-defined value if not specified
   * Must be one of: "currency", "crypto", "commodities", "others"
   * The type categorizes the asset and may affect how it behaves in
   * certain operations or reports.
   */
  type?: string;

  /**
   * Code is a unique identifier for the asset type (e.g., "USD", "BTC", "AAPL")
   * Required field that must be unique within the organization
   * This is typically a short, recognizable string that follows standard
   * conventions where applicable (e.g., ISO 4217 for currencies).
   */
  code: string;

  /**
   * Status represents the initial status of the asset
   * Optional field that defaults to ACTIVE if not specified
   */
  status?: StatusCode;

  /**
   * Metadata contains additional custom data for the asset
   * Optional field for storing application-specific data
   */
  metadata?: Record<string, any>;
}

/**
 * UpdateAssetInput is the input for updating an asset.
 *
 * This structure contains the fields that can be modified when updating an existing asset.
 * Only fields that are set will be updated; omitted fields will remain unchanged.
 * Some fields (like code and type) cannot be changed after asset creation.
 *
 * @example
 * ```typescript
 * // Update an existing asset with new name and metadata
 * const updateInput: UpdateAssetInput = {
 *   name: "United States Dollar",
 *   metadata: {
 *     symbol: "$",
 *     decimalPlaces: 2,
 *     countryCode: "US"
 *   }
 * };
 * ```
 */
export interface UpdateAssetInput extends BuildableModel {
  /**
   * Name is the updated human-readable name for the asset
   * Optional field with a maximum length of 256 characters
   */
  name?: string;

  /**
   * Status is the updated status of the asset
   * Optional field that controls whether the asset can be used in new transactions
   */
  status?: StatusCode;

  /**
   * Metadata contains updated additional custom data
   * Optional field that replaces the entire metadata object if specified
   */
  metadata?: Record<string, any>;
}

/**
 * Asset Builder interface
 * Defines the specific methods available for building asset objects
 */
export interface AssetBuilder extends Builder<CreateAssetInput, AssetBuilder> {
  /**
   * Set the name for the asset
   */
  withName(name: string): AssetBuilder;

  /**
   * Set the code for the asset
   */
  withCode(code: string): AssetBuilder;

  /**
   * Set the type for the asset
   */
  withType(type: string): AssetBuilder;
}

/**
 * Asset Builder implementation
 * Implements the AssetBuilder interface with method chaining
 */
export class AssetBuilderImpl
  extends ModelBuilder<CreateAssetInput, AssetBuilder>
  implements AssetBuilder
{
  constructor(model: CreateAssetInput) {
    super(model);
  }

  withName(name: string): AssetBuilder {
    if (!name) {
      throw new Error('Asset name is required');
    }

    this.model.name = name;
    return this;
  }

  withCode(code: string): AssetBuilder {
    if (!code) {
      throw new Error('Asset code is required');
    }

    this.model.code = code;
    return this;
  }

  withType(type: string): AssetBuilder {
    if (!type) {
      throw new Error('Asset type is required');
    }

    this.model.type = type;
    return this;
  }
}

/**
 * Creates a new asset builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an asset with a more fluent API.
 *
 * @param name - Human-readable name for the asset
 * @param code - Unique code identifying the asset type
 * @returns An asset builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an asset using method chaining
 * const assetInput = createAssetBuilder("US Dollar", "USD")
 *   .withType("currency")
 *   .withMetadata({
 *     symbol: "$",
 *     decimalPlaces: 2,
 *     isoCode: "USD"
 *   })
 *   .withStatus(StatusCode.ACTIVE)
 *   .build();
 * ```
 */
export function createAssetBuilder(name: string, code: string): AssetBuilder {
  // Validate required fields
  if (!name) {
    throw new Error('Asset name is required');
  }

  if (!code) {
    throw new Error('Asset code is required');
  }

  const input: CreateAssetInput = {
    name,
    code,
  };

  return new AssetBuilderImpl(input);
}

/**
 * Creates a new asset builder with type.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an asset with a more fluent API, including the type field.
 *
 * @param name - Human-readable name for the asset
 * @param code - Unique code identifying the asset type
 * @param type - The type for the asset
 * @returns An asset builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an asset using method chaining with type
 * const assetInput = createAssetBuilderWithType("Bitcoin", "BTC", "crypto")
 *   .withMetadata({
 *     symbol: "₿",
 *     decimalPlaces: 8,
 *     network: "mainnet"
 *   })
 *   .withStatus(StatusCode.ACTIVE)
 *   .build();
 * ```
 */
export function createAssetBuilderWithType(name: string, code: string, type: string): AssetBuilder {
  // Validate required fields
  if (!name) {
    throw new Error('Asset name is required');
  }

  if (!code) {
    throw new Error('Asset code is required');
  }

  if (!type) {
    throw new Error('Asset type is required');
  }

  const input: CreateAssetInput = {
    name,
    code,
    type,
  };

  return new AssetBuilderImpl(input);
}

/**
 * Update Asset Builder interface
 * Defines the specific methods available for building asset update objects
 */
export interface UpdateAssetBuilder extends Builder<UpdateAssetInput, UpdateAssetBuilder> {
  /**
   * Set the name for the asset update
   */
  withName(name: string): UpdateAssetBuilder;
}

/**
 * Update Asset Builder implementation
 * Implements the UpdateAssetBuilder interface with method chaining
 */
export class UpdateAssetBuilderImpl
  extends ModelBuilder<UpdateAssetInput, UpdateAssetBuilder>
  implements UpdateAssetBuilder
{
  constructor(model: UpdateAssetInput) {
    super(model);
  }

  withName(name: string): UpdateAssetBuilder {
    if (!name) {
      throw new Error('Asset name is required');
    }

    this.model.name = name;
    return this;
  }
}

/**
 * Creates a new asset update builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an asset update with a more fluent API.
 *
 * @returns An asset update builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an asset update using method chaining
 * const assetUpdate = createUpdateAssetBuilder()
 *   .withName("United States Dollar")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withMetadata({
 *     symbol: "$",
 *     decimalPlaces: 2,
 *     countryCode: "US"
 *   })
 *   .build();
 * ```
 */
export function createUpdateAssetBuilder(): UpdateAssetBuilder {
  return new UpdateAssetBuilderImpl({});
}

/**
 * NewCreateAssetInput creates a new CreateAssetInput with required fields.
 *
 * This constructor ensures that all mandatory fields are provided when creating an asset input.
 * It sets sensible defaults for optional fields where appropriate.
 *
 * @param name - Human-readable name for the asset
 * @param code - Unique code identifying the asset type
 * @returns A new CreateAssetInput object with required fields set
 *
 * @example
 * ```typescript
 * // Create input for a basic asset
 * const assetInput = newCreateAssetInput("US Dollar", "USD");
 *
 * // Asset input can be further customized with other helper methods
 * const customizedInput = withMetadata(assetInput, {
 *   symbol: "$",
 *   decimalPlaces: 2
 * });
 * ```
 */
export function newCreateAssetInput(name: string, code: string): CreateAssetInput {
  return {
    name,
    code,
  };
}

/**
 * Creates a new asset input with type.
 *
 * The asset type categorizes the asset (e.g., "CURRENCY", "SECURITY", "COMMODITY").
 * This constructor creates an asset input with both required fields and a type.
 *
 * @param name - Human-readable name for the asset
 * @param code - Unique code identifying the asset type
 * @param assetType - The type to set for the asset
 * @returns A new CreateAssetInput with type
 *
 * @example
 * ```typescript
 * // Create input for a cryptocurrency asset
 * const btcInput = newCreateAssetInputWithType(
 *   "Bitcoin",
 *   "BTC",
 *   "CRYPTOCURRENCY"
 * );
 * ```
 */
export function newCreateAssetInputWithType(
  name: string,
  code: string,
  assetType: string
): CreateAssetInput {
  return {
    name,
    code,
    type: assetType,
  };
}

/**
 * Helper method to set status on a CreateAssetInput.
 *
 * This sets the initial status of the asset and is useful for creating assets
 * in a non-default status (the default is typically ACTIVE).
 *
 * @param input - CreateAssetInput object to modify
 * @param status - The status to set for the asset
 * @returns The modified CreateAssetInput for chaining
 *
 * @example
 * ```typescript
 * // Create an inactive asset
 * const assetInput = newCreateAssetInput("Test Asset", "TEST");
 * const inactiveAsset = withStatus(assetInput, StatusCode.INACTIVE);
 * ```
 */
export function withStatus(input: CreateAssetInput, status: StatusCode): CreateAssetInput {
  input.status = status;
  return input;
}

/**
 * Helper method to set metadata on an input object.
 *
 * Metadata can store additional custom information about the asset.
 * This method works with both CreateAssetInput and UpdateAssetInput objects.
 *
 * @param input - CreateAssetInput or UpdateAssetInput object to modify
 * @param metadata - A map of key-value pairs to store as metadata
 * @returns The modified input object for chaining
 *
 * @example
 * ```typescript
 * // Add metadata to an asset input
 * const assetInput = newCreateAssetInput("Euro", "EUR");
 * const enhancedInput = withMetadata(assetInput, {
 *   symbol: "€",
 *   decimalPlaces: 2,
 *   isoCode: "EUR",
 *   countries: ["Germany", "France", "Italy", "Spain"]
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
 * Creates a new empty UpdateAssetInput.
 *
 * This initializes an empty update input that can be customized
 * using other helper methods. It's useful as a starting point for
 * building an update request.
 *
 * @returns A new UpdateAssetInput object
 *
 * @example
 * ```typescript
 * // Create and customize an update input
 * const updateInput = newUpdateAssetInput();
 * const customizedUpdate = withName(
 *   withMetadata(updateInput, { isRestricted: true }),
 *   "Restricted Asset"
 * );
 * ```
 */
export function newUpdateAssetInput(): UpdateAssetInput {
  return {};
}

/**
 * Helper method to set name on an UpdateAssetInput.
 *
 * This updates the human-readable name of the asset.
 *
 * @param input - UpdateAssetInput object to modify
 * @param name - The new name for the asset
 * @returns The modified UpdateAssetInput for chaining
 *
 * @example
 * ```typescript
 * // Update just the name of an asset
 * const updateInput = newUpdateAssetInput();
 * const nameUpdate = withName(updateInput, "Renamed Asset");
 * ```
 */
export function withName(input: UpdateAssetInput, name: string): UpdateAssetInput {
  input.name = name;
  return input;
}

/**
 * Asset rates have been moved to asset-rate.ts for better organization.
 * @see asset-rate.ts
 */
