/**
 * @file Organization model definitions for the Midaz SDK
 * @description Defines the organization data structures and helper functions for managing organizations in the Midaz ledger system
 */

import { Address, Status, StatusCode } from './common';
import { BuildableModel, Builder, ModelBuilder } from './common-helpers';

/**
 * Create Organization Input
 * Defines the input parameters for creating a new organization
 */
export interface CreateOrganizationInput extends BuildableModel {
  legalName: string;
  legalDocument: string;
  doingBusinessAs: string;
  address?: Address;
  parentOrganizationId?: string;
}

/**
 * Update Organization Input
 * Defines the input parameters for updating an existing organization
 */
export interface UpdateOrganizationInput extends BuildableModel {
  legalName?: string;
  doingBusinessAs?: string;
  address?: Address;
  parentOrganizationId?: string;
}

/**
 * Organization model
 *
 * Organizations are the top-level entities in the Midaz system and represent
 * legal entities like companies, institutions, or other business entities.
 */
export interface Organization {
  /**
   * Unique identifier for the organization
   */
  id: string;

  /**
   * Official registered name of the organization
   */
  legalName: string;

  /**
   * Official identification document (e.g., tax ID, registration number)
   */
  legalDocument: string;

  /**
   * Trading or brand name of the organization
   */
  doingBusinessAs: string;

  /**
   * Physical address of the organization
   */
  address?: Address;

  /**
   * Parent organization ID (if this is a subsidiary)
   */
  parentOrganizationId?: string;

  /**
   * Current status of the organization
   */
  status: Status;

  /**
   * Additional metadata about the organization
   */
  metadata?: Record<string, any>;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;

  /**
   * Deletion timestamp, if applicable
   */
  deletedAt?: string;
}

/**
 * Organization Builder interface
 * Defines the specific methods available for building organization objects
 */
export interface OrganizationBuilder extends Builder<CreateOrganizationInput, OrganizationBuilder> {
  withAddress(address: Address): OrganizationBuilder;
  withParentOrganizationId(parentId: string): OrganizationBuilder;
  withLegalName(legalName: string): OrganizationBuilder;
  withLegalDocument(legalDocument: string): OrganizationBuilder;
  withDoingBusinessAs(doingBusinessAs: string): OrganizationBuilder;
}

/**
 * Organization Builder implementation
 * Implements the OrganizationBuilder interface with method chaining
 */
export class OrganizationBuilderImpl
  extends ModelBuilder<CreateOrganizationInput, OrganizationBuilder>
  implements OrganizationBuilder
{
  constructor(model: CreateOrganizationInput) {
    super(model);
  }

  withAddress(address: Address): OrganizationBuilder {
    this.model.address = address;
    return this;
  }

  withParentOrganizationId(parentId: string): OrganizationBuilder {
    this.model.parentOrganizationId = parentId;
    return this;
  }

  withLegalName(legalName: string): OrganizationBuilder {
    this.model.legalName = legalName;
    return this;
  }

  withLegalDocument(legalDocument: string): OrganizationBuilder {
    this.model.legalDocument = legalDocument;
    return this;
  }

  withDoingBusinessAs(doingBusinessAs: string): OrganizationBuilder {
    this.model.doingBusinessAs = doingBusinessAs;
    return this;
  }
}

/**
 * Creates a new organization builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an organization with a more fluent API.
 *
 * @param legalName - Official registered name of the organization
 * @param legalDocument - Official identification document (e.g., tax ID, registration number)
 * @param doingBusinessAs - Trading or brand name of the organization
 * @returns An organization builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an organization using method chaining
 * const organization = createOrganizationBuilder("Acme Corporation", "123456789", "Acme")
 *   .withAddress({
 *     line1: "123 Main Street",
 *     city: "San Francisco",
 *     state: "CA",
 *     zipCode: "94105",
 *     country: "US"
 *   })
 *   .withMetadata({
 *     industry: "Technology",
 *     employeeCount: 250
 *   })
 *   .build();
 * ```
 */
export function createOrganizationBuilder(
  legalName: string,
  legalDocument: string,
  doingBusinessAs: string,
  address?: Address
): OrganizationBuilder {
  const input: CreateOrganizationInput = {
    legalName,
    legalDocument,
    doingBusinessAs,
  };

  if (address) {
    input.address = address;
  }

  return new OrganizationBuilderImpl(input);
}

// Removed old functional helper

// Removed old functional helper

// Removed old functional helper

// Removed old functional helper

// Removed old functional builder method

/**
 * Organization Update Builder interface
 * Defines the specific methods available for building organization update objects
 */
export interface UpdateOrganizationBuilder
  extends Builder<UpdateOrganizationInput, UpdateOrganizationBuilder> {
  withAddress(address: Address): UpdateOrganizationBuilder;
  withParentOrganizationId(parentId: string): UpdateOrganizationBuilder;
  withLegalName(legalName: string): UpdateOrganizationBuilder;
  withDoingBusinessAs(doingBusinessAs: string): UpdateOrganizationBuilder;
}

/**
 * Organization Update Builder implementation
 * Implements the UpdateOrganizationBuilder interface with method chaining
 */
export class UpdateOrganizationBuilderImpl
  extends ModelBuilder<UpdateOrganizationInput, UpdateOrganizationBuilder>
  implements UpdateOrganizationBuilder
{
  constructor(model: UpdateOrganizationInput) {
    super(model);
  }

  withAddress(address: Address): UpdateOrganizationBuilder {
    this.model.address = address;
    return this;
  }

  withParentOrganizationId(parentId: string): UpdateOrganizationBuilder {
    this.model.parentOrganizationId = parentId;
    return this;
  }

  withLegalName(legalName: string): UpdateOrganizationBuilder {
    this.model.legalName = legalName;
    return this;
  }

  withDoingBusinessAs(doingBusinessAs: string): UpdateOrganizationBuilder {
    this.model.doingBusinessAs = doingBusinessAs;
    return this;
  }
}

/**
 * Creates a new organization update builder with method chaining.
 *
 * This factory function creates a builder that allows you to use method chaining
 * to construct an organization update request with a more fluent API.
 *
 * @returns An organization update builder with method chaining
 *
 * @example
 * ```typescript
 * // Create an organization update using method chaining
 * const updateRequest = createUpdateOrganizationBuilder()
 *   .withLegalName("Acme Global Corporation")
 *   .withDoingBusinessAs("Acme Global")
 *   .withStatus(StatusCode.ACTIVE)
 *   .withAddress({
 *     line1: "456 Market Street",
 *     city: "San Francisco",
 *     state: "CA",
 *     zipCode: "94105",
 *     country: "US"
 *   })
 *   .withMetadata({
 *     industry: "Technology",
 *     employeeCount: 300,
 *     website: "https://acme-global.com"
 *   })
 *   .build();
 * ```
 */
export function createUpdateOrganizationBuilder(): UpdateOrganizationBuilder {
  return new UpdateOrganizationBuilderImpl({});
}

// Removed old functional helper

// Removed old functional helper
