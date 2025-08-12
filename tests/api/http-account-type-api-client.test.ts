/**
 * HTTP Account Type API Client Tests
 */

import { HttpAccountTypeApiClient } from '../../src/api/http/http-account-type-api-client';
import { AccountType, CreateAccountTypeInput, UpdateAccountTypeInput } from '../../src/models/account-type';
import { HttpClient } from '../../src/util/network/http-client';
import { Observability } from '../../src/util/observability/observability';
import { PaginatedResponse } from '../../src/models/common';
import { UrlBuilder } from '../../src/api/url-builder';

// Mock HttpClient
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<HttpClient>;

// Mock Observability
const mockObservability = {
  startSpan: jest.fn().mockReturnValue({
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  }),
  recordMetric: jest.fn(),
} as unknown as Observability;

// Mock UrlBuilder
const mockUrlBuilder = {
  buildAccountTypeUrl: jest.fn().mockImplementation((orgId: string, ledgerId: string, accountTypeId?: string) => {
    const baseUrl = `https://api.example.com/organizations/${orgId}/ledgers/${ledgerId}/account-types`;
    return accountTypeId ? `${baseUrl}/${accountTypeId}` : baseUrl;
  }),
  getApiVersion: jest.fn().mockReturnValue('v1'),
} as unknown as jest.Mocked<UrlBuilder>;

