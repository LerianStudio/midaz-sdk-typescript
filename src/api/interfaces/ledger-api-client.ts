/**
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
   * @returns Promise resolving to a paginated list of ledgers
   */
  listLedgers(orgId: string, options?: ListOptions): Promise<ListResponse<Ledger>>;

  /**
   * Gets a ledger by ID
   *
   * @returns Promise resolving to the ledger
   */
  getLedger(orgId: string, id: string): Promise<Ledger>;

  /**
   * Creates a new ledger
   *
   * @returns Promise resolving to the created ledger
   */
  createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger>;

  /**
   * Updates an existing ledger
   *
   * @returns Promise resolving to the updated ledger
   */
  updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger>;

  /**
   * Deletes a ledger
   *
   * @returns Promise resolving when the ledger is deleted
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
