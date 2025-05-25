/**
 * @file Tests for the BalancesServiceImpl implementation
 * @description Unit tests for the BalancesService implementation
 */

import { BalancesServiceImpl } from '../../../src/entities/implementations/balances-impl';
import { Observability } from '../../../src/util/observability';
import { Balance, UpdateBalanceInput } from '../../../src/models/balance';
import { ListResponse } from '../../../src/models/common';
import { ValidationError } from '../../../src/util/validation';
import { BalanceApiClient } from '../../../src/api/interfaces/balance-api-client';

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

// Mock the balance-validator
jest.mock('../../../src/models/validators/balance-validator', () => {
  return {
    validateUpdateBalanceInput: jest.fn().mockImplementation((input) => {
      // Simple validation for testing
      if (input === null || input === undefined) {
        throw new ValidationError('Input is required');
      }
      return { valid: true };
    }),
  };
});

// Mock the validation utility
jest.mock('../../../src/util/validation', () => {
  const originalModule = jest.requireActual('../../../src/util/validation');
  return {
    ...originalModule,
    validate: jest.fn().mockImplementation((input, validator) => {
      if (input === null || input === undefined) {
        throw new ValidationError('Input is required');
      }
      // Just pass through for valid inputs
      return validator(input);
    }),
    ValidationError: originalModule.ValidationError,
  };
});

