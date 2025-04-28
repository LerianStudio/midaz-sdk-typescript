import { validateCreatePortfolioInput, validateUpdatePortfolioInput } from '../../../src/models/validators/portfolio-validator';
import { CreatePortfolioInput, UpdatePortfolioInput } from '../../../src/models/portfolio';
import { StatusCode } from '../../../src/models/common';

describe('Portfolio Validator', () => {
    // Tests for validateCreatePortfolioInput
    describe('validateCreatePortfolioInput', () => {
        // Test 1: Valid input should pass validation
        it('shouldPassValidationForValidInput', () => {
            const validInput: CreatePortfolioInput = {
                entityId: 'client_12345',
                name: 'Retirement Portfolio'
            };
            
            const result = validateCreatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 2: Empty entityId should fail validation
        it('shouldFailValidationForEmptyEntityId', () => {
            const invalidInput: CreatePortfolioInput = {
                entityId: '',
                name: 'Retirement Portfolio'
            };
            
            const result = validateCreatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.entityId).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 3: Empty name should fail validation
        it('shouldFailValidationForEmptyName', () => {
            const invalidInput: CreatePortfolioInput = {
                entityId: 'client_12345',
                name: ''
            };
            
            const result = validateCreatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 4: Name exceeding maximum length should fail validation
        it('shouldFailValidationForNameExceedingMaxLength', () => {
            const longName = 'A'.repeat(257); // 257 characters
            const invalidInput: CreatePortfolioInput = {
                entityId: 'client_12345',
                name: longName
            };
            
            const result = validateCreatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('256 characters');
        });

        // Test 5: EntityId exceeding maximum length should fail validation
        it('shouldFailValidationForEntityIdExceedingMaxLength', () => {
            const longEntityId = 'A'.repeat(257); // 257 characters
            const invalidInput: CreatePortfolioInput = {
                entityId: longEntityId,
                name: 'Retirement Portfolio'
            };
            
            const result = validateCreatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.entityId).toBeDefined();
            expect(result.message).toContain('256 characters');
        });

        // Test 6: Multiple validation errors should be reported
        it('shouldReportMultipleValidationErrors', () => {
            const longEntityId = 'A'.repeat(257); // 257 characters
            const longName = 'B'.repeat(257); // 257 characters
            const invalidInput: CreatePortfolioInput = {
                entityId: longEntityId,
                name: longName
            };
            
            const result = validateCreatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.entityId).toBeDefined();
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('256 characters');
        });

        // Test 7: Null input should fail validation
        it('shouldFailValidationForNullInput', () => {
            const result = validateCreatePortfolioInput(null as unknown as CreatePortfolioInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 8: Undefined input should fail validation
        it('shouldFailValidationForUndefinedInput', () => {
            const result = validateCreatePortfolioInput(undefined as unknown as CreatePortfolioInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 9: Input with exactly maximum length values should pass validation
        it('shouldPassValidationForMaxLengthValues', () => {
            const maxLengthName = 'A'.repeat(256); // 256 characters
            const maxLengthEntityId = 'B'.repeat(256); // 256 characters
            const validInput: CreatePortfolioInput = {
                entityId: maxLengthEntityId,
                name: maxLengthName
            };
            
            const result = validateCreatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 10: Input with status and metadata should pass validation
        it('shouldPassValidationWithOptionalFields', () => {
            const validInput: CreatePortfolioInput = {
                entityId: 'client_12345',
                name: 'Retirement Portfolio',
                status: StatusCode.ACTIVE,
                metadata: {
                    riskProfile: 'moderate',
                    targetReturn: '8%'
                }
            };
            
            const result = validateCreatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 11: Input with special characters should pass validation
        it('shouldPassValidationWithSpecialCharacters', () => {
            const validInput: CreatePortfolioInput = {
                entityId: 'client_12345!@#$%^&*()',
                name: 'Retirement Portfolio !@#$%^&*()'
            };
            
            const result = validateCreatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });
    });

    // Tests for validateUpdatePortfolioInput
    describe('validateUpdatePortfolioInput', () => {
        // Test 12: Valid update with name should pass validation
        it('shouldPassValidationForValidUpdateWithName', () => {
            const validInput: UpdatePortfolioInput = {
                name: 'Updated Portfolio Name'
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 13: Valid update with status should pass validation
        it('shouldPassValidationForValidUpdateWithStatus', () => {
            const validInput: UpdatePortfolioInput = {
                status: StatusCode.ACTIVE
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 14: Valid update with metadata should pass validation
        it('shouldPassValidationForValidUpdateWithMetadata', () => {
            const validInput: UpdatePortfolioInput = {
                metadata: {
                    riskProfile: 'aggressive',
                    targetReturn: '12%'
                }
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 15: Valid update with all fields should pass validation
        it('shouldPassValidationForValidUpdateWithAllFields', () => {
            const validInput: UpdatePortfolioInput = {
                name: 'Updated Portfolio Name',
                status: StatusCode.ACTIVE,
                metadata: {
                    riskProfile: 'moderate',
                    targetReturn: '8%'
                }
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 16: Empty update should fail validation
        it('shouldFailValidationForEmptyUpdate', () => {
            const invalidInput: UpdatePortfolioInput = {};
            
            const result = validateUpdatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('At least one field must be provided');
        });

        // Test 17: Update with empty name should fail validation
        it('shouldFailValidationForEmptyName', () => {
            const invalidInput: UpdatePortfolioInput = {
                name: ''
            };
            
            const result = validateUpdatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 18: Update with name exceeding maximum length should fail validation
        it('shouldFailValidationForNameExceedingMaxLength', () => {
            const longName = 'A'.repeat(257); // 257 characters
            const invalidInput: UpdatePortfolioInput = {
                name: longName
            };
            
            const result = validateUpdatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('256 characters');
        });

        // Test 19: Null update input should fail validation
        it('shouldFailValidationForNullInput', () => {
            const result = validateUpdatePortfolioInput(null as unknown as UpdatePortfolioInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 20: Undefined update input should fail validation
        it('shouldFailValidationForUndefinedInput', () => {
            const result = validateUpdatePortfolioInput(undefined as unknown as UpdatePortfolioInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 21: Update with name of exactly maximum length should pass validation
        it('shouldPassValidationForMaxLengthName', () => {
            const maxLengthName = 'A'.repeat(256); // 256 characters
            const validInput: UpdatePortfolioInput = {
                name: maxLengthName
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 22: Update with only undefined values should fail validation
        it('shouldFailValidationForOnlyUndefinedValues', () => {
            const invalidInput = {
                name: undefined,
                status: undefined,
                metadata: undefined
            } as UpdatePortfolioInput;
            
            const result = validateUpdatePortfolioInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('At least one field must be provided');
        });

        // Test 23: Update with special characters in name should pass validation
        it('shouldPassValidationWithSpecialCharactersInName', () => {
            const validInput: UpdatePortfolioInput = {
                name: 'Updated Portfolio Name !@#$%^&*()'
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 24: Update with complex metadata should pass validation
        it('shouldPassValidationWithComplexMetadata', () => {
            const validInput: UpdatePortfolioInput = {
                metadata: {
                    riskProfile: 'moderate',
                    targetReturn: '8%',
                    assetAllocation: {
                        equities: '60%',
                        bonds: '30%',
                        alternatives: '10%'
                    },
                    rebalancingFrequency: 'quarterly',
                    investmentHorizon: 'long-term',
                    nestedObject: {
                        level1: {
                            level2: {
                                level3: 'deep value'
                            }
                        }
                    }
                }
            };
            
            const result = validateUpdatePortfolioInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });
    });
});
