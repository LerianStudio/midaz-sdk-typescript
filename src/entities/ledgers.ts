/**
 * Ledger service interface - Defines the interface for managing ledgers
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../models/ledger';

/**
 * Service for managing ledgers
 * 
 * Ledgers are the core financial record-keeping systems that contain
 * accounts, transactions, and balances.
 *
 * @example
 * ```typescript
 * // Create a new ledger
 * const newLedger = await client.entities.ledgers.createLedger(
 *   "org_123",
 *   {
 *     name: "Corporate Treasury"
 *   }
 * );
 * ```
 */
export interface LedgersService {
  /**
   * Lists ledgers with pagination, sorting, and filtering
   *
   * @param orgId Organization ID
   * @param opts List options
   * @returns Promise resolving to a paginated list of ledgers
   */
  listLedgers(orgId: string, opts?: ListOptions): Promise<ListResponse<Ledger>>;

  /**
   * Gets a ledger by ID
   *
   * @param orgId Organization ID
   * @param id Ledger ID to retrieve
   * @returns Promise resolving to the ledger
   */
  getLedger(orgId: string, id: string): Promise<Ledger>;

  /**
   * Creates a new ledger
   *
   * @param orgId Organization ID
   * @param input Ledger creation input
   * @returns Promise resolving to the created ledger
   */
  createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger>;

  /**
   * Updates an existing ledger
   *
   * @param orgId Organization ID
   * @param id Ledger ID to update
   * @param input Ledger update input
   * @returns Promise resolving to the updated ledger
   */
  updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger>;

  /**
   * Deletes a ledger
   *
   * @param orgId Organization ID
   * @param id Ledger ID to delete
   * @returns Promise that resolves when the ledger is deleted
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
