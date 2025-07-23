/**
 * HTTP implementation of the AccountTypeApiClient.
 */
import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '../../models/account-type';
import { ListOptions, ListResponse } from '../../models/common';
import {
  validateCreateAccountTypeInput,
  validateUpdateAccountTypeInput,
} from '../../models/validators/account-type-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { AccountTypeApiClient } from '../interfaces/account-type-api-client';
import { UrlBuilder } from '../url-builder';
import { HttpBaseApiClient } from './http-base-api-client';

export class HttpAccountTypeApiClient
  extends HttpBaseApiClient<AccountType, CreateAccountTypeInput, UpdateAccountTypeInput>
  implements AccountTypeApiClient
{
  private readonly basePath = 'account-types';

  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-account-type-api-client', observability);
  }

  protected getUrl(orgId: string, ledgerId: string, path: string = ''): string {
    return `organizations/${orgId}/ledgers/${ledgerId}/${this.basePath}${path}`;
  }

  public async listAccountTypes(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<AccountType>> {
    const url = this.getUrl(orgId, ledgerId);
    return this.getRequest<ListResponse<AccountType>>('listAccountTypes', url, { params: options });
  }

  public async getAccountType(orgId: string, ledgerId: string, id: string): Promise<AccountType> {
    const url = this.getUrl(orgId, ledgerId, `/${id}`);
    return this.getRequest<AccountType>('getAccountType', url);
  }

  public async createAccountType(
    orgId: string,
    ledgerId: string,
    input: CreateAccountTypeInput
  ): Promise<AccountType> {
    validate(input, validateCreateAccountTypeInput);
    const url = this.getUrl(orgId, ledgerId);
    return this.postRequest<AccountType>('createAccountType', url, input);
  }

  public async updateAccountType(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountTypeInput
  ): Promise<AccountType> {
    validate(input, validateUpdateAccountTypeInput);
    const url = this.getUrl(orgId, ledgerId, `/${id}`);
    return this.patchRequest<AccountType>('updateAccountType', url, input);
  }

  public async deleteAccountType(orgId: string, ledgerId: string, id: string): Promise<void> {
    const url = this.getUrl(orgId, ledgerId, `/${id}`);
    await this.deleteRequest('deleteAccountType', url);
  }
}
