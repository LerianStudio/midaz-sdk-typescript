import {
  validateCreateAccountTypeInput,
  validateUpdateAccountTypeInput,
} from '../../../src/models/validators/account-type-validator';

describe('AccountType Validators', () => {
  describe('validateCreateAccountTypeInput', () => {
    it('should return valid for correct input', () => {
      const input = {
        name: 'Test Account Type',
        keyValue: 'TEST_KEY',
        description: 'A description',
      };
      const result = validateCreateAccountTypeInput(input);
      expect(result.valid).toBe(true);
    });

    it('should return invalid if name is missing', () => {
      const input = { keyValue: 'TEST_KEY' } as any;
      const result = validateCreateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
    });

    it('should return invalid if keyValue is missing', () => {
      const input = { name: 'Test' } as any;
      const result = validateCreateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.keyValue).toBeDefined();
    });

    it('should return invalid if name exceeds max length', () => {
      const input = {
        name: 'a'.repeat(51),
        keyValue: 'TEST_KEY',
      };
      const result = validateCreateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
    });

    it('should return invalid if keyValue exceeds max length', () => {
      const input = {
        name: 'Test',
        keyValue: 'a'.repeat(51),
      };
      const result = validateCreateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.keyValue).toBeDefined();
    });

    it('should return invalid if description exceeds max length', () => {
      const input = {
        name: 'Test',
        keyValue: 'TEST_KEY',
        description: 'a'.repeat(251),
      };
      const result = validateCreateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.description).toBeDefined();
    });
  });

  describe('validateUpdateAccountTypeInput', () => {
    it('should return valid for correct input', () => {
      const input = {
        name: 'Updated Name',
        description: 'Updated description',
      };
      const result = validateUpdateAccountTypeInput(input);
      expect(result.valid).toBe(true);
    });

    it('should return valid if only name is provided', () => {
      const input = { name: 'Updated Name' };
      const result = validateUpdateAccountTypeInput(input);
      expect(result.valid).toBe(true);
    });

    it('should return valid if only description is provided', () => {
      const input = { description: 'Updated description' };
      const result = validateUpdateAccountTypeInput(input);
      expect(result.valid).toBe(true);
    });

    it('should return invalid if name exceeds max length', () => {
      const input = { name: 'a'.repeat(51) };
      const result = validateUpdateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
    });

    it('should return invalid if description exceeds max length', () => {
      const input = { description: 'a'.repeat(251) };
      const result = validateUpdateAccountTypeInput(input);
      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.description).toBeDefined();
    });
  });
});
