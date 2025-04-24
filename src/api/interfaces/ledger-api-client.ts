/**
 * @file Ledger API client interface
 * @description Defines the interface for ledger API operations
 */

import { ListOptions, ListResponse } from '../../models/common';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../../models/ledger';

import { ApiClient } from './api-client';

/**
 * Interface for ledger API operations
 *
 * This interface defines the methods for interacting with ledger endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface LedgerApiClient extends ApiClient<Ledger, CreateLedgerInput, UpdateLedgerInput> {
  /**
   * Lists ledgers for a specific organization
   *
   * @param orgId - Organization ID
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of ledgers
   */
  listLedgers(orgId: string, options?: ListOptions): Promise<ListResponse<Ledger>>;

  /**
   * Gets a ledger by ID
   *
   * @param orgId - Organization ID
   * @param id - Ledger ID
   * @returns Promise resolving to the ledger
   */
  getLedger(orgId: string, id: string): Promise<Ledger>;

  /**
   * Creates a new ledger
   *
   * @param orgId - Organization ID
   * @param input - Ledger creation input
   * @returns Promise resolving to the created ledger
   */
  createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger>;

  /**
   * Updates an existing ledger
   *
   * @param orgId - Organization ID
   * @param id - Ledger ID
   * @param input - Ledger update input
   * @returns Promise resolving to the updated ledger
   */
  updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger>;

  /**
   * Deletes a ledger
   *
   * @param orgId - Organization ID
   * @param id - Ledger ID
   * @returns Promise resolving when the ledger is deleted
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
