/**
 * Asset model definitions
 */

import { Status, StatusCode } from './common';
import { Builder, ModelBuilder } from './common-helpers';

/**
 * Represents an asset in a ledger system
 */
export interface Asset {
  /** Unique system-generated identifier */
  id: string;

  /** Human-readable name for the asset */
  name: string;

  /** Asset classification */
  type: string;

  /** Unique identifier code for the asset */
  code: string;

  /** Current status determining whether the asset can be used in transactions */
  status: Status;

  /** Ledger ID containing this asset */
  ledgerId: string;

  /** Organization ID that owns this asset */
  organizationId: string;

  /** Timestamp when the asset was created */
  createdAt: string;

  /** Timestamp when the asset was last updated */
  updatedAt: string;

  /** Custom metadata fields for the asset */
  metadata?: Record<string, any>;
}

/**
 * Input data for creating a new asset
 */
export interface CreateAssetInput {
  /** Human-readable name for the asset */
  name: string;

  /** Asset classification */
  type?: string;

  /** Unique identifier code for the asset */
  code: string;

  /** Initial status code for the asset */
  status?: StatusCode;

  /** Custom metadata fields for the asset */
  metadata?: Record<string, any>;
}

/**
 * Input data for updating an existing asset
 */
export interface UpdateAssetInput {
  /** Updated human-readable name for the asset */
  name?: string;

  /** Updated status code for the asset */
  status?: StatusCode;

  /** Updated custom metadata fields for the asset */
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
  implements AssetBuilder {
  constructor(model: CreateAssetInput) {
    super(model);
  }

  withName(name: string): AssetBuilder {
    this.model.name = name;
    return this;
  }

  withCode(code: string): AssetBuilder {
    this.model.code = code;
    return this;
  }

  withType(type: string): AssetBuilder {
    this.model.type = type;
    return this;
  }
}

/**
 * Creates a new asset builder with method chaining
 */
export function createAssetBuilder(name: string, code: string): AssetBuilder {
  const model: CreateAssetInput = {
    name,
    code,
  };
  return new AssetBuilderImpl(model);
}

/**
 * Creates a new asset builder with type field pre-filled
 */
export function createAssetBuilderWithType(
  name: string,
  code: string,
  type: string
): AssetBuilder {
  const model: CreateAssetInput = {
    name,
    code,
    type,
  };
  return new AssetBuilderImpl(model);
}

/** Builder interface for constructing asset update objects */
export interface UpdateAssetBuilder extends Builder<UpdateAssetInput, UpdateAssetBuilder> {
  /** Set the name for the asset update */
  withName(name: string): UpdateAssetBuilder;
}

/** Implementation of the UpdateAssetBuilder interface */
export class UpdateAssetBuilderImpl
  extends ModelBuilder<UpdateAssetInput, UpdateAssetBuilder>
  implements UpdateAssetBuilder {
  constructor(model: UpdateAssetInput) {
    super(model);
  }

  withName(name: string): UpdateAssetBuilder {
    this.model.name = name;
    return this;
  }
}

/**
 * Creates a new asset update builder with method chaining
 */
export function createUpdateAssetBuilder(): UpdateAssetBuilder {
  const model: UpdateAssetInput = {};
  return new UpdateAssetBuilderImpl(model);
}

/**
 * Creates a new CreateAssetInput with required fields
 * @deprecated Use createAssetBuilder instead
 */
export function newCreateAssetInput(name: string, code: string): CreateAssetInput {
  return { name, code };
}

/**
 * Creates a new asset input with name, code and type
 * @deprecated Use createAssetBuilderWithType instead
 */
export function newCreateAssetInputWithType(
  name: string,
  code: string,
  assetType: string
): CreateAssetInput {
  return { name, code, type: assetType };
}

/**
 * Sets the status on a CreateAssetInput
 */
export function withStatus<T extends { status?: StatusCode }>(
  input: T,
  status: StatusCode
): T {
  input.status = status;
  return input;
}

/**
 * Sets metadata on an input object
 */
export function withMetadata<T extends { metadata?: Record<string, any> }>(
  input: T,
  metadata: Record<string, any>
): T {
  input.metadata = metadata;
  return input;
}

/**
 * Creates an empty UpdateAssetInput for building update requests
 */
export function newUpdateAssetInput(): UpdateAssetInput {
  return {};
}

/**
 * Sets name on an UpdateAssetInput
 */
export function withName(input: UpdateAssetInput, name: string): UpdateAssetInput {
  input.name = name;
  return input;
}
