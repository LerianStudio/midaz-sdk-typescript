/**
 * @file Organizations service implementation for the Midaz SDK
 * @description Implements the OrganizationsService interface for managing organizations within the Midaz system
 */

import { OrganizationApiClient } from '../../api/interfaces/organization-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from '../../models/organization';
import { Observability } from '../../util/observability/observability';
import { OrganizationsService } from '../organizations';

/**
 * Implementation of the OrganizationsService interface
 *
 * This class provides the concrete implementation of the OrganizationsService interface,
 * delegating HTTP communication to the provided API client while focusing on business logic.
 * It handles validation, error handling, observability, and pagination.
 *
 * Organizations are the top-level entities in the Midaz system, representing
 * companies, financial institutions, or other business entities. Each organization
 * can contain multiple ledgers, accounts, and other resources.
 *
 * @implements {OrganizationsService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done through dependency injection)
 * const apiClient = new HttpOrganizationApiClient(httpClient, urlBuilder);
 * const organizationsService = new OrganizationsServiceImpl(apiClient);
 *
 * // Using the service to list organizations
 * const organizations = await organizationsService.listOrganizations();
 * ```
 */
export class OrganizationsServiceImpl implements OrganizationsService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new OrganizationsServiceImpl
   *
   * @param apiClient - API client for organization-related operations
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(private readonly apiClient: OrganizationApiClient, observability?: Observability) {
    // Initialize observability with service name
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-organizations-service',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists organizations with optional filters
   *
   * Retrieves a paginated list of organizations. The results can be
   * filtered, sorted, and paginated using the options parameter.
   *
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of organizations
   */
  public async listOrganizations(opts?: ListOptions): Promise<ListResponse<Organization>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listOrganizations');

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to API client
      const result = await this.apiClient.listOrganizations(opts);

      // Record metrics
      this.observability.recordMetric('organizations.list.count', result.items.length);

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Gets an organization by ID
   *
   * Retrieves a single organization by its unique identifier.
   *
   * @param id - Organization ID to retrieve
   * @returns Promise resolving to the organization
   */
  public async getOrganization(id: string): Promise<Organization> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getOrganization');
    span.setAttribute('organizationId', id);

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.getOrganization(id);

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a new organization
   *
   * Creates a new organization using the provided details. The organization
   * will be initialized with the specified properties and assigned a unique
   * identifier.
   *
   * @param input - Organization creation input with required properties
   * @returns Promise resolving to the created organization
   */
  public async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createOrganization');

    // Set attributes for the organization if available
    if (input.legalName) {
      span.setAttribute('legalName', input.legalName);
    }
    if (input.legalDocument) {
      // Don't log the full document for privacy reasons
      span.setAttribute('hasLegalDocument', true);
    }
    if (input.metadata) {
      span.setAttribute('hasMetadata', true);
    }

    try {
      // Delegate to API client
      const result = await this.apiClient.createOrganization(input);

      // Record metrics
      this.observability.recordMetric('organizations.create', 1);

      span.setAttribute('organizationId', result.id);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Updates an existing organization
   *
   * Updates the properties of an existing organization. Only the properties
   * included in the input will be modified; others will remain unchanged.
   *
   * @param id - Organization ID to update
   * @param input - Organization update input with properties to change
   * @returns Promise resolving to the updated organization
   */
  public async updateOrganization(
    id: string,
    input: UpdateOrganizationInput
  ): Promise<Organization> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateOrganization');
    span.setAttribute('organizationId', id);

    // Set attributes for the update if available
    if (input.legalName) {
      span.setAttribute('updatedLegalName', input.legalName);
    }
    if (input.doingBusinessAs) {
      span.setAttribute('updatedDoingBusinessAs', input.doingBusinessAs);
    }
    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }
    if (input.status) {
      span.setAttribute('updatedStatus', input.status);
    }
    if (input.address) {
      span.setAttribute('updatedAddress', true);
    }

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.updateOrganization(id, input);

      // Record metrics
      this.observability.recordMetric('organizations.update', 1, {
        organizationId: id,
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   */
  public async deleteOrganization(id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteOrganization');
    span.setAttribute('organizationId', id);

    try {
      // Delegate to API client (validation happens there)
      await this.apiClient.deleteOrganization(id);

      // Record metrics
      this.observability.recordMetric('organizations.delete', 1, {
        organizationId: id,
      });

      span.setStatus('ok');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
