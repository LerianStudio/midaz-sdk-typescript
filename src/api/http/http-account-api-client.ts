/**
 * @file HTTP implementation of account API client
 * @description Implements the account API client interface using HTTP
 */

import { Account, CreateAccountInput, UpdateAccountInput } from '../../models/account';
import { ListOptions, ListResponse } from '../../models/common';
import {
  validateCreateAccountInput,
  validateUpdateAccountInput,
} from '../../models/validators/account-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { AccountApiClient } from '../interfaces/account-api-client';
import { UrlBuilder } from '../url-builder';
import { HttpBaseApiClient } from './http-base-api-client';

/**
 * HTTP implementation of the AccountApiClient interface
 *
 * This class handles HTTP communication with account endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpAccountApiClient
  extends HttpBaseApiClient<Account, CreateAccountInput, UpdateAccountInput>
  implements AccountApiClient
{
  /**
   * Creates a new HttpAccountApiClient
   *
   * @param httpClient - HTTP client for making API requests
   * @param urlBuilder - URL builder for constructing endpoint URLs
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-account-api-client', observability);
  }

  /**
   * Lists accounts with optional filters
   *
   * @param orgId - Organization ID that owns the accounts
   * @param ledgerId - Ledger ID that contains the accounts
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of accounts
   */
  public async listAccounts(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Account>> {
    // Validate required parameters before making the request
    this.validateRequiredParams(this.startSpan('validateParams', { orgId, ledgerId }), {
      orgId,
      ledgerId,
    });

    // Build the URL for the request
    const url = this.urlBuilder.buildAccountUrl(orgId, ledgerId);

    // Make the request
    return this.getRequest<ListResponse<Account>>(
      'listAccounts',
      url,
      { params: options },
      { orgId, ledgerId }
    );
  }

  /**
   * Gets an account by ID
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to retrieve
   * @returns Promise resolving to the account
   */
  public async getAccount(orgId: string, ledgerId: string, id: string): Promise<Account> {
    // Validate required parameters before making the request
    this.validateRequiredParams(
      this.startSpan('validateParams', { orgId, ledgerId, accountId: id }),
      { orgId, ledgerId, id }
    );

    // Build the URL for the request
    const url = this.urlBuilder.buildAccountUrl(orgId, ledgerId, id);

    // Make the request
    return this.getRequest<Account>('getAccount', url, undefined, {
      orgId,
      ledgerId,
      accountId: id,
    });
  }

  /**
   * Creates a new account
   *
   * @param orgId - Organization ID that will own the account
   * @param ledgerId - Ledger ID that will contain the account
   * @param input - Account creation input with required properties
   * @returns Promise resolving to the created account
   */
  public async createAccount(
    orgId: string,
    ledgerId: string,
    input: CreateAccountInput
  ): Promise<Account> {
    // Validate required parameters before making the request
    this.validateRequiredParams(
      this.startSpan('validateParams', {
        orgId,
        ledgerId,
        accountName: input.name,
        assetCode: input.assetCode,
        accountType: input.type,
      }),
      { orgId, ledgerId }
    );

    // Validate input
    validate(input, validateCreateAccountInput);

    // Build the URL for the request
    const url = this.urlBuilder.buildAccountUrl(orgId, ledgerId);

    // Make the request
    return this.postRequest<Account>('createAccount', url, input, undefined, {
      orgId,
      ledgerId,
      accountName: input.name,
      assetCode: input.assetCode,
      accountType: input.type,
    });
  }

  /**
   * Updates an existing account
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to update
   * @param input - Account update input with properties to change
   * @returns Promise resolving to the updated account
   */
  public async updateAccount(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountInput
  ): Promise<Account> {
    // Prepare span attributes
    const attributes = {
      orgId,
      ledgerId,
      accountId: id,
      updatedName: input.name,
      updatedStatus: input.status,
      updatedMetadata: input.metadata ? true : undefined,
    };

    // Validate required parameters before making the request
    this.validateRequiredParams(this.startSpan('validateParams', attributes), {
      orgId,
      ledgerId,
      id,
    });

    // Validate input
    validate(input, validateUpdateAccountInput);

    // Build the URL for the request
    const url = this.urlBuilder.buildAccountUrl(orgId, ledgerId, id);

    // Make the request
    return this.patchRequest<Account>('updateAccount', url, input, undefined, attributes);
  }

  /**
   * Deletes an account
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to delete
   * @returns Promise resolving when the account is deleted
   */
  public async deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Validate required parameters before making the request
    this.validateRequiredParams(
      this.startSpan('validateParams', { orgId, ledgerId, accountId: id }),
      { orgId, ledgerId, id }
    );

    // Build the URL for the request
    const url = this.urlBuilder.buildAccountUrl(orgId, ledgerId, id);

    // Make the request
    return this.deleteRequest('deleteAccount', url, undefined, { orgId, ledgerId, accountId: id });
  }
}
