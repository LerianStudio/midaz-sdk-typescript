/**
 * @file HTTP implementation of organization API client
 * @description Implements the organization API client interface using HTTP
 */

import { ListOptions, ListResponse } from '../../models/common';
import {
  validateCreateOrganizationInput,
  validateUpdateOrganizationInput,
} from '../../models/validators/organization-validator';
import { MidazError, newNetworkError } from '../../util';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import {
  CreateOrganizationInput,
  Organization,
  OrganizationApiClient,
  UpdateOrganizationInput,
} from '../interfaces/organization-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the OrganizationApiClient interface
 *
 * This class handles HTTP communication with organization endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpOrganizationApiClient implements OrganizationApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpOrganizationApiClient
   *
   * @param httpClient - HTTP client for making API requests
   * @param urlBuilder - URL builder for constructing endpoint URLs
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly urlBuilder: UrlBuilder,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-organization-api-client',
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
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of organizations
   */
  public async listOrganizations(options?: ListOptions): Promise<ListResponse<Organization>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listOrganizations');

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('offset', options.offset || 0);
      if (options.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Build the URL and make the request
      const url = this.urlBuilder.buildOrganizationUrl();
      const result = await this.httpClient.get<ListResponse<Organization>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('organizations.list.count', result.items.length);

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
   * @param id - Organization ID
   * @returns Promise resolving to the organization
   */
  public async getOrganization(id: string): Promise<Organization> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getOrganization');
    span.setAttribute('organizationId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildOrganizationUrl(id);
      const result = await this.httpClient.get<Organization>(url);

      // Record metrics
      this.recordMetrics('organizations.get', 1, {
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
   * Creates a new organization
   *
   * @param input - Organization creation input
   * @returns Promise resolving to the created organization
   */
  public async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createOrganization');

    // Set attributes for the organization
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
      // Validate input
      validate(input, validateCreateOrganizationInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildOrganizationUrl();
      const result = await this.httpClient.post<Organization>(url, input);

      // Record metrics
      this.recordMetrics('organizations.create', 1);

      span.setAttribute('organizationId', result.id);
      span.setStatus('ok');
      return result;
    } catch (error) {
      if (error instanceof MidazError) {
        span.recordException(error);
        span.setStatus('error', error.message);
        throw error;
      }

      const networkError = newNetworkError('Failed to create organization', {
        operation: 'createOrganization',
        cause: error instanceof Error ? error : new Error(String(error)),
      });

      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw networkError;
    } finally {
      span.end();
    }
  }

  /**
   * Updates an existing organization
   *
   * @param id - Organization ID
   * @param input - Organization update input
   * @returns Promise resolving to the updated organization
   */
  public async updateOrganization(
    id: string,
    input: UpdateOrganizationInput
  ): Promise<Organization> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateOrganization');
    span.setAttribute('organizationId', id);

    // Set attributes for the update
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
      // Validate required parameters
      this.validateRequiredParams(span, { id });

      // Validate input
      validate(input, validateUpdateOrganizationInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildOrganizationUrl(id);
      const result = await this.httpClient.patch<Organization>(url, input);

      // Record metrics
      this.recordMetrics('organizations.update', 1, {
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
   * @param id - Organization ID
   * @returns Promise resolving when the organization is deleted
   */
  public async deleteOrganization(id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteOrganization');
    span.setAttribute('organizationId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildOrganizationUrl(id);
      await this.httpClient.delete(url);

      // Record metrics
      this.recordMetrics('organizations.delete', 1, {
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

  /**
   * Validates required parameters and throws an error if any are missing
   *
   * @param span - The current tracing span
   * @param params - The parameters to validate
   * @private
   */
  private validateRequiredParams(span: Span, params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        const error = new Error(`${key} is required`);
        span.recordException(error);
        throw error;
      }
    }
  }

  /**
   * Records metrics for an operation
   *
   * @param name - Metric name
   * @param value - Metric value
   * @param tags - Metric tags
   * @private
   */
  private recordMetrics(name: string, value: number, tags?: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags || {});
  }
}
