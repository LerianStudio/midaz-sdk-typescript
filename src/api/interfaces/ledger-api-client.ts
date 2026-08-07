/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import {
  CreateLedgerInput,
  Ledger,
  LedgerSettings,
  UpdateLedgerInput,
  UpdateLedgerSettingsInput,
} from '../../models/ledger';

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
  /**
   * Counts the ledgers of an organization
   *
   * The ledger serves this over HEAD alone, with the total in `X-Total-Count`,
   * and ignores every query parameter, so the count is never filtered.
   *
   * @returns Promise resolving to the number of ledgers
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
   * The ledger supplies the defaults in code rather than storing them, so every
   * field is present even on a ledger whose settings were never patched.
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
   * @returns Promise resolving when the ledger is deleted
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
