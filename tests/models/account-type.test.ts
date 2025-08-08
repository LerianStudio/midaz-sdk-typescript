/**
 * Account Type Model Tests
 */

import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
  createAccountTypeBuilder,
  createUpdateAccountTypeBuilder,
  AccountTypeBuilder,
  UpdateAccountTypeBuilder,
} from '../../src/models/account-type';

describe('AccountType Models', () => {
  describe('AccountTypeBuilder', () => {
    it('should create a basic account type input', () => {
      const builder = new AccountTypeBuilder('Cash Account', 'CASH');
      const input = builder.build();

      expect(input).toEqual({
        name: 'Cash Account',
        keyValue: 'CASH',
      });
    });

    it('should create an account type input with description', () => {
      const input = createAccountTypeBuilder('Savings Account', 'SAVINGS')
        .withDescription('Account for savings and deposits')
        .build();

      expect(input).toEqual({
        name: 'Savings Account',
        keyValue: 'SAVINGS',
        description: 'Account for savings and deposits',
      });
    });

    it('should create an account type input with metadata', () => {
      const metadata = {
        category: 'assets',
        liquidity: 'high',
        currency: 'USD',
      };

      const input = createAccountTypeBuilder('Current Account', 'CURRENT')
        .withDescription('Current account for daily operations')
        .withMetadata(metadata)
        .build();

      expect(input).toEqual({
        name: 'Current Account',
        keyValue: 'CURRENT',
        description: 'Current account for daily operations',
        metadata,
      });
    });

    it('should create an account type with all fields', () => {
      const metadata = {
        category: 'liability',
        subcategory: 'payable',
      };

      const input = createAccountTypeBuilder('Accounts Payable', 'AP')
        .withDescription('Account for amounts owed to suppliers')
        .withMetadata(metadata)
        .build();

      expect(input).toEqual({
        name: 'Accounts Payable',
        keyValue: 'AP',
        description: 'Account for amounts owed to suppliers',
        metadata,
      });
    });
  });

  describe('UpdateAccountTypeBuilder', () => {
    it('should create an empty update input', () => {
      const builder = new UpdateAccountTypeBuilder();
      const input = builder.build();

      expect(input).toEqual({});
    });

    it('should create an update input with name', () => {
      const input = createUpdateAccountTypeBuilder()
        .withName('Updated Cash Account')
        .build();

      expect(input).toEqual({
        name: 'Updated Cash Account',
      });
    });

    it('should create an update input with description', () => {
      const input = createUpdateAccountTypeBuilder()
        .withDescription('Updated description for the account type')
        .build();

      expect(input).toEqual({
        description: 'Updated description for the account type',
      });
    });

    it('should create an update input with metadata', () => {
      const metadata = {
        category: 'assets',
        updated: '2023-12-01T00:00:00Z',
      };

      const input = createUpdateAccountTypeBuilder()
        .withMetadata(metadata)
        .build();

      expect(input).toEqual({
        metadata,
      });
    });

    it('should create an update input with all fields', () => {
      const metadata = {
        category: 'liability',
        priority: 'high',
        updated: '2023-12-01T00:00:00Z',
      };

      const input = createUpdateAccountTypeBuilder()
        .withName('Updated Payable Account')
        .withDescription('Updated account for payables')
        .withMetadata(metadata)
        .build();

      expect(input).toEqual({
        name: 'Updated Payable Account',
        description: 'Updated account for payables',
        metadata,
      });
    });
  });

  describe('AccountType Interface', () => {
    it('should define a complete account type', () => {
      const accountType: AccountType = {
        id: 'at_123456789',
        organizationId: 'org_123',
        ledgerId: 'ledger_456',
        name: 'Cash Account',
        keyValue: 'CASH',
        description: 'Account for liquid cash assets',
        metadata: {
          category: 'assets',
          liquidity: 'very_high',
        },
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
      };

      expect(accountType.id).toBe('at_123456789');
      expect(accountType.name).toBe('Cash Account');
      expect(accountType.keyValue).toBe('CASH');
      expect(accountType.organizationId).toBe('org_123');
      expect(accountType.ledgerId).toBe('ledger_456');
      expect(accountType.metadata).toEqual({
        category: 'assets',
        liquidity: 'very_high',
      });
    });

    it('should handle optional fields', () => {
      const accountType: AccountType = {
        id: 'at_987654321',
        organizationId: 'org_456',
        ledgerId: 'ledger_789',
        name: 'Equity Account',
        keyValue: 'EQUITY',
        createdAt: '2023-12-01T11:00:00Z',
        updatedAt: '2023-12-01T11:00:00Z',
      };

      expect(accountType.description).toBeUndefined();
      expect(accountType.metadata).toBeUndefined();
      expect(accountType.deletedAt).toBeUndefined();
    });

    it('should handle deletedAt field', () => {
      const accountType: AccountType = {
        id: 'at_deleted',
        organizationId: 'org_123',
        ledgerId: 'ledger_456',
        name: 'Deleted Account',
        keyValue: 'DELETED',
        createdAt: '2023-12-01T09:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
        deletedAt: '2023-12-01T12:00:00Z',
      };

      expect(accountType.deletedAt).toBe('2023-12-01T12:00:00Z');
    });
  });

  describe('Input Validation', () => {
    it('should require name for CreateAccountTypeInput', () => {
      const builder = createAccountTypeBuilder('', 'CASH');
      const input = builder.build();

      expect(input.name).toBe('');
      expect(input.keyValue).toBe('CASH');
    });

    it('should require keyValue for CreateAccountTypeInput', () => {
      const builder = createAccountTypeBuilder('Cash Account', '');
      const input = builder.build();

      expect(input.name).toBe('Cash Account');
      expect(input.keyValue).toBe('');
    });

    it('should allow all optional fields in UpdateAccountTypeInput', () => {
      const input = createUpdateAccountTypeBuilder().build();

      expect(Object.keys(input)).toHaveLength(0);
    });
  });
});