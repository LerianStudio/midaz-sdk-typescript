/**
 * Ledger service interface - Defines the interface for managing ledgers
 */

import { ListOptions, ListResponse } from '../models/common';
import {
  CreateLedgerInput,
  Ledger,
  LedgerSettings,
  UpdateLedgerInput,
  UpdateLedgerSettingsInput,
} from '../models/ledger';

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
  /**
   * Counts the ledgers of an organization
   *
   * The ledger answers this over HEAD with the total in `X-Total-Count` and ignores
   * every query parameter, so the count cannot be filtered.
   *
   */
  countLedgers(orgId: string): Promise<number>;

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
   * Reads the settings document of a ledger
   *
   * Every field is present even on a ledger that was never patched: the ledger
   * supplies the defaults in code rather than storing them.
   *
   * @returns Promise resolving to the ledger settings
   */
  getLedgerSettings(orgId: string, id: string): Promise<LedgerSettings>;

  /**
   * Patches the settings document of a ledger
   *
   * This is a deep merge-patch, unlike every other update in this SDK: the ledger
   * merges the patch leaf by leaf, so `{ overrides: { allowFeeSkip: true } }`
   * leaves the other two overrides and both sibling groups untouched. An empty
   * patch is valid and returns the document unchanged.
   *
   * `LEDGER_OVERRIDE_PATHS` names the field each refused skip is gated by, so the
   * `0490` a transaction raises points straight at the patch that lifts it.
   *
   * @returns Promise resolving to the merged ledger settings
   */
  updateLedgerSettings(
    orgId: string,
    id: string,
    input: UpdateLedgerSettingsInput
  ): Promise<LedgerSettings>;

  /**
   * Deletes a ledger
   *
   * @returns Promise that resolves when the ledger is deleted
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
