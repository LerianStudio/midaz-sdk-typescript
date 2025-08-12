/**
 * Tests for HttpAccountApiClient
 */

import { Account, CreateAccountInput, UpdateAccountInput } from '../../../src/models/account';
import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import {
  validateCreateAccountInput,
  validateUpdateAccountInput,
} from '../../../src/models/validators/account-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpAccountApiClient } from '../../../src/api/http/http-account-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';

// Mock dependencies
jest.mock('../../../src/models/validators/account-validator');
// Validation mock
const validateMock = jest.fn();
jest.mock('../../../src/util/validation', () => ({
  validate: (input: any, validator: any) => {
    // Call the mock function to track calls and allow for return value configuration
    return validateMock(input, validator);
  },
}));

describe('HttpAccountApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const accountId = 'acc-789';
  const apiVersion = 'v1';

  // Mock account data
  const mockAccount: Account = {
    id: accountId,
    name: 'Test Account',
    assetCode: 'USD',
    organizationId: orgId,
    ledgerId: ledgerId,
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    type: 'deposit',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock account list response
  const mockAccountListResponse: ListResponse<Account> = {
    items: [mockAccount],
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
  let client: HttpAccountApiClient;

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
      buildAccountUrl: jest.fn().mockImplementation((orgId, ledgerId, accountId) => {
        let url = `/organizations/${orgId}/ledgers/${ledgerId}/accounts`;
        if (accountId) {
          url += `/${accountId}`;
        }
        return url;
      }),
      getApiVersion: jest.fn().mockReturnValue(apiVersion),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpAccountApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listAccounts', () => {
    it('should successfully list accounts', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAccountListResponse);

      // Act
      const result = await client.listAccounts(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockAccountListResponse);
      expect(mockUrlBuilder.buildAccountUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: undefined,
          headers: expect.objectContaining({ 'X-API-Version': apiVersion }),
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAccountListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listAccounts(orgId, ledgerId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: options,
          headers: expect.objectContaining({ 'X-API-Version': apiVersion }),
        })
      );
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listAccounts('', ledgerId)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listAccounts(orgId, '')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listAccounts(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getAccount', () => {
    it('should successfully get an account by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAccount);

      // Act
      const result = await client.getAccount(orgId, ledgerId, accountId);

      // Assert
      expect(result).toEqual(mockAccount);
      expect(mockUrlBuilder.buildAccountUrl).toHaveBeenCalledWith(orgId, ledgerId, accountId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Version': apiVersion }),
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getAccount('', ledgerId, accountId)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getAccount(orgId, '', accountId)).rejects.toThrow();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(client.getAccount(orgId, ledgerId, '')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Account not found',
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getAccount(orgId, ledgerId, accountId)).rejects.toThrow(
        'Account not found'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('createAccount', () => {
    const createInput: CreateAccountInput = {
      name: 'New Account',
      assetCode: 'USD',
      type: 'deposit',
    };

    it('should successfully create an account', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockAccount);
      (validateCreateAccountInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.createAccount(orgId, ledgerId, createInput);

      // Assert
      expect(result).toEqual(mockAccount);
      expect(mockUrlBuilder.buildAccountUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        createInput,
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Version': apiVersion }),
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.createAccount(orgId, ledgerId, createInput)).rejects.toThrow(
        'Validation error'
      );
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.createAccount('', ledgerId, createInput)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.createAccount(orgId, '', createInput)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      (validateCreateAccountInput as jest.Mock).mockReturnValueOnce({ valid: true });
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createAccount(orgId, ledgerId, createInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('updateAccount', () => {
    const updateInput: UpdateAccountInput = {
      name: 'Updated Account',
    };

    it('should successfully update an account', async () => {
      // Arrange
      mockHttpClient.patch.mockResolvedValueOnce({ ...mockAccount, name: 'Updated Account' });
      (validateUpdateAccountInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.updateAccount(orgId, ledgerId, accountId, updateInput);

      // Assert
      expect(result).toEqual({ ...mockAccount, name: 'Updated Account' });
      expect(mockUrlBuilder.buildAccountUrl).toHaveBeenCalledWith(orgId, ledgerId, accountId);
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        expect.any(String),
        updateInput,
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Version': apiVersion }),
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.updateAccount(orgId, ledgerId, accountId, updateInput)).rejects.toThrow(
        'Validation error'
      );
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updateAccount('', ledgerId, accountId, updateInput)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updateAccount(orgId, '', accountId, updateInput)).rejects.toThrow();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(client.updateAccount(orgId, ledgerId, '', updateInput)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      (validateUpdateAccountInput as jest.Mock).mockReturnValueOnce({ valid: true });
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateAccount(orgId, ledgerId, accountId, updateInput)).rejects.toThrow(
        'API Error'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('deleteAccount', () => {
    it('should successfully delete an account', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteAccount(orgId, ledgerId, accountId);

      // Assert
      expect(mockUrlBuilder.buildAccountUrl).toHaveBeenCalledWith(orgId, ledgerId, accountId);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Version': apiVersion }),
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.deleteAccount('', ledgerId, accountId)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deleteAccount(orgId, '', accountId)).rejects.toThrow();
    });

    it('should throw error when missing accountId', async () => {
      // Act & Assert
      await expect(client.deleteAccount(orgId, ledgerId, '')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deleteAccount(orgId, ledgerId, accountId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });
});
