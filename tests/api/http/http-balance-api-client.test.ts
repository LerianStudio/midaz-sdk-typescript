/**
 * Tests for HttpBalanceApiClient
 */

import { Balance, UpdateBalanceInput } from '../../../src/models/balance';
import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { validateUpdateBalanceInput } from '../../../src/models/validators/balance-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpBalanceApiClient } from '../../../src/api/http/http-balance-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { MidazError, ErrorCategory, ErrorCode } from '../../../src/util/error';

// Mock dependencies
jest.mock('../../../src/models/validators/balance-validator');
// Validation mock
const validateMock = jest.fn();
jest.mock('../../../src/util/validation', () => ({
  validate: (input: any, validator: any) => {
    // Call the mock function to track calls and allow for return value configuration
    return validateMock(input, validator);
  },
}));

describe('HttpBalanceApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const accountId = 'acc-789';
  const balanceId = 'bal-101';
  const apiVersion = 'v1';
  const serviceName = 'midaz-balance-api-client';

  // Mock balance data
  const mockBalance: Balance = {
    id: balanceId,
    organizationId: orgId,
    ledgerId: ledgerId,
    accountId: accountId,
    alias: 'main-balance',
    assetCode: 'USD',
    available: 10000,
    onHold: 500,
    scale: 100,
    version: 1,
    accountType: 'ASSET',
    allowSending: true,
    allowReceiving: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock balance list response
  const mockBalanceListResponse: ListResponse<Balance> = {
    items: [mockBalance],
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
  let client: HttpBalanceApiClient;

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
      buildBalanceUrl: jest.fn().mockImplementation((orgId, ledgerId) => {
        return `/organizations/${orgId}/ledgers/${ledgerId}/balances`;
      }),
      getBaseUrl: jest.fn().mockImplementation((type) => {
        return `/api/${type}`;
      }),
      getApiVersion: jest.fn().mockReturnValue(apiVersion)
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpBalanceApiClient(
      mockHttpClient,
      mockUrlBuilder,
      mockObservability
    );
    
    // Access the protected apiVersion property by using type assertion
    (client as any).apiVersion = apiVersion;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listBalances', () => {
    it('should successfully list balances', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      const result = await client.listBalances(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockBalanceListResponse);
      expect(mockUrlBuilder.buildBalanceUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.list.count',
        1,
        expect.objectContaining({ orgId, ledgerId })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.total.available',
        10000,
        expect.objectContaining({ orgId, ledgerId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listBalances(orgId, ledgerId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listBalances('', ledgerId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listBalances(orgId, '')).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listBalances(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle empty balance list', async () => {
      // Arrange
      const emptyResponse: ListResponse<Balance> = {
        items: [],
        meta: { total: 0, count: 0 }
      };
      mockHttpClient.get.mockResolvedValueOnce(emptyResponse);

      // Act
      const result = await client.listBalances(orgId, ledgerId);

      // Assert
      expect(result).toEqual(emptyResponse);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.list.count',
        0,
        expect.any(Object)
      );
      // No total.available metric should be recorded for empty list
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balances.total.available',
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe('listAccountBalances', () => {
    it('should successfully list account balances', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      const result = await client.listAccountBalances(orgId, ledgerId, accountId);

      // Assert
      expect(result).toEqual(mockBalanceListResponse);
      expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.account.count',
        1,
        expect.objectContaining({ orgId, ledgerId, accountId })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.account.available',
        10000,
        expect.objectContaining({ orgId, ledgerId, accountId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listAccountBalances(orgId, ledgerId, accountId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listAccountBalances('', ledgerId, accountId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listAccountBalances(orgId, '', accountId)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(client.listAccountBalances(orgId, ledgerId, '')).rejects.toThrow('accountId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listAccountBalances(orgId, ledgerId, accountId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle empty balance list', async () => {
      // Arrange
      const emptyResponse: ListResponse<Balance> = {
        items: [],
        meta: { total: 0, count: 0 }
      };
      mockHttpClient.get.mockResolvedValueOnce(emptyResponse);

      // Act
      const result = await client.listAccountBalances(orgId, ledgerId, accountId);

      // Assert
      expect(result).toEqual(emptyResponse);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.account.count',
        0,
        expect.any(Object)
      );
      // No account.available metric should be recorded for empty list
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balances.account.available',
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe('getBalance', () => {
    it('should successfully get a balance by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalance);

      // Act
      const result = await client.getBalance(orgId, ledgerId, balanceId);

      // Assert
      expect(result).toEqual(mockBalance);
      expect(mockUrlBuilder.buildBalanceUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.available',
        10000,
        expect.objectContaining({ orgId, ledgerId, balanceId, accountId })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.onHold',
        500,
        expect.objectContaining({ orgId, ledgerId, balanceId, accountId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getBalance('', ledgerId, balanceId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getBalance(orgId, '', balanceId)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing balanceId', async () => {
      // Act & Assert
      await expect(client.getBalance(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Balance not found',
        statusCode: 404
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getBalance(orgId, ledgerId, balanceId)).rejects.toThrow('Balance not found');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle balance with undefined available or onHold', async () => {
      // Arrange
      const incompleteBalance = { 
        ...mockBalance, 
        available: undefined as unknown as number, 
        onHold: undefined as unknown as number 
      };
      mockHttpClient.get.mockResolvedValueOnce(incompleteBalance);

      // Act
      const result = await client.getBalance(orgId, ledgerId, balanceId);

      // Assert
      expect(result).toEqual(incompleteBalance);
      // No metrics should be recorded for missing values
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balance.available',
        expect.any(Number),
        expect.any(Object)
      );
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balance.onHold',
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe('updateBalance', () => {
    const updateInput: UpdateBalanceInput = {
      allowSending: false,
      allowReceiving: true
    };

    it('should successfully update a balance', async () => {
      // Arrange
      const updatedBalance = { 
        ...mockBalance, 
        allowSending: false, 
        allowReceiving: true 
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedBalance);
      (validateUpdateBalanceInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.updateBalance(orgId, ledgerId, balanceId, updateInput);

      // Assert
      expect(result).toEqual(updatedBalance);
      expect(mockUrlBuilder.buildBalanceUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.patch).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.update',
        1,
        expect.objectContaining({ orgId, ledgerId, balanceId, accountId })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.update.allowSending',
        0,
        expect.objectContaining({ orgId, ledgerId, balanceId })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.update.allowReceiving',
        1,
        expect.objectContaining({ orgId, ledgerId, balanceId })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedAllowSending', false);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedAllowReceiving', true);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.updateBalance(orgId, ledgerId, balanceId, updateInput)).rejects.toThrow('Validation error');
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updateBalance('', ledgerId, balanceId, updateInput)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updateBalance(orgId, '', balanceId, updateInput)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing balanceId', async () => {
      // Act & Assert
      await expect(client.updateBalance(orgId, ledgerId, '', updateInput)).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateBalance(orgId, ledgerId, balanceId, updateInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle partial updates with only allowSending', async () => {
      // Arrange
      const partialInput: UpdateBalanceInput = { allowSending: false };
      const updatedBalance = { ...mockBalance, allowSending: false };
      mockHttpClient.patch.mockResolvedValueOnce(updatedBalance);

      // Act
      const result = await client.updateBalance(orgId, ledgerId, balanceId, partialInput);

      // Assert
      expect(result).toEqual(updatedBalance);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.update.allowSending',
        0,
        expect.any(Object)
      );
      // No allowReceiving metric should be recorded
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balance.update.allowReceiving',
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should handle partial updates with only allowReceiving', async () => {
      // Arrange
      const partialInput: UpdateBalanceInput = { allowReceiving: false };
      const updatedBalance = { ...mockBalance, allowReceiving: false };
      mockHttpClient.patch.mockResolvedValueOnce(updatedBalance);

      // Act
      const result = await client.updateBalance(orgId, ledgerId, balanceId, partialInput);

      // Assert
      expect(result).toEqual(updatedBalance);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.update.allowReceiving',
        0,
        expect.any(Object)
      );
      // No allowSending metric should be recorded
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balance.update.allowSending',
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe('deleteBalance', () => {
    it('should successfully delete a balance', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteBalance(orgId, ledgerId, balanceId);

      // Assert
      expect(mockUrlBuilder.buildBalanceUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.delete).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.delete',
        1,
        expect.objectContaining({ orgId, ledgerId, balanceId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.deleteBalance('', ledgerId, balanceId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deleteBalance(orgId, '', balanceId)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing balanceId', async () => {
      // Act & Assert
      await expect(client.deleteBalance(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deleteBalance(orgId, ledgerId, balanceId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('private methods', () => {
    it('should validate required parameters and throw error if missing', async () => {
      // The validateRequiredParams method is private, but we can test it indirectly
      // through the public methods that use it
      
      // Test with missing parameters
      await expect(client.getBalance('', ledgerId, balanceId)).rejects.toThrow('orgId is required');
      await expect(client.getBalance(orgId, '', balanceId)).rejects.toThrow('ledgerId is required');
      await expect(client.getBalance(orgId, ledgerId, '')).rejects.toThrow('id is required');
      
      // Verify the error is recorded on the span
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should record metrics with the observability provider', async () => {
      // Use a public method to indirectly test the private recordMetrics method
      mockHttpClient.get.mockResolvedValueOnce(mockBalance);
      
      // Act
      await client.getBalance(orgId, ledgerId, balanceId);
      
      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balance.available',
        10000,
        expect.objectContaining({ 
          orgId, 
          ledgerId,
          balanceId,
          accountId 
        })
      );
    });
  });
});