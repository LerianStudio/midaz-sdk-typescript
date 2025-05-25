/**
 * Tests for HttpOperationApiClient
 */

import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { Operation } from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpOperationApiClient } from '../../../src/api/http/http-operation-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';

describe('HttpOperationApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const accountId = 'acc-789';
  const operationId = 'op-123';
  const transactionId = 'tx-456';

  // Mock amount data
  const mockAmount = {
    value: 100,
    assetCode: 'USD',
    scale: 2,
  };

  // Mock operation data
  const mockOperation: Operation = {
    id: operationId,
    accountId: accountId,
    accountAlias: 'Main Account',
    type: 'DEBIT',
    amount: mockAmount,
    description: 'Test operation',
    metadata: { category: 'test' },
  };

  // Mock operation list response
  const mockOperationListResponse: ListResponse<Operation> = {
    items: [
      mockOperation,
      {
        ...mockOperation,
        id: 'op-124',
        type: 'CREDIT',
      },
    ],
    meta: {
      total: 2,
      count: 2,
      nextCursor: 'next-cursor',
    },
  };

  // Mocks
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;

  // Class under test
  let client: HttpOperationApiClient;

  beforeEach(() => {
    // Create mock implementations
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      getBaseUrl: jest.fn().mockReturnValue('https://api.example.com'),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();

    // Create client instance
    client = new HttpOperationApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listOperations', () => {
    it('should successfully list operations', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOperationListResponse);

      // Act
      const result = await client.listOperations(orgId, ledgerId, accountId);

      // Assert
      expect(result).toEqual(mockOperationListResponse);
      expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(
          `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations`
        ),
        { params: undefined }
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'operations.list.count',
        2,
        expect.objectContaining({
          orgId,
          ledgerId,
          accountId,
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should record separate metrics for debit and credit operations', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOperationListResponse);

      // Act
      await client.listOperations(orgId, ledgerId, accountId);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'operations.debit.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          accountId,
        })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'operations.credit.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          accountId,
        })
      );
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOperationListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listOperations(orgId, ledgerId, accountId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.any(String), { params: options });
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listOperations('', ledgerId, accountId)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listOperations(orgId, '', accountId)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(client.listOperations(orgId, ledgerId, '')).rejects.toThrow(
        'accountId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listOperations(orgId, ledgerId, accountId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getOperation', () => {
    it('should successfully get an operation by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOperation);

      // Act
      const result = await client.getOperation(orgId, ledgerId, accountId, operationId);

      // Assert
      expect(result).toEqual(mockOperation);
      expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(
          `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations/${operationId}`
        )
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'operation.get',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          accountId,
          operationId,
          operationType: 'DEBIT',
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should include transactionId in the URL when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOperation);

      // Act
      await client.getOperation(orgId, ledgerId, accountId, operationId, transactionId);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`?transactionId=${transactionId}&operationId=${operationId}`)
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('transactionId', transactionId);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getOperation('', ledgerId, accountId, operationId)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getOperation(orgId, '', accountId, operationId)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(client.getOperation(orgId, ledgerId, '', operationId)).rejects.toThrow(
        'accountId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing operationId', async () => {
      // Act & Assert
      await expect(client.getOperation(orgId, ledgerId, accountId, '')).rejects.toThrow(
        'operationId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getOperation(orgId, ledgerId, accountId, operationId)).rejects.toThrow(
        'API Error'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('updateOperation', () => {
    const updateInput = {
      metadata: { category: 'updated' },
    };

    it('should successfully update an operation', async () => {
      // Arrange
      const updatedOperation = {
        ...mockOperation,
        metadata: updateInput.metadata,
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedOperation);

      // Act
      const result = await client.updateOperation(
        orgId,
        ledgerId,
        accountId,
        operationId,
        updateInput
      );

      // Assert
      expect(result).toEqual(updatedOperation);
      expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations/${operationId}`
        ),
        updateInput
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'operation.update',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          accountId,
          operationId,
          operationType: 'DEBIT',
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation('', ledgerId, accountId, operationId, updateInput)
      ).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation(orgId, '', accountId, operationId, updateInput)
      ).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation(orgId, ledgerId, '', operationId, updateInput)
      ).rejects.toThrow('accountId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing operationId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation(orgId, ledgerId, accountId, '', updateInput)
      ).rejects.toThrow('operationId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        client.updateOperation(orgId, ledgerId, accountId, operationId, updateInput)
      ).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('private methods', () => {
    describe('buildOperationsUrl', () => {
      it('should build the correct operations URL', async () => {
        // Use listOperations to indirectly test the private method
        mockHttpClient.get.mockResolvedValueOnce(mockOperationListResponse);

        await client.listOperations(orgId, ledgerId, accountId);

        // Check that the URL was built correctly
        expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations`
          ),
          expect.any(Object)
        );
      });
    });

    describe('buildOperationUrl', () => {
      it('should build the correct operation URL', async () => {
        // Use getOperation to indirectly test the private method
        mockHttpClient.get.mockResolvedValueOnce(mockOperation);

        await client.getOperation(orgId, ledgerId, accountId, operationId);

        // Check that the URL was built correctly
        expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations/${operationId}`
          )
        );
      });

      it('should build the correct operation URL with transactionId', async () => {
        // Use getOperation to indirectly test the private method
        mockHttpClient.get.mockResolvedValueOnce(mockOperation);

        await client.getOperation(orgId, ledgerId, accountId, operationId, transactionId);

        // Check that the URL was built correctly
        expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          expect.stringContaining(`?transactionId=${transactionId}&operationId=${operationId}`)
        );
      });
    });

    describe('validateRequiredParams', () => {
      it('should validate required parameters and throw error if missing', async () => {
        // Test with missing parameters indirectly through getOperation
        await expect(client.getOperation('', ledgerId, accountId, operationId)).rejects.toThrow(
          'orgId is required'
        );
        await expect(client.getOperation(orgId, '', accountId, operationId)).rejects.toThrow(
          'ledgerId is required'
        );
        await expect(client.getOperation(orgId, ledgerId, '', operationId)).rejects.toThrow(
          'accountId is required'
        );
        await expect(client.getOperation(orgId, ledgerId, accountId, '')).rejects.toThrow(
          'operationId is required'
        );

        // Verify the error is recorded on the span
        expect(mockSpan.recordException).toHaveBeenCalled();
      });
    });

    describe('recordMetrics', () => {
      it('should record metrics with the observability provider', async () => {
        // Use a public method to indirectly test the private recordMetrics method
        mockHttpClient.get.mockResolvedValueOnce(mockOperation);

        // Act
        await client.getOperation(orgId, ledgerId, accountId, operationId);

        // Assert
        expect(mockObservability.recordMetric).toHaveBeenCalledWith(
          'operation.get',
          1,
          expect.objectContaining({
            orgId,
            ledgerId,
            accountId,
            operationId,
            operationType: 'DEBIT',
          })
        );
      });
    });
  });
});
