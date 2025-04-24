/**
 * @file Portfolio API client interface
 * @description Defines the interface for portfolio API operations
 */

import { ListOptions, ListResponse } from '../../models/common';
import { CreatePortfolioInput, Portfolio, UpdatePortfolioInput } from '../../models/portfolio';

import { ApiClient } from './api-client';

/**
 * Interface for portfolio API operations
 *
 * This interface defines the methods for interacting with portfolio endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface PortfolioApiClient
  extends ApiClient<Portfolio, CreatePortfolioInput, UpdatePortfolioInput> {
  /**
   * Lists portfolios for a ledger with optional filters
   *
   * @param orgId - Organization ID that owns the portfolios
   * @param ledgerId - Ledger ID that contains the portfolios
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of portfolios
   */
  listPortfolios(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Portfolio>>;

  /**
   * Gets a portfolio by ID
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to retrieve
   * @returns Promise resolving to the portfolio
   */
  getPortfolio(orgId: string, ledgerId: string, id: string): Promise<Portfolio>;

  /**
   * Creates a new portfolio
   *
   * @param orgId - Organization ID that will own the portfolio
   * @param ledgerId - Ledger ID that will contain the portfolio
   * @param input - Portfolio creation input with required properties
   * @returns Promise resolving to the created portfolio
   */
  createPortfolio(orgId: string, ledgerId: string, input: CreatePortfolioInput): Promise<Portfolio>;

  /**
   * Updates an existing portfolio
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to update
   * @param input - Portfolio update input with properties to change
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
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to delete
   * @returns Promise resolving when the portfolio is deleted
   */
  deletePortfolio(orgId: string, ledgerId: string, id: string): Promise<void>;
}
