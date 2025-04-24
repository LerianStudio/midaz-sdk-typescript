import { validateCreateAccountInput, validateUpdateAccountInput } from '../../../src/models/validators/account-validator';
import { CreateAccountInput, UpdateAccountInput, AccountType } from '../../../src/models/account';
import { StatusCode } from '../../../src/models/common';

describe('Account Validator', () => {
    // Tests for validateCreateAccountInput
    describe('validateCreateAccountInput', () => {
        // Test 1: Valid input should pass validation
        it('shouldPassValidationForValidInput', () => {
            const validInput: CreateAccountInput = {
                name: 'Checking Account',
                type: 'deposit' as AccountType,
                assetCode: 'USD'
            };
            
            const result = validateCreateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 2: Missing name should fail validation
        it('shouldFailValidationForMissingName', () => {
            const invalidInput: CreateAccountInput = {
                name: '',
                type: 'deposit' as AccountType,
                assetCode: 'USD'
            };
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('name');
        });

        // Test 3: Missing type should fail validation
        it('shouldFailValidationForMissingType', () => {
            const invalidInput = {
                name: 'Checking Account',
                type: '',
                assetCode: 'USD'
            } as unknown as CreateAccountInput;
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.type).toBeDefined();
            expect(result.message).toContain('type');
        });

        // Test 4: Missing assetCode should fail validation
        it('shouldFailValidationForMissingAssetCode', () => {
            const invalidInput: CreateAccountInput = {
                name: 'Checking Account',
                type: 'deposit' as AccountType,
                assetCode: ''
            };
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.assetCode).toBeDefined();
            expect(result.message).toContain('assetCode');
        });

        // Test 5: Invalid assetCode format should fail validation
        it('shouldFailValidationForInvalidAssetCodeFormat', () => {
            const invalidInput: CreateAccountInput = {
                name: 'Checking Account',
                type: 'deposit' as AccountType,
                assetCode: 'usd' // lowercase, should be uppercase
            };
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.assetCode).toBeDefined();
            expect(result.message).toContain('ISO 4217');
        });

        // Test 6: Invalid assetCode length should fail validation
        it('shouldFailValidationForInvalidAssetCodeLength', () => {
            const invalidInput: CreateAccountInput = {
                name: 'Checking Account',
                type: 'deposit' as AccountType,
                assetCode: 'USDT' // 4 characters, should be 3
            };
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.assetCode).toBeDefined();
            expect(result.message).toContain('ISO 4217');
        });

        // Test 7: Invalid account type should fail validation
        it('shouldFailValidationForInvalidAccountType', () => {
            const invalidInput = {
                name: 'Checking Account',
                type: 'checking', // not in allowed list
                assetCode: 'USD'
            } as unknown as CreateAccountInput;
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.type).toBeDefined();
            expect(result.message).toContain('type');
        });

        // Test 8: Null input should fail validation
        it('shouldFailValidationForNullInput', () => {
            const result = validateCreateAccountInput(null as unknown as CreateAccountInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 9: Undefined input should fail validation
        it('shouldFailValidationForUndefinedInput', () => {
            const result = validateCreateAccountInput(undefined as unknown as CreateAccountInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 10: Multiple validation errors should be reported
        it('shouldReportMultipleValidationErrors', () => {
            const invalidInput = {
                name: '',
                type: 'invalid',
                assetCode: 'usd'
            } as unknown as CreateAccountInput;
            
            const result = validateCreateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.fieldErrors?.type).toBeDefined();
            expect(result.fieldErrors?.assetCode).toBeDefined();
        });

        // Test 11: Valid input with all account types should pass validation
        it('shouldPassValidationForAllValidAccountTypes', () => {
            const accountTypes = ['deposit', 'savings', 'loans', 'marketplace', 'creditCard', 'external'];
            
            accountTypes.forEach(type => {
                const validInput: CreateAccountInput = {
                    name: 'Test Account',
                    type: type as AccountType,
                    assetCode: 'USD'
                };
                
                const result = validateCreateAccountInput(validInput);
                expect(result.valid).toBe(true);
            });
        });

        // Test 12: Valid input with different asset codes should pass validation
        it('shouldPassValidationForDifferentAssetCodes', () => {
            const assetCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'BTC', 'ETH'];
            
            assetCodes.forEach(code => {
                // Only test valid 3-letter uppercase codes
                if (code.length === 3 && code === code.toUpperCase()) {
                    const validInput: CreateAccountInput = {
                        name: 'Test Account',
                        type: 'deposit' as AccountType,
                        assetCode: code
                    };
                    
                    const result = validateCreateAccountInput(validInput);
                    expect(result.valid).toBe(true);
                }
            });
        });
    });

    // Tests for validateUpdateAccountInput
    describe('validateUpdateAccountInput', () => {
        // Test 13: Valid update with name should pass validation
        it('shouldPassValidationForValidUpdateWithName', () => {
            const validInput: UpdateAccountInput = {
                name: 'Updated Account Name'
            };
            
            const result = validateUpdateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 14: Valid update with segmentId should pass validation
        it('shouldPassValidationForValidUpdateWithSegmentId', () => {
            const validInput: UpdateAccountInput = {
                segmentId: 'seg_12345'
            };
            
            const result = validateUpdateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 15: Valid update with portfolioId should pass validation
        it('shouldPassValidationForValidUpdateWithPortfolioId', () => {
            const validInput: UpdateAccountInput = {
                portfolioId: 'port_12345'
            };
            
            const result = validateUpdateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 16: Valid update with status should pass validation
        it('shouldPassValidationForValidUpdateWithStatus', () => {
            const validInput: UpdateAccountInput = {
                status: StatusCode.ACTIVE
            };
            
            const result = validateUpdateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 17: Valid update with metadata should pass validation
        it('shouldPassValidationForValidUpdateWithMetadata', () => {
            const validInput: UpdateAccountInput = {
                metadata: {
                    category: 'personal',
                    interestRate: '0.05'
                }
            };
            
            const result = validateUpdateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 18: Valid update with all fields should pass validation
        it('shouldPassValidationForValidUpdateWithAllFields', () => {
            const validInput: UpdateAccountInput = {
                name: 'Updated Account Name',
                segmentId: 'seg_12345',
                portfolioId: 'port_12345',
                status: StatusCode.ACTIVE,
                metadata: {
                    category: 'personal',
                    interestRate: '0.05'
                }
            };
            
            const result = validateUpdateAccountInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 19: Empty update should fail validation
        it('shouldFailValidationForEmptyUpdate', () => {
            const invalidInput: UpdateAccountInput = {};
            
            const result = validateUpdateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('At least one field must be provided');
        });

        // Test 20: Update with empty name should fail validation
        it('shouldFailValidationForEmptyName', () => {
            const invalidInput: UpdateAccountInput = {
                name: ''
            };
            
            const result = validateUpdateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 21: Null update input should fail validation
        it('shouldFailValidationForNullInput', () => {
            const result = validateUpdateAccountInput(null as unknown as UpdateAccountInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 22: Undefined update input should fail validation
        it('shouldFailValidationForUndefinedInput', () => {
            const result = validateUpdateAccountInput(undefined as unknown as UpdateAccountInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 23: Update with only undefined values should fail validation
        it('shouldFailValidationForOnlyUndefinedValues', () => {
            const invalidInput = {
                name: undefined,
                segmentId: undefined,
                portfolioId: undefined,
                status: undefined,
                metadata: undefined
            } as UpdateAccountInput;
            
            const result = validateUpdateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('At least one field must be provided');
        });

        // Test 24: Update with whitespace-only name should fail validation
        it('shouldFailValidationForWhitespaceOnlyName', () => {
            const invalidInput: UpdateAccountInput = {
                name: '   '
            };
            
            const result = validateUpdateAccountInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.name).toBeDefined();
        });
    });
});
