/**
 * Tests for HttpBalanceApiClient
 */

import {
  Balance,
  BalanceHistory,
  CreateBalanceInput,
  UpdateBalanceInput,
} from '../../../src/models/balance';
import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpBalanceApiClient } from '../../../src/api/http/http-balance-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';

// Mock dependencies
// The date validator stays real: the client's client-side refusals are what these tests measure.
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
    updatedAt: new Date().toISOString(),
  };

  // Mock balance list response
  const mockBalanceListResponse: ListResponse<Balance> = {
    items: [mockBalance],
    meta: {
      total: 1,
      count: 1,
      nextCursor: 'next-cursor',
    },
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
      buildBalanceUrl: jest.fn().mockImplementation((orgId, ledgerId) => {
        return `/organizations/${orgId}/ledgers/${ledgerId}/balances`;
      }),
      getBaseUrl: jest.fn().mockImplementation((type) => {
        return `/api/${type}`;
      }),
      buildAccountAliasBalancesUrl: jest
        .fn()
        .mockImplementation(
          (orgId, ledgerId, alias) =>
            `/organizations/${orgId}/ledgers/${ledgerId}/accounts/alias/${alias}/balances`
        ),
      buildExternalAccountBalancesUrl: jest
        .fn()
        .mockImplementation(
          (orgId, ledgerId, code) =>
            `/organizations/${orgId}/ledgers/${ledgerId}/accounts/external/${code}/balances`
        ),
      buildAccountBalanceUrl: jest
        .fn()
        .mockImplementation(
          (orgId, ledgerId, accountId) =>
            `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/balances`
        ),
      buildAccountBalanceHistoryUrl: jest
        .fn()
        .mockImplementation(
          (orgId, ledgerId, accountId) =>
            `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/balances/history`
        ),
      buildBalanceHistoryUrl: jest
        .fn()
        .mockImplementation(
          (orgId, ledgerId, balanceId) =>
            `/organizations/${orgId}/ledgers/${ledgerId}/balances/${balanceId}/history`
        ),
      getApiVersion: jest.fn().mockReturnValue(apiVersion),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpBalanceApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

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
        meta: { total: 0, count: 0 },
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
    const wirePage = {
      items: [mockBalance],
      limit: 10,
      next_cursor: 'cursor-2',
      prev_cursor: 'cursor-0',
    };

    it('returns the ledger cursor envelope with the cursors named in camelCase', async () => {
      mockHttpClient.get.mockResolvedValueOnce(wirePage);

      const result = await client.listAccountBalances(orgId, ledgerId, accountId);

      expect(result).toEqual({
        items: [mockBalance],
        limit: 10,
        nextCursor: 'cursor-2',
        prevCursor: 'cursor-0',
      });
      expect(mockUrlBuilder.buildAccountBalanceUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/balances`,
        { params: {} }
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.account.count',
        1,
        expect.objectContaining({ orgId, ledgerId, accountId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('sends only the query parameters the ledger honours, under their wire names', async () => {
      mockHttpClient.get.mockResolvedValueOnce(wirePage);

      await client.listAccountBalances(orgId, ledgerId, accountId, {
        limit: 2,
        cursor: 'cursor-1',
        sortOrder: 'desc',
        startDate: '2026-08-01',
        endDate: '2026-08-08',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.any(String), {
        params: {
          limit: 2,
          cursor: 'cursor-1',
          sort_order: 'desc',
          start_date: '2026-08-01',
          end_date: '2026-08-08',
        },
      });
    });

    it('walks to the next page with the cursor the previous page returned', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(wirePage)
        .mockResolvedValueOnce({ items: [], limit: 2, prev_cursor: 'cursor-1' });

      const first = await client.listAccountBalances(orgId, ledgerId, accountId, { limit: 2 });
      const second = await client.listAccountBalances(orgId, ledgerId, accountId, {
        limit: 2,
        cursor: first.nextCursor,
      });

      expect(mockHttpClient.get).toHaveBeenLastCalledWith(expect.any(String), {
        params: { limit: 2, cursor: 'cursor-2' },
      });
      expect(second.nextCursor).toBeUndefined();
      expect(second.prevCursor).toBe('cursor-1');
    });

    it('refuses a half-open date range before the wire', async () => {
      await expect(
        client.listAccountBalances(orgId, ledgerId, accountId, { startDate: '2026-08-01' })
      ).rejects.toThrow(/startDate and endDate/);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('refuses a limit above the ledger maximum before the wire', async () => {
      await expect(
        client.listAccountBalances(orgId, ledgerId, accountId, { limit: 101 })
      ).rejects.toThrow(/100/);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      await expect(client.listAccountBalances('', ledgerId, accountId)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      await expect(client.listAccountBalances(orgId, '', accountId)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing accountId', async () => {
      await expect(client.listAccountBalances(orgId, ledgerId, '')).rejects.toThrow(
        'accountId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      await expect(client.listAccountBalances(orgId, ledgerId, accountId)).rejects.toThrow(
        'API Error'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle empty balance list', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ items: [], limit: 10 });

      const result = await client.listAccountBalances(orgId, ledgerId, accountId);

      expect(result).toEqual({ items: [], limit: 10 });
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'balances.account.count',
        0,
        expect.any(Object)
      );
      expect(mockObservability.recordMetric).not.toHaveBeenCalledWith(
        'balances.account.available',
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe('createAccountBalance', () => {
    const input: CreateBalanceInput = { key: 'asset-freeze', direction: 'debit' };

    it('posts the payload to the per-account balance collection', async () => {
      mockHttpClient.post.mockResolvedValueOnce(mockBalance);

      const result = await client.createAccountBalance(orgId, ledgerId, accountId, input);

      expect(result).toEqual(mockBalance);
      expect(mockUrlBuilder.buildAccountBalanceUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId
      );
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/balances`,
        input
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('runs the create validator over the input', async () => {
      mockHttpClient.post.mockResolvedValueOnce(mockBalance);

      await client.createAccountBalance(orgId, ledgerId, accountId, input);

      expect(validateMock).toHaveBeenCalledWith(input, expect.any(Function));
    });

    it('refuses an invalid input before the wire', async () => {
      validateMock.mockImplementationOnce(() => {
        throw new Error('key is required');
      });

      await expect(
        client.createAccountBalance(orgId, ledgerId, accountId, { key: '' })
      ).rejects.toThrow('key is required');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should throw error when missing accountId', async () => {
      await expect(client.createAccountBalance(orgId, ledgerId, '', input)).rejects.toThrow(
        'accountId is required'
      );
    });
  });

  describe('listAccountBalanceHistory', () => {
    const snapshot: BalanceHistory = {
      id: balanceId,
      organizationId: orgId,
      ledgerId: ledgerId,
      accountId: accountId,
      alias: 'acct_a',
      key: 'default',
      assetCode: 'BRL',
      available: '749.5',
      onHold: '0',
      version: 1,
      accountType: 'deposit',
      overdraftUsed: '0',
      createdAt: '2026-08-07T02:42:18Z',
      updatedAt: '2026-08-07T02:45:00Z',
    };

    it('returns the bare array the route answers with, not an envelope', async () => {
      mockHttpClient.get.mockResolvedValueOnce([snapshot]);

      const result = await client.listAccountBalanceHistory(
        orgId,
        ledgerId,
        accountId,
        '2026-08-07T02:45:14Z'
      );

      expect(result).toEqual([snapshot]);
      expect(mockUrlBuilder.buildAccountBalanceHistoryUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/balances/history`,
        { params: { date: '2026-08-07T02:45:14Z' } }
      );
    });

    it('refuses a date-only timestamp before the wire', async () => {
      await expect(
        client.listAccountBalanceHistory(orgId, ledgerId, accountId, '2026-08-07')
      ).rejects.toThrow(/yyyy-mm-dd hh:mm:ss/);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('refuses an omitted date before the wire', async () => {
      await expect(
        client.listAccountBalanceHistory(orgId, ledgerId, accountId, undefined as unknown as string)
      ).rejects.toThrow('date is required');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getBalanceHistory', () => {
    const snapshot: BalanceHistory = {
      id: balanceId,
      organizationId: orgId,
      ledgerId: ledgerId,
      accountId: accountId,
      alias: 'acct_a',
      key: 'default',
      assetCode: 'BRL',
      available: '0',
      onHold: '0',
      version: 0,
      accountType: 'deposit',
      overdraftUsed: '0',
      createdAt: '2026-08-07T02:42:18Z',
      updatedAt: '2026-08-07T02:42:18Z',
    };

    it('returns the single snapshot object the route answers with', async () => {
      mockHttpClient.get.mockResolvedValueOnce(snapshot);

      const result = await client.getBalanceHistory(
        orgId,
        ledgerId,
        balanceId,
        '2026-08-07 02:45:14'
      );

      expect(result).toEqual(snapshot);
      expect(Array.isArray(result)).toBe(false);
      expect(mockUrlBuilder.buildBalanceHistoryUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        balanceId
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/balances/${balanceId}/history`,
        { params: { date: '2026-08-07 02:45:14' } }
      );
    });

    it('refuses a date-only timestamp before the wire', async () => {
      await expect(
        client.getBalanceHistory(orgId, ledgerId, balanceId, '2026-08-07')
      ).rejects.toThrow(/yyyy-mm-dd hh:mm:ss/);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw error when missing balanceId', async () => {
      await expect(
        client.getBalanceHistory(orgId, ledgerId, '', '2026-08-07T02:45:14Z')
      ).rejects.toThrow('balanceId is required');
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
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getBalance(orgId, ledgerId, balanceId)).rejects.toThrow(
        'Balance not found'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle balance with undefined available or onHold', async () => {
      // Arrange
      const incompleteBalance = {
        ...mockBalance,
        available: undefined as unknown as number,
        onHold: undefined as unknown as number,
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
      allowReceiving: true,
    };

    it('should successfully update a balance', async () => {
      // Arrange
      const updatedBalance = {
        ...mockBalance,
        allowSending: false,
        allowReceiving: true,
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedBalance);

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
      await expect(client.updateBalance(orgId, ledgerId, balanceId, updateInput)).rejects.toThrow(
        'Validation error'
      );
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updateBalance('', ledgerId, balanceId, updateInput)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updateBalance(orgId, '', balanceId, updateInput)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing balanceId', async () => {
      // Act & Assert
      await expect(client.updateBalance(orgId, ledgerId, '', updateInput)).rejects.toThrow(
        'id is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateBalance(orgId, ledgerId, balanceId, updateInput)).rejects.toThrow(
        'API Error'
      );
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
      await expect(client.deleteBalance('', ledgerId, balanceId)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deleteBalance(orgId, '', balanceId)).rejects.toThrow(
        'ledgerId is required'
      );
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
          accountId,
        })
      );
    });
  });
  describe('listAccountBalancesByAlias', () => {
    const alias = 'probe@lerian:acct_a';

    it('should list the balances of the account addressed by its alias', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      const result = await client.listAccountBalancesByAlias(orgId, ledgerId, alias);

      // Assert
      expect(result).toEqual(mockBalanceListResponse);
      expect(mockUrlBuilder.buildAccountAliasBalancesUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        alias
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should send the alias verbatim rather than percent-encoded', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      await client.listAccountBalancesByAlias(orgId, ledgerId, alias);

      // Assert
      const [requestedUrl] = mockHttpClient.get.mock.calls[0];
      expect(requestedUrl).toContain(alias);
      expect(requestedUrl).not.toContain(encodeURIComponent(alias));
    });

    it('should send no query parameters, because the route ignores them', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      await client.listAccountBalancesByAlias(orgId, ledgerId, alias);

      // Assert
      const [, requestOptions] = mockHttpClient.get.mock.calls[0];
      expect((requestOptions as Record<string, unknown> | undefined)?.params).toBeUndefined();
    });

    it('should return the empty page an unknown alias yields instead of throwing', async () => {
      // Arrange
      const emptyPage: ListResponse<Balance> = { items: [], meta: { total: 0, count: 0 } };
      mockHttpClient.get.mockResolvedValueOnce(emptyPage);

      // Act
      const result = await client.listAccountBalancesByAlias(orgId, ledgerId, 'nope');

      // Assert
      expect(result.items).toEqual([]);
    });

    it('should throw error when missing alias', async () => {
      await expect(client.listAccountBalancesByAlias(orgId, ledgerId, '')).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      await expect(client.listAccountBalancesByAlias(orgId, '', alias)).rejects.toThrow();
    });
  });

  describe('listExternalAccountBalances', () => {
    it('should list the balances of the external account for an asset code', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      const result = await client.listExternalAccountBalances(orgId, ledgerId, 'BRL');

      // Assert
      expect(result).toEqual(mockBalanceListResponse);
      expect(mockUrlBuilder.buildExternalAccountBalancesUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        'BRL'
      );
    });

    it('should send no query parameters, because the route ignores them', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockBalanceListResponse);

      // Act
      await client.listExternalAccountBalances(orgId, ledgerId, 'BRL');

      // Assert
      const [, requestOptions] = mockHttpClient.get.mock.calls[0];
      expect((requestOptions as Record<string, unknown> | undefined)?.params).toBeUndefined();
    });

    it('should throw error when missing assetCode', async () => {
      await expect(client.listExternalAccountBalances(orgId, ledgerId, '')).rejects.toThrow();
    });

    it('should throw error when missing orgId', async () => {
      await expect(client.listExternalAccountBalances('', ledgerId, 'BRL')).rejects.toThrow();
    });
  });
});
