import { validateCreateOrganizationInput, validateUpdateOrganizationInput } from '../../../src/models/validators/organization-validator';
import { CreateOrganizationInput, UpdateOrganizationInput } from '../../../src/models/organization';
import { StatusCode } from '../../../src/models/common';

describe('Organization Validator', () => {
    // Tests for validateCreateOrganizationInput
    describe('validateCreateOrganizationInput', () => {
        // Test 1: Valid input should pass validation
        it('shouldPassValidationForValidInput', () => {
            const validInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'US',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
            expect(result.fieldErrors).toBeUndefined();
            expect(result.message || '').toBe('');
        });

        // Test 2: Empty legalName should fail validation
        it('shouldFailValidationForEmptyLegalName', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: '',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'US',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.legalName).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 3: Empty legalDocument should fail validation
        it('shouldFailValidationForEmptyLegalDocument', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'US',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.legalDocument).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 4: Empty doingBusinessAs should fail validation
        it('shouldFailValidationForEmptyDoingBusinessAs', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: '',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'US',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.doingBusinessAs).toBeDefined();
            expect(result.message).toContain('doingBusinessAs');
        });

        // Test 5: Invalid address should fail validation
        it('shouldFailValidationForInvalidAddress', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'US',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.['address.line1']).toBeDefined();
            expect(result.message).toContain('line1');
        });

        // Test 6: Invalid country code should fail validation
        it('shouldFailValidationForInvalidCountryCode', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'usa', // lowercase, should be uppercase
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.['address.country']).toBeDefined();
            expect(result.message).toContain('ISO 3166-1');
        });

        // Test 7: Invalid country code length should fail validation
        it('shouldFailValidationForInvalidCountryCodeLength', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'USA', // 3 characters, should be 2
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.['address.country']).toBeDefined();
            expect(result.message).toContain('ISO 3166-1');
        });

        // Test 8: Missing address fields should fail validation
        it('shouldFailValidationForMissingAddressFields', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    // missing city, state, country
                    city: '',
                    state: '',
                    country: '',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.['address.city']).toBeDefined();
            expect(result.fieldErrors?.['address.state']).toBeDefined();
            expect(result.fieldErrors?.['address.country']).toBeDefined();
        });

        // Test 9: Null input should fail validation
        it('shouldFailValidationForNullInput', () => {
            const result = validateCreateOrganizationInput(null as unknown as CreateOrganizationInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 10: Undefined input should fail validation
        it('shouldFailValidationForUndefinedInput', () => {
            const result = validateCreateOrganizationInput(undefined as unknown as CreateOrganizationInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 11: Multiple validation errors should be reported
        it('shouldReportMultipleValidationErrors', () => {
            const invalidInput: CreateOrganizationInput = {
                legalName: '',
                legalDocument: '',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '',
                    city: '',
                    state: '',
                    country: 'USA', // invalid format
                    zipCode: ''
                }
            };
            
            const result = validateCreateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.legalName).toBeDefined();
            expect(result.fieldErrors?.legalDocument).toBeDefined();
            expect(result.fieldErrors?.['address.line1']).toBeDefined();
            expect(result.fieldErrors?.['address.city']).toBeDefined();
            expect(result.fieldErrors?.['address.state']).toBeDefined();
            expect(result.fieldErrors?.['address.country']).toBeDefined();
        });

        // Test 12: Valid input without optional fields should pass validation
        it('shouldPassValidationForValidInputWithoutOptionalFields', () => {
            const validInput: CreateOrganizationInput = {
                legalName: 'Acme Corporation',
                legalDocument: '123456789',
                doingBusinessAs: 'Acme Inc.',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'US',
                    zipCode: '94105'
                }
            };
            
            const result = validateCreateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });
    });

    // Tests for validateUpdateOrganizationInput
    describe('validateUpdateOrganizationInput', () => {
        // Test 13: Valid update with legalName should pass validation
        it('shouldPassValidationForValidUpdateWithLegalName', () => {
            const validInput: UpdateOrganizationInput = {
                legalName: 'Updated Corporation'
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 14: Valid update with doingBusinessAs should pass validation
        it('shouldPassValidationForValidUpdateWithDoingBusinessAs', () => {
            const validInput: UpdateOrganizationInput = {
                doingBusinessAs: 'Updated Inc.'
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 15: Valid update with status should pass validation
        it('shouldPassValidationForValidUpdateWithStatus', () => {
            const validInput: UpdateOrganizationInput = {
                status: StatusCode.ACTIVE
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 16: Valid update with address should pass validation
        it('shouldPassValidationForValidUpdateWithAddress', () => {
            const validInput: UpdateOrganizationInput = {
                address: {
                    line1: '456 New St',
                    city: 'New York',
                    state: 'NY',
                    country: 'US',
                    zipCode: '10001'
                }
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 17: Valid update with parentOrganizationId should pass validation
        it('shouldPassValidationForValidUpdateWithParentOrganizationId', () => {
            const validInput: UpdateOrganizationInput = {
                parentOrganizationId: 'org_12345'
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 18: Valid update with metadata should pass validation
        it('shouldPassValidationForValidUpdateWithMetadata', () => {
            const validInput: UpdateOrganizationInput = {
                metadata: {
                    industry: 'Technology',
                    yearFounded: '2010'
                }
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 19: Valid update with all fields should pass validation
        it('shouldPassValidationForValidUpdateWithAllFields', () => {
            const validInput: UpdateOrganizationInput = {
                legalName: 'Updated Corporation',
                doingBusinessAs: 'Updated Inc.',
                status: StatusCode.ACTIVE,
                address: {
                    line1: '456 New St',
                    city: 'New York',
                    state: 'NY',
                    country: 'US',
                    zipCode: '10001'
                },
                parentOrganizationId: 'org_12345',
                metadata: {
                    industry: 'Technology',
                    yearFounded: '2010'
                }
            };
            
            const result = validateUpdateOrganizationInput(validInput);
            
            expect(result.valid).toBe(true);
        });

        // Test 20: Empty update should fail validation
        it('shouldFailValidationForEmptyUpdate', () => {
            const invalidInput: UpdateOrganizationInput = {};
            
            const result = validateUpdateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('At least one field must be provided');
        });

        // Test 21: Update with empty legalName should fail validation
        it('shouldFailValidationForEmptyLegalName', () => {
            const invalidInput: UpdateOrganizationInput = {
                legalName: ''
            };
            
            const result = validateUpdateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.legalName).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 22: Update with empty doingBusinessAs should fail validation
        it('shouldFailValidationForEmptyDoingBusinessAs', () => {
            const invalidInput: UpdateOrganizationInput = {
                doingBusinessAs: ''
            };
            
            const result = validateUpdateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.doingBusinessAs).toBeDefined();
            expect(result.message).toContain('empty');
        });

        // Test 23: Update with invalid address should fail validation
        it('shouldFailValidationForInvalidUpdateAddress', () => {
            const invalidInput: UpdateOrganizationInput = {
                address: {
                    line1: '456 New St',
                    city: '',
                    state: 'NY',
                    country: 'USA', // invalid format
                    zipCode: '10001'
                }
            };
            
            const result = validateUpdateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.fieldErrors?.['address.city']).toBeDefined();
            expect(result.fieldErrors?.['address.country']).toBeDefined();
        });

        // Test 24: Null update input should fail validation
        it('shouldFailValidationForNullInput', () => {
            const result = validateUpdateOrganizationInput(null as unknown as UpdateOrganizationInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 25: Undefined update input should fail validation
        it('shouldFailValidationForUndefinedInput', () => {
            const result = validateUpdateOrganizationInput(undefined as unknown as UpdateOrganizationInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        // Test 26: Update with only undefined values should fail validation
        it('shouldFailValidationForOnlyUndefinedValues', () => {
            const invalidInput = {
                legalName: undefined,
                doingBusinessAs: undefined,
                status: undefined,
                address: undefined,
                parentOrganizationId: undefined,
                metadata: undefined
            } as UpdateOrganizationInput;
            
            const result = validateUpdateOrganizationInput(invalidInput);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('At least one field must be provided');
        });
    });
});
