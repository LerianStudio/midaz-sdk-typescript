/**
 * @file Asset model definitions
 * @description Asset data structures and helper functions
 */

import { ListResponse, Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Represents an asset in a ledger system
 * 
 * Assets are units of value that can be tracked and transferred.
 * Types include currency, security, commodity, cryptocurrency, 
 * and loyalty points.
 * 
 * @example
 * ```typescript
 * const usdAsset: Asset = {
 *   id: "ast_123",
 *   name: "US Dollar",
 *   type: "CURRENCY",
 *   code: "USD",
 *   status: { code: "ACTIVE", timestamp: "2023-09-15T14:30:00Z" },
 *   ledgerId: "ldg_456",
 *   organizationId: "org_789",
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   metadata: { symbol: "$", decimalPlaces: 2 }
 * };
 * ```
 */
export interface Asset {
  /** Unique system-generated identifier */
  id: string;

  /** Human-readable name for the asset (max 256 characters) */
  name: string;

  /** Asset classification (e.g., "currency", "crypto", "commodities") */
  type: string;

  /** Unique identifier code for the asset (e.g., "USD", "BTC", "AAPL") */
  code: string;

  /** Current status determining whether the asset can be used in transactions */
  status: Status;

  /** Ledger ID containing this asset, defining accounting boundaries */
  ledgerId: string;

  /** Organization ID that owns this asset, providing top-level access control */
  organizationId: string;

  /** Creation timestamp (ISO 8601), automatically set by the system */
  createdAt: string;

  /** Last update timestamp (ISO 8601), automatically updated on changes */
  updatedAt: string;

  /** Optional deletion timestamp (ISO 8601) for soft-deleted assets */
  deletedAt?: string;

  /** Optional custom metadata for additional asset information */
  metadata?: Record<string, any>;
}

/**
 * Input data for creating a new asset
 * 
 * @example
 * ```typescript
 * const createUsdInput: CreateAssetInput = {
 *   name: "US Dollar",
 *   code: "USD",
 *   type: "CURRENCY",
 *   metadata: { symbol: "$", decimalPlaces: 2 }
 * };
 * ```
 */
export interface CreateAssetInput extends BuildableModel {
  /** Required human-readable name for the asset (max 256 characters) */
  name: string;

  /** Optional asset classification (defaults to system value if not specified) */
  type?: string;

  /** Required unique identifier code for the asset (e.g., "USD", "BTC") */
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
 * Input data for updating an existing asset
 * 
 * @example
 * ```typescript
 * const updateInput: UpdateAssetInput = {
 *   name: "United States Dollar",
 *   metadata: { symbol: "$", decimalPlaces: 2 }
 * };
 * ```
 */
export interface UpdateAssetInput extends BuildableModel {
  /** Updated human-readable name for the asset (max 256 characters) */
  name?: string;

  /** Updated status code controlling whether the asset can be used */
  status?: StatusCode;

  /** Updated metadata (replaces entire metadata object if specified) */
  metadata?: Record<string, any>;
}

/** Builder interface for constructing asset objects */
export interface AssetBuilder extends Builder<CreateAssetInput, AssetBuilder> {
  /** Set the name for the asset */
  withName(name: string): AssetBuilder;

  /** Set the code for the asset */
  withCode(code: string): AssetBuilder;

  /** Set the type for the asset */
  withType(type: string): AssetBuilder;
}

/** Implementation of the AssetBuilder interface */
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
 * Creates a new asset builder with method chaining
 *
 * @example
 * ```typescript
 * const assetInput = createAssetBuilder("US Dollar", "USD")
 *   .withType("currency")
 *   .withMetadata({ symbol: "$", decimalPlaces: 2 })
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
 * Creates a new asset builder with type field pre-filled
 *
 * @example
 * ```typescript
 * const assetInput = createAssetBuilderWithType("Bitcoin", "BTC", "crypto")
 *   .withMetadata({ symbol: "₿", decimalPlaces: 8 })
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

/** Builder interface for constructing asset update objects */
export interface UpdateAssetBuilder extends Builder<UpdateAssetInput, UpdateAssetBuilder> {
  /** Set the name for the asset update */
  withName(name: string): UpdateAssetBuilder;
}

/** Implementation of the UpdateAssetBuilder interface */
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
 * Creates a new asset update builder with method chaining
 *
 * @example
 * ```typescript
 * const assetUpdate = createUpdateAssetBuilder()
 *   .withName("United States Dollar")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withMetadata({ symbol: "$", decimalPlaces: 2 })
 *   .build();
 * ```
 */
export function createUpdateAssetBuilder(): UpdateAssetBuilder {
  return new UpdateAssetBuilderImpl({});
}

/**
 * Creates a new CreateAssetInput with required fields
 *
 * @example
 * ```typescript
 * const assetInput = newCreateAssetInput("US Dollar", "USD");
 * 
 * // Further customize with helper methods
 * const customizedInput = withMetadata(assetInput, {
 *   symbol: "$", decimalPlaces: 2
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
 * Creates a new asset input with name, code and type
 *
 * @example
 * ```typescript
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
 * Sets the status on a CreateAssetInput
 *
 * @example
 * ```typescript
 * const assetInput = newCreateAssetInput("Test Asset", "TEST");
 * const inactiveAsset = withStatus(assetInput, StatusCode.INACTIVE);
 * ```
 */
export function withStatus(input: CreateAssetInput, status: StatusCode): CreateAssetInput {
  input.status = status;
  return input;
}

/**
 * Sets metadata on an input object
 *
 * @example
 * ```typescript
 * const assetInput = newCreateAssetInput("Euro", "EUR");
 * const enhancedInput = withMetadata(assetInput, {
 *   symbol: "€", decimalPlaces: 2, isoCode: "EUR"
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

/** Creates an empty UpdateAssetInput for building update requests */
export function newUpdateAssetInput(): UpdateAssetInput {
  return {};
}

/** Sets name on an UpdateAssetInput */
export function withName(input: UpdateAssetInput, name: string): UpdateAssetInput {
  input.name = name;
  return input;
}

/** @see asset-rate.ts for asset rates functionality */
