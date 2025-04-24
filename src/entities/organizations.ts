/**
 * @file Organization service interface for the Midaz SDK
 * @description Defines the interface for managing organizations within the Midaz system
 */

import { ListOptions, ListResponse } from '../models/common';
import {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from '../models/organization';

/**
 * Service for managing organizations in the Midaz system
 *
 * The OrganizationsService provides methods for creating, retrieving, updating, and deleting
 * organizations. Organizations are the top-level entities in the Midaz system hierarchy,
 * containing ledgers, accounts, and other financial entities.
 *
 * Each organization:
 * - Has a unique identifier
 * - Has a legal name and document (e.g., tax ID)
 * - Can contain multiple ledgers
 * - Has a status (active, inactive, etc.)
 * - Can have custom metadata for additional information
 *
 * @example
 * ```typescript
 * // Create a new organization
 * const newOrganization = await midazClient.entities.organizations.createOrganization({
 *   legalName: "Acme Corporation",
 *   legalDocument: "12-3456789"
 * });
 *
 * // List organizations
 * const organizations = await midazClient.entities.organizations.listOrganizations({
 *   limit: 10,
 *   offset: 0
 * });
 * ```
 */
export interface OrganizationsService {
  /**
   * Lists organizations with optional filters
   *
   * Retrieves a paginated list of organizations. The results can be
   * filtered, sorted, and paginated using the options parameter.
   *
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of organizations
   *
   * @example
   * ```typescript
   * // List the first 10 organizations
   * const organizations = await organizationsService.listOrganizations({
   *   limit: 10,
   *   offset: 0
   * });
   *
   * // List organizations with filtering
   * const filteredOrganizations = await organizationsService.listOrganizations({
   *   limit: 20,
   *   filter: {
   *     status: "ACTIVE"
   *   }
   * });
   *
   * // List organizations with sorting
   * const sortedOrganizations = await organizationsService.listOrganizations({
   *   limit: 10,
   *   sort: {
   *     field: "createdAt",
   *     order: "DESC"
   *   }
   * });
   * ```
   */
  listOrganizations(opts?: ListOptions): Promise<ListResponse<Organization>>;

  /**
   * Gets an organization by ID
   *
   * Retrieves a single organization by its unique identifier.
   *
   * @param id - Organization ID to retrieve
   * @returns Promise resolving to the organization
   *
   * @example
   * ```typescript
   * // Get organization details
   * const organization = await organizationsService.getOrganization("org_12345");
   *
   * console.log(`Organization name: ${organization.legalName}`);
   * console.log(`Legal document: ${organization.legalDocument}`);
   * console.log(`Status: ${organization.status.code}`);
   * console.log(`Created at: ${organization.createdAt}`);
   * ```
   */
  getOrganization(id: string): Promise<Organization>;

  /**
   * Creates a new organization
   *
   * Creates a new organization using the provided details. The organization
   * will be initialized with the specified properties and assigned a unique
   * identifier.
   *
   * @param input - Organization creation input with required properties
   * @returns Promise resolving to the created organization
   *
   * @example
   * ```typescript
   * // Create a basic organization
   * const newOrganization = await organizationsService.createOrganization({
   *   legalName: "Acme Corporation",
   *   legalDocument: "12-3456789"
   * });
   *
   * // Create an organization with additional properties
   * const newOrganizationWithDetails = await organizationsService.createOrganization({
   *   legalName: "Tech Innovations Inc.",
   *   legalDocument: "98-7654321",
   *   alias: "tech-innovations",
   *   metadata: {
   *     industry: "Technology",
   *     size: "Enterprise",
   *     region: "North America"
   *   }
   * });
   * ```
   */
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;

  /**
   * Updates an existing organization
   *
   * Updates the properties of an existing organization. Only the properties
   * included in the input will be modified; others will remain unchanged.
   *
   * @param id - Organization ID to update
   * @param input - Organization update input with properties to change
   * @returns Promise resolving to the updated organization
   *
   * @example
   * ```typescript
   * // Update an organization's name
   * const updatedOrganization = await organizationsService.updateOrganization(
   *   "org_12345",
   *   {
   *     legalName: "Acme Corporation Global"
   *   }
   * );
   *
   * // Update multiple properties
   * const updatedOrganization = await organizationsService.updateOrganization(
   *   "org_12345",
   *   {
   *     legalName: "Acme Corporation Global",
   *     status: "INACTIVE",
   *     metadata: {
   *       industry: "Conglomerate",
   *       size: "Enterprise",
   *       region: "Global"
   *     }
   *   }
   * );
   * ```
   */
  updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization>;

  /**
   * Deletes an organization
   *
   * Deletes an organization. This operation may be restricted if the organization
   * has associated ledgers, accounts, or other entities. In many cases, organizations
   * are soft-deleted (marked as deleted but retained in the system) to maintain
   * audit history.
   *
   * @param id - Organization ID to delete
   * @returns Promise that resolves when the organization is deleted
   *
   * @example
   * ```typescript
   * // Delete an organization
   * await organizationsService.deleteOrganization("org_12345");
   *
   * // Attempt to retrieve the deleted organization (will throw an error)
   * try {
   *   const organization = await organizationsService.getOrganization("org_12345");
   * } catch (error) {
   *   console.error("Organization not found or has been deleted");
   * }
   * ```
   */
  deleteOrganization(id: string): Promise<void>;
}
