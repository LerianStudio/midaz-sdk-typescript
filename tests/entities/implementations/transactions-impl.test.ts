/**
 * @file Tests for the TransactionsServiceImpl implementation
 * @description Unit tests for the TransactionsService implementation and TransactionPaginator
 */

import {
  TransactionPaginatorImpl,
  TransactionsServiceImpl,
} from '../../../src/entities/implementations/transactions-impl';
import { CreateTransactionInput, Operation, Transaction } from '../../../src/models/transaction';
import { ListResponse } from '../../../src/models/common';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error/error-types';
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
      updateTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      cancelTransaction: jest.fn(),
      revertTransaction: jest.fn(),
      createInflow: jest.fn(),
      createOutflow: jest.fn(),
      blockFunds: jest.fn(),
      unblockFunds: jest.fn(),
      createAnnotation: jest.fn(),
      countTransactions: jest.fn(),
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

  describe('updateTransaction', () => {
    const patch = { description: 'audited', metadata: { auditRef: 'X-1' } };

    it('delegates the caller body to the API client under the right ledger', async () => {
      const patched: Transaction = { ...mockTransaction, description: 'audited' };
      mockTransactionApiClient.updateTransaction.mockResolvedValueOnce(patched);

      const result = await transactionsService.updateTransaction(
        orgId,
        ledgerId,
        transactionId,
        patch
      );

      expect(mockTransactionApiClient.updateTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransactionApiClient.updateTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        patch
      );
      expect(result).toBe(patched);
    });

    it('forwards an empty patch untouched, which the ledger answers with the stored transaction', async () => {
      mockTransactionApiClient.updateTransaction.mockResolvedValueOnce(mockTransaction);

      await transactionsService.updateTransaction(orgId, ledgerId, transactionId, {});

      expect(mockTransactionApiClient.updateTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        {}
      );
    });

    it('propagates the client-side rejection of a key the endpoint refuses', async () => {
      const rejected = new Error('externalId is not accepted by this endpoint');
      mockTransactionApiClient.updateTransaction.mockRejectedValueOnce(rejected);

      await expect(
        transactionsService.updateTransaction(orgId, ledgerId, transactionId, patch)
      ).rejects.toBe(rejected);
    });
  });

  describe('state transitions', () => {
    it('delegates commitTransaction to the API client', async () => {
      mockTransactionApiClient.commitTransaction.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.commitTransaction(orgId, ledgerId, transactionId);

      expect(mockTransactionApiClient.commitTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        undefined
      );
      expect(result).toEqual(mockTransaction);
    });

    it('delegates cancelTransaction to the API client', async () => {
      mockTransactionApiClient.cancelTransaction.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.cancelTransaction(orgId, ledgerId, transactionId);

      expect(mockTransactionApiClient.cancelTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        undefined
      );
      expect(result).toEqual(mockTransaction);
    });

    it('delegates revertTransaction with the options the endpoint honours', async () => {
      const reverted: Transaction = {
        ...mockTransaction,
        id: 'txn_reverted',
        parentTransactionId: transactionId,
      };
      mockTransactionApiClient.revertTransaction.mockResolvedValueOnce(reverted);
      const signal = new AbortController().signal;

      const result = await transactionsService.revertTransaction(orgId, ledgerId, transactionId, {
        timeout: 5000,
        signal,
      });

      expect(mockTransactionApiClient.revertTransaction).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        { timeout: 5000, signal }
      );
      expect(result.parentTransactionId).toBe(transactionId);
    });

    it('issues exactly one commit request when the ledger reports the permanent lock', async () => {
      const locked = new MidazError({
        category: ErrorCategory.CONFLICT,
        code: ErrorCode.TRANSACTION_LOCKED,
        midazCode: '0486',
        message: 'Transaction Locked',
        statusCode: 409,
      });
      mockTransactionApiClient.commitTransaction.mockRejectedValue(locked);

      await expect(
        transactionsService.commitTransaction(orgId, ledgerId, transactionId)
      ).rejects.toBe(locked);
      expect(mockTransactionApiClient.commitTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('single-sided flows', () => {
    const inflow = {
      description: 'Deposit',
      send: {
        asset: 'USD',
        value: '100',
        distribute: { to: [{ account: 'acc_123', amount: { asset: 'USD', value: '100' } }] },
      },
    };

    const outflow = {
      description: 'Withdrawal',
      send: {
        asset: 'USD',
        value: '40',
        source: { from: [{ account: 'acc_123', amount: { asset: 'USD', value: '40' } }] },
      },
    };

    it('delegates createInflow to the API client', async () => {
      mockTransactionApiClient.createInflow.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.createInflow(orgId, ledgerId, inflow);

      expect(mockTransactionApiClient.createInflow).toHaveBeenCalledWith(orgId, ledgerId, inflow);
      expect(result).toEqual(mockTransaction);
    });

    it('delegates createOutflow to the API client', async () => {
      mockTransactionApiClient.createOutflow.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.createOutflow(orgId, ledgerId, outflow);

      expect(mockTransactionApiClient.createOutflow).toHaveBeenCalledWith(orgId, ledgerId, outflow);
      expect(result).toEqual(mockTransaction);
    });

    it('propagates a client-side rejection without swallowing it', async () => {
      const rejected = new Error('send.source is not accepted by the inflow endpoint');
      mockTransactionApiClient.createInflow.mockRejectedValueOnce(rejected);

      await expect(transactionsService.createInflow(orgId, ledgerId, inflow)).rejects.toBe(
        rejected
      );
    });

    it('names each flow span after its public method, as the transport layer does', async () => {
      mockTransactionApiClient.createInflow.mockResolvedValueOnce(mockTransaction);
      mockTransactionApiClient.createOutflow.mockResolvedValueOnce(mockTransaction);
      mockTransactionApiClient.blockFunds.mockResolvedValueOnce(mockTransaction);
      mockTransactionApiClient.unblockFunds.mockResolvedValueOnce(mockTransaction);
      mockTransactionApiClient.createAnnotation.mockResolvedValueOnce(mockTransaction);

      const labelInput = {
        ...inflow,
        send: {
          ...inflow.send,
          source: { from: [{ account: 'acc_1', amount: inflow.send.value }] },
        },
      };

      await transactionsService.createInflow(orgId, ledgerId, inflow);
      await transactionsService.createOutflow(orgId, ledgerId, outflow);
      await transactionsService.blockFunds(orgId, ledgerId, labelInput as never);
      await transactionsService.unblockFunds(orgId, ledgerId, labelInput as never);
      await transactionsService.createAnnotation(orgId, ledgerId, labelInput as never);

      const spanNames = observability.startSpan.mock.calls.map(([name]) => name);

      expect(spanNames).toEqual([
        'createInflow',
        'createOutflow',
        'blockFunds',
        'unblockFunds',
        'createAnnotation',
      ]);
    });

    it('keeps the lowercase variant on the metric name', async () => {
      mockTransactionApiClient.blockFunds.mockResolvedValueOnce(mockTransaction);

      await transactionsService.blockFunds(orgId, ledgerId, {
        ...inflow,
        send: { ...inflow.send, source: { from: [] } },
      } as never);

      expect(observability.recordMetric).toHaveBeenCalledWith('transactions.block', 1, {
        orgId,
        ledgerId,
      });
    });
  });

  describe('label-only variants', () => {
    const fullInput = {
      chartOfAccountsGroupName: 'BLOCKS',
      description: 'Block 100',
      send: {
        asset: 'USD',
        value: '100',
        source: { from: [{ account: 'acc_123', amount: { asset: 'USD', value: '100' } }] },
        distribute: { to: [{ account: 'acc_456', amount: { asset: 'USD', value: '100' } }] },
      },
    };

    it('delegates blockFunds to the API client', async () => {
      mockTransactionApiClient.blockFunds.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.blockFunds(orgId, ledgerId, fullInput);

      expect(mockTransactionApiClient.blockFunds).toHaveBeenCalledWith(orgId, ledgerId, fullInput);
      expect(result).toEqual(mockTransaction);
    });

    it('delegates unblockFunds to the API client', async () => {
      mockTransactionApiClient.unblockFunds.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.unblockFunds(orgId, ledgerId, fullInput);

      expect(mockTransactionApiClient.unblockFunds).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        fullInput
      );
      expect(result).toEqual(mockTransaction);
    });

    it('delegates createAnnotation to the API client', async () => {
      mockTransactionApiClient.createAnnotation.mockResolvedValueOnce(mockTransaction);

      const result = await transactionsService.createAnnotation(orgId, ledgerId, fullInput);

      expect(mockTransactionApiClient.createAnnotation).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        fullInput
      );
      expect(result).toEqual(mockTransaction);
    });

    it('propagates the annotation validator rejection without swallowing it', async () => {
      const rejected = new Error('pending is not accepted by the annotation endpoint');
      mockTransactionApiClient.createAnnotation.mockRejectedValueOnce(rejected);

      await expect(transactionsService.createAnnotation(orgId, ledgerId, fullInput)).rejects.toBe(
        rejected
      );
    });
  });

  // Unlike the other six counts, this one is windowed: with no dates the ledger answers
  // today's number, so the window the caller named has to reach the client verbatim.
  describe('countTransactions', () => {
    it('forwards the window and the filters the caller named', async () => {
      mockTransactionApiClient.countTransactions.mockResolvedValueOnce(46);
      const options = {
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-07T23:59:59Z',
        status: 'APPROVED',
      } as const;

      const result = await transactionsService.countTransactions(orgId, ledgerId, options);

      expect(mockTransactionApiClient.countTransactions).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        options
      );
      expect(result).toBe(46);
    });

    it('forwards the deliberate opt-in to the ledger default window', async () => {
      mockTransactionApiClient.countTransactions.mockResolvedValueOnce(3);

      const result = await transactionsService.countTransactions(orgId, ledgerId, {
        window: 'today',
      });

      expect(mockTransactionApiClient.countTransactions).toHaveBeenCalledWith(orgId, ledgerId, {
        window: 'today',
      });
      expect(result).toBe(3);
    });

    it('lets the client-side refusal of a half-open window through', async () => {
      mockTransactionApiClient.countTransactions.mockRejectedValueOnce(
        new Error('startDate and endDate must be given together')
      );

      await expect(
        transactionsService.countTransactions(orgId, ledgerId, {
          startDate: '2026-08-01T00:00:00Z',
        } as never)
      ).rejects.toThrow('startDate and endDate must be given together');
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
      commitTransaction: jest.fn(),
      cancelTransaction: jest.fn(),
      revertTransaction: jest.fn(),
      createInflow: jest.fn(),
      createOutflow: jest.fn(),
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
