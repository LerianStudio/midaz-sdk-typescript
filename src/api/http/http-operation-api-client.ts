/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import { Operation } from '../../models/transaction';
import { HttpClient } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { ValidationError } from '../../util/validation';
import { OperationApiClient } from '../interfaces/operation-api-client';
import { UrlBuilder } from '../url-builder';

import { HttpBaseApiClient } from './http-base-api-client';

/**
 * HTTP implementation of the OperationApiClient interface
 *
 * This class handles HTTP communication with operation endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpOperationApiClient
  extends HttpBaseApiClient<Operation, never, Record<string, any>>
  implements OperationApiClient
{
  /**
   * Creates a new HttpOperationApiClient
   *
   */
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-operation-api-client', observability);
  }

  /**
   * Lists operations for a specific organization, ledger, and account
   *
   * @returns Promise resolving to a paginated list of operations
   */
  public async listOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    options?: ListOptions
  ): Promise<ListResponse<Operation>> {
    const attributes = { orgId, ledgerId, accountId };

    this.validateParamsInSpan(attributes, attributes);

    const url = this.urlBuilder.buildAccountOperationUrl(orgId, ledgerId, accountId);

    const result = await this.getRequest<ListResponse<Operation>>(
      'listOperations',
      url,
      { params: options },
      attributes
    );

    this.recordMetrics('operations.list.count', result.items.length, attributes);
    this.recordDirectionMetrics(result.items, attributes);

    return result;
  }

  /**
   * Gets an operation by ID
   *
   * @returns Promise resolving to the operation
   */
  public async getOperation(
    orgId: string,
    ledgerId: string,
    accountId: string,
    operationId: string
  ): Promise<Operation> {
    const attributes = { orgId, ledgerId, accountId, operationId };

    this.validateParamsInSpan(attributes, attributes);

    const url = this.urlBuilder.buildAccountOperationUrl(orgId, ledgerId, accountId, operationId);

    const result = await this.getRequest<Operation>('getOperation', url, undefined, attributes);

    this.recordMetrics('operation.get', 1, {
      ...attributes,
      operationType: result.type || 'unknown',
    });

    return result;
  }

  /**
   * Updates an existing operation
   *
   * @returns Promise resolving to the updated operation
   */
  public async updateOperation(
    orgId: string,
    ledgerId: string,
    accountId: string | undefined,
    operationId: string,
    input: Record<string, any>,
    transactionId: string
  ): Promise<Operation> {
    const attributes = { orgId, ledgerId, accountId, operationId, transactionId };
    const span = this.startSpan('validateParams', attributes);

    try {
      this.validateRequiredParams(span, { orgId, ledgerId, operationId });

      if (!transactionId) {
        const error = new ValidationError(
          'transactionId is required: operations are updated through PATCH /organizations/{orgId}/ledgers/{ledgerId}/transactions/{transactionId}/operations/{operationId}',
          { transactionId: ['transactionId is required'] }
        );
        span.recordException(error);
        throw error;
      }
    } finally {
      span.end();
    }

    const requestAttributes: Record<string, any> = { ...attributes };
    if (input?.metadata) {
      requestAttributes.updatedMetadata = true;
    }

    const url = this.urlBuilder.buildTransactionOperationUrl(
      orgId,
      ledgerId,
      transactionId,
      operationId
    );

    const result = await this.patchRequest<Operation>(
      'updateOperation',
      url,
      input,
      undefined,
      requestAttributes
    );

    this.recordMetrics('operation.update', 1, {
      ...attributes,
      operationType: result.type || 'unknown',
    });

    return result;
  }

  /**
   * Records the DEBIT and CREDIT breakdown of a listing
   *
   */
  private recordDirectionMetrics(items: Operation[], attributes: Record<string, any>): void {
    const debitCount = items.filter((op) => op.type === 'DEBIT').length;
    const creditCount = items.filter((op) => op.type === 'CREDIT').length;

    if (debitCount > 0) {
      this.recordMetrics('operations.debit.count', debitCount, attributes);
    }

    if (creditCount > 0) {
      this.recordMetrics('operations.credit.count', creditCount, attributes);
    }
  }
}
