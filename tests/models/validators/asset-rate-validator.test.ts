import { validateUpdateAssetRateInput } from '../../../src/models/validators/asset-rate-validator';
import { UpdateAssetRateInput } from '../../../src/models/asset-rate';

describe('Asset Rate Validator', () => {
    // Test 1: Valid input should pass validation
    it('shouldPassValidationForValidInput', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
        expect(result.fieldErrors).toBeUndefined();
        expect(result.message).toBe('');
    });

    // Test 2: Missing fromAsset should fail validation
    it('shouldFailValidationForMissingFromAsset', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: '',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.fromAsset).toContain('Source asset code is required');
        expect(result.message).toContain('Source asset code is required');
    });

    // Test 3: Missing toAsset should fail validation
    it('shouldFailValidationForMissingToAsset', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: '',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.toAsset).toContain('Target asset code is required');
        expect(result.message).toContain('Target asset code is required');
    });

    // Test 4: Zero rate should fail validation
    it('shouldFailValidationForZeroRate', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.rate).toContain('Rate must be greater than 0');
        expect(result.message).toContain('Rate must be greater than 0');
    });

    // Test 5: Negative rate should fail validation
    it('shouldFailValidationForNegativeRate', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: -0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.rate).toContain('Rate must be greater than 0');
        expect(result.message).toContain('Rate must be greater than 0');
    });

    // Test 6: Missing effectiveAt should fail validation
    it('shouldFailValidationForMissingEffectiveAt', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.effectiveAt).toContain('Effective date is required');
        expect(result.message).toContain('Effective date is required');
    });

    // Test 7: Missing expirationAt should fail validation
    it('shouldFailValidationForMissingExpirationAt', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: ''
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.expirationAt).toContain('Expiration date is required');
        expect(result.message).toContain('Expiration date is required');
    });

    // Test 8: effectiveAt after expirationAt should fail validation
    it('shouldFailValidationForEffectiveAfterExpiration', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-02T00:00:00Z',
            expirationAt: '2023-01-01T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.effectiveAt).toContain('Effective date must be before expiration date');
        expect(result.message).toContain('Effective date must be before expiration date');
    });

    // Test 9: effectiveAt equal to expirationAt should fail validation
    it('shouldFailValidationForEffectiveEqualToExpiration', () => {
        const sameTime = '2023-01-01T00:00:00Z';
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: sameTime,
            expirationAt: sameTime
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.effectiveAt).toContain('Effective date must be before expiration date');
        expect(result.message).toContain('Effective date must be before expiration date');
    });

    // Test 10: Multiple validation errors should be reported
    it('shouldReportMultipleValidationErrors', () => {
        const invalidInput: UpdateAssetRateInput = {
            fromAsset: '',
            toAsset: '',
            rate: 0,
            effectiveAt: '',
            expirationAt: ''
        };
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.fromAsset).toContain('Source asset code is required');
        expect(result.fieldErrors?.toAsset).toContain('Target asset code is required');
        expect(result.fieldErrors?.rate).toContain('Rate must be greater than 0');
        expect(result.fieldErrors?.effectiveAt).toContain('Effective date is required');
        expect(result.fieldErrors?.expirationAt).toContain('Expiration date is required');
        
        // Check that all error messages are included in the message string
        expect(result.message).toContain('Source asset code is required');
        expect(result.message).toContain('Target asset code is required');
        expect(result.message).toContain('Rate must be greater than 0');
        expect(result.message).toContain('Effective date is required');
        expect(result.message).toContain('Expiration date is required');
    });

    // Test 11: Very small positive rate should pass validation
    it('shouldPassValidationForVerySmallPositiveRate', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.0000001,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 12: Very large positive rate should pass validation
    it('shouldPassValidationForVeryLargePositiveRate', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 1000000000000, // 1 trillion
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 13: Effective date just before expiration date should pass validation
    it('shouldPassValidationForEffectiveJustBeforeExpiration', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00.000Z',
            expirationAt: '2023-01-01T00:00:00.001Z' // 1 millisecond later
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 14: Effective date far before expiration date should pass validation
    it('shouldPassValidationForEffectiveFarBeforeExpiration', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2030-01-01T00:00:00Z' // 7 years later
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 15: Special characters in asset codes should pass validation
    it('shouldPassValidationForSpecialCharactersInAssetCodes', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD-TEST',
            toAsset: 'EUR_TEST',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 16: Lowercase asset codes should pass validation
    it('shouldPassValidationForLowercaseAssetCodes', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'usd',
            toAsset: 'eur',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 17: Same asset codes should pass validation
    it('shouldPassValidationForSameAssetCodes', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'USD',
            rate: 1.0,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 18: Numeric asset codes should pass validation
    it('shouldPassValidationForNumericAssetCodes', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: '123',
            toAsset: '456',
            rate: 2.5,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 19: Long asset codes should pass validation
    it('shouldPassValidationForLongAssetCodes', () => {
        const longCode1 = 'VERY_LONG_ASSET_CODE_FOR_TESTING_PURPOSES_1';
        const longCode2 = 'VERY_LONG_ASSET_CODE_FOR_TESTING_PURPOSES_2';
        
        const validInput: UpdateAssetRateInput = {
            fromAsset: longCode1,
            toAsset: longCode2,
            rate: 1.5,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 20: Invalid date format should still pass validation (as it's handled by Date constructor)
    it('shouldHandleInvalidDateFormat', () => {
        const input: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: 'January 1, 2023',
            expirationAt: 'January 2, 2023'
        };
        
        // This should pass because JavaScript's Date constructor is very forgiving
        // and will parse these strings into valid dates
        const result = validateUpdateAssetRateInput(input);
        
        expect(result.valid).toBe(true);
    });

    // Test 21: Undefined fields should fail validation
    it('shouldFailValidationForUndefinedFields', () => {
        const invalidInput = {
            // Intentionally missing all required fields
        } as UpdateAssetRateInput;
        
        const result = validateUpdateAssetRateInput(invalidInput);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors?.fromAsset).toContain('Source asset code is required');
        expect(result.fieldErrors?.toAsset).toContain('Target asset code is required');
        expect(result.fieldErrors?.rate).toContain('Rate must be greater than 0');
        expect(result.fieldErrors?.effectiveAt).toContain('Effective date is required');
        expect(result.fieldErrors?.expirationAt).toContain('Expiration date is required');
    });

    // Test 22: Rate of exactly 1.0 should pass validation
    it('shouldPassValidationForRateOfExactlyOne', () => {
        const validInput: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'USD',
            rate: 1.0,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        const result = validateUpdateAssetRateInput(validInput);
        
        expect(result.valid).toBe(true);
    });
});
