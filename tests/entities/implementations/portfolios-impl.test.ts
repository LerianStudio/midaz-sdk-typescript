/**
 * @file Tests for the PortfoliosServiceImpl implementation
 * @description Unit tests for the PortfoliosService implementation
 */

import { PortfoliosServiceImpl } from '../../../src/entities/implementations/portfolios-impl';
import { Observability } from '../../../src/util/observability';
import {
  CreatePortfolioInput,
  Portfolio,
  UpdatePortfolioInput,
} from '../../../src/models/portfolio';
import { ListResponse, StatusCode } from '../../../src/models/common';
import { ValidationError } from '../../../src/util/validation';
import { PortfolioApiClient } from '../../../src/api/interfaces/portfolio-api-client';

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

// Mock the portfolio-validator
jest.mock('../../../src/models/validators/portfolio-validator', () => {
  return {
    validateCreatePortfolioInput: jest.fn().mockImplementation((input) => {
      // Simple validation for testing
      if (!input || !input.name || !input.entityId) {
        throw new ValidationError('Required fields missing');
      }
      return { valid: true };
    }),
    validateUpdatePortfolioInput: jest.fn().mockImplementation((input) => {
      // Simple validation for testing
      if (!input) {
        throw new ValidationError('Input is required');
      }
      return { valid: true };
    }),
  };
});

