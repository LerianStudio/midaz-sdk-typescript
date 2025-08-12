/**
 * HTTP Account Type API Client Implementation
 */

import { HttpBaseApiClient } from './http-base-api-client';
import { AccountTypeApiClient } from '../interfaces/account-type-api-client';
import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '../../models/account-type';
import { PaginatedResponse, ListOptions } from '../../models/common';
import { HttpClient } from '../../util/network/http-client';
import { buildQueryParams, UrlBuilder } from '../url-builder';
import { Observability } from '../../util/observability/observability';

/**
 * HTTP implementation of AccountTypeApiClient
 */
export class HttpAccountTypeApiClient
  extends HttpBaseApiClient<AccountType, CreateAccountTypeInput, UpdateAccountTypeInput>
  implements AccountTypeApiClient
{
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'account-types', observability);
  }

  /**
   * List account types for a ledger
   */
  async listAccountTypes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<AccountType>> {
    const url = this.urlBuilder.buildAccountTypeUrl(organizationId, ledgerId);
    const queryParams = buildQueryParams(options || {});

    return this.getRequest<PaginatedResponse<AccountType>>(
      'listAccountTypes',
      `${url}${queryParams}`
    );
  }

  /**
   * Get a specific account type
   */
  async getAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string
  ): Promise<AccountType> {
    const url = this.urlBuilder.buildAccountTypeUrl(organizationId, ledgerId, accountTypeId);

    return this.getRequest<AccountType>('getAccountType', url);
  }

  /**
   * Create a new account type
   */
  async createAccountType(
    organizationId: string,
    ledgerId: string,
    input: CreateAccountTypeInput
  ): Promise<AccountType> {
    const url = this.urlBuilder.buildAccountTypeUrl(organizationId, ledgerId);

    return this.postRequest<AccountType>('createAccountType', url, input);
  }

  /**
   * Update an existing account type
   */
  async updateAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string,
    input: UpdateAccountTypeInput
  ): Promise<AccountType> {
    const url = this.urlBuilder.buildAccountTypeUrl(organizationId, ledgerId, accountTypeId);

    return this.patchRequest<AccountType>('updateAccountType', url, input);
  }

  /**
   * Delete an account type
   */
  async deleteAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string
  ): Promise<void> {
    const url = this.urlBuilder.buildAccountTypeUrl(organizationId, ledgerId, accountTypeId);

    return this.deleteRequest('deleteAccountType', url);
  }
}
