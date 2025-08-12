/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import { CreateTransactionInput, Transaction } from '../../models/transaction';
import { transactionTransformer } from '../../models/transaction-transformer';
import { validateCreateTransactionInput } from '../../models/validators/transaction-validator';
import { transformRequest } from '../../util/data/model-transformer';
import { HttpClient } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { TransactionApiClient } from '../interfaces/transaction-api-client';
import { UrlBuilder } from '../url-builder';

import { HttpBaseApiClient } from './http-base-api-client';

/**
 * HTTP implementation of the TransactionApiClient interface
 *
 * This class handles HTTP communication with transaction endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpTransactionApiClient
  extends HttpBaseApiClient<Transaction, CreateTransactionInput, never>
  implements TransactionApiClient
{
  /**
   * Creates a new HttpTransactionApiClient
   *
   */
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-transaction-api-client', observability);
  }

  /**
   * Lists transactions for a specific organization and ledger
   *
   * @returns Promise resolving to a paginated list of transactions
   */
  public async listTransactions(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Transaction>> {
    // Validate required parameters before making the request
    this.validateRequiredParams(this.startSpan('validateParams', { orgId, ledgerId }), {
      orgId,
      ledgerId,
    });

    // Build the URL for the request
    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId);

    // Make the request
    return this.getRequest<ListResponse<Transaction>>(
      'listTransactions',
      url,
      { params: options },
      { orgId, ledgerId }
    );
  }

  /**
   * Gets a transaction by ID
   *
   * @returns Promise resolving to the transaction
   */
  public async getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction> {
    // Validate required parameters before making the request
    this.validateRequiredParams(
      this.startSpan('validateParams', { orgId, ledgerId, transactionId: id }),
      { orgId, ledgerId, id }
    );

    // Build the URL for the request
    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId, id);

    // Make the request
    return this.getRequest<Transaction>('getTransaction', url, undefined, {
      orgId,
      ledgerId,
      transactionId: id,
    });
  }

  /**
   * Creates a new transaction
   *
   * @returns Promise resolving to the created transaction
   */
  public async createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction> {
    // Prepare span attributes
    const attributes = {
      orgId,
      ledgerId,
      description: input.description,
      externalId: input.externalId,
      operationCount: input.operations?.length || 0,
    };

    // Validate required parameters before making the request
    this.validateRequiredParams(this.startSpan('validateParams', attributes), { orgId, ledgerId });

    // Validate input
    validate(input, validateCreateTransactionInput);

    // Transform input to the format expected by the backend
    const libTransaction = transformRequest(transactionTransformer, input);

    // Build the URL for the request with the transaction flag
    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId, undefined, true);

    // Make the request
    const result = await this.postRequest<Transaction>(
      'createTransaction',
      url,
      libTransaction,
      undefined,
      attributes
    );

    // Record transaction amount metrics if available
    if (input.amount) {
      const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
      this.recordMetrics('transactions.amount', amount, {
        orgId,
        ledgerId,
        assetCode: input.assetCode || 'unknown',
      });
    }

    return result;
  }
}
