/**
 * @file Ledger service interface for the Midaz SDK
 * @description Defines the interface for managing ledgers within the Midaz system
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../models/ledger';

/**
 * Service for managing ledgers in the Midaz system
 *
 * The LedgersService provides methods for creating, retrieving, updating, and deleting
 * ledgers within a specific organization. Ledgers are the core financial record-keeping
 * systems that contain accounts, transactions, and balances.
 *
 * Each ledger:
 * - Belongs to a specific organization
 * - Contains multiple accounts of various types
 * - Maintains a transaction history
 * - Tracks balances for all accounts
 * - Can be organized into segments for reporting and analysis
 *
 * @example
 * ```typescript
 * // Create a new ledger
 * const newLedger = await midazClient.entities.ledgers.createLedger(
 *   "org_12345",
 *   {
 *     name: "Corporate Treasury"
 *   }
 * );
 *
 * // List ledgers in an organization
 * const ledgers = await midazClient.entities.ledgers.listLedgers(
 *   "org_12345",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface LedgersService {
  /**
   * Lists ledgers with optional filters
   *
   * Retrieves a paginated list of ledgers within the specified organization.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the ledgers
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of ledgers
   *
   * @example
   * ```typescript
   * // List the first 10 ledgers in an organization
   * const ledgers = await ledgersService.listLedgers(
   *   "org_12345",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List ledgers with filtering
   * const filteredLedgers = await ledgersService.listLedgers(
   *   "org_12345",
   *   {
   *     limit: 20,
   *     filter: {
   *       status: "ACTIVE"
   *     }
   *   }
   * );
   * ```
   */
  listLedgers(orgId: string, opts?: ListOptions): Promise<ListResponse<Ledger>>;

  /**
   * Gets a ledger by ID
   *
   * Retrieves a single ledger by its unique identifier within the specified
   * organization.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param id - Ledger ID to retrieve
   * @returns Promise resolving to the ledger
   *
   * @example
   * ```typescript
   * // Get ledger details
   * const ledger = await ledgersService.getLedger(
   *   "org_12345",
   *   "ldg_67890"
   * );
   *
   * console.log(`Ledger name: ${ledger.name}`);
   * console.log(`Status: ${ledger.status.code}`);
   * console.log(`Created at: ${ledger.createdAt}`);
   * ```
   */
  getLedger(orgId: string, id: string): Promise<Ledger>;

  /**
   * Creates a new ledger
   *
   * Creates a new ledger within the specified organization using
   * the provided ledger details. The ledger will be initialized with the
   * specified properties and assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the ledger
   * @param input - Ledger creation input with required properties
   * @returns Promise resolving to the created ledger
   *
   * @example
   * ```typescript
   * // Create a basic ledger
   * const newLedger = await ledgersService.createLedger(
   *   "org_12345",
   *   {
   *     name: "Corporate Treasury"
   *   }
   * );
   *
   * // Create a ledger with additional properties
   * const newLedgerWithDetails = await ledgersService.createLedger(
   *   "org_12345",
   *   {
   *     name: "Investment Portfolio",
   *     alias: "investments",
   *     metadata: {
   *       department: "Finance",
   *       purpose: "Long-term investments"
   *     }
   *   }
   * );
   * ```
   */
  createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger>;

  /**
   * Updates an existing ledger
   *
   * Updates the properties of an existing ledger within the specified
   * organization. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param id - Ledger ID to update
   * @param input - Ledger update input with properties to change
   * @returns Promise resolving to the updated ledger
   *
   * @example
   * ```typescript
   * // Update a ledger's name
   * const updatedLedger = await ledgersService.updateLedger(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Primary Corporate Treasury"
   *   }
   * );
   *
   * // Update multiple properties
   * const updatedLedger = await ledgersService.updateLedger(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Primary Corporate Treasury",
   *     status: "INACTIVE",
   *     metadata: {
   *       department: "Treasury",
   *       purpose: "Daily operations"
   *     }
   *   }
   * );
   * ```
   */
  updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger>;

  /**
   * Deletes a ledger
   *
   * Deletes a ledger from the specified organization.
   * This operation may be restricted if the ledger has associated accounts,
   * balances, or transactions. In many cases, ledgers are soft-deleted (marked as deleted
   * but retained in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param id - Ledger ID to delete
   * @returns Promise that resolves when the ledger is deleted
   *
   * @example
   * ```typescript
   * // Delete a ledger
   * await ledgersService.deleteLedger(
   *   "org_12345",
   *   "ldg_67890"
   * );
   *
   * // Attempt to retrieve the deleted ledger (will throw an error)
   * try {
   *   const ledger = await ledgersService.getLedger(
   *     "org_12345",
   *     "ldg_67890"
   *   );
   * } catch (error) {
   *   console.error("Ledger not found or has been deleted");
   * }
   * ```
   */
  deleteLedger(orgId: string, id: string): Promise<void>;
}
