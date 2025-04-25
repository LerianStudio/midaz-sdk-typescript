/**
 * @file Ledger service interface
 * @description Defines the interface for managing ledgers
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
   * @param orgId - Organization ID
   * @param opts - List options
   */
  listLedgers(orgId: string, opts?: ListOptions): Promise<ListResponse<Ledger>>;

  /**
   * Gets a ledger by ID
   *
   * @param orgId - Organization ID
   * @param id - Ledger ID to retrieve
   */
  getLedger(orgId: string, id: string): Promise<Ledger>;

  /**
   * Creates a new ledger
   *
   * @param orgId - Organization ID
   * @param input - Ledger creation input
   */
  createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger>;

  /**
   * Updates an existing ledger
   *
   * @param orgId - Organization ID
   * @param id - Ledger ID to update
   * @param input - Ledger update input
   */
  updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger>;

  /**
   * Deletes a ledger (typically soft-deleted to maintain history)
   *
   * @param orgId - Organization ID
   * @param id - Ledger ID to delete
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
