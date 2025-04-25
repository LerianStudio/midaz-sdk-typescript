/**
 * Portfolio service interface - Defines the interface for managing portfolios
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreatePortfolioInput, Portfolio, UpdatePortfolioInput } from '../models/portfolio';

/**
 * Service for managing portfolios
 *
 * Portfolios are groupings of accounts that allow for consolidated
 * reporting, analysis, and management of related accounts.
 *
 * @example
 * ```typescript
 * // Create a new portfolio
 * const newPortfolio = await midazClient.entities.portfolios.createPortfolio(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     name: "Treasury Operations",
 *     entityId: "ent_abcdef"
 *   }
 * );
 * ```
 */
export interface PortfoliosService {
  /**
   * Lists portfolios for a ledger with optional filters
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param opts List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of portfolios
   */
  listPortfolios(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Portfolio>>;

  /**
   * Gets a portfolio by ID
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param id Portfolio ID to retrieve
   * @returns Promise resolving to the portfolio
   */
  getPortfolio(orgId: string, ledgerId: string, id: string): Promise<Portfolio>;

  /**
   * Creates a new portfolio
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param input Portfolio creation input
   * @returns Promise resolving to the created portfolio
   */
  createPortfolio(orgId: string, ledgerId: string, input: CreatePortfolioInput): Promise<Portfolio>;

  /**
   * Updates an existing portfolio
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param id Portfolio ID to update
   * @param input Portfolio update input
   * @returns Promise resolving to the updated portfolio
   */
  updatePortfolio(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdatePortfolioInput
  ): Promise<Portfolio>;

  /**
   * Deletes a portfolio
   *
   * @param orgId Organization ID
   * @param ledgerId Ledger ID
   * @param id Portfolio ID to delete
   * @returns Promise that resolves when the portfolio is deleted
   */
  deletePortfolio(orgId: string, ledgerId: string, id: string): Promise<void>;
}
