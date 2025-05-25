/**
 */

import { SegmentApiClient } from '../../api/interfaces/segment-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { CreateSegmentInput, Segment, UpdateSegmentInput } from '../../models/segment';
import { Observability } from '../../util/observability/observability';
import { SegmentsService } from '../segments';

/**
 * Implementation of the SegmentsService interface
 *
 * This class provides the concrete implementation of the SegmentsService interface,
 * handling operations for segment-related API endpoints. It relies on the SegmentApiClient
 * to perform the actual HTTP communication, allowing for better separation of concerns.
 *
 * Segments represent logical divisions or categories within a ledger that can be used
 * to organize accounts and transactions. They provide a way to structure financial data
 * for reporting, analysis, and management purposes.
 *
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done by the MidazClient)
 * const segmentApiClient = apiFactory.createSegmentApiClient();
 * const segmentsService = new SegmentsServiceImpl(segmentApiClient);
 *
 * // Using the service to list segments
 * const segments = await segmentsService.listSegments(
 *   "org_123",
 *   "ldg_456",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export class SegmentsServiceImpl implements SegmentsService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new SegmentsServiceImpl
   *
   */
  constructor(
    private readonly segmentApiClient: SegmentApiClient,
    observability?: Observability
  ) {
    // Initialize observability with service name
    this.observability = observability || Observability.getInstance();
  }

  /**
   * Lists segments for a ledger with optional filters
   *
   * Retrieves a paginated list of segments for a specific organization and ledger.
   * The results can be filtered, sorted, and paginated using the optional parameters.
   *
   * @returns Promise resolving to a paginated list of segments
   *
   * @example
   * ```typescript
   * // List all segments for a ledger
   * const segments = await segmentsService.listSegments(
   *   "org_123",
   *   "ldg_456"
   * );
   *
   * // List segments with pagination
   * const paginatedSegments = await segmentsService.listSegments(
   *   "org_123",
   *   "ldg_456",
   *   { limit: 10, offset: 0 }
   * );
   * ```
   */
  public async listSegments(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Segment>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listSegments');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    if (opts?.limit) {
      span.setAttribute('limit', opts.limit);
    }
    if (opts?.offset) {
      span.setAttribute('offset', opts.offset);
    }

    try {
      // Delegate to the API client
      const result = await this.segmentApiClient.listSegments(orgId, ledgerId, opts);

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
   * Gets a specific segment by ID
   *
   * Retrieves the details of a specific segment identified by its ID.
   *
   * @returns Promise resolving to the segment details
   *
   * @example
   * ```typescript
   * // Get a specific segment
   * const segment = await segmentsService.getSegment(
   *   "org_123",
   *   "ldg_456",
   *   "seg_789"
   * );
   *
   * console.log(`Segment name: ${segment.name}`);
   * console.log(`Segment description: ${segment.description}`);
   * ```
   */
  public async getSegment(orgId: string, ledgerId: string, segmentId: string): Promise<Segment> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentId', segmentId);

    try {
      // Delegate to the API client
      const result = await this.segmentApiClient.getSegment(orgId, ledgerId, segmentId);

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
   * Creates a new segment in the specified organization and ledger.
   *
   * @returns Promise resolving to the created segment
   *
   * @example
   * ```typescript
   * // Create a new segment
   * const newSegment = await segmentsService.createSegment(
   *   "org_123",
   *   "ldg_456",
   *   {
   *     name: "Business Unit",
   *     metadata: {
   *       importance: "high",
   *       owner: "Finance Department"
   *     }
   *   }
   * );
   *
   * console.log(`Created segment with ID: ${newSegment.id}`);
   * ```
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
      // Delegate to the API client
      const result = await this.segmentApiClient.createSegment(orgId, ledgerId, input);

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
   * Updates the details of an existing segment identified by its ID.
   *
   * @returns Promise resolving to the updated segment
   *
   * @example
   * ```typescript
   * // Update an existing segment
   * const updatedSegment = await segmentsService.updateSegment(
   *   "org_123",
   *   "ldg_456",
   *   "seg_789",
   *   {
   *     name: "Revised Business Unit",
   *     metadata: {
   *       importance: "critical",
   *       owner: "Executive Team"
   *     }
   *   }
   * );
   *
   * console.log(`Updated segment: ${updatedSegment.name}`);
   * ```
   */
  public async updateSegment(
    orgId: string,
    ledgerId: string,
    segmentId: string,
    input: UpdateSegmentInput
  ): Promise<Segment> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentId', segmentId);
    if (input.name) {
      span.setAttribute('segmentName', input.name);
    }

    try {
      // Delegate to the API client
      const result = await this.segmentApiClient.updateSegment(orgId, ledgerId, segmentId, input);

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
   * Permanently removes a segment from the system.
   *
   * @returns Promise that resolves when the segment is deleted
   *
   * @example
   * ```typescript
   * // Delete a segment
   * await segmentsService.deleteSegment(
   *   "org_123",
   *   "ldg_456",
   *   "seg_789"
   * );
   *
   * console.log("Segment successfully deleted");
   * ```
   */
  public async deleteSegment(orgId: string, ledgerId: string, segmentId: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteSegment');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('segmentId', segmentId);

    try {
      // Delegate to the API client
      await this.segmentApiClient.deleteSegment(orgId, ledgerId, segmentId);

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
