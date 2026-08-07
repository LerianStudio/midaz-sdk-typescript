import {
  validateBalanceHistoryDate,
  validateCreateBalanceInput,
  validateUpdateBalanceInput,
} from '../../../src/models/validators/balance-validator';
import { CreateBalanceInput, UpdateBalanceInput } from '../../../src/models/balance';

describe('Balance Validator', () => {
  // Tests for validateUpdateBalanceInput
  describe('validateUpdateBalanceInput', () => {
    // Test 1: Valid input with allowSending should pass validation
    it('shouldPassValidationForValidInputWithAllowSending', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: true,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message || '').toBe('');
    });

    // Test 2: Valid input with allowReceiving should pass validation
    it('shouldPassValidationForValidInputWithAllowReceiving', () => {
      const validInput: UpdateBalanceInput = {
        allowReceiving: true,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message || '').toBe('');
    });

    // Test 3: Valid input with both fields should pass validation
    it('shouldPassValidationForValidInputWithBothFields', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: true,
        allowReceiving: false,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message || '').toBe('');
    });

    // Test 4: Empty update should fail validation
    it('shouldFailValidationForEmptyUpdate', () => {
      const invalidInput: UpdateBalanceInput = {};

      const result = validateUpdateBalanceInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.input).toBeDefined();
      expect(result.message).toContain('At least one field must be provided');
    });

    // Test 5: Null input should fail validation
    it('shouldFailValidationForNullInput', () => {
      const result = validateUpdateBalanceInput(null as unknown as UpdateBalanceInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 6: Undefined input should fail validation
    it('shouldFailValidationForUndefinedInput', () => {
      const result = validateUpdateBalanceInput(undefined as unknown as UpdateBalanceInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 7: Input with only undefined values should fail validation
    it('shouldFailValidationForOnlyUndefinedValues', () => {
      const invalidInput = {
        allowSending: undefined,
        allowReceiving: undefined,
      } as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('At least one field must be provided');
    });

    // Test 8: Input with allowSending false should pass validation
    it('shouldPassValidationForAllowSendingFalse', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: false,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 9: Input with allowReceiving false should pass validation
    it('shouldPassValidationForAllowReceivingFalse', () => {
      const validInput: UpdateBalanceInput = {
        allowReceiving: false,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 10: Input with both fields false should pass validation (freeze account)
    it('shouldPassValidationForFreezeAccount', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: false,
        allowReceiving: false,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 11: Input with both fields true should pass validation (unfreeze account)
    it('shouldPassValidationForUnfreezeAccount', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: true,
        allowReceiving: true,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 12: Input with allowSending true and allowReceiving false should pass validation
    it('shouldPassValidationForSendOnlyAccount', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: true,
        allowReceiving: false,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 13: Input with allowSending false and allowReceiving true should pass validation
    it('shouldPassValidationForReceiveOnlyAccount', () => {
      const validInput: UpdateBalanceInput = {
        allowSending: false,
        allowReceiving: true,
      };

      const result = validateUpdateBalanceInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 14: Input with non-boolean allowSending should still pass validation (type checking is not part of validation)
    it('shouldPassValidationForNonBooleanAllowSending', () => {
      const input = {
        allowSending: 'true', // String instead of boolean
      } as unknown as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      // The validator only checks for undefined, not for type
      expect(result.valid).toBe(true);
    });

    // Test 15: Input with non-boolean allowReceiving should still pass validation (type checking is not part of validation)
    it('shouldPassValidationForNonBooleanAllowReceiving', () => {
      const input = {
        allowReceiving: 'false', // String instead of boolean
      } as unknown as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      // The validator only checks for undefined, not for type
      expect(result.valid).toBe(true);
    });

    // Test 16: Input with null allowSending should pass validation (null is not undefined)
    it('shouldPassValidationForNullAllowSending', () => {
      const input = {
        allowSending: null,
      } as unknown as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      // The validator only checks for undefined, not for null
      expect(result.valid).toBe(true);
    });

    // Test 17: Input with null allowReceiving should pass validation (null is not undefined)
    it('shouldPassValidationForNullAllowReceiving', () => {
      const input = {
        allowReceiving: null,
      } as unknown as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      // The validator only checks for undefined, not for null
      expect(result.valid).toBe(true);
    });

    // Test 18: Input with additional properties should pass validation (extra properties are ignored)
    it('shouldPassValidationWithAdditionalProperties', () => {
      const input = {
        allowSending: true,
        allowReceiving: false,
        extraProperty: 'This should be ignored',
      } as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      expect(result.valid).toBe(true);
    });

    // Test 19: Input with empty object as allowSending should pass validation (type checking is not part of validation)
    it('shouldPassValidationForObjectAsAllowSending', () => {
      const input = {
        allowSending: {},
      } as unknown as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      // The validator only checks for undefined, not for type
      expect(result.valid).toBe(true);
    });

    // Test 20: Input with empty array as allowReceiving should pass validation (type checking is not part of validation)
    it('shouldPassValidationForArrayAsAllowReceiving', () => {
      const input = {
        allowReceiving: [],
      } as unknown as UpdateBalanceInput;

      const result = validateUpdateBalanceInput(input);

      // The validator only checks for undefined, not for type
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCreateBalanceInput', () => {
    const valid: CreateBalanceInput = { key: 'asset-freeze' };

    it('accepts a bare key', () => {
      expect(validateCreateBalanceInput(valid).valid).toBe(true);
    });

    it('rejects a missing key', () => {
      const result = validateCreateBalanceInput({} as CreateBalanceInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.key?.join(' ')).toContain('required');
    });

    it('rejects a key carrying whitespace', () => {
      const result = validateCreateBalanceInput({ key: 'asset freeze' });

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.key?.join(' ')).toContain('whitespace');
    });

    it('rejects a key longer than 100 characters', () => {
      const result = validateCreateBalanceInput({ key: 'k'.repeat(101) });

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.key?.join(' ')).toContain('100');
    });

    it('accepts a key of exactly 100 characters', () => {
      expect(validateCreateBalanceInput({ key: 'k'.repeat(100) }).valid).toBe(true);
    });

    it('rejects overdraftLimitEnabled without a limit', () => {
      const result = validateCreateBalanceInput({
        key: 'od',
        settings: { allowOverdraft: true, overdraftLimitEnabled: true },
      });

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['settings.overdraftLimit']?.join(' ')).toContain('required');
    });

    it('rejects a non-positive overdraft limit', () => {
      const result = validateCreateBalanceInput({
        key: 'od',
        settings: { overdraftLimitEnabled: true, overdraftLimit: '0' },
      });

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['settings.overdraftLimit']?.join(' ')).toContain('greater than');
    });

    it('accepts a positive overdraft limit', () => {
      expect(
        validateCreateBalanceInput({
          key: 'od',
          settings: {
            allowOverdraft: true,
            overdraftLimitEnabled: true,
            overdraftLimit: '1000.00',
          },
        }).valid
      ).toBe(true);
    });

    it('rejects an overdraft limit while the flag is off', () => {
      const result = validateCreateBalanceInput({
        key: 'od',
        settings: { overdraftLimitEnabled: false, overdraftLimit: '10' },
      });

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['settings.overdraftLimit']?.join(' ')).toContain('absent');
    });

    it('rejects the internal balance scope, which the ledger reserves for itself', () => {
      const result = validateCreateBalanceInput({
        key: 'k',
        settings: { balanceScope: 'internal' },
      });

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.['settings.balanceScope']?.join(' ')).toContain('internal');
    });

    it('accepts the transactional balance scope', () => {
      expect(
        validateCreateBalanceInput({ key: 'k', settings: { balanceScope: 'transactional' } }).valid
      ).toBe(true);
    });
  });

  describe('validateBalanceHistoryDate', () => {
    it.each([
      '2026-08-07 02:45:14',
      '2026-08-07T02:45:14Z',
      '2026-08-07T02:45:14',
      '2026-08-06T23:45:14-03:00',
      '2026-08-07T02:45:14.123Z',
    ])('accepts %s', (date) => {
      expect(validateBalanceHistoryDate(date).valid).toBe(true);
    });

    it('rejects a date without a time component', () => {
      const result = validateBalanceHistoryDate('2026-08-07');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('yyyy-mm-dd hh:mm:ss');
      expect(result.message).toContain('2026-08-07T02:45:14Z');
    });

    it('rejects an empty date', () => {
      expect(validateBalanceHistoryDate('').valid).toBe(false);
    });

    it('rejects a free-form date', () => {
      expect(validateBalanceHistoryDate('yesterday').valid).toBe(false);
    });
  });
});
