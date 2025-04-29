/**
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
   * @returns Promise resolving to the portfolio
   */
  getPortfolio(orgId: string, ledgerId: string, id: string): Promise<Portfolio>;

  /**
   * Creates a new portfolio
   *
   * @returns Promise resolving to the created portfolio
   */
  createPortfolio(orgId: string, ledgerId: string, input: CreatePortfolioInput): Promise<Portfolio>;

  /**
   * Updates an existing portfolio
   *
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
   * @returns Promise resolving when the portfolio is deleted
   */
  deletePortfolio(orgId: string, ledgerId: string, id: string): Promise<void>;
}
