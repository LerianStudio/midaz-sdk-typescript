/**
 * @file Tests for the OperationsServiceImpl implementation
 * @description Unit tests for the OperationsService implementation
 */

import { OperationsServiceImpl } from '../../../src/entities/implementations/operations-impl';
import { OperationApiClient } from '../../../src/api/interfaces/operation-api-client';
import { Operation } from '../../../src/models/transaction';
import { ListResponse } from '../../../src/models/common';
import { Observability } from '../../../src/util/observability/observability';
import { ValidationError } from '../../../src/util/validation';

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

describe('OperationsServiceImpl', () => {
  let operationsService: OperationsServiceImpl;
  let operationApiClient: jest.Mocked<OperationApiClient>;
  let mockObservability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const accountId = 'acc_789';
  const operationId = 'op_123';
  const transactionId = 'tx_456';

  const mockOperation: Operation = {
    id: operationId,
    accountId: accountId,
    accountAlias: 'main-account',
    type: 'CREDIT',
    amount: {
      value: 1000,
      assetCode: 'USD',
      scale: 2,
    },
    description: 'Test operation',
    metadata: {
      category: 'test',
    },
  };

  const mockOperationsList: ListResponse<Operation> = {
    items: [mockOperation],
    meta: {
      total: 1,
      count: 1,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock OperationApiClient
    operationApiClient = {
      listOperations: jest.fn().mockImplementation((orgId, ledgerId, accountId) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!accountId) throw new ValidationError('Account ID is required');
        return Promise.resolve(mockOperationsList);
      }),
      getOperation: jest.fn().mockImplementation((orgId, ledgerId, accountId, operationId) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!accountId) throw new ValidationError('Account ID is required');
        if (!operationId) throw new ValidationError('Operation ID is required');
        return Promise.resolve(mockOperation);
      }),
      updateOperation: jest.fn().mockImplementation((orgId, ledgerId, accountId, operationId) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!accountId) throw new ValidationError('Account ID is required');
        if (!operationId) throw new ValidationError('Operation ID is required');
        return Promise.resolve(mockOperation);
      }),
    } as unknown as jest.Mocked<OperationApiClient>;

    // Create mock Observability
    mockObservability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
      }),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    // Create the service instance
    operationsService = new OperationsServiceImpl(operationApiClient, mockObservability);

    // For paginator tests
    jest
      .spyOn(operationsService, 'getOperationPaginator')
      .mockImplementation((orgId, ledgerId, accountId) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!accountId) throw new ValidationError('Account ID is required');

        return {
          hasNext: jest.fn().mockResolvedValue(false),
          next: jest.fn().mockResolvedValue([]),
        };
      });
  });

  describe('listOperations', () => {
    it('should list operations successfully', async () => {
      // Execute
      const result = await operationsService.listOperations(orgId, ledgerId, accountId);

      // Verify
      expect(operationApiClient.listOperations).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        undefined
      );
      expect(result).toEqual(mockOperationsList);
    });

    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = {
        limit: 10,
        offset: 0,
        filter: {
          type: 'CREDIT',
        },
        sort: {
          field: 'createdAt',
          order: 'DESC',
        },
      };

      // Execute
      await operationsService.listOperations(orgId, ledgerId, accountId, listOptions);

      // Verify
      expect(operationApiClient.listOperations).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        listOptions
      );
    });

    it('should throw an error if orgId is missing', async () => {
      // Execute & Verify
      await expect(operationsService.listOperations('', ledgerId, accountId)).rejects.toThrow(
        'Organization ID is required'
      );
    });

    it('should throw an error if ledgerId is missing', async () => {
      // Execute & Verify
      await expect(operationsService.listOperations(orgId, '', accountId)).rejects.toThrow(
        'Ledger ID is required'
      );
    });

    it('should throw an error if accountId is missing', async () => {
      // Execute & Verify
      await expect(operationsService.listOperations(orgId, ledgerId, '')).rejects.toThrow(
        'Account ID is required'
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      operationApiClient.listOperations.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(operationsService.listOperations(orgId, ledgerId, accountId)).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('getOperation', () => {
    it('should get an operation by ID successfully', async () => {
      // Execute
      const result = await operationsService.getOperation(orgId, ledgerId, accountId, operationId);

      // Verify
      expect(operationApiClient.getOperation).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        operationId,
        undefined
      );
      expect(result).toEqual(mockOperation);
    });

    it('should include transaction ID when provided', async () => {
      // Execute
      await operationsService.getOperation(orgId, ledgerId, accountId, operationId, transactionId);

      // Verify
      expect(operationApiClient.getOperation).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        operationId,
        transactionId
      );
    });

    it('should throw an error if orgId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.getOperation('', ledgerId, accountId, operationId)
      ).rejects.toThrow('Organization ID is required');
    });

    it('should throw an error if ledgerId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.getOperation(orgId, '', accountId, operationId)
      ).rejects.toThrow('Ledger ID is required');
    });

    it('should throw an error if accountId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.getOperation(orgId, ledgerId, '', operationId)
      ).rejects.toThrow('Account ID is required');
    });

    it('should throw an error if operationId is missing', async () => {
      // Execute & Verify
      await expect(operationsService.getOperation(orgId, ledgerId, accountId, '')).rejects.toThrow(
        'Operation ID is required'
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      operationApiClient.getOperation.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(
        operationsService.getOperation(orgId, ledgerId, accountId, operationId)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('updateOperation', () => {
    it('should update an operation successfully', async () => {
      // Setup
      const updateInput = {
        metadata: {
          category: 'updated-category',
          note: 'Updated note',
        },
      };
      const updatedOperation = {
        ...mockOperation,
        metadata: updateInput.metadata,
      };
      operationApiClient.updateOperation.mockResolvedValueOnce(updatedOperation);

      // Execute
      const result = await operationsService.updateOperation(
        orgId,
        ledgerId,
        accountId,
        operationId,
        updateInput
      );

      // Verify
      expect(operationApiClient.updateOperation).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        operationId,
        updateInput
      );
      expect(result).toEqual(updatedOperation);
    });

    it('should throw an error if orgId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.updateOperation('', ledgerId, accountId, operationId, {})
      ).rejects.toThrow('Organization ID is required');
    });

    it('should throw an error if ledgerId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.updateOperation(orgId, '', accountId, operationId, {})
      ).rejects.toThrow('Ledger ID is required');
    });

    it('should throw an error if accountId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.updateOperation(orgId, ledgerId, '', operationId, {})
      ).rejects.toThrow('Account ID is required');
    });

    it('should throw an error if operationId is missing', async () => {
      // Execute & Verify
      await expect(
        operationsService.updateOperation(orgId, ledgerId, accountId, '', {})
      ).rejects.toThrow('Operation ID is required');
    });

    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      operationApiClient.updateOperation.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(
        operationsService.updateOperation(orgId, ledgerId, accountId, operationId, {})
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getOperationPaginator', () => {
    it('should return a paginator instance', () => {
      // Execute
      const paginator = operationsService.getOperationPaginator(orgId, ledgerId, accountId);

      // Verify
      expect(paginator).toBeDefined();
      expect(typeof paginator.hasNext).toBe('function');
      expect(typeof paginator.next).toBe('function');
    });
  });

  describe('iterateOperations', () => {
    it('should return an async generator', () => {
      // Execute
      const generator = operationsService.iterateOperations(orgId, ledgerId, accountId);

      // Verify
      expect(generator).toBeDefined();
      expect(generator[Symbol.asyncIterator]).toBeDefined();
    });
  });

  describe('getAllOperations', () => {
    it('should retrieve all operations by handling pagination', async () => {
      // Setup a mock for the getOperationPaginator method
      const mockOperation1 = { ...mockOperation };

      // Create a mock paginator
      const mockPaginator = {
        hasNext: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        next: jest.fn().mockResolvedValueOnce([mockOperation1]),
      };

      // Reset the original spy and create a new one
      jest.spyOn(operationsService, 'getOperationPaginator').mockReset();
      jest.spyOn(operationsService, 'getOperationPaginator').mockReturnValue(mockPaginator);

      // Execute
      const result = await operationsService.getAllOperations(orgId, ledgerId, accountId);

      // Verify
      expect(operationsService.getOperationPaginator).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        undefined
      );
      expect(mockPaginator.hasNext).toHaveBeenCalledTimes(2);
      expect(mockPaginator.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockOperation1]);
    });

    it('should handle empty results', async () => {
      // Setup a mock paginator that returns no results
      const mockPaginator = {
        hasNext: jest.fn().mockResolvedValue(false),
        next: jest.fn().mockResolvedValue([]),
      };

      // Reset the original spy and create a new one
      jest.spyOn(operationsService, 'getOperationPaginator').mockReset();
      jest.spyOn(operationsService, 'getOperationPaginator').mockReturnValue(mockPaginator);

      // Execute
      const result = await operationsService.getAllOperations(orgId, ledgerId, accountId);

      // Verify
      expect(result).toEqual([]);
      expect(mockPaginator.hasNext).toHaveBeenCalledTimes(1);
      expect(mockPaginator.next).not.toHaveBeenCalled();
    });

    it('should throw an error if orgId is missing', async () => {
      // Reset the spy to return the original behavior
      jest.spyOn(operationsService, 'getOperationPaginator').mockReset();
      jest
        .spyOn(operationsService, 'getOperationPaginator')
        .mockImplementation((orgId, ledgerId, accountId) => {
          if (!orgId) throw new ValidationError('Organization ID is required');
          if (!ledgerId) throw new ValidationError('Ledger ID is required');
          if (!accountId) throw new ValidationError('Account ID is required');

          return {
            hasNext: jest.fn().mockResolvedValue(false),
            next: jest.fn().mockResolvedValue([]),
          };
        });

      // Execute & Verify
      await expect(operationsService.getAllOperations('', ledgerId, accountId)).rejects.toThrow(
        'Organization ID is required'
      );
    });

    it('should throw an error if ledgerId is missing', async () => {
      // Execute & Verify
      await expect(operationsService.getAllOperations(orgId, '', accountId)).rejects.toThrow(
        'Ledger ID is required'
      );
    });

    it('should throw an error if accountId is missing', async () => {
      // Execute & Verify
      await expect(operationsService.getAllOperations(orgId, ledgerId, '')).rejects.toThrow(
        'Account ID is required'
      );
    });
  });
});
