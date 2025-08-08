/**
 * Operation Route Model Tests
 */

import {
  OperationRoute,
  CreateOperationRouteInput,
  UpdateOperationRouteInput,
  AccountRule,
  createOperationRouteBuilder,
  createUpdateOperationRouteBuilder,
  OperationRouteBuilder,
  UpdateOperationRouteBuilder,
} from '../../src/models/operation-route';

describe('OperationRoute Models', () => {
  describe('OperationRouteBuilder', () => {
    it('should create a basic operation route input', () => {
      const builder = new OperationRouteBuilder(
        'Payment Source',
        'Route for payment source operations',
        'source'
      );
      const input = builder.build();

      expect(input).toEqual({
        title: 'Payment Source',
        description: 'Route for payment source operations',
        operationType: 'source',
      });
    });

    it('should create an operation route with account alias', () => {
      const input = createOperationRouteBuilder(
        'Merchant Account',
        'Route for merchant payments',
        'destination'
      )
        .withAccountAlias('merchant-main')
        .build();

      expect(input).toEqual({
        title: 'Merchant Account',
        description: 'Route for merchant payments',
        operationType: 'destination',
        account: {
          ruleType: 'alias',
          validIf: 'merchant-main',
        },
      });
    });

    it('should create an operation route with account types', () => {
      const input = createOperationRouteBuilder(
        'Cash Operations',
        'Route for cash-based operations',
        'source'
      )
        .withAccountTypes(['cash', 'bank'])
        .build();

      expect(input).toEqual({
        title: 'Cash Operations',
        description: 'Route for cash-based operations',
        operationType: 'source',
        account: {
          ruleType: 'account_type',
          validIf: ['cash', 'bank'],
        },
      });
    });

    it('should create an operation route with metadata', () => {
      const metadata = {
        category: 'payment',
        priority: 'high',
        region: 'US',
      };

      const input = createOperationRouteBuilder(
        'High Priority Route',
        'Route for high priority operations',
        'destination'
      )
        .withAccountAlias('priority-account')
        .withMetadata(metadata)
        .build();

      expect(input).toEqual({
        title: 'High Priority Route',
        description: 'Route for high priority operations',
        operationType: 'destination',
        account: {
          ruleType: 'alias',
          validIf: 'priority-account',
        },
        metadata,
      });
    });
  });

  describe('UpdateOperationRouteBuilder', () => {
    it('should create an empty update input', () => {
      const builder = new UpdateOperationRouteBuilder();
      const input = builder.build();

      expect(input).toEqual({});
    });

    it('should update title and description', () => {
      const input = createUpdateOperationRouteBuilder()
        .withTitle('Updated Route Title')
        .withDescription('Updated route description')
        .build();

      expect(input).toEqual({
        title: 'Updated Route Title',
        description: 'Updated route description',
      });
    });

    it('should update account rule with alias', () => {
      const input = createUpdateOperationRouteBuilder()
        .withAccountAlias('new-account-alias')
        .build();

      expect(input).toEqual({
        account: {
          ruleType: 'alias',
          validIf: 'new-account-alias',
        },
      });
    });

    it('should update account rule with types', () => {
      const input = createUpdateOperationRouteBuilder()
        .withAccountTypes(['savings', 'checking'])
        .build();

      expect(input).toEqual({
        account: {
          ruleType: 'account_type',
          validIf: ['savings', 'checking'],
        },
      });
    });

    it('should update with metadata', () => {
      const metadata = {
        updated: '2023-12-01T10:00:00Z',
        version: '2.0',
      };

      const input = createUpdateOperationRouteBuilder()
        .withTitle('Version 2.0 Route')
        .withMetadata(metadata)
        .build();

      expect(input).toEqual({
        title: 'Version 2.0 Route',
        metadata,
      });
    });
  });

  describe('AccountRule', () => {
    it('should define an alias-based account rule', () => {
      const rule: AccountRule = {
        ruleType: 'alias',
        validIf: 'main-account',
      };

      expect(rule.ruleType).toBe('alias');
      expect(rule.validIf).toBe('main-account');
    });

    it('should define an account type-based rule', () => {
      const rule: AccountRule = {
        ruleType: 'account_type',
        validIf: ['cash', 'savings', 'checking'],
      };

      expect(rule.ruleType).toBe('account_type');
      expect(rule.validIf).toEqual(['cash', 'savings', 'checking']);
    });
  });

  describe('OperationRoute Interface', () => {
    it('should define a complete operation route', () => {
      const operationRoute: OperationRoute = {
        id: 'or_123456789',
        organizationId: 'org_123',
        ledgerId: 'ledger_456',
        title: 'Payment Processing Route',
        description: 'Route for processing customer payments',
        operationType: 'destination',
        account: {
          ruleType: 'alias',
          validIf: 'payment-processor',
        },
        metadata: {
          category: 'payment',
          processor: 'stripe',
        },
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
      };

      expect(operationRoute.id).toBe('or_123456789');
      expect(operationRoute.title).toBe('Payment Processing Route');
      expect(operationRoute.operationType).toBe('destination');
      expect(operationRoute.account?.ruleType).toBe('alias');
      expect(operationRoute.account?.validIf).toBe('payment-processor');
    });

    it('should handle source operation type', () => {
      const operationRoute: OperationRoute = {
        id: 'or_source123',
        organizationId: 'org_456',
        ledgerId: 'ledger_789',
        title: 'Source Route',
        description: 'Route for source operations',
        operationType: 'source',
        createdAt: '2023-12-01T11:00:00Z',
        updatedAt: '2023-12-01T11:00:00Z',
      };

      expect(operationRoute.operationType).toBe('source');
      expect(operationRoute.account).toBeUndefined();
      expect(operationRoute.metadata).toBeUndefined();
    });

    it('should handle operation route with account types', () => {
      const operationRoute: OperationRoute = {
        id: 'or_types123',
        organizationId: 'org_789',
        ledgerId: 'ledger_012',
        title: 'Multi-Type Route',
        description: 'Route supporting multiple account types',
        operationType: 'source',
        account: {
          ruleType: 'account_type',
          validIf: ['cash', 'bank', 'digital'],
        },
        createdAt: '2023-12-01T12:00:00Z',
        updatedAt: '2023-12-01T12:00:00Z',
      };

      expect(operationRoute.account?.ruleType).toBe('account_type');
      expect(operationRoute.account?.validIf).toEqual(['cash', 'bank', 'digital']);
    });

    it('should handle deletedAt field', () => {
      const operationRoute: OperationRoute = {
        id: 'or_deleted',
        organizationId: 'org_123',
        ledgerId: 'ledger_456',
        title: 'Deleted Route',
        description: 'This route was deleted',
        operationType: 'source',
        createdAt: '2023-12-01T09:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
        deletedAt: '2023-12-01T13:00:00Z',
      };

      expect(operationRoute.deletedAt).toBe('2023-12-01T13:00:00Z');
    });
  });

  describe('Operation Type Validation', () => {
    it('should accept source operation type', () => {
      const input = createOperationRouteBuilder(
        'Source Route',
        'Description',
        'source'
      ).build();

      expect(input.operationType).toBe('source');
    });

    it('should accept destination operation type', () => {
      const input = createOperationRouteBuilder(
        'Destination Route',
        'Description',
        'destination'
      ).build();

      expect(input.operationType).toBe('destination');
    });
  });
});