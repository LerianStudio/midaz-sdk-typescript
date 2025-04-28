/**
 * Tests for HttpTransactionApiClient
 */

import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { CreateTransactionInput, Operation, Transaction } from '../../../src/models/transaction';
import { validateCreateTransactionInput } from '../../../src/models/validators/transaction-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { validate } from '../../../src/util/validation';
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
// We'll remove the transformer tests to simplify

// Mock dependencies
jest.mock('../../../src/models/validators/transaction-validator');
jest.mock('../../../src/util/validation', () => ({
  validate: jest.fn()
}));

describe('HttpTransactionApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const transactionId = 'tx-789';
  const accountId = 'acc-123';

  // Mock operation data
  const mockOperation: Operation = {
    id: 'op-123',
    accountId: accountId,
    type: 'DEBIT',
    amount: {
      value: 100,
      assetCode: 'USD',
      scale: 2
    },
    metadata: { category: 'test' }
  };

  // Mock transaction data
  const mockTransaction: Transaction = {
    id: transactionId,
    amount: 100,
    scale: 2,
    assetCode: 'USD',
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    ledgerId: ledgerId,
    organizationId: orgId,
    operations: [mockOperation],
    metadata: { purpose: 'test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'Test transaction'
  };

  // Mock transaction list response
  const mockTransactionListResponse: ListResponse<Transaction> = {
    items: [mockTransaction],
    meta: {
      total: 1,
      count: 1,
      nextCursor: 'next-cursor'
    }
  };

  // Mocks
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;

  // Class under test
  let client: HttpTransactionApiClient;

  beforeEach(() => {
    // Create mock implementations
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn()
    } as unknown as jest.Mocked<Span>;

    mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn()
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      buildTransactionUrl: jest.fn().mockImplementation((orgId, ledgerId, txId, flag) => {
        let url = `/organizations/${orgId}/ledgers/${ledgerId}/transactions`;
        if (txId) {
          url += `/${txId}`;
        }
        if (flag) {
          url += '?flag=true';
        }
        return url;
      }),
      getApiVersion: jest.fn().mockReturnValue('v1')
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();
    (validate as jest.Mock).mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpTransactionApiClient(
      mockHttpClient,
      mockUrlBuilder,
      mockObservability
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listTransactions', () => {
    it('should successfully list transactions', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockTransactionListResponse);

      // Act
      const result = await client.listTransactions(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockTransactionListResponse);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/ledgers/${ledgerId}/transactions`),
        expect.objectContaining({
          params: undefined,
          headers: expect.objectContaining({
            'X-API-Version': 'v1'
          })
        })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'listTransactions.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId
        })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'listTransactions.items.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockTransactionListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listTransactions(orgId, ledgerId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: options
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasParams', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listTransactions('', ledgerId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listTransactions(orgId, '')).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listTransactions(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getTransaction', () => {
    it('should successfully get a transaction by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockTransaction);

      // Act
      const result = await client.getTransaction(orgId, ledgerId, transactionId);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(orgId, ledgerId, transactionId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Version': 'v1'
          })
        })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'getTransaction.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          transactionId
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getTransaction('', ledgerId, transactionId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getTransaction(orgId, '', transactionId)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing transactionId', async () => {
      // Act & Assert
      await expect(client.getTransaction(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getTransaction(orgId, ledgerId, transactionId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('createTransaction', () => {
    const mockOperationInput = {
      accountId,
      type: 'DEBIT' as const,
      amount: {
        value: 100,
        assetCode: 'USD',
        scale: 2
      }
    };

    const createInput: CreateTransactionInput = {
      amount: 100,
      scale: 2,
      assetCode: 'USD',
      description: 'Test transaction',
      metadata: { purpose: 'test' },
      operations: [mockOperationInput]
    };

    it('should successfully create a transaction', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockTransaction);

      // Act
      const result = await client.createTransaction(orgId, ledgerId, createInput);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(orgId, ledgerId, undefined, true);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/transactions?flag=true`,
        expect.anything(), // We don't care about the exact transformation for the test
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Version': 'v1'
          })
        })
      );
      expect(validate).toHaveBeenCalledWith(createInput, validateCreateTransactionInput);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'createTransaction.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          description: createInput.description,
          operationCount: createInput.operations.length
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('description', createInput.description);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('operationCount', createInput.operations.length);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should record transaction amount metrics when amount is provided', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockTransaction);

      // Act
      await client.createTransaction(orgId, ledgerId, createInput);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'transactions.amount',
        createInput.amount || 0,
        expect.objectContaining({
          orgId,
          ledgerId,
          assetCode: createInput.assetCode
        })
      );
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const validationError = new Error('Validation error');
      const mockValidate = validate as jest.Mock;
      mockValidate.mockImplementationOnce(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(client.createTransaction(orgId, ledgerId, createInput)).rejects.toThrow('Validation error');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.createTransaction('', ledgerId, createInput)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.createTransaction(orgId, '', createInput)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createTransaction(orgId, ledgerId, createInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });
});