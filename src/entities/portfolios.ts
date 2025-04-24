/**
 * @file Portfolio service interface for the Midaz SDK
 * @description Defines the interface for managing portfolios within the Midaz ledger system
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreatePortfolioInput, Portfolio, UpdatePortfolioInput } from '../models/portfolio';

/**
 * Service for managing portfolios in the Midaz system
 *
 * The PortfoliosService provides methods for creating, retrieving, updating, and deleting
 * portfolios within a specific organization and ledger. Portfolios are groupings of accounts
 * that allow for consolidated reporting, analysis, and management of related accounts.
 *
 * Each portfolio:
 * - Belongs to a specific organization and ledger
 * - Is associated with a specific entity (e.g., a customer, department, or project)
 * - Can contain multiple accounts of various types
 * - Can be used for reporting and analysis purposes
 * - Has a status (active, inactive, etc.)
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
 *
 * // List portfolios in a ledger
 * const portfolios = await midazClient.entities.portfolios.listPortfolios(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface PortfoliosService {
  /**
   * Lists portfolios for a ledger with optional filters
   *
   * Retrieves a paginated list of portfolios within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the portfolios
   * @param ledgerId - Ledger ID that contains the portfolios
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of portfolios
   *
   * @example
   * ```typescript
   * // List the first 10 portfolios in a ledger
   * const portfolios = await portfoliosService.listPortfolios(
   *   "org_12345",
   *   "ldg_67890",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List portfolios with filtering
   * const filteredPortfolios = await portfoliosService.listPortfolios(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 20,
   *     filter: {
   *       entityId: "ent_abcdef",
   *       status: "ACTIVE"
   *     }
   *   }
   * );
   *
   * // List portfolios with sorting
   * const sortedPortfolios = await portfoliosService.listPortfolios(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 10,
   *     sort: {
   *       field: "name",
   *       order: "ASC"
   *     }
   *   }
   * );
   * ```
   */
  listPortfolios(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Portfolio>>;

  /**
   * Gets a portfolio by ID
   *
   * Retrieves a single portfolio by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to retrieve
   * @returns Promise resolving to the portfolio
   *
   * @example
   * ```typescript
   * // Get portfolio details
   * const portfolio = await portfoliosService.getPortfolio(
   *   "org_12345",
   *   "ldg_67890",
   *   "pfl_abcdef"
   * );
   *
   * console.log(`Portfolio name: ${portfolio.name}`);
   * console.log(`Entity ID: ${portfolio.entityId}`);
   * console.log(`Status: ${portfolio.status.code}`);
   * console.log(`Created at: ${portfolio.createdAt}`);
   * ```
   */
  getPortfolio(orgId: string, ledgerId: string, id: string): Promise<Portfolio>;

  /**
   * Creates a new portfolio
   *
   * Creates a new portfolio within the specified organization and ledger using
   * the provided portfolio details. The portfolio will be initialized with the
   * specified properties and assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the portfolio
   * @param ledgerId - Ledger ID that will contain the portfolio
   * @param input - Portfolio creation input with required properties
   * @returns Promise resolving to the created portfolio
   *
   * @example
   * ```typescript
   * // Create a basic portfolio
   * const newPortfolio = await portfoliosService.createPortfolio(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Treasury Operations",
   *     entityId: "ent_abcdef"
   *   }
   * );
   *
   * // Create a portfolio with additional properties
   * const portfolioWithDetails = await portfoliosService.createPortfolio(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Investment Portfolio",
   *     entityId: "ent_abcdef",
   *     alias: "investments",
   *     metadata: {
   *       department: "Finance",
   *       riskProfile: "Moderate",
   *       manager: "Jane Doe"
   *     }
   *   }
   * );
   * ```
   */
  createPortfolio(orgId: string, ledgerId: string, input: CreatePortfolioInput): Promise<Portfolio>;

  /**
   * Updates an existing portfolio
   *
   * Updates the properties of an existing portfolio within the specified
   * organization and ledger. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to update
   * @param input - Portfolio update input with properties to change
   * @returns Promise resolving to the updated portfolio
   *
   * @example
   * ```typescript
   * // Update a portfolio's name
   * const updatedPortfolio = await portfoliosService.updatePortfolio(
   *   "org_12345",
   *   "ldg_67890",
   *   "pfl_abcdef",
   *   {
   *     name: "Primary Treasury Operations"
   *   }
   * );
   *
   * // Update multiple properties
   * const updatedPortfolio = await portfoliosService.updatePortfolio(
   *   "org_12345",
   *   "ldg_67890",
   *   "pfl_abcdef",
   *   {
   *     name: "Primary Treasury Operations",
   *     status: "INACTIVE",
   *     metadata: {
   *       department: "Treasury",
   *       riskProfile: "Low",
   *       manager: "John Smith"
   *     }
   *   }
   * );
   * ```
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
   * Deletes a portfolio from the specified organization and ledger.
   * This operation may be restricted if the portfolio has associated accounts.
   * In many cases, portfolios are soft-deleted (marked as deleted but retained
   * in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to delete
   * @returns Promise that resolves when the portfolio is deleted
   *
   * @example
   * ```typescript
   * // Delete a portfolio
   * await portfoliosService.deletePortfolio(
   *   "org_12345",
   *   "ldg_67890",
   *   "pfl_abcdef"
   * );
   *
   * // Attempt to retrieve the deleted portfolio (will throw an error)
   * try {
   *   const portfolio = await portfoliosService.getPortfolio(
   *     "org_12345",
   *     "ldg_67890",
   *     "pfl_abcdef"
   *   );
   * } catch (error) {
   *   console.error("Portfolio not found or has been deleted");
   * }
   * ```
   */
  deletePortfolio(orgId: string, ledgerId: string, id: string): Promise<void>;
}
