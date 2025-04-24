/**
 * @file Segment model definitions for the Midaz SDK
 * @description Defines the segment data structures and helper functions for managing segments in the Midaz ledger system
 */

import { Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Segment represents a segment in the Midaz system for more granular organization.
 *
 * Segments allow for further categorization and grouping of accounts or other entities
 * within a ledger, enabling more detailed reporting and management.
 *
 * Segments are commonly used for:
 * - Business unit categorization (e.g., departments, divisions)
 * - Geographic segmentation (e.g., regions, countries)
 * - Product line segmentation (e.g., product categories)
 * - Customer segmentation (e.g., market segments, industries)
 * - Regulatory reporting (e.g., tax jurisdictions, regulatory categories)
 *
 * @example
 * ```typescript
 * // Example of a complete Segment object
 * const segment: Segment = {
 *   id: "seg_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   name: "North America",
 *   ledgerId: "ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   organizationId: "org_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   status: {
 *     code: "ACTIVE",
 *     description: "Segment is active and operational",
 *     timestamp: "2023-09-15T14:30:00Z"
 *   },
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   metadata: {
 *     regionCode: "NA",
 *     countries: ["US", "CA", "MX"],
 *     currency: "USD"
 *   }
 * };
 * ```
 */
export interface Segment {
  /**
   * ID is the unique identifier for the segment
   * System-generated UUID that uniquely identifies this segment
   * across the entire Midaz platform.
   */
  id: string;

  /**
   * Name is the human-readable name of the segment
   * Descriptive name that helps identify the purpose or category of the segment.
   * Examples include "North America", "Enterprise Clients", or "Software Products".
   */
  name: string;

  /**
   * LedgerID is the identifier of the ledger that contains this segment
   * Segments are always created within a specific ledger, which defines
   * the accounting boundaries and rules.
   */
  ledgerId: string;

  /**
   * OrganizationID is the identifier of the organization that owns this segment
   * All segments must belong to an organization, which provides the
   * top-level ownership and access control.
   */
  organizationId: string;

  /**
   * Status represents the current status of the segment (e.g., "ACTIVE", "INACTIVE")
   * Controls whether the segment can be used for new accounts or transactions.
   * Includes a code, optional description, and timestamp of the status change.
   */
  status: Status;

  /**
   * CreatedAt is the timestamp when the segment was created
   * ISO 8601 formatted date-time string.
   * Automatically set by the system and cannot be modified.
   */
  createdAt: string;

  /**
   * UpdatedAt is the timestamp when the segment was last updated
   * ISO 8601 formatted date-time string.
   * Automatically updated by the system whenever the segment is modified.
   */
  updatedAt: string;

  /**
   * DeletedAt is the timestamp when the segment was deleted, if applicable
   * ISO 8601 formatted date-time string.
   * Set when a segment is soft-deleted, allowing for potential recovery.
   */
  deletedAt?: string;

  /**
   * Metadata contains additional custom data associated with the segment
   * Arbitrary key-value pairs for storing application-specific information.
   * Can include region codes, business unit identifiers, reporting categories, etc.
   */
  metadata?: Record<string, any>;
}

/**
 * CreateSegmentInput is the input for creating a segment.
 *
 * This structure contains all the fields that can be specified when creating a new segment.
 * Only fields marked as required must be provided; others are optional and will use system defaults
 * if not specified.
 *
 * @example
 * ```typescript
 * // Create input for a new geographic segment
 * const createInput: CreateSegmentInput = {
 *   name: "North America",
 *   metadata: {
 *     regionCode: "NA",
 *     countries: ["US", "CA", "MX"],
 *     currency: "USD"
 *   }
 * };
 * ```
 */
export interface CreateSegmentInput extends BuildableModel {
  /**
   * Name is the human-readable name for the segment
   * Required field that helps identify the purpose or category of the segment.
   * Should be descriptive and meaningful to users.
   * Maximum length is typically 256 characters.
   */
  name: string;

  /**
   * Status represents the initial status of the segment
   * Optional field that defaults to ACTIVE if not specified.
   * Controls whether the segment can be used for new accounts or transactions.
   */
  status?: StatusCode;

  /**
   * Metadata contains additional custom data for the segment
   * Optional field for storing application-specific information.
   * Can include region codes, business unit identifiers, reporting categories, etc.
   */
  metadata?: Record<string, any>;
}

/**
 * UpdateSegmentInput is the input for updating a segment.
 *
 * This structure contains the fields that can be modified when updating an existing segment.
 * Only fields that are set will be updated; omitted fields will remain unchanged.
 *
 * @example
 * ```typescript
 * // Update an existing segment with new name and metadata
 * const updateInput: UpdateSegmentInput = {
 *   name: "North America Region",
 *   metadata: {
 *     regionCode: "NAR",
 *     countries: ["US", "CA", "MX"],
 *     currency: "USD",
 *     timeZones: ["EST", "CST", "MST", "PST"]
 *   }
 * };
 * ```
 */
export interface UpdateSegmentInput extends BuildableModel {
  /**
   * Name is the updated human-readable name for the segment
   * Optional field that helps identify the purpose or category of the segment.
   * Should be descriptive and meaningful to users.
   * Maximum length is typically 256 characters.
   */
  name?: string;

  /**
   * Status represents the updated status of the segment
   * Optional field that controls whether the segment can be used for new accounts or transactions.
   * Common status changes include activating or deactivating a segment.
   */
  status?: StatusCode;

  /**
   * Metadata contains updated or additional custom data for the segment
   * Optional field for storing application-specific information.
   * If provided, replaces the entire metadata object.
   */
  metadata?: Record<string, any>;
}

/**
 * Segment Builder interface
 * Defines the specific methods available for building segment objects
 */
export interface SegmentBuilder extends Builder<CreateSegmentInput, SegmentBuilder> {
  /**
   * Set the name for the segment
   */
  withName(name: string): SegmentBuilder;
}

/**
 * Segment Builder implementation
 * Implements the SegmentBuilder interface with method chaining
 */
export class SegmentBuilderImpl
  extends ModelBuilder<CreateSegmentInput, SegmentBuilder>
  implements SegmentBuilder
{
  constructor(model: CreateSegmentInput) {
    super(model);
  }

  withName(name: string): SegmentBuilder {
    if (!name) {
      throw new Error('Segment name is required');
    }

    this.model.name = name;
    return this;
  }
}

/**
 * Creates a new segment builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct a segment with a more fluent API.
 *
 * @param name - Human-readable name for the segment
 * @returns A segment builder with method chaining
 *
 * @example
 * ```typescript
 * // Create a segment using method chaining
 * const segmentInput = createSegmentBuilder("North America")
 *   .withMetadata({
 *     regionCode: "NA",
 *     countries: ["US", "CA", "MX"],
 *     currency: "USD"
 *   })
 *   .withStatus(StatusCode.ACTIVE)
 *   .build();
 * ```
 */
export function createSegmentBuilder(name: string): SegmentBuilder {
  // Validate required fields
  if (!name) {
    throw new Error('Segment name is required');
  }

  const input: CreateSegmentInput = {
    name,
  };

  return new SegmentBuilderImpl(input);
}

/**
 * Update Segment Builder interface
 * Defines the specific methods available for building segment update objects
 */
export interface UpdateSegmentBuilder extends Builder<UpdateSegmentInput, UpdateSegmentBuilder> {
  /**
   * Set the name for the segment update
   */
  withName(name: string): UpdateSegmentBuilder;
}

/**
 * Update Segment Builder implementation
 * Implements the UpdateSegmentBuilder interface with method chaining
 */
export class UpdateSegmentBuilderImpl
  extends ModelBuilder<UpdateSegmentInput, UpdateSegmentBuilder>
  implements UpdateSegmentBuilder
{
  constructor(model: UpdateSegmentInput) {
    super(model);
  }

  withName(name: string): UpdateSegmentBuilder {
    if (!name) {
      throw new Error('Segment name is required');
    }

    this.model.name = name;
    return this;
  }
}

/**
 * Creates a new segment update builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct a segment update with a more fluent API.
 *
 * @returns A segment update builder with method chaining
 *
 * @example
 * ```typescript
 * // Create a segment update using method chaining
 * const segmentUpdate = createUpdateSegmentBuilder()
 *   .withName("North America Region")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withMetadata({
 *     regionCode: "NAR",
 *     countries: ["US", "CA", "MX"],
 *     currency: "USD",
 *     timeZones: ["EST", "CST", "MST", "PST"]
 *   })
 *   .build();
 * ```
 */
export function createUpdateSegmentBuilder(): UpdateSegmentBuilder {
  return new UpdateSegmentBuilderImpl({});
}

/**
 * NewCreateSegmentInput creates a new CreateSegmentInput with required fields.
 *
 * This constructor ensures that all mandatory fields are provided when creating a segment input.
 * It sets sensible defaults for optional fields where appropriate.
 *
 * @param name - Human-readable name for the segment
 * @returns A new CreateSegmentInput object with required fields set
 *
 * @example
 * ```typescript
 * // Create a basic segment input
 * const segmentInput = newCreateSegmentInput("North America");
 *
 * // Segment input can be further customized with other helper methods
 * const customizedInput = withMetadata(segmentInput, {
 *   regionCode: "NA",
 *   countries: ["US", "CA", "MX"]
 * });
 * ```
 */
export function newCreateSegmentInput(name: string): CreateSegmentInput {
  return {
    name,
  };
}

/**
 * Helper method to set status on a CreateSegmentInput or UpdateSegmentInput.
 *
 * This sets the initial status of the segment or updates the status of an existing segment.
 * It can be used to create segments in a non-default status or to update the status
 * of existing segments.
 *
 * @param input - CreateSegmentInput or UpdateSegmentInput object to modify
 * @param status - The status to set for the segment
 * @returns The modified input object for chaining
 *
 * @example
 * ```typescript
 * // Create an inactive segment
 * const segmentInput = newCreateSegmentInput("Legacy Region");
 * const inactiveSegment = withStatus(segmentInput, StatusCode.INACTIVE);
 *
 * // Update a segment to active status
 * const updateInput = newUpdateSegmentInput();
 * const activateSegment = withStatus(updateInput, StatusCode.ACTIVE);
 * ```
 */
export function withStatus(
  input: CreateSegmentInput | UpdateSegmentInput,
  status: StatusCode
): CreateSegmentInput | UpdateSegmentInput {
  input.status = status;
  return input;
}

/**
 * Helper method to set metadata on an input object.
 *
 * Metadata can store additional custom information about the segment.
 * This can include region codes, business unit identifiers, reporting categories,
 * or any other application-specific data.
 *
 * @param input - CreateSegmentInput or UpdateSegmentInput object to modify
 * @param metadata - A map of key-value pairs to store as metadata
 * @returns The modified input object for chaining
 *
 * @example
 * ```typescript
 * // Add metadata to a segment input
 * const segmentInput = newCreateSegmentInput("EMEA");
 * const enhancedInput = withMetadata(segmentInput, {
 *   regionCode: "EU",
 *   countries: ["UK", "FR", "DE", "IT", "ES"],
 *   currency: "EUR",
 *   headquarters: "London"
 * });
 *
 * // Update a segment's metadata
 * const updateInput = newUpdateSegmentInput();
 * const updateMetadata = withMetadata(updateInput, {
 *   regionCode: "EMEA",
 *   headquarters: "Paris"
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
 * NewUpdateSegmentInput creates a new empty UpdateSegmentInput.
 *
 * This initializes an empty update input that can be customized
 * using the With* methods. It's useful as a starting point for
 * building an update request.
 *
 * @returns A new UpdateSegmentInput object
 *
 * @example
 * ```typescript
 * // Create and customize an update input
 * const updateInput = newUpdateSegmentInput();
 *
 * // Chain multiple updates together
 * const fullUpdate = withName(
 *   withMetadata(
 *     withStatus(updateInput, StatusCode.ACTIVE),
 *     { regionCode: "APAC", headquarters: "Singapore" }
 *   ),
 *   "Asia-Pacific Region"
 * );
 * ```
 */
export function newUpdateSegmentInput(): UpdateSegmentInput {
  return {};
}

/**
 * Helper method to set name on an UpdateSegmentInput.
 *
 * This updates the human-readable name of the segment.
 * The name should be descriptive and meaningful to users.
 *
 * @param input - UpdateSegmentInput object to modify
 * @param name - The new name for the segment
 * @returns The modified UpdateSegmentInput for chaining
 *
 * @example
 * ```typescript
 * // Update just the name of a segment
 * const updateInput = newUpdateSegmentInput();
 * const nameUpdate = withName(
 *   updateInput,
 *   "Asia-Pacific Region"
 * );
 * ```
 */
export function withName(input: UpdateSegmentInput, name: string): UpdateSegmentInput {
  input.name = name;
  return input;
}
