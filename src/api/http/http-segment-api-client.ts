/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import {
  validateCreateSegmentInput,
  validateUpdateSegmentInput,
} from '../../models/validators/segment-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import {
  CreateSegmentInput,
  Segment,
  SegmentApiClient,
  UpdateSegmentInput,
} from '../interfaces/segment-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the SegmentApiClient interface
 *
 * This class handles HTTP communication with segment endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpSegmentApiClient implements SegmentApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpSegmentApiClient
   *
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
        serviceName: 'midaz-segment-api-client',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists segments for a ledger with optional filters
   *
   * @returns Promise resolving to a paginated list of segments
   */
  public async listSegments(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Segment>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listSegments');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('offset', options.offset || 0);
      if (options.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId });

      // Build the URL and make the request
      const url = this.urlBuilder.buildSegmentUrl(orgId, ledgerId);
      const result = await this.httpClient.get<ListResponse<Segment>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('segments.list.count', result.items.length, {
        orgId,
        ledgerId,
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
   * Gets a segment by ID
   *
   * @returns Promise resolving to the segment
   */
  public async getSegment(orgId: string, ledgerId: string, id: string): Promise<Segment> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildSegmentUrl(orgId, ledgerId)}/${id}`;
      const result = await this.httpClient.get<Segment>(url);

      // Record metrics
      this.recordMetrics('segments.get', 1, {
        orgId,
        ledgerId,
        segmentId: id,
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
   * Creates a new segment
   *
   * @returns Promise resolving to the created segment
   */
  public async createSegment(
    orgId: string,
    ledgerId: string,
    input: CreateSegmentInput
  ): Promise<Segment> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentName', input.name);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId });

      // Validate input
      validate(input, validateCreateSegmentInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildSegmentUrl(orgId, ledgerId);
      const result = await this.httpClient.post<Segment>(url, input);

      // Record metrics
      this.recordMetrics('segments.create', 1, {
        orgId,
        ledgerId,
        segmentName: input.name,
      });

      span.setAttribute('segmentId', result.id);
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
   * Updates an existing segment
   *
   * @returns Promise resolving to the updated segment
   */
  public async updateSegment(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateSegmentInput
  ): Promise<Segment> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentId', id);

    // Set attributes for the update
    if (input.name) {
      span.setAttribute('updatedName', input.name);
    }
    if (input.status) {
      span.setAttribute('updatedStatus', input.status);
    }
    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Validate input
      validate(input, validateUpdateSegmentInput);

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildSegmentUrl(orgId, ledgerId)}/${id}`;
      const result = await this.httpClient.patch<Segment>(url, input);

      // Record metrics
      this.recordMetrics('segments.update', 1, {
        orgId,
        ledgerId,
        segmentId: id,
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
   * Deletes a segment
   *
   * @returns Promise resolving when the segment is deleted
   */
  public async deleteSegment(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildSegmentUrl(orgId, ledgerId)}/${id}`;
      await this.httpClient.delete(url);

      // Record metrics
      this.recordMetrics('segments.delete', 1, {
        orgId,
        ledgerId,
        segmentId: id,
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
   * @private
   */
  private recordMetrics(name: string, value: number, tags?: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags || {});
  }
}
