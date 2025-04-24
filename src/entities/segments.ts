/**
 * @file Segment service interface for the Midaz SDK
 * @description Defines the interface for managing segments within the Midaz ledger system
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreateSegmentInput, Segment, UpdateSegmentInput } from '../models/segment';

/**
 * Service for managing segments in the Midaz system
 *
 * The SegmentsService provides methods for creating, retrieving, updating, and deleting
 * segments within a specific organization and ledger. Segments are a way to categorize
 * and group accounts within a ledger for reporting, analysis, and organizational purposes.
 *
 * Each segment:
 * - Belongs to a specific organization and ledger
 * - Has a unique name within the ledger
 * - Can contain multiple accounts
 * - Can be used for reporting and analysis purposes
 * - Has a status (active, inactive, etc.)
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
 *
 * // List segments in a ledger
 * const segments = await midazClient.entities.segments.listSegments(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface SegmentsService {
  /**
   * Lists segments for a ledger with optional filters
   *
   * Retrieves a paginated list of segments within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the segments
   * @param ledgerId - Ledger ID that contains the segments
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of segments
   *
   * @example
   * ```typescript
   * // List the first 10 segments in a ledger
   * const segments = await segmentsService.listSegments(
   *   "org_12345",
   *   "ldg_67890",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List segments with filtering
   * const filteredSegments = await segmentsService.listSegments(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 20,
   *     filter: {
   *       status: "ACTIVE"
   *     }
   *   }
   * );
   *
   * // List segments with sorting
   * const sortedSegments = await segmentsService.listSegments(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 10,
   *     sort: {
   *       field: "name",
   *       order: "ASC"
   *     }
   *   }
   * );
   * ```
   */
  listSegments(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Segment>>;

  /**
   * Gets a segment by ID
   *
   * Retrieves a single segment by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the segment
   * @param ledgerId - Ledger ID that contains the segment
   * @param id - Segment ID to retrieve
   * @returns Promise resolving to the segment
   *
   * @example
   * ```typescript
   * // Get segment details
   * const segment = await segmentsService.getSegment(
   *   "org_12345",
   *   "ldg_67890",
   *   "seg_abcdef"
   * );
   *
   * console.log(`Segment name: ${segment.name}`);
   * console.log(`Ledger ID: ${segment.ledgerId}`);
   * console.log(`Status: ${segment.status.code}`);
   * console.log(`Created at: ${segment.createdAt}`);
   * ```
   */
  getSegment(orgId: string, ledgerId: string, id: string): Promise<Segment>;

  /**
   * Creates a new segment
   *
   * Creates a new segment within the specified organization and ledger using
   * the provided segment details. The segment will be initialized with the
   * specified properties and assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the segment
   * @param ledgerId - Ledger ID that will contain the segment
   * @param input - Segment creation input with required properties
   * @returns Promise resolving to the created segment
   *
   * @example
   * ```typescript
   * // Create a basic segment
   * const newSegment = await segmentsService.createSegment(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Operating Expenses"
   *   }
   * );
   *
   * // Create a segment with additional properties
   * const segmentWithDetails = await segmentsService.createSegment(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Capital Expenditures",
   *     alias: "capex",
   *     metadata: {
   *       department: "Finance",
   *       category: "Expenses",
   *       description: "Long-term investments in assets"
   *     }
   *   }
   * );
   * ```
   */
  createSegment(orgId: string, ledgerId: string, input: CreateSegmentInput): Promise<Segment>;

  /**
   * Updates an existing segment
   *
   * Updates the properties of an existing segment within the specified
   * organization and ledger. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * @param orgId - Organization ID that owns the segment
   * @param ledgerId - Ledger ID that contains the segment
   * @param id - Segment ID to update
   * @param input - Segment update input with properties to change
   * @returns Promise resolving to the updated segment
   *
   * @example
   * ```typescript
   * // Update a segment's name
   * const updatedSegment = await segmentsService.updateSegment(
   *   "org_12345",
   *   "ldg_67890",
   *   "seg_abcdef",
   *   {
   *     name: "General Operating Expenses"
   *   }
   * );
   *
   * // Update multiple properties
   * const updatedSegment = await segmentsService.updateSegment(
   *   "org_12345",
   *   "ldg_67890",
   *   "seg_abcdef",
   *   {
   *     name: "General Operating Expenses",
   *     status: "INACTIVE",
   *     metadata: {
   *       department: "Accounting",
   *       category: "Operational",
   *       description: "Day-to-day business expenses"
   *     }
   *   }
   * );
   * ```
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
   * Deletes a segment from the specified organization and ledger.
   * This operation may be restricted if the segment has associated accounts.
   * In many cases, segments are soft-deleted (marked as deleted but retained
   * in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the segment
   * @param ledgerId - Ledger ID that contains the segment
   * @param id - Segment ID to delete
   * @returns Promise that resolves when the segment is deleted
   *
   * @example
   * ```typescript
   * // Delete a segment
   * await segmentsService.deleteSegment(
   *   "org_12345",
   *   "ldg_67890",
   *   "seg_abcdef"
   * );
   *
   * // Attempt to retrieve the deleted segment (will throw an error)
   * try {
   *   const segment = await segmentsService.getSegment(
   *     "org_12345",
   *     "ldg_67890",
   *     "seg_abcdef"
   *   );
   * } catch (error) {
   *   console.error("Segment not found or has been deleted");
   * }
   * ```
   */
  deleteSegment(orgId: string, ledgerId: string, id: string): Promise<void>;
}
