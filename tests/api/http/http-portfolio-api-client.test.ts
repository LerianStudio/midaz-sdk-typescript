/**
 * Tests for HttpPortfolioApiClient
 */

import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import {
  CreatePortfolioInput,
  Portfolio,
  UpdatePortfolioInput,
} from '../../../src/models/portfolio';
import {
  validateCreatePortfolioInput,
  validateUpdatePortfolioInput,
} from '../../../src/models/validators/portfolio-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpPortfolioApiClient } from '../../../src/api/http/http-portfolio-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';

// Mock dependencies
jest.mock('../../../src/models/validators/portfolio-validator');
// Validation mock
const validateMock = jest.fn();
jest.mock('../../../src/util/validation', () => ({
  validate: (input: any, validator: any) => {
    // Call the mock function to track calls and allow for return value configuration
    return validateMock(input, validator);
  },
}));

describe('HttpPortfolioApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const portfolioId = 'pfl-789';
  const entityId = 'entity-123';
  const apiVersion = 'v1';
  const _serviceName = 'midaz-portfolio-api-client';

  // Mock portfolio data
  const mockPortfolio: Portfolio = {
    id: portfolioId,
    name: 'Test Portfolio',
    entityId: entityId,
    organizationId: orgId,
    ledgerId: ledgerId,
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock portfolio list response
  const mockPortfolioListResponse: ListResponse<Portfolio> = {
    items: [mockPortfolio],
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
  let client: HttpPortfolioApiClient;

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
      buildPortfolioUrl: jest.fn().mockImplementation((orgId, ledgerId, portfolioId) => {
        let url = `/organizations/${orgId}/ledgers/${ledgerId}/portfolios`;
        if (portfolioId) {
          url += `/${portfolioId}`;
        }
        return url;
      }),
      getApiVersion: jest.fn().mockReturnValue(apiVersion),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpPortfolioApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    // Access the protected apiVersion property by using type assertion
    (client as any).apiVersion = apiVersion;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listPortfolios', () => {
    it('should successfully list portfolios', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockPortfolioListResponse);

      // Act
      const result = await client.listPortfolios(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockPortfolioListResponse);
      expect(mockUrlBuilder.buildPortfolioUrl).toHaveBeenCalledWith(orgId, ledgerId, undefined);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'portfolios.list.count',
        1,
        expect.objectContaining({ orgId, ledgerId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockPortfolioListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listPortfolios(orgId, ledgerId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listPortfolios('', ledgerId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listPortfolios(orgId, '')).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listPortfolios(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getPortfolio', () => {
    it('should successfully get a portfolio by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockPortfolio);

      // Act
      const result = await client.getPortfolio(orgId, ledgerId, portfolioId);

      // Assert
      expect(result).toEqual(mockPortfolio);
      expect(mockUrlBuilder.buildPortfolioUrl).toHaveBeenCalledWith(orgId, ledgerId, portfolioId);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'portfolios.get',
        1,
        expect.objectContaining({ orgId, ledgerId, portfolioId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getPortfolio('', ledgerId, portfolioId)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getPortfolio(orgId, '', portfolioId)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing portfolioId', async () => {
      // Act & Assert
      await expect(client.getPortfolio(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Portfolio not found',
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getPortfolio(orgId, ledgerId, portfolioId)).rejects.toThrow(
        'Portfolio not found'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('createPortfolio', () => {
    const createInput: CreatePortfolioInput = {
      name: 'New Portfolio',
      entityId: entityId,
    };

    it('should successfully create a portfolio', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockPortfolio);
      (validateCreatePortfolioInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.createPortfolio(orgId, ledgerId, createInput);

      // Assert
      expect(result).toEqual(mockPortfolio);
      expect(mockUrlBuilder.buildPortfolioUrl).toHaveBeenCalledWith(orgId, ledgerId, undefined);
      expect(mockHttpClient.post).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'portfolios.create',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          portfolioName: createInput.name,
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('portfolioName', createInput.name);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('entityId', createInput.entityId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('portfolioId', mockPortfolio.id);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.createPortfolio(orgId, ledgerId, createInput)).rejects.toThrow(
        'Validation error'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.createPortfolio('', ledgerId, createInput)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.createPortfolio(orgId, '', createInput)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createPortfolio(orgId, ledgerId, createInput)).rejects.toThrow(
        'API Error'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('updatePortfolio', () => {
    const updateInput: UpdatePortfolioInput = {
      name: 'Updated Portfolio',
      status: StatusCode.INACTIVE,
      metadata: { type: 'Investment' },
    };

    it('should successfully update a portfolio', async () => {
      // Arrange
      const updatedPortfolio = {
        ...mockPortfolio,
        name: updateInput.name,
        status: {
          code: updateInput.status || StatusCode.INACTIVE,
          timestamp: new Date().toISOString(),
        },
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedPortfolio);
      (validateUpdatePortfolioInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.updatePortfolio(orgId, ledgerId, portfolioId, updateInput);

      // Assert
      expect(result).toEqual(updatedPortfolio);
      expect(mockUrlBuilder.buildPortfolioUrl).toHaveBeenCalledWith(orgId, ledgerId, portfolioId);
      expect(mockHttpClient.patch).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'portfolios.update',
        1,
        expect.objectContaining({ orgId, ledgerId, portfolioId })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedName', updateInput.name);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', updateInput.status);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(
        client.updatePortfolio(orgId, ledgerId, portfolioId, updateInput)
      ).rejects.toThrow('Validation error');
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updatePortfolio('', ledgerId, portfolioId, updateInput)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updatePortfolio(orgId, '', portfolioId, updateInput)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing portfolioId', async () => {
      // Act & Assert
      await expect(client.updatePortfolio(orgId, ledgerId, '', updateInput)).rejects.toThrow(
        'id is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        client.updatePortfolio(orgId, ledgerId, portfolioId, updateInput)
      ).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should handle partial updates with only name', async () => {
      // Arrange
      const partialInput: UpdatePortfolioInput = { name: 'Renamed Portfolio' };
      const updatedPortfolio = { ...mockPortfolio, name: partialInput.name };
      mockHttpClient.patch.mockResolvedValueOnce(updatedPortfolio);

      // Act
      const result = await client.updatePortfolio(orgId, ledgerId, portfolioId, partialInput);

      // Assert
      expect(result).toEqual(updatedPortfolio);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedName', partialInput.name);
      // Status and metadata attributes should not be set
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedStatus', expect.anything());
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedMetadata', expect.anything());
    });

    it('should handle partial updates with only status', async () => {
      // Arrange
      const partialInput: UpdatePortfolioInput = { status: StatusCode.INACTIVE };
      const updatedPortfolio = {
        ...mockPortfolio,
        status: { code: partialInput.status!, timestamp: new Date().toISOString() },
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedPortfolio);

      // Act
      const result = await client.updatePortfolio(orgId, ledgerId, portfolioId, partialInput);

      // Assert
      expect(result).toEqual(updatedPortfolio);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', partialInput.status);
      // Name and metadata attributes should not be set
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedName', expect.anything());
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedMetadata', expect.anything());
    });

    it('should handle partial updates with only metadata', async () => {
      // Arrange
      const partialInput: UpdatePortfolioInput = { metadata: { category: 'Retirement' } };
      const updatedPortfolio = { ...mockPortfolio, metadata: partialInput.metadata };
      mockHttpClient.patch.mockResolvedValueOnce(updatedPortfolio);

      // Act
      const result = await client.updatePortfolio(orgId, ledgerId, portfolioId, partialInput);

      // Assert
      expect(result).toEqual(updatedPortfolio);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      // Name and status attributes should not be set
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedName', expect.anything());
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedStatus', expect.anything());
    });
  });

  describe('deletePortfolio', () => {
    it('should successfully delete a portfolio', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deletePortfolio(orgId, ledgerId, portfolioId);

      // Assert
      expect(mockUrlBuilder.buildPortfolioUrl).toHaveBeenCalledWith(orgId, ledgerId, portfolioId);
      expect(mockHttpClient.delete).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'portfolios.delete',
        1,
        expect.objectContaining({ orgId, ledgerId, portfolioId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.deletePortfolio('', ledgerId, portfolioId)).rejects.toThrow(
        'orgId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deletePortfolio(orgId, '', portfolioId)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing portfolioId', async () => {
      // Act & Assert
      await expect(client.deletePortfolio(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deletePortfolio(orgId, ledgerId, portfolioId)).rejects.toThrow(
        'API Error'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('private methods', () => {
    it('should validate required parameters and throw error if missing', async () => {
      // The validateRequiredParams method is private, but we can test it indirectly
      // through the public methods that use it

      // Test with missing parameters
      await expect(client.getPortfolio('', ledgerId, portfolioId)).rejects.toThrow(
        'orgId is required'
      );
      await expect(client.getPortfolio(orgId, '', portfolioId)).rejects.toThrow(
        'ledgerId is required'
      );
      await expect(client.getPortfolio(orgId, ledgerId, '')).rejects.toThrow('id is required');

      // Verify the error is recorded on the span
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should record metrics with the observability provider', async () => {
      // Use a public method to indirectly test the private recordMetrics method
      mockHttpClient.get.mockResolvedValueOnce(mockPortfolio);

      // Act
      await client.getPortfolio(orgId, ledgerId, portfolioId);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'portfolios.get',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          portfolioId,
        })
      );
    });
  });
});
