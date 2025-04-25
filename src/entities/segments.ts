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
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param opts List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of segments
   */
  listSegments(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Segment>>;

  /**
   * Gets a segment by ID
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param id Segment ID to retrieve
   * @returns Promise resolving to the segment
   */
  getSegment(orgId: string, ledgerId: string, id: string): Promise<Segment>;

  /**
   * Creates a new segment
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param input Segment creation input
   * @returns Promise resolving to the created segment
   */
  createSegment(orgId: string, ledgerId: string, input: CreateSegmentInput): Promise<Segment>;

  /**
   * Updates an existing segment
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param id Segment ID to update
   * @param input Segment update input
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
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param id Segment ID to delete
   * @returns Promise that resolves when the segment is deleted
   */
  deleteSegment(orgId: string, ledgerId: string, id: string): Promise<void>;
}
