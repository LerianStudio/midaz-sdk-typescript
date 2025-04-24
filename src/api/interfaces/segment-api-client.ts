/**
 * @file Segment API client interface
 * @description Defines the interface for segment API operations
 */

import { ListOptions, ListResponse, Status, StatusCode } from '../../models/common';

import { ApiClient } from './api-client';

/**
 * Represents a segment in the system
 */
export interface Segment {
  id: string;
  name: string;
  ledgerId: string;
  organizationId: string;
  parentSegmentId?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Input for creating a segment
 */
export interface CreateSegmentInput {
  name: string;
  parentSegmentId?: string;
  status?: StatusCode;
  metadata?: Record<string, any>;
}

/**
 * Input for updating a segment
 */
export interface UpdateSegmentInput {
  name?: string;
  parentSegmentId?: string;
  status?: StatusCode;
  metadata?: Record<string, any>;
}

/**
 * Interface for segment API operations
 *
 * This interface defines the methods for interacting with segment endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface SegmentApiClient
  extends ApiClient<Segment, CreateSegmentInput, UpdateSegmentInput> {
  /**
   * Lists segments for a ledger with optional filters
   *
   * @param orgId - Organization ID that owns the segments
   * @param ledgerId - Ledger ID that contains the segments
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of segments
   */
  listSegments(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Segment>>;

  /**
   * Gets a segment by ID
   *
   * @param orgId - Organization ID that owns the segment
   * @param ledgerId - Ledger ID that contains the segment
   * @param id - Segment ID to retrieve
   * @returns Promise resolving to the segment
   */
  getSegment(orgId: string, ledgerId: string, id: string): Promise<Segment>;

  /**
   * Creates a new segment
   *
   * @param orgId - Organization ID that will own the segment
   * @param ledgerId - Ledger ID that will contain the segment
   * @param input - Segment creation input with required properties
   * @returns Promise resolving to the created segment
   */
  createSegment(orgId: string, ledgerId: string, input: CreateSegmentInput): Promise<Segment>;

  /**
   * Updates an existing segment
   *
   * @param orgId - Organization ID that owns the segment
   * @param ledgerId - Ledger ID that contains the segment
   * @param id - Segment ID to update
   * @param input - Segment update input with properties to change
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
   * @param orgId - Organization ID that owns the segment
   * @param ledgerId - Ledger ID that contains the segment
   * @param id - Segment ID to delete
   * @returns Promise resolving when the segment is deleted
   */
  deleteSegment(orgId: string, ledgerId: string, id: string): Promise<void>;
}