describe('PortfoliosServiceImpl', () => {
  let portfoliosService: PortfoliosServiceImpl;
  let mockPortfolioApiClient: jest.Mocked<PortfolioApiClient>;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const portfolioId = 'pfl_789';

  const mockPortfolio: Portfolio = {
    id: portfolioId,
    name: 'Test Portfolio',
    entityId: 'entity_123',
    ledgerId: ledgerId,
    organizationId: orgId,
    status: {
      code: StatusCode.ACTIVE,
      description: 'Active portfolio',
      timestamp: '2023-01-01T00:00:00Z',
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    metadata: {
      category: 'test',
    },
  };

  const mockPortfoliosList: ListResponse<Portfolio> = {
    items: [mockPortfolio],
    meta: {
      total: 1,
      count: 1,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock PortfolioApiClient
    mockPortfolioApiClient = {
      listPortfolios: jest.fn(),
      getPortfolio: jest.fn(),
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
    } as unknown as jest.Mocked<PortfolioApiClient>;

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
    portfoliosService = new PortfoliosServiceImpl(mockPortfolioApiClient, observability);
  });

  describe('listPortfolios', () => {
    it('should list portfolios successfully', async () => {
      // Setup
      mockPortfolioApiClient.listPortfolios.mockResolvedValueOnce(mockPortfoliosList);

      // Execute
      const result = await portfoliosService.listPortfolios(orgId, ledgerId);

      // Verify
      expect(mockPortfolioApiClient.listPortfolios).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined
      );
      expect(result).toEqual(mockPortfoliosList);
    });

    it('should apply list options when provided', async () => {
      // Setup
      mockPortfolioApiClient.listPortfolios.mockResolvedValueOnce(mockPortfoliosList);
      const listOptions = {
        limit: 10,
        offset: 0,
        filter: {
          status: StatusCode.ACTIVE,
        },
        sort: {
          field: 'createdAt',
          order: 'DESC',
        },
      };

      // Execute
      await portfoliosService.listPortfolios(orgId, ledgerId, listOptions);

      // Verify
      expect(mockPortfolioApiClient.listPortfolios).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        listOptions
      );
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      mockPortfolioApiClient.listPortfolios.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.listPortfolios('', ledgerId)).rejects.toThrow(
        'Organization ID is required'
      );

      // Verify API client was called with empty orgId
      expect(mockPortfolioApiClient.listPortfolios).toHaveBeenCalledWith('', ledgerId, undefined);
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      mockPortfolioApiClient.listPortfolios.mockRejectedValueOnce(
        new Error('Ledger ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.listPortfolios(orgId, '')).rejects.toThrow(
        'Ledger ID is required'
      );

      // Verify API client was called with empty ledgerId
      expect(mockPortfolioApiClient.listPortfolios).toHaveBeenCalledWith(orgId, '', undefined);
    });

    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      mockPortfolioApiClient.listPortfolios.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(portfoliosService.listPortfolios(orgId, ledgerId)).rejects.toThrow();
    });
  });

  describe('getPortfolio', () => {
    it('should get a portfolio by ID successfully', async () => {
      // Setup
      mockPortfolioApiClient.getPortfolio.mockResolvedValueOnce(mockPortfolio);

      // Execute
      const result = await portfoliosService.getPortfolio(orgId, ledgerId, portfolioId);

      // Verify
      expect(mockPortfolioApiClient.getPortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        portfolioId
      );
      expect(result).toEqual(mockPortfolio);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      mockPortfolioApiClient.getPortfolio.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.getPortfolio('', ledgerId, portfolioId)).rejects.toThrow(
        'Organization ID is required'
      );

      // Verify API client was called with empty orgId
      expect(mockPortfolioApiClient.getPortfolio).toHaveBeenCalledWith('', ledgerId, portfolioId);
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      mockPortfolioApiClient.getPortfolio.mockRejectedValueOnce(new Error('Ledger ID is required'));

      // Execute & Verify
      await expect(portfoliosService.getPortfolio(orgId, '', portfolioId)).rejects.toThrow(
        'Ledger ID is required'
      );

      // Verify API client was called with empty ledgerId
      expect(mockPortfolioApiClient.getPortfolio).toHaveBeenCalledWith(orgId, '', portfolioId);
    });

    it('should delegate validation to the API client for missing portfolioId', async () => {
      // Setup
      mockPortfolioApiClient.getPortfolio.mockRejectedValueOnce(
        new Error('Portfolio ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.getPortfolio(orgId, ledgerId, '')).rejects.toThrow(
        'Portfolio ID is required'
      );

      // Verify API client was called with empty portfolioId
      expect(mockPortfolioApiClient.getPortfolio).toHaveBeenCalledWith(orgId, ledgerId, '');
    });

    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      mockPortfolioApiClient.getPortfolio.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(portfoliosService.getPortfolio(orgId, ledgerId, portfolioId)).rejects.toThrow();
    });
  });

  describe('createPortfolio', () => {
    it('should create a portfolio successfully', async () => {
      // Setup
      const createInput: CreatePortfolioInput = {
        name: 'New Portfolio',
        entityId: 'entity_123',
        metadata: {
          category: 'investment',
        },
      };

      mockPortfolioApiClient.createPortfolio.mockResolvedValueOnce(mockPortfolio);

      // Execute
      const result = await portfoliosService.createPortfolio(orgId, ledgerId, createInput);

      // Verify
      expect(mockPortfolioApiClient.createPortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        createInput
      );
      expect(result).toEqual(mockPortfolio);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const createInput: CreatePortfolioInput = {
        name: 'New Portfolio',
        entityId: 'entity_123',
      };

      mockPortfolioApiClient.createPortfolio.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.createPortfolio('', ledgerId, createInput)).rejects.toThrow(
        'Organization ID is required'
      );

      // Verify API client was called with empty orgId
      expect(mockPortfolioApiClient.createPortfolio).toHaveBeenCalledWith(
        '',
        ledgerId,
        createInput
      );
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const createInput: CreatePortfolioInput = {
        name: 'New Portfolio',
        entityId: 'entity_123',
      };

      mockPortfolioApiClient.createPortfolio.mockRejectedValueOnce(
        new Error('Ledger ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.createPortfolio(orgId, '', createInput)).rejects.toThrow(
        'Ledger ID is required'
      );

      // Verify API client was called with empty ledgerId
      expect(mockPortfolioApiClient.createPortfolio).toHaveBeenCalledWith(orgId, '', createInput);
    });

    it('should delegate validation to the API client for invalid input', async () => {
      // Setup
      const invalidInput = {} as CreatePortfolioInput;
      mockPortfolioApiClient.createPortfolio.mockRejectedValueOnce(
        new ValidationError('Required fields missing')
      );

      // Execute & Verify
      await expect(
        portfoliosService.createPortfolio(orgId, ledgerId, invalidInput)
      ).rejects.toThrow(ValidationError);

      // Verify API client was called with invalid input
      expect(mockPortfolioApiClient.createPortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        invalidInput
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const createInput: CreatePortfolioInput = {
        name: 'New Portfolio',
        entityId: 'entity_123',
      };

      const errorMessage = 'API Error';
      mockPortfolioApiClient.createPortfolio.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(
        portfoliosService.createPortfolio(orgId, ledgerId, createInput)
      ).rejects.toThrow();
    });
  });

  describe('updatePortfolio', () => {
    it('should update a portfolio successfully', async () => {
      // Setup
      const updateInput: UpdatePortfolioInput = {
        name: 'Updated Portfolio',
        metadata: {
          category: 'updated-category',
        },
      };

      const updatedPortfolio = {
        ...mockPortfolio,
        name: 'Updated Portfolio',
        metadata: {
          category: 'updated-category',
        },
      };

      mockPortfolioApiClient.updatePortfolio.mockResolvedValueOnce(updatedPortfolio);

      // Execute
      const result = await portfoliosService.updatePortfolio(
        orgId,
        ledgerId,
        portfolioId,
        updateInput
      );

      // Verify
      expect(mockPortfolioApiClient.updatePortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        portfolioId,
        updateInput
      );
      expect(result).toEqual(updatedPortfolio);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const updateInput: UpdatePortfolioInput = {
        name: 'Updated Portfolio',
      };

      mockPortfolioApiClient.updatePortfolio.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(
        portfoliosService.updatePortfolio('', ledgerId, portfolioId, updateInput)
      ).rejects.toThrow('Organization ID is required');

      // Verify API client was called with empty orgId
      expect(mockPortfolioApiClient.updatePortfolio).toHaveBeenCalledWith(
        '',
        ledgerId,
        portfolioId,
        updateInput
      );
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const updateInput: UpdatePortfolioInput = {
        name: 'Updated Portfolio',
      };

      mockPortfolioApiClient.updatePortfolio.mockRejectedValueOnce(
        new Error('Ledger ID is required')
      );

      // Execute & Verify
      await expect(
        portfoliosService.updatePortfolio(orgId, '', portfolioId, updateInput)
      ).rejects.toThrow('Ledger ID is required');

      // Verify API client was called with empty ledgerId
      expect(mockPortfolioApiClient.updatePortfolio).toHaveBeenCalledWith(
        orgId,
        '',
        portfolioId,
        updateInput
      );
    });

    it('should delegate validation to the API client for missing portfolioId', async () => {
      // Setup
      const updateInput: UpdatePortfolioInput = {
        name: 'Updated Portfolio',
      };

      mockPortfolioApiClient.updatePortfolio.mockRejectedValueOnce(
        new Error('Portfolio ID is required')
      );

      // Execute & Verify
      await expect(
        portfoliosService.updatePortfolio(orgId, ledgerId, '', updateInput)
      ).rejects.toThrow('Portfolio ID is required');

      // Verify API client was called with empty portfolioId
      expect(mockPortfolioApiClient.updatePortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        '',
        updateInput
      );
    });

    it('should delegate validation to the API client for invalid input', async () => {
      // Setup
      const invalidInput = {} as UpdatePortfolioInput;
      mockPortfolioApiClient.updatePortfolio.mockRejectedValueOnce(
        new ValidationError('Invalid input')
      );

      // Execute & Verify
      await expect(
        portfoliosService.updatePortfolio(orgId, ledgerId, portfolioId, invalidInput)
      ).rejects.toThrow(ValidationError);

      // Verify API client was called with invalid input
      expect(mockPortfolioApiClient.updatePortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        portfolioId,
        invalidInput
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdatePortfolioInput = {
        name: 'Updated Portfolio',
      };

      const errorMessage = 'API Error';
      mockPortfolioApiClient.updatePortfolio.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(
        portfoliosService.updatePortfolio(orgId, ledgerId, portfolioId, updateInput)
      ).rejects.toThrow();
    });
  });

  describe('deletePortfolio', () => {
    it('should delete a portfolio successfully', async () => {
      // Setup
      mockPortfolioApiClient.deletePortfolio.mockResolvedValueOnce(undefined);

      // Execute
      await portfoliosService.deletePortfolio(orgId, ledgerId, portfolioId);

      // Verify
      expect(mockPortfolioApiClient.deletePortfolio).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        portfolioId
      );
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      mockPortfolioApiClient.deletePortfolio.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.deletePortfolio('', ledgerId, portfolioId)).rejects.toThrow(
        'Organization ID is required'
      );

      // Verify API client was called with empty orgId
      expect(mockPortfolioApiClient.deletePortfolio).toHaveBeenCalledWith(
        '',
        ledgerId,
        portfolioId
      );
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      mockPortfolioApiClient.deletePortfolio.mockRejectedValueOnce(
        new Error('Ledger ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.deletePortfolio(orgId, '', portfolioId)).rejects.toThrow(
        'Ledger ID is required'
      );

      // Verify API client was called with empty ledgerId
      expect(mockPortfolioApiClient.deletePortfolio).toHaveBeenCalledWith(orgId, '', portfolioId);
    });

    it('should delegate validation to the API client for missing portfolioId', async () => {
      // Setup
      mockPortfolioApiClient.deletePortfolio.mockRejectedValueOnce(
        new Error('Portfolio ID is required')
      );

      // Execute & Verify
      await expect(portfoliosService.deletePortfolio(orgId, ledgerId, '')).rejects.toThrow(
        'Portfolio ID is required'
      );

      // Verify API client was called with empty portfolioId
      expect(mockPortfolioApiClient.deletePortfolio).toHaveBeenCalledWith(orgId, ledgerId, '');
    });

    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      mockPortfolioApiClient.deletePortfolio.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(
        portfoliosService.deletePortfolio(orgId, ledgerId, portfolioId)
      ).rejects.toThrow();
    });
  });
});
