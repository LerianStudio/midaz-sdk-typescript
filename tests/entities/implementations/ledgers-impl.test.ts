/**
 * @file Tests for the LedgersServiceImpl implementation
 * @description Unit tests for the LedgersService implementation
 */

import { LedgersServiceImpl } from '../../../src/entities/implementations/ledgers-impl';
import { Observability } from '../../../src/util/observability';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../../../src/models/ledger';
import { ListResponse, StatusCode } from '../../../src/models/common';
import { LedgerApiClient } from '../../../src/api/interfaces/ledger-api-client';

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

describe('LedgersServiceImpl', () => {
  let ledgersService: LedgersServiceImpl;
  let mockLedgerApiClient: jest.Mocked<LedgerApiClient>;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';

  const mockLedger: Ledger = {
    id: ledgerId,
    name: 'Test Ledger',
    status: {
      code: 'ACTIVE',
      timestamp: '2023-01-01T00:00:00Z',
    },
    organizationId: orgId,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockLedgersList: ListResponse<Ledger> = {
    items: [mockLedger],
    meta: {
      total: 1,
      count: 1,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock LedgerApiClient
    mockLedgerApiClient = {
      listLedgers: jest.fn(),
      getLedger: jest.fn(),
      createLedger: jest.fn(),
      updateLedger: jest.fn(),
      deleteLedger: jest.fn(),
    } as unknown as jest.Mocked<LedgerApiClient>;

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
    ledgersService = new LedgersServiceImpl(mockLedgerApiClient, observability);
  });

  describe('listLedgers', () => {
    it('should list ledgers successfully', async () => {
      // Setup
      mockLedgerApiClient.listLedgers.mockResolvedValueOnce(mockLedgersList);

      // Execute
      const result = await ledgersService.listLedgers(orgId);

      // Verify
      expect(mockLedgerApiClient.listLedgers).toHaveBeenCalledWith(orgId, undefined);
      expect(result).toEqual(mockLedgersList);
    });

    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = {
        limit: 5,
        offset: 10,
        filter: { status: 'ACTIVE' },
      };
      mockLedgerApiClient.listLedgers.mockResolvedValueOnce(mockLedgersList);

      // Execute
      const result = await ledgersService.listLedgers(orgId, listOptions);

      // Verify
      expect(mockLedgerApiClient.listLedgers).toHaveBeenCalledWith(orgId, listOptions);
      expect(result).toEqual(mockLedgersList);
    });

    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      mockLedgerApiClient.listLedgers.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.listLedgers('')).rejects.toThrow('Organization ID is required');

      expect(mockLedgerApiClient.listLedgers).toHaveBeenCalledWith('', undefined);
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockLedgerApiClient.listLedgers.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(ledgersService.listLedgers(orgId)).rejects.toThrow('API Error');
    });
  });

  describe('getLedger', () => {
    it('should get a ledger by ID successfully', async () => {
      // Setup
      mockLedgerApiClient.getLedger.mockResolvedValueOnce(mockLedger);

      // Execute
      const result = await ledgersService.getLedger(orgId, ledgerId);

      // Verify
      expect(mockLedgerApiClient.getLedger).toHaveBeenCalledWith(orgId, ledgerId);
      expect(result).toEqual(mockLedger);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      mockLedgerApiClient.getLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.getLedger('', ledgerId)).rejects.toThrow(
        'Organization ID is required'
      );

      expect(mockLedgerApiClient.getLedger).toHaveBeenCalledWith('', ledgerId);
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const validationError = new Error('Ledger ID is required');
      mockLedgerApiClient.getLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.getLedger(orgId, '')).rejects.toThrow('Ledger ID is required');

      expect(mockLedgerApiClient.getLedger).toHaveBeenCalledWith(orgId, '');
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockLedgerApiClient.getLedger.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(ledgersService.getLedger(orgId, ledgerId)).rejects.toThrow('API Error');
    });
  });

  describe('createLedger', () => {
    it('should create a ledger successfully', async () => {
      // Setup
      const createInput: CreateLedgerInput = {
        name: 'New Ledger',
      };
      mockLedgerApiClient.createLedger.mockResolvedValueOnce(mockLedger);

      // Execute
      const result = await ledgersService.createLedger(orgId, createInput);

      // Verify
      expect(mockLedgerApiClient.createLedger).toHaveBeenCalledWith(orgId, createInput);
      expect(result).toEqual(mockLedger);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const createInput: CreateLedgerInput = {
        name: 'New Ledger',
      };
      const validationError = new Error('Organization ID is required');
      mockLedgerApiClient.createLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.createLedger('', createInput)).rejects.toThrow(
        'Organization ID is required'
      );

      expect(mockLedgerApiClient.createLedger).toHaveBeenCalledWith('', createInput);
    });

    it('should handle API errors', async () => {
      // Setup
      const createInput: CreateLedgerInput = {
        name: 'New Ledger',
      };
      const apiError = new Error('API Error');
      mockLedgerApiClient.createLedger.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(ledgersService.createLedger(orgId, createInput)).rejects.toThrow('API Error');
    });
  });

  describe('updateLedger', () => {
    it('should update a ledger successfully', async () => {
      // Setup
      const updateInput: UpdateLedgerInput = {
        name: 'Updated Ledger',
        status: StatusCode.INACTIVE,
      };
      mockLedgerApiClient.updateLedger.mockResolvedValueOnce(mockLedger);

      // Execute
      const result = await ledgersService.updateLedger(orgId, ledgerId, updateInput);

      // Verify
      expect(mockLedgerApiClient.updateLedger).toHaveBeenCalledWith(orgId, ledgerId, updateInput);
      expect(result).toEqual(mockLedger);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const updateInput: UpdateLedgerInput = {
        name: 'Updated Ledger',
      };
      const validationError = new Error('Organization ID is required');
      mockLedgerApiClient.updateLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.updateLedger('', ledgerId, updateInput)).rejects.toThrow(
        'Organization ID is required'
      );

      expect(mockLedgerApiClient.updateLedger).toHaveBeenCalledWith('', ledgerId, updateInput);
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const updateInput: UpdateLedgerInput = {
        name: 'Updated Ledger',
      };
      const validationError = new Error('Ledger ID is required');
      mockLedgerApiClient.updateLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.updateLedger(orgId, '', updateInput)).rejects.toThrow(
        'Ledger ID is required'
      );

      expect(mockLedgerApiClient.updateLedger).toHaveBeenCalledWith(orgId, '', updateInput);
    });

    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdateLedgerInput = {
        name: 'Updated Ledger',
      };
      const apiError = new Error('API Error');
      mockLedgerApiClient.updateLedger.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(ledgersService.updateLedger(orgId, ledgerId, updateInput)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('deleteLedger', () => {
    it('should delete a ledger successfully', async () => {
      // Setup
      mockLedgerApiClient.deleteLedger.mockResolvedValueOnce(undefined);

      // Execute
      await ledgersService.deleteLedger(orgId, ledgerId);

      // Verify
      expect(mockLedgerApiClient.deleteLedger).toHaveBeenCalledWith(orgId, ledgerId);
    });

    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      mockLedgerApiClient.deleteLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.deleteLedger('', ledgerId)).rejects.toThrow(
        'Organization ID is required'
      );

      expect(mockLedgerApiClient.deleteLedger).toHaveBeenCalledWith('', ledgerId);
    });

    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const validationError = new Error('Ledger ID is required');
      mockLedgerApiClient.deleteLedger.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(ledgersService.deleteLedger(orgId, '')).rejects.toThrow('Ledger ID is required');

      expect(mockLedgerApiClient.deleteLedger).toHaveBeenCalledWith(orgId, '');
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockLedgerApiClient.deleteLedger.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(ledgersService.deleteLedger(orgId, ledgerId)).rejects.toThrow('API Error');
    });
  });
});
