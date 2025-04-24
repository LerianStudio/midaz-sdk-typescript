/**
 * @file Tests for the AccountsServiceImpl implementation
 * @description Unit tests for the AccountsService implementation
 */

import { AccountsServiceImpl } from '../../../src/entities/implementations/accounts-impl';
import { Observability } from '../../../src/util/observability';
import { 
  Account, 
  CreateAccountInput, 
  UpdateAccountInput 
} from '../../../src/models/account';
import { ListResponse, StatusCode } from '../../../src/models/common';
import { AccountApiClient } from '../../../src/api/interfaces/account-api-client';

// Mock the Observability
jest.mock('../../../src/util/observability/observability', () => {
  return {
    Observability: jest.fn().mockImplementation(() => {
      return {
        startSpan: jest.fn().mockReturnValue({
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          setStatus: jest.fn(),
          end: jest.fn()
        }),
        recordMetric: jest.fn()
      };
    })
  };
});

describe('AccountsServiceImpl', () => {
  let accountsService: AccountsServiceImpl;
  let mockAccountApiClient: jest.Mocked<AccountApiClient>;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const accountId = 'acc_789';
  
  const mockAccount: Account = {
    id: accountId,
    name: 'Test Account',
    assetCode: 'USD',
    type: 'deposit',
    status: { 
      code: 'ACTIVE',
      timestamp: '2023-01-01T00:00:00Z'
    },
    organizationId: orgId,
    ledgerId: ledgerId,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };
  
  const mockAccountsList: ListResponse<Account> = {
    items: [mockAccount],
    meta: {
      total: 1,
      count: 1
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock AccountApiClient
    mockAccountApiClient = {
      listAccounts: jest.fn(),
      getAccount: jest.fn(),
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn()
    } as unknown as jest.Mocked<AccountApiClient>;
    
    // Create a mock Observability instance
    observability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      }),
      recordMetric: jest.fn()
    } as unknown as jest.Mocked<Observability>;
    
    // Create the service instance
    accountsService = new AccountsServiceImpl(mockAccountApiClient, observability);
  });

  describe('listAccounts', () => {
    it('should list accounts successfully', async () => {
      // Setup
      mockAccountApiClient.listAccounts.mockResolvedValueOnce(mockAccountsList);
      
      // Execute
      const result = await accountsService.listAccounts(orgId, ledgerId);
      
      // Verify
      expect(mockAccountApiClient.listAccounts).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined
      );
      expect(result).toEqual(mockAccountsList);
    });
    
    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = { 
        limit: 5, 
        offset: 10,
        filter: { type: 'deposit' }
      };
      mockAccountApiClient.listAccounts.mockResolvedValueOnce(mockAccountsList);
      
      // Execute
      const result = await accountsService.listAccounts(orgId, ledgerId, listOptions);
      
      // Verify
      expect(mockAccountApiClient.listAccounts).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        listOptions
      );
      expect(result).toEqual(mockAccountsList);
    });
    
    it('should handle empty orgId', async () => {
      // Setup
      mockAccountApiClient.listAccounts.mockRejectedValueOnce(new Error('Organization ID is required'));
      
      // Execute & Verify
      await expect(accountsService.listAccounts('', ledgerId))
        .rejects.toThrow('Organization ID is required');
    });
    
    it('should handle empty ledgerId', async () => {
      // Setup
      mockAccountApiClient.listAccounts.mockRejectedValueOnce(new Error('Ledger ID is required'));
      
      // Execute & Verify
      await expect(accountsService.listAccounts(orgId, ''))
        .rejects.toThrow('Ledger ID is required');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockAccountApiClient.listAccounts.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(accountsService.listAccounts(orgId, ledgerId))
        .rejects.toThrow('API Error');
    });
  });

  describe('getAccount', () => {
    it('should get an account by ID successfully', async () => {
      // Setup
      mockAccountApiClient.getAccount.mockResolvedValueOnce(mockAccount);
      
      // Execute
      const result = await accountsService.getAccount(orgId, ledgerId, accountId);
      
      // Verify
      expect(mockAccountApiClient.getAccount).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId
      );
      expect(result).toEqual(mockAccount);
    });
    
    it('should handle empty orgId', async () => {
      // Setup
      mockAccountApiClient.getAccount.mockRejectedValueOnce(new Error('Organization ID is required'));
      
      // Execute & Verify
      await expect(accountsService.getAccount('', ledgerId, accountId))
        .rejects.toThrow('Organization ID is required');
    });
    
    it('should handle empty ledgerId', async () => {
      // Setup
      mockAccountApiClient.getAccount.mockRejectedValueOnce(new Error('Ledger ID is required'));
      
      // Execute & Verify
      await expect(accountsService.getAccount(orgId, '', accountId))
        .rejects.toThrow('Ledger ID is required');
    });
    
    it('should handle empty accountId', async () => {
      // Setup
      mockAccountApiClient.getAccount.mockRejectedValueOnce(new Error('Account ID is required'));
      
      // Execute & Verify
      await expect(accountsService.getAccount(orgId, ledgerId, ''))
        .rejects.toThrow('Account ID is required');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockAccountApiClient.getAccount.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(accountsService.getAccount(orgId, ledgerId, accountId))
        .rejects.toThrow('API Error');
    });
  });

  describe('createAccount', () => {
    it('should create an account successfully', async () => {
      // Setup
      const createInput: CreateAccountInput = {
        name: 'New Account',
        assetCode: 'USD',
        type: 'deposit'
      };
      mockAccountApiClient.createAccount.mockResolvedValueOnce(mockAccount);
      
      // Execute
      const result = await accountsService.createAccount(orgId, ledgerId, createInput);
      
      // Verify
      expect(mockAccountApiClient.createAccount).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        createInput
      );
      expect(result).toEqual(mockAccount);
    });
    
    it('should handle empty orgId', async () => {
      // Setup
      const createInput: CreateAccountInput = {
        name: 'New Account',
        assetCode: 'USD',
        type: 'deposit'
      };
      mockAccountApiClient.createAccount.mockRejectedValueOnce(new Error('Organization ID is required'));
      
      // Execute & Verify
      await expect(accountsService.createAccount('', ledgerId, createInput))
        .rejects.toThrow('Organization ID is required');
    });
    
    it('should handle empty ledgerId', async () => {
      // Setup
      const createInput: CreateAccountInput = {
        name: 'New Account',
        assetCode: 'USD',
        type: 'deposit'
      };
      mockAccountApiClient.createAccount.mockRejectedValueOnce(new Error('Ledger ID is required'));
      
      // Execute & Verify
      await expect(accountsService.createAccount(orgId, '', createInput))
        .rejects.toThrow('Ledger ID is required');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const createInput: CreateAccountInput = {
        name: 'New Account',
        assetCode: 'USD',
        type: 'deposit'
      };
      const apiError = new Error('API Error');
      mockAccountApiClient.createAccount.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(accountsService.createAccount(orgId, ledgerId, createInput))
        .rejects.toThrow('API Error');
    });
  });

  describe('updateAccount', () => {
    it('should update an account successfully', async () => {
      // Setup
      const updateInput: UpdateAccountInput = {
        name: 'Updated Account',
        status: StatusCode.INACTIVE
      };
      mockAccountApiClient.updateAccount.mockResolvedValueOnce(mockAccount);
      
      // Execute
      const result = await accountsService.updateAccount(orgId, ledgerId, accountId, updateInput);
      
      // Verify
      expect(mockAccountApiClient.updateAccount).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId,
        updateInput
      );
      expect(result).toEqual(mockAccount);
    });
    
    it('should handle empty orgId', async () => {
      // Setup
      const updateInput: UpdateAccountInput = {
        name: 'Updated Account'
      };
      mockAccountApiClient.updateAccount.mockRejectedValueOnce(new Error('Organization ID is required'));
      
      // Execute & Verify
      await expect(accountsService.updateAccount('', ledgerId, accountId, updateInput))
        .rejects.toThrow('Organization ID is required');
    });
    
    it('should handle empty ledgerId', async () => {
      // Setup
      const updateInput: UpdateAccountInput = {
        name: 'Updated Account'
      };
      mockAccountApiClient.updateAccount.mockRejectedValueOnce(new Error('Ledger ID is required'));
      
      // Execute & Verify
      await expect(accountsService.updateAccount(orgId, '', accountId, updateInput))
        .rejects.toThrow('Ledger ID is required');
    });
    
    it('should handle empty accountId', async () => {
      // Setup
      const updateInput: UpdateAccountInput = {
        name: 'Updated Account'
      };
      mockAccountApiClient.updateAccount.mockRejectedValueOnce(new Error('Account ID is required'));
      
      // Execute & Verify
      await expect(accountsService.updateAccount(orgId, ledgerId, '', updateInput))
        .rejects.toThrow('Account ID is required');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdateAccountInput = {
        name: 'Updated Account'
      };
      const apiError = new Error('API Error');
      mockAccountApiClient.updateAccount.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(accountsService.updateAccount(orgId, ledgerId, accountId, updateInput))
        .rejects.toThrow('API Error');
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account successfully', async () => {
      // Setup
      mockAccountApiClient.deleteAccount.mockResolvedValueOnce(undefined);
      
      // Execute
      await accountsService.deleteAccount(orgId, ledgerId, accountId);
      
      // Verify
      expect(mockAccountApiClient.deleteAccount).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        accountId
      );
    });
    
    it('should handle empty orgId', async () => {
      // Setup
      mockAccountApiClient.deleteAccount.mockRejectedValueOnce(new Error('Organization ID is required'));
      
      // Execute & Verify
      await expect(accountsService.deleteAccount('', ledgerId, accountId))
        .rejects.toThrow('Organization ID is required');
    });
    
    it('should handle empty ledgerId', async () => {
      // Setup
      mockAccountApiClient.deleteAccount.mockRejectedValueOnce(new Error('Ledger ID is required'));
      
      // Execute & Verify
      await expect(accountsService.deleteAccount(orgId, '', accountId))
        .rejects.toThrow('Ledger ID is required');
    });
    
    it('should handle empty accountId', async () => {
      // Setup
      mockAccountApiClient.deleteAccount.mockRejectedValueOnce(new Error('Account ID is required'));
      
      // Execute & Verify
      await expect(accountsService.deleteAccount(orgId, ledgerId, ''))
        .rejects.toThrow('Account ID is required');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockAccountApiClient.deleteAccount.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(accountsService.deleteAccount(orgId, ledgerId, accountId))
        .rejects.toThrow('API Error');
    });
  });
});
