/**
 * Tests for HttpOperationApiClient
 */

import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { Operation } from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpOperationApiClient } from '../../../src/api/http/http-operation-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ValidationError } from '../../../src/util/validation';

const URL_ENV_KEYS = ['MIDAZ_LEDGER_URL', 'MIDAZ_ONBOARDING_URL', 'MIDAZ_TRANSACTION_URL'];

describe('HttpOperationApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const accountId = 'acc-789';
  const operationId = 'op-123';
  const transactionId = 'tx-456';

  const accountOperationsUrl = `https://api.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations`;
  const accountOperationUrl = `${accountOperationsUrl}/${operationId}`;
  const transactionOperationUrl = `https://api.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}/operations/${operationId}`;

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
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      getApiVersion: jest.fn().mockReturnValue('v1'),
      getBaseUrl: jest.fn().mockReturnValue('https://api.example.com'),
      buildAccountOperationUrl: jest
        .fn()
        .mockImplementation((_org: string, _ledger: string, _account: string, opId?: string) =>
          opId ? accountOperationUrl : accountOperationsUrl
        ),
      buildTransactionOperationUrl: jest.fn().mockReturnValue(transactionOperationUrl),
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
      expect(mockUrlBuilder.buildAccountOperationUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(accountOperationsUrl, expect.any(Object));
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
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        accountOperationsUrl,
        expect.objectContaining({ params: options })
      );
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
      expect(mockUrlBuilder.buildAccountOperationUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        operationId
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(accountOperationUrl, expect.any(Object));
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

    it('should read the account-scoped path only, the ledger serves no transaction-scoped GET', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOperation);

      // Act
      await client.getOperation(orgId, ledgerId, accountId, operationId);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(accountOperationUrl, expect.any(Object));
      expect(mockUrlBuilder.buildTransactionOperationUrl).not.toHaveBeenCalled();
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('transactionId', expect.anything());
    });

    it('should take no transactionId argument', () => {
      expect(client.getOperation).toHaveLength(4);
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

    it('should patch the transaction-scoped operation path', async () => {
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
        updateInput,
        transactionId
      );

      // Assert
      expect(result).toEqual(updatedOperation);
      expect(mockUrlBuilder.buildTransactionOperationUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        operationId
      );
      expect(mockUrlBuilder.buildAccountOperationUrl).not.toHaveBeenCalled();
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        transactionOperationUrl,
        updateInput,
        expect.any(Object)
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'operation.update',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          accountId,
          operationId,
          transactionId,
          operationType: 'DEBIT',
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw a validation error when transactionId is missing', async () => {
      // Act & Assert
      await expect(
        client.updateOperation(orgId, ledgerId, accountId, operationId, updateInput)
      ).rejects.toThrow(ValidationError);
      await expect(
        client.updateOperation(orgId, ledgerId, accountId, operationId, updateInput)
      ).rejects.toThrow(/transactionId is required/);
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation('', ledgerId, accountId, operationId, updateInput, transactionId)
      ).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation(orgId, '', accountId, operationId, updateInput, transactionId)
      ).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should patch the transaction-scoped path without an accountId', async () => {
      // Arrange
      mockHttpClient.patch.mockResolvedValueOnce(mockOperation);

      // Act
      const result = await client.updateOperation(
        orgId,
        ledgerId,
        undefined,
        operationId,
        updateInput,
        transactionId
      );

      // Assert
      expect(result).toEqual(mockOperation);
      expect(mockUrlBuilder.buildTransactionOperationUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        operationId
      );
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        transactionOperationUrl,
        updateInput,
        expect.any(Object)
      );
      expect(mockSpan.recordException).not.toHaveBeenCalled();
    });

    it('should throw error when missing operationId', async () => {
      // Act & Assert
      await expect(
        client.updateOperation(orgId, ledgerId, accountId, '', updateInput, transactionId)
      ).rejects.toThrow('operationId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        client.updateOperation(orgId, ledgerId, accountId, operationId, updateInput, transactionId)
      ).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('versioned paths against midaz main', () => {
    const ledgerBaseUrl = 'https://ledger.example.com';
    const savedEnv: Record<string, string | undefined> = {};
    let realUrlBuilder: UrlBuilder;
    let realClient: HttpOperationApiClient;

    beforeEach(() => {
      for (const key of URL_ENV_KEYS) {
        savedEnv[key] = process.env[key];
        delete process.env[key];
      }
      realUrlBuilder = new UrlBuilder({ baseUrls: { ledger: ledgerBaseUrl } });
      realClient = new HttpOperationApiClient(mockHttpClient, realUrlBuilder, mockObservability);
    });

    afterEach(() => {
      for (const key of URL_ENV_KEYS) {
        if (savedEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = savedEnv[key];
        }
      }
    });

    it('lists operations under the versioned account-scoped path', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockOperationListResponse);

      await realClient.listOperations(orgId, ledgerId, accountId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `${ledgerBaseUrl}/v1/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations`,
        expect.any(Object)
      );
    });

    it('gets a single operation under the versioned account-scoped path', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockOperation);

      await realClient.getOperation(orgId, ledgerId, accountId, operationId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `${ledgerBaseUrl}/v1/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations/${operationId}`,
        expect.any(Object)
      );
    });

    it('updates an operation under the versioned transaction-scoped path', async () => {
      mockHttpClient.patch.mockResolvedValueOnce(mockOperation);

      await realClient.updateOperation(
        orgId,
        ledgerId,
        accountId,
        operationId,
        { metadata: {} },
        transactionId
      );

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `${ledgerBaseUrl}/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}/operations/${operationId}`,
        { metadata: {} },
        expect.any(Object)
      );
    });

    it('no longer exposes the ledger-level operation template', () => {
      expect(
        (realUrlBuilder as unknown as Record<string, unknown>).buildOperationUrl
      ).toBeUndefined();
    });
  });
});
