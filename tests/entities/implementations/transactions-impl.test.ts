/**
 * @file Tests for the TransactionsServiceImpl implementation
 * @description Unit tests for the TransactionsService implementation and TransactionPaginator
 */

import {
  TransactionPaginatorImpl,
  TransactionsServiceImpl,
} from '../../../src/entities/implementations/transactions-impl';
import { MidazConfig } from '../../../src/client';
import { CreateTransactionInput, Operation, Transaction } from '../../../src/models/transaction';
import { ListResponse } from '../../../src/models/common';
import { Observability } from '../../../src/util/observability';
import { TransactionApiClient } from '../../../src/api/interfaces/transaction-api-client';

// Mock the Observability
jest.mock('../../../src/util/observability/observability', () => {
  return {
    Observability: jest.fn().mockImplementation(() => {
      return {
        startSpan: jest.fn().mockReturnValue({
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          setStatus: jest.fn(),
          end: jest.fn(),
        }),
        recordMetric: jest.fn(),
      };
    }),
  };
});

describe('TransactionsServiceImpl', () => {
  let transactionsService: TransactionsServiceImpl;
  let mockTransactionApiClient: jest.Mocked<TransactionApiClient>;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const transactionId = 'txn_789';

  const mockOperation: Operation = {
    id: 'op_123',
    accountId: 'acc_123',
    amount: {
      value: '100.00',
      assetCode: 'USD',
      scale: 2,
    },
    type: 'DEBIT',
  };

  const mockTransaction: Transaction = {
    id: transactionId,
    amount: 100,
    scale: 2,
    assetCode: 'USD',
    status: {
      code: 'COMPLETED',
      timestamp: '2023-01-01T00:00:00Z',
    },
    ledgerId: ledgerId,
    organizationId: orgId,
    operations: [
      mockOperation,
      {
        id: 'op_456',
        accountId: 'acc_456',
        amount: {
          value: '100.00',
          assetCode: 'USD',
          scale: 2,
        },
        type: 'CREDIT',
      },
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockTransactionsList: ListResponse<Transaction> = {
    items: [mockTransaction],
    meta: {
      total: 1,
      count: 1,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock TransactionApiClient
    mockTransactionApiClient = {
      listTransactions: jest.fn(),
      getTransaction: jest.fn(),
      createTransaction: jest.fn(),
    } as unknown as jest.Mocked<TransactionApiClient>;

    // Create a mock Observability instance
    observability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
      }),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    // Create the service instance
    transactionsService = new TransactionsServiceImpl(mockTransactionApiClient, observability);
  });

  describe('listTransactions', () => {
    it('should list transactions successfully', async () => {
      // Setup
      mockTransactionApiClient.listTransactions.mockResolvedValueOnce(mockTransactionsList);

      // Execute
      const result = await transactionsService.listTransactions(orgId, ledgerId);

      // Verify
      expect(mockTransactionApiClient.listTransactions).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined
      );
      expect(result).toEqual(mockTransactionsList);
    });

    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = {
        limit: 5,
        offset: 10,
        filter: { status: 'COMPLETED' },
      };
      mockTransactionApiClient.listTransactions.mockResolvedValueOnce(mockTransactionsList);

      // Execute
      const result = await transactionsService.listTransactions(orgId, ledgerId, listOptions);

      // Verify
      expect(mockTransactionApiClient.listTransactions).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        listOptions
      );
      expect(result).toEqual(mockTransactionsList);
    });

    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      mockTransactionApiClient.listTransactions.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(transactionsService.listTransactions('', ledgerId)).rejects.toThrow(
        'Organization ID is required'
      );
      expect(mockTransactionApiClient.listTransactions).toHaveBeenCalledWith(
        '',
        ledgerId,
        undefined
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockTransactionApiClient.listTransactions.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(transactionsService.listTransactions(orgId, ledgerId)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('getTransaction', () => {
    it('should get a transaction by ID successfully', async () => {
      // Setup
      mockTransactionApiClient.getTransaction.mockResolvedValueOnce(mockTransaction);

      // Execute
      const result = await transactionsService.getTransaction(orgId, ledgerId, transactionId);

      // Verify
      expect(mockTransactionApiClient.getTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      mockTransactionApiClient.getTransaction.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(transactionsService.getTransaction('', ledgerId, transactionId)).rejects.toThrow(
        'Organization ID is required'
      );
      expect(mockTransactionApiClient.getTransaction).toHaveBeenCalledWith(
        '',
        ledgerId,
        transactionId
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockTransactionApiClient.getTransaction.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(
        transactionsService.getTransaction(orgId, ledgerId, transactionId)
      ).rejects.toThrow('API Error');
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      // Setup
      const createInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_123',
            type: 'DEBIT',
            amount: {
              value: '100.00',
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_456',
            type: 'CREDIT',
            amount: {
              value: '100.00',
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      mockTransactionApiClient.createTransaction.mockResolvedValueOnce(mockTransaction);

      // Execute
      const result = await transactionsService.createTransaction(orgId, ledgerId, createInput);

      // Verify
      expect(mockTransactionApiClient.createTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        createInput
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should delegate validation to the API client', async () => {
      // Setup
      const createInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_123',
            type: 'DEBIT',
            amount: {
              value: '100.00',
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_456',
            type: 'CREDIT',
            amount: {
              value: '100.00',
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const validationError = new Error('Validation failed');
      mockTransactionApiClient.createTransaction.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(
        transactionsService.createTransaction('', ledgerId, createInput)
      ).rejects.toThrow('Validation failed');
      expect(mockTransactionApiClient.createTransaction).toHaveBeenCalledWith(
        '',
        ledgerId,
        createInput
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const createInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_123',
            type: 'DEBIT',
            amount: {
              value: '100.00',
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_456',
            type: 'CREDIT',
            amount: {
              value: '100.00',
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };
      const apiError = new Error('API Error');
      mockTransactionApiClient.createTransaction.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(
        transactionsService.createTransaction(orgId, ledgerId, createInput)
      ).rejects.toThrow('API Error');
    });
  });
});

describe('TransactionPaginatorImpl', () => {
  let mockTransactionApiClient: jest.Mocked<TransactionApiClient>;
  let paginator: TransactionPaginatorImpl;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const transactionId = 'txn_789';

  const mockTransaction: Transaction = {
    id: transactionId,
    amount: 100,
    scale: 2,
    assetCode: 'USD',
    status: {
      code: 'COMPLETED',
      timestamp: '2023-01-01T00:00:00Z',
    },
    ledgerId: ledgerId,
    organizationId: orgId,
    operations: [
      {
        id: 'op_123',
        accountId: 'acc_123',
        amount: {
          value: '100.00',
          assetCode: 'USD',
          scale: 2,
        },
        type: 'DEBIT',
      },
      {
        id: 'op_456',
        accountId: 'acc_456',
        amount: {
          value: '100.00',
          assetCode: 'USD',
          scale: 2,
        },
        type: 'CREDIT',
      },
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock TransactionApiClient
    mockTransactionApiClient = {
      listTransactions: jest.fn(),
      getTransaction: jest.fn(),
      createTransaction: jest.fn(),
    } as unknown as jest.Mocked<TransactionApiClient>;

    // Create a mock Observability instance
    observability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
      }),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    // Create the paginator
    paginator = new TransactionPaginatorImpl(
      mockTransactionApiClient,
      orgId,
      ledgerId,
      { limit: 1 },
      observability
    );

    // Mock the private properties for testing
    Object.defineProperties(paginator, {
      currentResponse: {
        value: {
          items: [mockTransaction],
          meta: {
            total: 100,
            count: 1,
          },
        },
        writable: true,
      },
      currentPage: {
        value: [mockTransaction],
        writable: true,
      },
      hasMorePages: {
        value: true,
        writable: true,
      },
      nextCursor: {
        value: 'next_cursor',
        writable: true,
      },
    });
  });

  describe('hasNext', () => {
    it('should return true if there are more pages', async () => {
      // Execute & Verify
      expect(await paginator.hasNext()).toBe(true);
    });

    it('should return false if there are no more pages', async () => {
      // Setup
      Object.defineProperty(paginator, 'hasMorePages', {
        value: false,
        writable: true,
      });

      // Execute & Verify
      expect(await paginator.hasNext()).toBe(false);
    });
  });

  describe('next', () => {
    it('should return the next page of transactions', async () => {
      // Setup
      const mockTransactions = [mockTransaction];
      mockTransactionApiClient.listTransactions.mockResolvedValueOnce({
        items: mockTransactions,
        meta: {
          total: 100,
          count: 1,
          nextCursor: 'another_cursor',
        },
      });

      // Execute
      const result = await paginator.next();

      // Verify
      expect(mockTransactionApiClient.listTransactions).toHaveBeenCalledWith(orgId, ledgerId, {
        limit: 1,
        cursor: 'next_cursor',
      });
      expect(result).toEqual(mockTransactions);

      // Check that the private properties were updated correctly
      expect(paginator['nextCursor']).toBe('another_cursor');
      expect(paginator['hasMorePages']).toBe(true);
    });

    it('should return an empty array if there are no more pages', async () => {
      // Setup
      Object.defineProperty(paginator, 'hasMorePages', {
        value: false,
        writable: true,
      });

      // Execute & Verify
      const result = await paginator.next();
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockTransactionApiClient.listTransactions.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(paginator.next()).rejects.toThrow('API Error');
    });
  });
});
