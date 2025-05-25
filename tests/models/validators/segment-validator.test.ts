import {
  validateCreateSegmentInput,
  validateUpdateSegmentInput,
} from '../../../src/models/validators/segment-validator';
import { CreateSegmentInput, UpdateSegmentInput } from '../../../src/models/segment';
import { StatusCode } from '../../../src/models/common';

describe('Segment Validator', () => {
  // Tests for validateCreateSegmentInput
  describe('validateCreateSegmentInput', () => {
    // Test 1: Valid input should pass validation
    it('shouldPassValidationForValidInput', () => {
      const validInput: CreateSegmentInput = {
        name: 'North America',
      };

      const result = validateCreateSegmentInput(validInput);

      expect(result.valid).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message || '').toBe('');
    });

    // Test 2: Empty name should fail validation
    it('shouldFailValidationForEmptyName', () => {
      const invalidInput: CreateSegmentInput = {
        name: '',
      };

      const result = validateCreateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.message).toContain('empty');
    });

    // Test 3: Name exceeding maximum length should fail validation
    it('shouldFailValidationForNameExceedingMaxLength', () => {
      const longName = 'A'.repeat(257); // 257 characters
      const invalidInput: CreateSegmentInput = {
        name: longName,
      };

      const result = validateCreateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.message).toContain('256 characters');
    });

    // Test 4: Null input should fail validation
    it('shouldFailValidationForNullInput', () => {
      const result = validateCreateSegmentInput(null as unknown as CreateSegmentInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 5: Undefined input should fail validation
    it('shouldFailValidationForUndefinedInput', () => {
      const result = validateCreateSegmentInput(undefined as unknown as CreateSegmentInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 6: Input with exactly maximum length name should pass validation
    it('shouldPassValidationForMaxLengthName', () => {
      const maxLengthName = 'A'.repeat(256); // 256 characters
      const validInput: CreateSegmentInput = {
        name: maxLengthName,
      };

      const result = validateCreateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 7: Input with status and metadata should pass validation
    it('shouldPassValidationWithOptionalFields', () => {
      const validInput: CreateSegmentInput = {
        name: 'North America',
        status: StatusCode.ACTIVE,
        metadata: {
          regionCode: 'NA',
          countries: ['US', 'CA', 'MX'],
        },
      };

      const result = validateCreateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 8: Input with special characters should pass validation
    it('shouldPassValidationWithSpecialCharacters', () => {
      const validInput: CreateSegmentInput = {
        name: 'North America !@#$%^&*()',
      };

      const result = validateCreateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 9: Metadata with key exceeding maximum length should fail validation
    it('shouldFailValidationForMetadataKeyExceedingMaxLength', () => {
      const longKey = 'A'.repeat(101); // 101 characters
      const invalidInput: CreateSegmentInput = {
        name: 'North America',
        metadata: {
          [longKey]: 'value',
        },
      };

      const result = validateCreateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.metadata).toBeDefined();
      expect(result.message).toContain('metadata');
    });

    // Test 10: Metadata with string value exceeding maximum length should fail validation
    it('shouldFailValidationForMetadataValueExceedingMaxLength', () => {
      const longValue = 'A'.repeat(2001); // 2001 characters
      const invalidInput: CreateSegmentInput = {
        name: 'North America',
        metadata: {
          key: longValue,
        },
      };

      const result = validateCreateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.metadata).toBeDefined();
      expect(result.message).toContain('metadata');
    });

    // Test 11: Metadata with multiple validation errors should report all errors
    it('shouldReportMultipleMetadataValidationErrors', () => {
      const longKey = 'A'.repeat(101); // 101 characters
      const longValue = 'A'.repeat(2001); // 2001 characters
      const invalidInput: CreateSegmentInput = {
        name: 'North America',
        metadata: {
          [longKey]: 'value',
          key2: longValue,
        },
      };

      const result = validateCreateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.metadata).toBeDefined();
      expect(result.fieldErrors?.metadata?.length).toBe(2);
    });

    // Test 12: Metadata with non-string values should pass validation
    it('shouldPassValidationForMetadataWithNonStringValues', () => {
      const validInput: CreateSegmentInput = {
        name: 'North America',
        metadata: {
          numberValue: 123,
          booleanValue: true,
          arrayValue: [1, 2, 3],
          objectValue: { key: 'value' },
          nullValue: null,
        },
      };

      const result = validateCreateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });
  });

  // Tests for validateUpdateSegmentInput
  describe('validateUpdateSegmentInput', () => {
    // Test 13: Valid update with name should pass validation
    it('shouldPassValidationForValidUpdateWithName', () => {
      const validInput: UpdateSegmentInput = {
        name: 'Updated Segment Name',
      };

      const result = validateUpdateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 14: Valid update with status should pass validation
    it('shouldPassValidationForValidUpdateWithStatus', () => {
      const validInput: UpdateSegmentInput = {
        status: StatusCode.ACTIVE,
      };

      const result = validateUpdateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 15: Valid update with metadata should pass validation
    it('shouldPassValidationForValidUpdateWithMetadata', () => {
      const validInput: UpdateSegmentInput = {
        metadata: {
          regionCode: 'NA',
          countries: ['US', 'CA', 'MX'],
        },
      };

      const result = validateUpdateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 16: Valid update with all fields should pass validation
    it('shouldPassValidationForValidUpdateWithAllFields', () => {
      const validInput: UpdateSegmentInput = {
        name: 'Updated Segment Name',
        status: StatusCode.ACTIVE,
        metadata: {
          regionCode: 'NA',
          countries: ['US', 'CA', 'MX'],
        },
      };

      const result = validateUpdateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 17: Empty update should fail validation
    it('shouldFailValidationForEmptyUpdate', () => {
      const invalidInput: UpdateSegmentInput = {};

      const result = validateUpdateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('At least one field must be provided');
    });

    // Test 18: Update with empty name should fail validation
    it('shouldFailValidationForEmptyName', () => {
      const invalidInput: UpdateSegmentInput = {
        name: '',
      };

      const result = validateUpdateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.message).toContain('empty');
    });

    // Test 19: Update with name exceeding maximum length should fail validation
    it('shouldFailValidationForNameExceedingMaxLength', () => {
      const longName = 'A'.repeat(257); // 257 characters
      const invalidInput: UpdateSegmentInput = {
        name: longName,
      };

      const result = validateUpdateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.message).toContain('256 characters');
    });

    // Test 20: Null update input should fail validation
    it('shouldFailValidationForNullInput', () => {
      const result = validateUpdateSegmentInput(null as unknown as UpdateSegmentInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 21: Undefined update input should fail validation
    it('shouldFailValidationForUndefinedInput', () => {
      const result = validateUpdateSegmentInput(undefined as unknown as UpdateSegmentInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    // Test 22: Update with name of exactly maximum length should pass validation
    it('shouldPassValidationForMaxLengthName', () => {
      const maxLengthName = 'A'.repeat(256); // 256 characters
      const validInput: UpdateSegmentInput = {
        name: maxLengthName,
      };

      const result = validateUpdateSegmentInput(validInput);

      expect(result.valid).toBe(true);
    });

    // Test 23: Update with only undefined values should fail validation
    it('shouldFailValidationForOnlyUndefinedValues', () => {
      const invalidInput = {
        name: undefined,
        status: undefined,
        metadata: undefined,
      } as UpdateSegmentInput;

      const result = validateUpdateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('At least one field must be provided');
    });

    // Test 24: Update with metadata key exceeding maximum length should fail validation
    it('shouldFailValidationForUpdateMetadataKeyExceedingMaxLength', () => {
      const longKey = 'A'.repeat(101); // 101 characters
      const invalidInput: UpdateSegmentInput = {
        metadata: {
          [longKey]: 'value',
        },
      };

      const result = validateUpdateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.metadata).toBeDefined();
      expect(result.message).toContain('metadata');
    });

    // Test 25: Update with metadata value exceeding maximum length should fail validation
    it('shouldFailValidationForUpdateMetadataValueExceedingMaxLength', () => {
      const longValue = 'A'.repeat(2001); // 2001 characters
      const invalidInput: UpdateSegmentInput = {
        metadata: {
          key: longValue,
        },
      };

      const result = validateUpdateSegmentInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.metadata).toBeDefined();
      expect(result.message).toContain('metadata');
    });
  });
});
