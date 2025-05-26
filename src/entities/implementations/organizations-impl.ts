/**
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
 * @inheritdoc
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
   */
  constructor(
    private readonly apiClient: OrganizationApiClient,
    observability?: Observability
  ) {
    // Initialize observability with service name
    this.observability = observability || Observability.getInstance();
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