describe('HttpAccountTypeApiClient', () => {
  let client: HttpAccountTypeApiClient;
  const organizationId = 'org_123';
  const ledgerId = 'ledger_456';

  beforeEach(() => {
    client = new HttpAccountTypeApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
    jest.clearAllMocks();
  });

  describe('listAccountTypes', () => {
    it('should build correct URL and make GET request', async () => {
      const mockResponse: PaginatedResponse<AccountType> = {
        items: [
          {
            id: 'at_123',
            organizationId,
            ledgerId,
            name: 'Cash Account',
            keyValue: 'CASH',
            createdAt: '2023-12-01T10:00:00Z',
            updatedAt: '2023-12-01T10:00:00Z',
          },
        ],
        meta: {
          total: 1,
          count: 1,
          nextCursor: undefined,
          prevCursor: undefined,
        },
      };

      (mockHttpClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.listAccountTypes(organizationId, ledgerId);

      expect(mockUrlBuilder.buildAccountTypeUrl).toHaveBeenCalledWith(organizationId, ledgerId);
      expect(result).toEqual(mockResponse);
    });

    it('should build URL with query parameters', async () => {
      const mockResponse: PaginatedResponse<AccountType> = {
        items: [],
        meta: {
          total: 0,
          count: 0,
          nextCursor: undefined,
          prevCursor: undefined,
        },
      };

      (mockHttpClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const options = { limit: 10, page: 2 };
      await client.listAccountTypes(organizationId, ledgerId, options);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `https://api.example.com/organizations/${organizationId}/ledgers/${ledgerId}/account-types?limit=10&page=2`,
        {"headers": {"X-API-Version": "v1"}}
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      (mockHttpClient.get as jest.Mock).mockRejectedValue(error);

      await expect(client.listAccountTypes(organizationId, ledgerId))
        .rejects.toThrow('Network error');
    });
  });

  describe('getAccountType', () => {
    it('should build correct URL and make GET request', async () => {
      const accountTypeId = 'at_123';
      const mockAccountType: AccountType = {
        id: accountTypeId,
        organizationId,
        ledgerId,
        name: 'Savings Account',
        keyValue: 'SAVINGS',
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
      };

      (mockHttpClient.get as jest.Mock).mockResolvedValue(mockAccountType);

      const result = await client.getAccountType(organizationId, ledgerId, accountTypeId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `https://api.example.com/organizations/${organizationId}/ledgers/${ledgerId}/account-types/${accountTypeId}`,
        {"headers": {"X-API-Version": "v1"}}
      );
      expect(result).toEqual(mockAccountType);
    });

    it('should handle 404 errors', async () => {
      const accountTypeId = 'at_nonexistent';
      const error = new Error('Not found');
      (mockHttpClient.get as jest.Mock).mockRejectedValue(error);

      await expect(client.getAccountType(organizationId, ledgerId, accountTypeId))
        .rejects.toThrow('Not found');
    });
  });

  describe('createAccountType', () => {
    it('should make POST request with correct data', async () => {
      const input: CreateAccountTypeInput = {
        name: 'Current Account',
        keyValue: 'CURRENT',
        description: 'Account for daily operations',
        metadata: { category: 'assets' },
      };

      const mockCreatedAccountType: AccountType = {
        id: 'at_new123',
        organizationId,
        ledgerId,
        ...input,
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
      };

      (mockHttpClient.post as jest.Mock).mockResolvedValue(mockCreatedAccountType);

      const result = await client.createAccountType(organizationId, ledgerId, input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `https://api.example.com/organizations/${organizationId}/ledgers/${ledgerId}/account-types`,
        input,
        {"headers": {"X-API-Version": "v1"}}
      );
      expect(result).toEqual(mockCreatedAccountType);
    });

    it('should handle validation errors', async () => {
      const input: CreateAccountTypeInput = {
        name: 'Test Account',
        keyValue: 'TEST',
      };

      const error = new Error('Validation failed');
      (mockHttpClient.post as jest.Mock).mockRejectedValue(error);

      await expect(client.createAccountType(organizationId, ledgerId, input))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('updateAccountType', () => {
    it('should make PATCH request with correct data', async () => {
      const accountTypeId = 'at_123';
      const input: UpdateAccountTypeInput = {
        name: 'Updated Account',
        description: 'Updated description',
        metadata: { category: 'updated' },
      };

      const mockUpdatedAccountType: AccountType = {
        id: accountTypeId,
        organizationId,
        ledgerId,
        name: 'Updated Account',
        keyValue: 'ORIGINAL_KEY',
        description: 'Updated description',
        metadata: { category: 'updated' },
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T11:00:00Z',
      };

      (mockHttpClient.patch as jest.Mock).mockResolvedValue(mockUpdatedAccountType);

      const result = await client.updateAccountType(organizationId, ledgerId, accountTypeId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `https://api.example.com/organizations/${organizationId}/ledgers/${ledgerId}/account-types/${accountTypeId}`,
        input,
        {"headers": {"X-API-Version": "v1"}}
      );
      expect(result).toEqual(mockUpdatedAccountType);
    });

    it('should handle update errors', async () => {
      const accountTypeId = 'at_123';
      const input: UpdateAccountTypeInput = {
        name: 'Updated Name',
      };

      const error = new Error('Update failed');
      (mockHttpClient.patch as jest.Mock).mockRejectedValue(error);

      await expect(client.updateAccountType(organizationId, ledgerId, accountTypeId, input))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteAccountType', () => {
    it('should make DELETE request with correct URL', async () => {
      const accountTypeId = 'at_123';

      (mockHttpClient.delete as jest.Mock).mockResolvedValue(undefined);

      await client.deleteAccountType(organizationId, ledgerId, accountTypeId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `https://api.example.com/organizations/${organizationId}/ledgers/${ledgerId}/account-types/${accountTypeId}`,
        {"headers": {"X-API-Version": "v1"}}
      );
    });

    it('should handle deletion errors', async () => {
      const accountTypeId = 'at_123';
      const error = new Error('Deletion failed');
      (mockHttpClient.delete as jest.Mock).mockRejectedValue(error);

      await expect(client.deleteAccountType(organizationId, ledgerId, accountTypeId))
        .rejects.toThrow('Deletion failed');
    });
  });

  describe('Observability Integration', () => {
    it('should create and manage spans correctly', async () => {
      const mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn(),
      };

      (mockObservability.startSpan as jest.Mock).mockReturnValue(mockSpan);
      (mockHttpClient.get as jest.Mock).mockResolvedValue({ 
        items: [], 
        meta: { total: 0, count: 0, nextCursor: undefined, prevCursor: undefined } 
      });

      await client.listAccountTypes(organizationId, ledgerId);

      expect(mockObservability.startSpan).toHaveBeenCalledWith('listAccountTypes');
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok'); // SUCCESS
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should record exceptions in spans', async () => {
      const mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn(),
      };
      const error = new Error('Test error');

      (mockObservability.startSpan as jest.Mock).mockReturnValue(mockSpan);
      (mockHttpClient.get as jest.Mock).mockRejectedValue(error);

      try {
        await client.getAccountType(organizationId, ledgerId, 'at_123');
      } catch {
        // Expected to throw
      }

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', 'Test error');
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });
});