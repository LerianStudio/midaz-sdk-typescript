import {
  validateCreateLedgerInput,
  validateUpdateLedgerInput,
} from '../../../src/models/validators/ledger-validator';
import { CreateLedgerInput, UpdateLedgerInput } from '../../../src/models/ledger';
import { StatusCode } from '../../../src/models/common';

describe('Ledger Validator', () => {
  // Tests for validateCreateLedgerInput
  describe('validateCreateLedgerInput', () => {
    // Test 1: Valid input should pass validation
    it('shouldPassValidationForValidInput', () => {
      const validInput: CreateLedgerInput = {
        name: 'Corporate General Ledger',
      };

      const result = validateCreateLedgerInput(validInput);

      expect(result.valid).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message || '').toBe('');
    });

    // Test 2: Empty name should fail validation
    it('shouldFailValidationForEmptyName', () => {
      const invalidInput: CreateLedgerInput = {
        name: '',
      };

      const result = validateCreateLedgerInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.message).toContain('empty');
    });

    // Test 3: Null input should fail validation
    it('shouldFailValidationForNullInput', () => {
      const result = validateCreateLedgerInput(null as unknown as CreateLedgerInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 4: Undefined input should fail validation
    it('shouldFailValidationForUndefinedInput', () => {
      const result = validateCreateLedgerInput(undefined as unknown as CreateLedgerInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 5: Input with status and metadata should pass validation
    it('shouldPassValidationWithOptionalFields', () => {
      const validInput: CreateLedgerInput = {
        name: 'Corporate General Ledger',
        status: StatusCode.ACTIVE,
        metadata: {
          fiscalYear: '2023',
          accountingStandard: 'GAAP',
        },
      };

      const result = validateCreateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 6: Input with special characters should pass validation
    it('shouldPassValidationWithSpecialCharacters', () => {
      const validInput: CreateLedgerInput = {
        name: 'Corporate General Ledger !@#$%^&*()',
      };

      const result = validateCreateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 7: Input with very long name should pass validation (no length restriction)
    it('shouldPassValidationWithVeryLongName', () => {
      const longName = 'A'.repeat(1000); // 1000 characters
      const validInput: CreateLedgerInput = {
        name: longName,
      };

      const result = validateCreateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 8: Input with whitespace-only name should fail validation
    it('shouldFailValidationForWhitespaceOnlyName', () => {
      const invalidInput: CreateLedgerInput = {
        name: '   ',
      };

      const result = validateCreateLedgerInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
    });

    // Test 9: Input with complex metadata should pass validation
    it('shouldPassValidationWithComplexMetadata', () => {
      const validInput: CreateLedgerInput = {
        name: 'Corporate General Ledger',
        metadata: {
          fiscalYear: '2023',
          accountingStandard: 'GAAP',
          departments: ['Finance', 'Sales', 'Marketing'],
          settings: {
            autoClose: true,
            reportingCurrency: 'USD',
            exchangeRates: {
              EUR: 1.1,
              GBP: 1.3,
              JPY: 0.009,
            },
          },
        },
      };

      const result = validateCreateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 10: Input with numeric name should pass validation
    it('shouldPassValidationWithNumericName', () => {
      const validInput: CreateLedgerInput = {
        name: '12345',
      };

      const result = validateCreateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });
  });

  // Tests for validateUpdateLedgerInput
  describe('validateUpdateLedgerInput', () => {
    // Test 11: Valid update with name should pass validation
    it('shouldPassValidationForValidUpdateWithName', () => {
      const validInput: UpdateLedgerInput = {
        name: 'Updated Ledger Name',
      };

      const result = validateUpdateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 12: Valid update with status should pass validation
    it('shouldPassValidationForValidUpdateWithStatus', () => {
      const validInput: UpdateLedgerInput = {
        status: StatusCode.ACTIVE,
      };

      const result = validateUpdateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 13: Valid update with metadata should pass validation
    it('shouldPassValidationForValidUpdateWithMetadata', () => {
      const validInput: UpdateLedgerInput = {
        metadata: {
          fiscalYear: '2023',
          accountingStandard: 'GAAP',
        },
      };

      const result = validateUpdateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 14: Valid update with all fields should pass validation
    it('shouldPassValidationForValidUpdateWithAllFields', () => {
      const validInput: UpdateLedgerInput = {
        name: 'Updated Ledger Name',
        status: StatusCode.ACTIVE,
        metadata: {
          fiscalYear: '2023',
          accountingStandard: 'GAAP',
        },
      };

      const result = validateUpdateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 15: Empty update should fail validation
    it('shouldFailValidationForEmptyUpdate', () => {
      const invalidInput: UpdateLedgerInput = {};

      const result = validateUpdateLedgerInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('At least one field must be provided');
    });

    // Test 16: Update with empty name should fail validation
    it('shouldFailValidationForEmptyName', () => {
      const invalidInput: UpdateLedgerInput = {
        name: '',
      };

      const result = validateUpdateLedgerInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.message).toContain('empty');
    });

    // Test 17: Null update input should fail validation
    it('shouldFailValidationForNullInput', () => {
      const result = validateUpdateLedgerInput(null as unknown as UpdateLedgerInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 18: Undefined update input should fail validation
    it('shouldFailValidationForUndefinedInput', () => {
      const result = validateUpdateLedgerInput(undefined as unknown as UpdateLedgerInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 19: Update with only undefined values should fail validation
    it('shouldFailValidationForOnlyUndefinedValues', () => {
      const invalidInput = {
        name: undefined,
        status: undefined,
        metadata: undefined,
      } as UpdateLedgerInput;

      const result = validateUpdateLedgerInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('At least one field must be provided');
    });

    // Test 20: Update with whitespace-only name should fail validation
    it('shouldFailValidationForWhitespaceOnlyName', () => {
      const invalidInput: UpdateLedgerInput = {
        name: '   ',
      };

      const result = validateUpdateLedgerInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
    });

    // Test 21: Update with very long name should pass validation (no length restriction)
    it('shouldPassValidationForUpdateWithVeryLongName', () => {
      const longName = 'A'.repeat(1000); // 1000 characters
      const validInput: UpdateLedgerInput = {
        name: longName,
      };

      const result = validateUpdateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 22: Update with complex metadata should pass validation
    it('shouldPassValidationForUpdateWithComplexMetadata', () => {
      const validInput: UpdateLedgerInput = {
        metadata: {
          fiscalYear: '2023',
          accountingStandard: 'GAAP',
          departments: ['Finance', 'Sales', 'Marketing'],
          settings: {
            autoClose: true,
            reportingCurrency: 'USD',
            exchangeRates: {
              EUR: 1.1,
              GBP: 1.3,
              JPY: 0.009,
            },
          },
        },
      };

      const result = validateUpdateLedgerInput(validInput);

      expect(result.valid).toBe(true);
    });
  });
});
