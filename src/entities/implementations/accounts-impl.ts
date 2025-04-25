/**
 * Accounts service implementation
 */

import { AccountApiClient } from '../../api/interfaces/account-api-client';
import { Account, CreateAccountInput, UpdateAccountInput } from '../../models/account';
import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';
import { AccountsService } from '../accounts';

/**
 * Implementation of the AccountsService interface
 */
export class AccountsServiceImpl implements AccountsService {
  /** Observability instance */
  private readonly observability: Observability;

  /**
   * Creates a new AccountsServiceImpl
   * @param accountApiClient API client for account operations
   * @param observability Optional observability instance
   */
  constructor(
    private readonly accountApiClient: AccountApiClient,
    observability?: Observability
  ) {
    this.observability = observability || new Observability({
      serviceName: 'midaz-accounts-service',
      enableTracing: process.env.MIDAZ_ENABLE_TRACING?.toLowerCase() === 'true',
      enableMetrics: process.env.MIDAZ_ENABLE_METRICS?.toLowerCase() === 'true',
    });
  }

  /** @inheritdoc */
  public async listAccounts(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Account>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccounts');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.listAccounts(orgId, ledgerId, opts);

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

  /** @inheritdoc */
  public async getAccount(orgId: string, ledgerId: string, id: string): Promise<Account> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', id);

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.getAccount(orgId, ledgerId, id);

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

  /** @inheritdoc */
  public async createAccount(
    orgId: string,
    ledgerId: string,
    input: CreateAccountInput
  ): Promise<Account> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountName', input.name);
    span.setAttribute('assetCode', input.assetCode);
    span.setAttribute('accountType', input.type);

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.createAccount(orgId, ledgerId, input);

      span.setAttribute('accountId', result.id);
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

  /** @inheritdoc */
  public async updateAccount(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountInput
  ): Promise<Account> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', id);

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.updateAccount(orgId, ledgerId, id, input);

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

  /** @inheritdoc */
  public async deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', id);

    try {
      // Delegate to the API client
      await this.accountApiClient.deleteAccount(orgId, ledgerId, id);

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
