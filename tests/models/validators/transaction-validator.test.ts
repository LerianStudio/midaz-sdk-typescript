import { validateCreateTransactionInput } from '../../../src/models/validators/transaction-validator';
import {
  AmountInput,
  CreateTransactionInput,
} from '../../../src/models/transaction';

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
});
