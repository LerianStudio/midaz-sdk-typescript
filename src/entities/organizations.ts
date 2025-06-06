/**
 * Organization service interface - Defines the interface for managing organizations
 */

import { ListOptions, ListResponse } from '../models/common';
import {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from '../models/organization';

/**
 * Service for managing organizations
 *
 * Organizations are the top-level entities in the system hierarchy,
 * containing ledgers, accounts, and other financial entities.
 *
 * @example
 * ```typescript
 * // Create a new organization
 * const newOrganization = await midazClient.entities.organizations.createOrganization({
 *   legalName: "Acme Corporation",
 *   legalDocument: "12-3456789"
 * });
 * ```
 */
export interface OrganizationsService {
  /**
   * Lists organizations with optional filters
   *
   * @returns Promise resolving to a paginated list of organizations
   */
  listOrganizations(opts?: ListOptions): Promise<ListResponse<Organization>>;

  /**
   * Gets an organization by ID
   *
   * @returns Promise resolving to the organization
   */
  getOrganization(id: string): Promise<Organization>;

  /**
   * Creates a new organization
   *
   * @returns Promise resolving to the created organization
   */
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;

  /**
   * Updates an existing organization
   *
   * @returns Promise resolving to the updated organization
   */
  updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization>;

  /**
   * Deletes an organization
   *
   * @returns Promise that resolves when the organization is deleted
   */
  deleteOrganization(id: string): Promise<void>;
}
