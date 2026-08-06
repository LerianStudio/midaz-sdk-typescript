import {
  validateCreateInflowInput,
  validateCreateOutflowInput,
  validateCreateTransactionInput,
} from '../../../src/models/validators/transaction-validator';
import { AmountInput, CreateTransactionInput } from '../../../src/models/transaction';

describe('Transaction Validator', () => {
  // Tests for validateCreateTransactionInput
  describe('validateCreateTransactionInput', () => {
    // Test 1: Valid balanced transaction should pass validation
    it('shouldPassValidationForValidBalancedTransaction', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message || '').toBe('');
    });

    // Test 2: Valid transaction with metadata should pass validation
    it('shouldPassValidationForValidTransactionWithMetadata', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
        metadata: {
          description: 'Monthly rent payment',
          category: 'housing',
        },
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 3: Valid transaction with externalId should pass validation
    it('shouldPassValidationForValidTransactionWithExternalId', () => {
      const validInput: CreateTransactionInput = {
        externalId: 'TRX-12345',
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 4: Missing operations should fail validation
    it('shouldFailValidationForMissingOperations', () => {
      const invalidInput: CreateTransactionInput = {
        externalId: 'TRX-12345',
      } as CreateTransactionInput;

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.operations).toBeDefined();
      expect(result.message).toContain('operations');
    });

    // Test 5: Empty operations array should fail validation
    it('shouldFailValidationForEmptyOperations', () => {
      const invalidInput: CreateTransactionInput = {
        externalId: 'TRX-12345',
        operations: [],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.operations).toBeDefined();
      expect(result.message).toContain('At least one operation is required');
    });

    // Test 6: Unbalanced transaction should fail validation
    it('shouldFailValidationForUnbalancedTransaction', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 50, // Not equal to debit amount
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.operations).toBeDefined();
      expect(result.message).toContain('not balanced');
    });

    // Test 7: Operation with missing accountId should fail validation
    it('shouldFailValidationForMissingAccountId', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: '', // Empty accountId
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['operations[0].accountId']).toBeDefined();
      expect(result.message).toContain('accountId');
    });

    // Test 8: Operation with invalid type should fail validation
    it('shouldFailValidationForInvalidOperationType', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'INVALID' as 'DEBIT' | 'CREDIT', // Invalid type
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['operations[0].type']).toBeDefined();
      expect(result.message).toContain('type');
    });

    // Test 9: Operation with missing amount should fail validation
    it('shouldFailValidationForMissingAmount', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: undefined as unknown as AmountInput,
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['operations[0].amount']).toBeDefined();
      expect(result.message).toContain('amount');
    });

    // Test 10: Amount with missing value should fail validation
    it('shouldFailValidationForMissingAmountValue', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: undefined as unknown as number,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['operations[0].amount.value']).toBeDefined();
      expect(result.message).toContain('value');
    });

    // Test 11: Amount with missing assetCode should fail validation
    it('shouldFailValidationForMissingAssetCode', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: '',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['operations[0].amount.assetCode']).toBeDefined();
      expect(result.message).toContain('assetCode');
    });

    // Test 12: Amount with invalid assetCode format should fail validation
    it('shouldFailValidationForInvalidAssetCodeFormat', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            type: 'DEBIT' as const,
            accountId: 'account1',
            amount: {
              value: '100',
              assetCode: 'usd', // lowercase, invalid format
              scale: 2,
            },
          },
          {
            type: 'CREDIT' as const,
            accountId: 'account2',
            amount: {
              value: '100',
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('currencyCode must match a currency code format');
      expect(result.message).toContain('usd');
    });

    // Test 13: Amount with negative value should fail validation
    it('shouldFailValidationForNegativeAmountValue', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: -100, // Negative value
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('negative');
    });

    // Test 14: Null input should fail validation
    it('shouldFailValidationForNullInput', () => {
      const result = validateCreateTransactionInput(null as unknown as CreateTransactionInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 15: Undefined input should fail validation
    it('shouldFailValidationForUndefinedInput', () => {
      const result = validateCreateTransactionInput(undefined as unknown as CreateTransactionInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 16: Multiple operations with same type should fail validation (unbalanced)
    it('shouldFailValidationForMultipleOperationsWithSameType', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'DEBIT', // Same type as first operation
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      // This test should check that the transaction is not balanced
      // Since we have only DEBIT operations, the transaction is not balanced
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not balanced');
    });

    // Test 17: Transaction with multiple currencies should pass if balanced for each currency
    it('shouldPassValidationForMultipleCurrenciesBalanced', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 200,
              assetCode: 'EUR',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 200,
              assetCode: 'EUR',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 18: Transaction with multiple currencies should fail if unbalanced for any currency
    it('shouldFailValidationForMultipleCurrenciesUnbalanced', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 200,
              assetCode: 'EUR',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 150, // Not equal to debit amount
              assetCode: 'EUR',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.operations).toBeDefined();
      expect(result.message).toContain('not balanced');
      expect(result.message).toContain('EUR');
    });

    // Test 19: Transaction with funding type should pass even if unbalanced
    it('shouldPassValidationForFundingTransaction', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
            metadata: {
              transactionType: 'FUNDING',
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 20: Transaction with withdrawal type should pass even if unbalanced
    it('shouldPassValidationForWithdrawalTransaction', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
            metadata: {
              transactionType: 'WITHDRAWAL',
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 21: Transaction with all credit operations should pass validation
    it('shouldPassValidationForAllCreditOperations', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
            metadata: {
              transactionType: 'FUNDING', // Add transaction type for special handling
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 200,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 22: Transaction with all debit operations should pass validation
    it('shouldPassValidationForAllDebitOperations', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
            metadata: {
              transactionType: 'WITHDRAWAL', // Add transaction type for special handling
            },
          },
          {
            accountId: 'acc_67890',
            type: 'DEBIT',
            amount: {
              value: 200,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 23: Missing scale in amount should fail validation
    it('shouldFailValidationForMissingScale', () => {
      const invalidInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: undefined as unknown as number,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['operations[0].amount.scale']).toBeDefined();
      expect(result.message).toContain('scale');
    });

    // Test 24: Transaction with floating point values should be balanced correctly
    it('shouldHandleFloatingPointValuesCorrectly', () => {
      const validInput: CreateTransactionInput = {
        operations: [
          {
            accountId: 'acc_12345',
            type: 'DEBIT',
            amount: {
              value: 100.5,
              assetCode: 'USD',
              scale: 2,
            },
          },
          {
            accountId: 'acc_67890',
            type: 'CREDIT',
            amount: {
              value: 100.5,
              assetCode: 'USD',
              scale: 2,
            },
          },
        ],
      };

      const result = validateCreateTransactionInput(validInput);

      expect(result.valid).toBe(true);
    });
  });

  describe('send decimal values', () => {
    const buildSendInput = (
      sendValue: any,
      fromValue: any = sendValue,
      toValue: any = sendValue
    ): CreateTransactionInput =>
      ({
        chartOfAccountsGroupName: 'group',
        description: 'transfer',
        send: {
          asset: 'BRL',
          value: sendValue,
          source: {
            from: [{ account: 'smoke-a', amount: { asset: 'BRL', value: fromValue } }],
          },
          distribute: {
            to: [{ account: 'smoke-b', amount: { asset: 'BRL', value: toValue } }],
          },
        },
      }) as CreateTransactionInput;

    it('shouldAcceptDecimalStringSendValues', () => {
      const result = validateCreateTransactionInput(buildSendInput('100.50'));

      expect(result.valid).toBe(true);
    });

    it('shouldAcceptNumericSendValues', () => {
      const result = validateCreateTransactionInput(buildSendInput(100));

      expect(result.valid).toBe(true);
    });

    it('shouldRejectNonFiniteSendValue', () => {
      const result = validateCreateTransactionInput(buildSendInput(Number.NaN));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.value']).toBeDefined();
    });

    it('shouldRejectUnsafeIntegerSendValue', () => {
      const result = validateCreateTransactionInput(buildSendInput(Number.MAX_SAFE_INTEGER + 2));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.value']).toBeDefined();
    });

    it('shouldNameTheOffendingSourcePath', () => {
      const result = validateCreateTransactionInput(buildSendInput('10', 'abc'));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.source.from[0].amount.value']).toBeDefined();
      expect(result.message).toContain('send.source.from[0].amount.value');
    });

    it('shouldNameTheOffendingDistributePath', () => {
      const result = validateCreateTransactionInput(buildSendInput('10', '10', Number.NaN));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0].amount.value']).toBeDefined();
    });
  });

  describe('field parity rules', () => {
    const build = (extra: Partial<CreateTransactionInput> = {}): CreateTransactionInput =>
      ({
        chartOfAccountsGroupName: 'group',
        description: 'transfer',
        send: {
          asset: 'BRL',
          value: '100',
          source: { from: [{ account: 'smoke-a', amount: { asset: 'BRL', value: '100' } }] },
          distribute: { to: [{ account: 'smoke-b', amount: { asset: 'BRL', value: '100' } }] },
        },
        ...extra,
      }) as CreateTransactionInput;

    it('shouldAcceptAUuidRouteId', () => {
      const result = validateCreateTransactionInput(
        build({ routeId: 'd389ba81-e807-4bcc-a26a-019edcd12dfc' })
      );

      expect(result.valid).toBe(true);
    });

    it('shouldRejectANonUuidRouteId', () => {
      const result = validateCreateTransactionInput(build({ routeId: 'not-a-uuid' }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.routeId).toBeDefined();
      expect(result.message).toContain('UUID');
    });

    it.each([
      ['2025-01-02T03:04:05.123456789Z'],
      ['2025-01-02T03:04:05Z'],
      ['2025-01-02T03:04:05-03:00'],
      ['2025-01-02T03:04:05.000Z'],
      ['2025-01-02T03:04:05'],
      ['2025-01-02'],
    ])('shouldAcceptTheAcceptedTransactionDateFormat %s', (transactionDate) => {
      const result = validateCreateTransactionInput(build({ transactionDate }));

      expect(result.valid).toBe(true);
    });

    it('shouldRejectATransactionDateInAnUnsupportedFormat', () => {
      const result = validateCreateTransactionInput(build({ transactionDate: '04/03/2025' }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.transactionDate).toBeDefined();
    });

    it('shouldRejectATransactionDateThatIsNotACalendarDate', () => {
      const result = validateCreateTransactionInput(build({ transactionDate: '2025-02-30' }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.transactionDate).toBeDefined();
    });

    it('shouldRejectAFutureTransactionDate', () => {
      const result = validateCreateTransactionInput(build({ transactionDate: '2099-01-01' }));

      expect(result.valid).toBe(false);
      expect(result.message).toContain('0121');
    });

    it('shouldRejectATransactionDateOnAPendingTransaction', () => {
      const result = validateCreateTransactionInput(
        build({ pending: true, transactionDate: '2025-01-02T03:04:05Z' })
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('0122');
    });

    it('shouldAcceptAPendingTransactionWithoutATransactionDate', () => {
      const result = validateCreateTransactionInput(build({ pending: true }));

      expect(result.valid).toBe(true);
    });

    it('shouldAcceptSkipWithoutConsultingLedgerSettings', () => {
      const result = validateCreateTransactionInput(build({ skip: { fees: true, tracer: true } }));

      expect(result.valid).toBe(true);
    });

    it('shouldRejectADescriptionOver256Characters', () => {
      const result = validateCreateTransactionInput(build({ description: 'x'.repeat(257) }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.description).toBeDefined();
    });

    it('shouldAcceptADescriptionOfExactly256Characters', () => {
      const result = validateCreateTransactionInput(build({ description: 'x'.repeat(256) }));

      expect(result.valid).toBe(true);
    });

    it('shouldRejectAChartOfAccountsGroupNameOver256Characters', () => {
      const result = validateCreateTransactionInput(
        build({ chartOfAccountsGroupName: 'x'.repeat(257) })
      );

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.chartOfAccountsGroupName).toBeDefined();
    });

    it('shouldRejectACodeOver100Characters', () => {
      const result = validateCreateTransactionInput(build({ code: 'x'.repeat(101) }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.code).toBeDefined();
    });

    it('shouldAcceptACodeOfExactly100Characters', () => {
      const result = validateCreateTransactionInput(build({ code: 'x'.repeat(100) }));

      expect(result.valid).toBe(true);
    });
  });

  describe('leg field parity and money-safety guards', () => {
    const buildLegs = (from: any[], to: any[]): CreateTransactionInput =>
      ({
        chartOfAccountsGroupName: 'group',
        description: 'transfer',
        send: {
          asset: 'BRL',
          value: '100',
          source: { from },
          distribute: { to },
        },
      }) as CreateTransactionInput;

    const defaultLeg = (account: string, extra: Record<string, any> = {}) => ({
      account,
      amount: { asset: 'BRL', value: '100' },
      ...extra,
    });

    const build = (extra: Record<string, any> = {}, target: 'from' | 'to' = 'from') =>
      target === 'from'
        ? buildLegs([defaultLeg('smoke-a', extra)], [defaultLeg('smoke-b')])
        : buildLegs([defaultLeg('smoke-a')], [defaultLeg('smoke-b', extra)]);

    it('shouldRefuseARemainingSourceLegNamingTheAlternatives', () => {
      const result = validateCreateTransactionInput(build({ remaining: 'remaining' }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.source.from[0].remaining']).toBeDefined();
      expect(result.message).toContain('amount');
      expect(result.message).toContain('share');
    });

    it('shouldRefuseARemainingDistributeLeg', () => {
      const result = validateCreateTransactionInput(build({ remaining: 'remaining' }, 'to'));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0].remaining']).toBeDefined();
    });

    it('shouldRefuseAnAmountAssetThatDiffersFromSendAsset', () => {
      const result = validateCreateTransactionInput(
        build({ amount: { asset: 'USD', value: '100' } })
      );

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.source.from[0].amount.asset']).toBeDefined();
      expect(result.message).toContain('USD');
      expect(result.message).toContain('BRL');
    });

    it('shouldAcceptALegAmountThatOmitsTheAsset', () => {
      const result = validateCreateTransactionInput(build({ amount: { value: '100' } }));

      expect(result.valid).toBe(true);
    });

    it('shouldAcceptAnIntegerShareLegWithoutAnAmount', () => {
      const result = validateCreateTransactionInput(
        buildLegs(
          [defaultLeg('smoke-a')],
          [
            { account: 'smoke-b', share: { percentage: 60 } },
            { account: 'smoke-c', share: { percentage: 40, percentageOfPercentage: 100 } },
          ]
        )
      );

      expect(result.valid).toBe(true);
    });

    it('shouldRejectAFractionalSharePercentage', () => {
      const result = validateCreateTransactionInput(
        buildLegs([defaultLeg('smoke-a')], [{ account: 'smoke-b', share: { percentage: 33.5 } }])
      );

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0].share.percentage']).toBeDefined();
    });

    it('shouldRejectAFractionalPercentageOfPercentage', () => {
      const result = validateCreateTransactionInput(
        buildLegs(
          [defaultLeg('smoke-a')],
          [{ account: 'smoke-b', share: { percentage: 60, percentageOfPercentage: 50.5 } }]
        )
      );

      expect(result.valid).toBe(false);
      expect(
        result.fieldErrors?.['send.distribute.to[0].share.percentageOfPercentage']
      ).toBeDefined();
    });

    it('shouldRejectANonPositiveSharePercentage', () => {
      const result = validateCreateTransactionInput(
        buildLegs([defaultLeg('smoke-a')], [{ account: 'smoke-b', share: { percentage: 0 } }])
      );

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0].share.percentage']).toBeDefined();
    });

    it('shouldRejectALegCarryingNeitherAmountNorShare', () => {
      const result = validateCreateTransactionInput(
        buildLegs([defaultLeg('smoke-a')], [{ account: 'smoke-b' }])
      );

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0]']).toBeDefined();
    });

    it('shouldRejectALegCarryingBothAmountAndShare', () => {
      const result = validateCreateTransactionInput(build({ share: { percentage: 60 } }, 'to'));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0]']).toBeDefined();
    });

    it('shouldAcceptTheNewLegFields', () => {
      const result = validateCreateTransactionInput(
        build({
          balanceKey: 'asset-freeze',
          chartOfAccounts: '1000',
          routeId: '8dbf1c9e-3a2b-4a55-9f1e-2c0f6b7d4e11',
        })
      );

      expect(result.valid).toBe(true);
    });

    it('shouldRejectANonUuidLegRouteId', () => {
      const result = validateCreateTransactionInput(build({ routeId: 'not-a-uuid' }));

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.source.from[0].routeId']).toBeDefined();
    });

    it('shouldRefuseARemainingLegOnAnInflow', () => {
      const result = validateCreateInflowInput({
        send: {
          asset: 'BRL',
          value: '100',
          distribute: { to: [defaultLeg('smoke-b', { remaining: 'remaining' })] },
        },
      } as any);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.distribute.to[0].remaining']).toBeDefined();
    });

    it('shouldRefuseAMismatchedAmountAssetOnAnOutflow', () => {
      const result = validateCreateOutflowInput({
        send: {
          asset: 'BRL',
          value: '100',
          source: { from: [{ account: 'smoke-a', amount: { asset: 'USD', value: '100' } }] },
        },
      } as any);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['send.source.from[0].amount.asset']).toBeDefined();
    });
  });
});
