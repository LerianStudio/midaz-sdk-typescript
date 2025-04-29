/**
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
 * @inheritdoc
 */
export class HttpAccountApiClient
  extends HttpBaseApiClient<Account, CreateAccountInput, UpdateAccountInput>
  implements AccountApiClient
{
  /**
   * Creates a new HttpAccountApiClient
   *
   */
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-account-api-client', observability);
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
