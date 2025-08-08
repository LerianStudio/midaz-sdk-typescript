/**
 * Account Types Service Implementation
 */

import { AccountTypesService } from '../account-types';
import { AccountType, CreateAccountTypeInput, UpdateAccountTypeInput } from '../../models/account-type';
import { PaginatedResponse, ListOptions } from '../../models/common';
import { AccountTypeApiClient } from '../../api/interfaces/account-type-api-client';
import { Observability } from '../../util/observability/observability';
import { logger } from '../../util/observability/logger-instance';

/**
 * Implementation of AccountTypesService
 */
export class AccountTypesServiceImpl implements AccountTypesService {
  constructor(
    private readonly apiClient: AccountTypeApiClient,
    private readonly observability?: Observability
  ) {}

  /**
   * List account types for a ledger
   */
  async listAccountTypes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<AccountType>> {
    const span = this.observability?.startSpan('AccountTypesService.listAccountTypes');
    
    try {
      logger.debug('Listing account types', {
        organizationId,
        ledgerId,
        options
      });

      const result = await this.apiClient.listAccountTypes(organizationId, ledgerId, options);
      
      logger.debug('Account types listed successfully', {
        organizationId,
        ledgerId,
        count: result.items.length,
        total: result.totalCount
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to list account types', {
        organizationId,
        ledgerId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Get a specific account type
   */
  async getAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string
  ): Promise<AccountType> {
    const span = this.observability?.startSpan('AccountTypesService.getAccountType');
    
    try {
      logger.debug('Getting account type', {
        organizationId,
        ledgerId,
        accountTypeId
      });

      const result = await this.apiClient.getAccountType(organizationId, ledgerId, accountTypeId);
      
      logger.debug('Account type retrieved successfully', {
        organizationId,
        ledgerId,
        accountTypeId,
        accountTypeName: result.name,
        keyValue: result.keyValue
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to get account type', {
        organizationId,
        ledgerId,
        accountTypeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Create a new account type
   */
  async createAccountType(
    organizationId: string,
    ledgerId: string,
    input: CreateAccountTypeInput
  ): Promise<AccountType> {
    const span = this.observability?.startSpan('AccountTypesService.createAccountType');
    
    try {
      logger.debug('Creating account type', {
        organizationId,
        ledgerId,
        input: {
          name: input.name,
          keyValue: input.keyValue,
          hasDescription: !!input.description,
          hasMetadata: !!input.metadata
        }
      });

      // Basic validation
      if (!input.name?.trim()) {
        throw new Error('Account type name is required');
      }
      if (!input.keyValue?.trim()) {
        throw new Error('Account type keyValue is required');
      }

      const result = await this.apiClient.createAccountType(organizationId, ledgerId, input);
      
      logger.info('Account type created successfully', {
        organizationId,
        ledgerId,
        accountTypeId: result.id,
        accountTypeName: result.name,
        keyValue: result.keyValue
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to create account type', {
        organizationId,
        ledgerId,
        inputName: input.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
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
    const span = this.observability?.startSpan('AccountTypesService.updateAccountType');
    
    try {
      logger.debug('Updating account type', {
        organizationId,
        ledgerId,
        accountTypeId,
        input: {
          hasName: !!input.name,
          hasDescription: !!input.description,
          hasMetadata: !!input.metadata
        }
      });

      const result = await this.apiClient.updateAccountType(organizationId, ledgerId, accountTypeId, input);
      
      logger.info('Account type updated successfully', {
        organizationId,
        ledgerId,
        accountTypeId,
        accountTypeName: result.name,
        keyValue: result.keyValue
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to update account type', {
        organizationId,
        ledgerId,
        accountTypeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Delete an account type
   */
  async deleteAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string
  ): Promise<void> {
    const span = this.observability?.startSpan('AccountTypesService.deleteAccountType');
    
    try {
      logger.debug('Deleting account type', {
        organizationId,
        ledgerId,
        accountTypeId
      });

      await this.apiClient.deleteAccountType(organizationId, ledgerId, accountTypeId);
      
      logger.info('Account type deleted successfully', {
        organizationId,
        ledgerId,
        accountTypeId
      });

      span?.setStatus('ok'); // SUCCESS
    } catch (error) {
      logger.error('Failed to delete account type', {
        organizationId,
        ledgerId,
        accountTypeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }
}