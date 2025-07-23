/**
 * AccountTypes service implementation
 */
import { AccountTypeApiClient } from '../../api/interfaces/account-type-api-client';
import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '../../models/account-type';
import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';
import { AccountTypesService } from '../account-types';

export class AccountTypesServiceImpl implements AccountTypesService {
  private readonly observability: Observability;

  constructor(
    private readonly accountTypeApiClient: AccountTypeApiClient,
    observability?: Observability
  ) {
    this.observability = observability || Observability.getInstance();
  }

  public async listAccountTypes(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<AccountType>> {
    const span = this.observability.startSpan('listAccountTypes');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    try {
      const result = await this.accountTypeApiClient.listAccountTypes(orgId, ledgerId, opts);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  public async getAccountType(orgId: string, ledgerId: string, id: string): Promise<AccountType> {
    const span = this.observability.startSpan('getAccountType');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountTypeId', id);

    try {
      const result = await this.accountTypeApiClient.getAccountType(orgId, ledgerId, id);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  public async createAccountType(
    orgId: string,
    ledgerId: string,
    input: CreateAccountTypeInput
  ): Promise<AccountType> {
    const span = this.observability.startSpan('createAccountType');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountTypeName', input.name);

    try {
      const result = await this.accountTypeApiClient.createAccountType(orgId, ledgerId, input);
      span.setAttribute('accountTypeId', result.id);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  public async updateAccountType(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountTypeInput
  ): Promise<AccountType> {
    const span = this.observability.startSpan('updateAccountType');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountTypeId', id);

    try {
      const result = await this.accountTypeApiClient.updateAccountType(orgId, ledgerId, id, input);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  public async deleteAccountType(orgId: string, ledgerId: string, id: string): Promise<void> {
    const span = this.observability.startSpan('deleteAccountType');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountTypeId', id);

    try {
      await this.accountTypeApiClient.deleteAccountType(orgId, ledgerId, id);
      span.setStatus('ok');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