describe('BalancesServiceImpl', () => {
  let balancesService: BalancesServiceImpl;
  let mockBalanceApiClient: jest.Mocked<BalanceApiClient>;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const accountId = 'acc_789';
  const balanceId = 'bal_123';

  const mockBalance: Balance = {
    id: balanceId,
    organizationId: orgId,
    ledgerId: ledgerId,
    accountId: accountId,
    alias: 'operating-cash',
    assetCode: 'USD',
    available: 1000,
    onHold: 0,
    scale: 100,
    version: 1,
    accountType: 'ASSET',
    allowSending: true,
    allowReceiving: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    metadata: {
      lastReconciled: '2023-01-01T00:00:00Z',
    },
  };

  const mockBalancesList: ListResponse<Balance> = {
    items: [mockBalance],
    meta: {
      total: 1,
      count: 1,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock BalanceApiClient
    mockBalanceApiClient = {
      listBalances: jest.fn(),
      listAccountBalances: jest.fn(),
      getBalance: jest.fn(),
      updateBalance: jest.fn(),
      deleteBalance: jest.fn(),
    } as unknown as jest.Mocked<BalanceApiClient>;

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
    balancesService = new BalancesServiceImpl(mockBalanceApiClient, observability);
  });

  describe('listBalances', () => {
    it('should list balances successfully', async () => {
      // Setup
      mockBalanceApiClient.listBalances.mockResolvedValueOnce(mockBalancesList);

      // Execute
      const result = await balancesService.listBalances(orgId, ledgerId);

      // Verify
      expect(mockBalanceApiClient.listBalances).toHaveBeenCalledWith(orgId, ledgerId, undefined);
      expect(result).toEqual(mockBalancesList);
    });

    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = {
        limit: 5,
        offset: 10,
        filter: { available: { gt: 0 } },
      };
      mockBalanceApiClient.listBalances.mockResolvedValueOnce(mockBalancesList);

      // Execute
      const result = await balancesService.listBalances(orgId, ledgerId, listOptions);

      // Verify
      expect(mockBalanceApiClient.listBalances).toHaveBeenCalledWith(orgId, ledgerId, listOptions);
      expect(result).toEqual(mockBalancesList);
    });

    it('should handle empty orgId', async () => {
      // Setup
      mockBalanceApiClient.listBalances.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(balancesService.listBalances('', ledgerId)).rejects.toThrow(
        'Organization ID is required'
      );
    });

    it('should handle empty ledgerId', async () => {
      // Setup
      mockBalanceApiClient.listBalances.mockRejectedValueOnce(new Error('Ledger ID is required'));

      // Execute & Verify
      await expect(balancesService.listBalances(orgId, '')).rejects.toThrow(
        'Ledger ID is required'
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockBalanceApiClient.listBalances.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(balancesService.listBalances(orgId, ledgerId)).rejects.toThrow('API Error');
    });
  });

  describe('listAccountBalances', () => {
    it('should list account balances successfully', async () => {
      // Setup
      mockBalanceApiClient.listAccountBalances.mockResolvedValueOnce(mockBalancesList);

      // Execute
      const result = await balancesService.listAccountBalances(orgId, ledgerId, accountId);

      // Verify
      expect(mockBalanceApiClient.listAccountBalances).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        undefined
      );
      expect(result).toEqual(mockBalancesList);
    });

    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = {
        limit: 5,
        offset: 10,
      };
      mockBalanceApiClient.listAccountBalances.mockResolvedValueOnce(mockBalancesList);

      // Execute
      const result = await balancesService.listAccountBalances(
        orgId,
        ledgerId,
        accountId,
        listOptions
      );

      // Verify
      expect(mockBalanceApiClient.listAccountBalances).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        listOptions
      );
      expect(result).toEqual(mockBalancesList);
    });

    it('should handle empty orgId', async () => {
      // Setup
      mockBalanceApiClient.listAccountBalances.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(balancesService.listAccountBalances('', ledgerId, accountId)).rejects.toThrow(
        'Organization ID is required'
      );
    });

    it('should handle empty ledgerId', async () => {
      // Setup
      mockBalanceApiClient.listAccountBalances.mockRejectedValueOnce(
        new Error('Ledger ID is required')
      );

      // Execute & Verify
      await expect(balancesService.listAccountBalances(orgId, '', accountId)).rejects.toThrow(
        'Ledger ID is required'
      );
    });

    it('should handle empty accountId', async () => {
      // Setup
      mockBalanceApiClient.listAccountBalances.mockRejectedValueOnce(
        new Error('Account ID is required')
      );

      // Execute & Verify
      await expect(balancesService.listAccountBalances(orgId, ledgerId, '')).rejects.toThrow(
        'Account ID is required'
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockBalanceApiClient.listAccountBalances.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(balancesService.listAccountBalances(orgId, ledgerId, accountId)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('getBalance', () => {
    it('should get a balance by ID successfully', async () => {
      // Setup
      mockBalanceApiClient.getBalance.mockResolvedValueOnce(mockBalance);

      // Execute
      const result = await balancesService.getBalance(orgId, ledgerId, balanceId);

      // Verify
      expect(mockBalanceApiClient.getBalance).toHaveBeenCalledWith(orgId, ledgerId, balanceId);
      expect(result).toEqual(mockBalance);
    });

    it('should handle empty orgId', async () => {
      // Setup
      mockBalanceApiClient.getBalance.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(balancesService.getBalance('', ledgerId, balanceId)).rejects.toThrow(
        'Organization ID is required'
      );
    });

    it('should handle empty ledgerId', async () => {
      // Setup
      mockBalanceApiClient.getBalance.mockRejectedValueOnce(new Error('Ledger ID is required'));

      // Execute & Verify
      await expect(balancesService.getBalance(orgId, '', balanceId)).rejects.toThrow(
        'Ledger ID is required'
      );
    });

    it('should handle empty balanceId', async () => {
      // Setup
      mockBalanceApiClient.getBalance.mockRejectedValueOnce(new Error('Balance ID is required'));

      // Execute & Verify
      await expect(balancesService.getBalance(orgId, ledgerId, '')).rejects.toThrow(
        'Balance ID is required'
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockBalanceApiClient.getBalance.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(balancesService.getBalance(orgId, ledgerId, balanceId)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('updateBalance', () => {
    it('should update a balance successfully', async () => {
      // Setup
      const updateInput: UpdateBalanceInput = {
        allowSending: false,
        allowReceiving: true,
      };

      const updatedBalance = {
        ...mockBalance,
        allowSending: false,
        updatedAt: '2023-01-02T00:00:00Z',
      };

      mockBalanceApiClient.updateBalance.mockResolvedValueOnce(updatedBalance);

      // Execute
      const result = await balancesService.updateBalance(orgId, ledgerId, balanceId, updateInput);

      // Verify
      expect(mockBalanceApiClient.updateBalance).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        balanceId,
        updateInput
      );
      expect(result).toEqual(updatedBalance);
    });

    it('should handle empty orgId', async () => {
      // Setup
      const updateInput: UpdateBalanceInput = {
        allowSending: false,
      };
      mockBalanceApiClient.updateBalance.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(
        balancesService.updateBalance('', ledgerId, balanceId, updateInput)
      ).rejects.toThrow('Organization ID is required');
    });

    it('should handle empty ledgerId', async () => {
      // Setup
      const updateInput: UpdateBalanceInput = {
        allowSending: false,
      };
      mockBalanceApiClient.updateBalance.mockRejectedValueOnce(new Error('Ledger ID is required'));

      // Execute & Verify
      await expect(
        balancesService.updateBalance(orgId, '', balanceId, updateInput)
      ).rejects.toThrow('Ledger ID is required');
    });

    it('should handle empty balanceId', async () => {
      // Setup
      const updateInput: UpdateBalanceInput = {
        allowSending: false,
      };
      mockBalanceApiClient.updateBalance.mockRejectedValueOnce(new Error('Balance ID is required'));

      // Execute & Verify
      await expect(balancesService.updateBalance(orgId, ledgerId, '', updateInput)).rejects.toThrow(
        'Balance ID is required'
      );
    });

    it('should handle validation errors', async () => {
      // Setup
      const invalidInput = {} as UpdateBalanceInput;
      mockBalanceApiClient.updateBalance.mockRejectedValueOnce(
        new ValidationError('Invalid input')
      );

      // Execute & Verify
      await expect(
        balancesService.updateBalance(orgId, ledgerId, balanceId, invalidInput)
      ).rejects.toThrow(ValidationError);
    });

    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdateBalanceInput = {
        allowSending: false,
      };

      const apiError = new Error('API Error');
      mockBalanceApiClient.updateBalance.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(
        balancesService.updateBalance(orgId, ledgerId, balanceId, updateInput)
      ).rejects.toThrow('API Error');
    });
  });

  describe('deleteBalance', () => {
    it('should delete a balance successfully', async () => {
      // Setup
      mockBalanceApiClient.deleteBalance.mockResolvedValueOnce(undefined);

      // Execute
      await balancesService.deleteBalance(orgId, ledgerId, balanceId);

      // Verify
      expect(mockBalanceApiClient.deleteBalance).toHaveBeenCalledWith(orgId, ledgerId, balanceId);
    });

    it('should handle empty orgId', async () => {
      // Setup
      mockBalanceApiClient.deleteBalance.mockRejectedValueOnce(
        new Error('Organization ID is required')
      );

      // Execute & Verify
      await expect(balancesService.deleteBalance('', ledgerId, balanceId)).rejects.toThrow(
        'Organization ID is required'
      );
    });

    it('should handle empty ledgerId', async () => {
      // Setup
      mockBalanceApiClient.deleteBalance.mockRejectedValueOnce(new Error('Ledger ID is required'));

      // Execute & Verify
      await expect(balancesService.deleteBalance(orgId, '', balanceId)).rejects.toThrow(
        'Ledger ID is required'
      );
    });

    it('should handle empty balanceId', async () => {
      // Setup
      mockBalanceApiClient.deleteBalance.mockRejectedValueOnce(new Error('Balance ID is required'));

      // Execute & Verify
      await expect(balancesService.deleteBalance(orgId, ledgerId, '')).rejects.toThrow(
        'Balance ID is required'
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockBalanceApiClient.deleteBalance.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(balancesService.deleteBalance(orgId, ledgerId, balanceId)).rejects.toThrow(
        'API Error'
      );
    });
  });
});
