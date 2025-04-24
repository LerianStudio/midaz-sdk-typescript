/**
 * @file Organization API client interface
 * @description Defines the interface for organization API operations
 */

import { Address, ListOptions, ListResponse, Status } from '../../models/common';

import { ApiClient } from './api-client';

/**
 * Represents an organization in the system
 */
export interface Organization {
  id: string;
  name: string;
  legalName: string;
  legalDocument: string;
  doingBusinessAs: string;
  parentOrganizationId?: string;
  address?: Address;
  status: Status;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Input for creating an organization
 */
export interface CreateOrganizationInput {
  legalName: string;
  legalDocument: string;
  doingBusinessAs: string;
  parentOrganizationId?: string;
  address?: Address;
  status?: string;
  metadata?: Record<string, any>;
}

/**
 * Input for updating an organization
 */
export interface UpdateOrganizationInput {
  legalName?: string;
  doingBusinessAs?: string;
  parentOrganizationId?: string;
  address?: Address;
  status?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for organization API operations
 *
 * This interface defines the methods for interacting with organization endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface OrganizationApiClient
  extends ApiClient<Organization, CreateOrganizationInput, UpdateOrganizationInput> {
  /**
   * Lists organizations with optional filters
   *
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of organizations
   */
  listOrganizations(options?: ListOptions): Promise<ListResponse<Organization>>;

  /**
   * Gets an organization by ID
   *
   * @param id - Organization ID
   * @returns Promise resolving to the organization
   */
  getOrganization(id: string): Promise<Organization>;

  /**
   * Creates a new organization
   *
   * @param input - Organization creation input
   * @returns Promise resolving to the created organization
   */
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;

  /**
   * Updates an existing organization
   *
   * @param id - Organization ID
   * @param input - Organization update input
   * @returns Promise resolving to the updated organization
   */
  updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization>;

  /**
   * Deletes an organization
   *
   * @param id - Organization ID
   * @returns Promise resolving when the organization is deleted
   */
  deleteOrganization(id: string): Promise<void>;
}
