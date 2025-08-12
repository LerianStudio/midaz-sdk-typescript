/**
 * Tests for HttpLedgerApiClient
 */

import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../../../src/models/ledger';
import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpLedgerApiClient } from '../../../src/api/http/http-ledger-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';

// Mock dependencies
jest.mock('../../../src/models/validators/ledger-validator');
import {
  validateCreateLedgerInput,
  validateUpdateLedgerInput,
} from '../../../src/models/validators/ledger-validator';
// Validation mock
const validateMock = jest.fn();
jest.mock('../../../src/util/validation', () => ({
  validate: (input: any, validator: any) => {
    // Call the mock function to track calls and allow for return value configuration
    return validateMock(input, validator);
  },
}));

describe('HttpLedgerApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const apiVersion = 'v1';

  // Mock ledger data
  const mockLedger: Ledger = {
    id: ledgerId,
    name: 'Test Ledger',
    organizationId: orgId,
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock ledger list response
  const mockLedgerListResponse: ListResponse<Ledger> = {
    items: [mockLedger],
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
  let client: HttpLedgerApiClient;

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
      buildLedgerUrl: jest.fn().mockImplementation((orgId, id?) => {
        let url = `/organizations/${orgId}/ledgers`;
        if (id) {
          url += `/${id}`;
        }
        return url;
      }),
      getApiVersion: jest.fn().mockReturnValue(apiVersion),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    mockHttpClient.get.mockReset();
    mockHttpClient.post.mockReset();
    mockHttpClient.patch.mockReset();
    mockHttpClient.delete.mockReset();

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpLedgerApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    // Access the protected apiVersion property by using type assertion
    (client as any).apiVersion = apiVersion;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listLedgers', () => {
    it('should successfully list ledgers', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockLedgerListResponse);

      // Act
      const result = await client.listLedgers(orgId);

      // Assert
      expect(result).toEqual(mockLedgerListResponse);
      expect(mockUrlBuilder.buildLedgerUrl).toHaveBeenCalledWith(orgId);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'ledgers.list.count',
        1,
        expect.objectContaining({ orgId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockLedgerListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listLedgers(orgId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: options,
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listLedgers('')).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listLedgers(orgId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getLedger', () => {
    it('should successfully get a ledger by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockLedger);

      // Act
      const result = await client.getLedger(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockLedger);
      expect(mockUrlBuilder.buildLedgerUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'ledgers.get',
        1,
        expect.objectContaining({ orgId, ledgerId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getLedger('', ledgerId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getLedger(orgId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Ledger not found',
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getLedger(orgId, ledgerId)).rejects.toThrow('Ledger not found');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('createLedger', () => {
    const createInput: CreateLedgerInput = {
      name: 'New Ledger',
      status: StatusCode.ACTIVE,
      metadata: { department: 'Finance' },
    };

    it('should successfully create a ledger', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockLedger);
      (validateCreateLedgerInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.createLedger(orgId, createInput);

      // Assert
      expect(result).toEqual(mockLedger);
      expect(mockUrlBuilder.buildLedgerUrl).toHaveBeenCalledWith(orgId);
      expect(mockHttpClient.post).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'ledgers.create',
        1,
        expect.objectContaining({ orgId })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('ledgerName', createInput.name);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasMetadata', true);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('status', createInput.status);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('ledgerId', mockLedger.id);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.createLedger(orgId, createInput)).rejects.toThrow('Validation error');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.createLedger('', createInput)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      (validateCreateLedgerInput as jest.Mock).mockReturnValueOnce({ valid: true });
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createLedger(orgId, createInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('updateLedger', () => {
    const updateInput: UpdateLedgerInput = {
      name: 'Updated Ledger',
      status: StatusCode.INACTIVE,
      metadata: { department: 'Accounting' },
    };

    it('should successfully update a ledger', async () => {
      // Arrange
      const updatedLedger = {
        ...mockLedger,
        name: updateInput.name,
        status: {
          code: updateInput.status || StatusCode.INACTIVE,
          timestamp: new Date().toISOString(),
        },
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedLedger);
      (validateUpdateLedgerInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.updateLedger(orgId, ledgerId, updateInput);

      // Assert
      expect(result).toEqual(updatedLedger);
      expect(mockUrlBuilder.buildLedgerUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.patch).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'ledgers.update',
        1,
        expect.objectContaining({ orgId, ledgerId })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedName', updateInput.name);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', updateInput.status);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.updateLedger(orgId, ledgerId, updateInput)).rejects.toThrow(
        'Validation error'
      );
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updateLedger('', ledgerId, updateInput)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updateLedger(orgId, '', updateInput)).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      (validateUpdateLedgerInput as jest.Mock).mockReturnValueOnce({ valid: true });
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateLedger(orgId, ledgerId, updateInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('deleteLedger', () => {
    it('should successfully delete a ledger', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteLedger(orgId, ledgerId);

      // Assert
      expect(mockUrlBuilder.buildLedgerUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.delete).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'ledgers.delete',
        1,
        expect.objectContaining({ orgId, ledgerId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.deleteLedger('', ledgerId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deleteLedger(orgId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deleteLedger(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('private methods', () => {
    it('should record metrics with the observability provider', async () => {
      // Use a public method to indirectly test the private recordMetrics method
      mockHttpClient.get.mockResolvedValueOnce(mockLedger);

      // Act
      await client.getLedger(orgId, ledgerId);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'ledgers.get',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
        })
      );
    });

    it('should validate required parameters and throw error if missing', async () => {
      // The validateRequiredParams method is private, but we can test it indirectly
      // through the public methods that use it

      // Test with missing parameters
      await expect(client.getLedger('', ledgerId)).rejects.toThrow('orgId is required');
      await expect(client.getLedger(orgId, '')).rejects.toThrow('id is required');

      // Verify the error is recorded on the span
      expect(mockSpan.recordException).toHaveBeenCalled();
    });
  });
});
