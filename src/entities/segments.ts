/**
 * Segment service interface - Defines the interface for managing segments
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreateSegmentInput, Segment, UpdateSegmentInput } from '../models/segment';

/**
 * Service for managing segments
 *
 * Segments are a way to categorize and group accounts within a ledger
 * for reporting, analysis, and organizational purposes.
 *
 * @example
 * ```typescript
 * // Create a new segment
 * const newSegment = await midazClient.entities.segments.createSegment(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     name: "Operating Expenses"
 *   }
 * );
 * ```
 */
export interface SegmentsService {
  /**
   * Lists segments for a ledger with optional filters
   *
   * @returns Promise resolving to a paginated list of segments
   */
  listSegments(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Segment>>;

  /**
   * Gets a segment by ID
   *
   * @returns Promise resolving to the segment
   */
  getSegment(orgId: string, ledgerId: string, id: string): Promise<Segment>;

  /**
   * Creates a new segment
   *
   * @returns Promise resolving to the created segment
   */
  createSegment(orgId: string, ledgerId: string, input: CreateSegmentInput): Promise<Segment>;

  /**
   * Updates an existing segment
   *
   * @returns Promise resolving to the updated segment
   */
  updateSegment(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateSegmentInput
  ): Promise<Segment>;

  /**
   * Deletes a segment
   *
   * @returns Promise that resolves when the segment is deleted
   */
  deleteSegment(orgId: string, ledgerId: string, id: string): Promise<void>;
}
