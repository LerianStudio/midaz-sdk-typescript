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
   * @returns Promise resolving to a paginated list of ledgers
   */
  listLedgers(orgId: string, opts?: ListOptions): Promise<ListResponse<Ledger>>;

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
   * @returns Promise that resolves when the ledger is deleted
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
