import {
    Ledger,
    CreateLedgerInput,
    UpdateLedgerInput,
    newCreateLedgerInput,
    newUpdateLedgerInput,
    withName,
    withStatus,
    withMetadata
} from '../../src/models/ledger';
import { StatusCode } from '../../src/models/common';

describe('Ledger Model and Helper Functions', () => {
    // Test 1: Creating a ledger input with required fields
    it('shouldCreateLedgerInputWithRequiredFields', () => {
        const input = newCreateLedgerInput('Corporate General Ledger');
        expect(input).toEqual({
            name: 'Corporate General Ledger',
            status: StatusCode.ACTIVE // Default status
        });
    });

    // Test 2: Creating an empty update ledger input
    it('shouldCreateEmptyUpdateLedgerInput', () => {
        const updateInput = newUpdateLedgerInput();
        expect(updateInput).toEqual({});
    });

    // Test 3: Setting name on update input
    it('shouldSetNameOnUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        const result = withName(updateInput, 'Corporate General Ledger 2023');
        
        expect(result).toEqual({
            name: 'Corporate General Ledger 2023'
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 4: Setting status on update input
    it('shouldSetStatusOnUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        const result = withStatus(updateInput, StatusCode.INACTIVE);
        
        expect(result).toEqual({
            status: StatusCode.INACTIVE
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 5: Setting metadata on update input
    it('shouldSetMetadataOnUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        const metadata = {
            fiscalYear: '2023',
            accountingStandard: 'GAAP',
            baseCurrency: 'USD'
        };
        
        const result = withMetadata(updateInput, metadata);
        
        expect(result).toEqual({
            metadata
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 6: Setting metadata on create input
    it('shouldSetMetadataOnCreateInput', () => {
        const createInput = newCreateLedgerInput('Corporate General Ledger');
        const metadata = {
            fiscalYear: '2023',
            accountingStandard: 'GAAP',
            baseCurrency: 'USD'
        };
        
        const result = withMetadata(createInput, metadata);
        
        expect(result).toEqual({
            name: 'Corporate General Ledger',
            status: StatusCode.ACTIVE,
            metadata
        });
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 7: Chaining helper methods for update input
    it('shouldSupportChainingHelperMethodsForUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        const result = withName(
            withMetadata(
                withStatus(updateInput, StatusCode.ACTIVE),
                { fiscalYear: '2023', lastReconciled: '2023-09-30' }
            ),
            'Corporate General Ledger 2023'
        );
        
        expect(result).toEqual({
            name: 'Corporate General Ledger 2023',
            status: StatusCode.ACTIVE,
            metadata: {
                fiscalYear: '2023',
                lastReconciled: '2023-09-30'
            }
        });
    });

    // Test 8: Creating a complete ledger object
    it('shouldCreateCompleteLedgerObject', () => {
        const now = new Date().toISOString();
        const completeLedger: Ledger = {
            id: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            name: 'Corporate General Ledger',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            status: {
                code: StatusCode.ACTIVE,
                description: 'Ledger is active and operational',
                timestamp: now
            },
            createdAt: now,
            updatedAt: now,
            metadata: {
                fiscalYear: '2023',
                accountingStandard: 'GAAP',
                baseCurrency: 'USD'
            }
        };
        
        expect(completeLedger.id).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeLedger.name).toBe('Corporate General Ledger');
        expect(completeLedger.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeLedger.status.code).toBe(StatusCode.ACTIVE);
        expect(completeLedger.status.description).toBe('Ledger is active and operational');
        expect(completeLedger.createdAt).toBe(now);
        expect(completeLedger.updatedAt).toBe(now);
        expect(completeLedger.metadata).toEqual({
            fiscalYear: '2023',
            accountingStandard: 'GAAP',
            baseCurrency: 'USD'
        });
    });

    // Test 9: Creating a ledger with minimum required fields
    it('shouldCreateLedgerWithMinimumRequiredFields', () => {
        const now = new Date().toISOString();
        const minimalLedger: Ledger = {
            id: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            name: 'Minimal Ledger',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            status: {
                code: StatusCode.ACTIVE,
                timestamp: now
            },
            createdAt: now,
            updatedAt: now
        };
        
        expect(minimalLedger.metadata).toBeUndefined();
        expect(minimalLedger.deletedAt).toBeUndefined();
        expect(minimalLedger.status.description).toBeUndefined();
    });

    // Test 10: Handling empty strings for name
    it('shouldHandleEmptyStringsForName', () => {
        const input = newCreateLedgerInput('');
        expect(input.name).toBe('');
    });

    // Test 11: Setting empty name in update input
    it('shouldSetEmptyNameInUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        const result = withName(updateInput, '');
        
        expect(result.name).toBe('');
    });

    // Test 12: Handling different status values
    it('shouldHandleDifferentStatusValues', () => {
        const updateInput = newUpdateLedgerInput();
        
        const activeResult = withStatus(updateInput, StatusCode.ACTIVE);
        expect(activeResult.status).toBe(StatusCode.ACTIVE);
        
        const inactiveResult = withStatus(updateInput, StatusCode.INACTIVE);
        expect(inactiveResult.status).toBe(StatusCode.INACTIVE);
        
        const pendingResult = withStatus(updateInput, StatusCode.PENDING);
        expect(pendingResult.status).toBe(StatusCode.PENDING);
    });

    // Test 13: Handling complex metadata objects
    it('shouldHandleComplexMetadataObjects', () => {
        const input = newCreateLedgerInput('Complex Metadata Ledger');
        const complexMetadata = {
            nestedObject: {
                level1: {
                    level2: {
                        level3: 'deep value'
                    }
                }
            },
            arrayValue: [1, 2, 3, 4, 5],
            mixedArray: [
                'string',
                123,
                true,
                { key: 'value' },
                ['nested', 'array']
            ],
            nullValue: null,
            booleanValue: true
        };
        
        const result = withMetadata(input, complexMetadata);
        
        expect(result.metadata).toEqual(complexMetadata);
    });

    // Test 14: Overriding existing values
    it('shouldOverrideExistingValues', () => {
        const updateInput = newUpdateLedgerInput();
        
        // Set initial values
        const withInitialValues = withName(
            withMetadata(
                withStatus(updateInput, StatusCode.ACTIVE),
                { key1: 'value1' }
            ),
            'Initial Name'
        );
        
        expect(withInitialValues).toEqual({
            name: 'Initial Name',
            status: StatusCode.ACTIVE,
            metadata: { key1: 'value1' }
        });
        
        // Override values
        const withOverriddenValues = withName(
            withMetadata(
                withStatus(updateInput, StatusCode.INACTIVE),
                { key2: 'value2' }
            ),
            'Overridden Name'
        );
        
        expect(withOverriddenValues).toEqual({
            name: 'Overridden Name',
            status: StatusCode.INACTIVE,
            metadata: { key2: 'value2' }
        });
    });

    // Test 15: Creating update input with direct property assignment
    it('shouldCreateUpdateInputWithDirectPropertyAssignment', () => {
        const updateInput: UpdateLedgerInput = {};
        updateInput.name = 'Direct Assignment';
        updateInput.status = StatusCode.ACTIVE;
        updateInput.metadata = { directlyAssigned: true };
        
        expect(updateInput).toEqual({
            name: 'Direct Assignment',
            status: StatusCode.ACTIVE,
            metadata: { directlyAssigned: true }
        });
    });

    // Test 16: Setting only name in update input
    it('shouldSetOnlyNameInUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.name = 'Only Name';
        
        expect(updateInput).toEqual({
            name: 'Only Name'
        });
        expect(updateInput.status).toBeUndefined();
        expect(updateInput.metadata).toBeUndefined();
    });

    // Test 17: Setting only status in update input
    it('shouldSetOnlyStatusInUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.status = StatusCode.ACTIVE;
        
        expect(updateInput).toEqual({
            status: StatusCode.ACTIVE
        });
        expect(updateInput.name).toBeUndefined();
        expect(updateInput.metadata).toBeUndefined();
    });

    // Test 18: Setting only metadata in update input
    it('shouldSetOnlyMetadataInUpdateInput', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.metadata = { onlyMetadata: true };
        
        expect(updateInput).toEqual({
            metadata: { onlyMetadata: true }
        });
        expect(updateInput.name).toBeUndefined();
        expect(updateInput.status).toBeUndefined();
    });

    // Test 19: Handling long ledger names
    it('shouldHandleLongLedgerNames', () => {
        const longName = 'A'.repeat(256); // 256 characters
        const input = newCreateLedgerInput(longName);
        
        expect(input.name.length).toBe(256);
        expect(input.name).toBe(longName);
    });

    // Test 20: Handling null metadata values
    it('shouldHandleNullMetadataValues', () => {
        const input = newCreateLedgerInput('Null Metadata Ledger');
        const metadataWithNull = {
            nullValue: null,
            undefinedValue: undefined,
            regularValue: 'value'
        };
        
        const result = withMetadata(input, metadataWithNull);
        
        expect(result.metadata!.nullValue).toBeNull();
        expect(result.metadata!.undefinedValue).toBeUndefined();
        expect(result.metadata!.regularValue).toBe('value');
    });

    // Test 21: Creating a ledger with deletedAt timestamp
    it('shouldCreateLedgerWithDeletedAtTimestamp', () => {
        const now = new Date().toISOString();
        const deletedLedger: Ledger = {
            id: 'ldg_deleted',
            name: 'Deleted Ledger',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            status: {
                code: StatusCode.INACTIVE,
                description: 'Ledger has been deleted',
                timestamp: now
            },
            createdAt: now,
            updatedAt: now,
            deletedAt: now
        };
        
        expect(deletedLedger.deletedAt).toBe(now);
        expect(deletedLedger.status.code).toBe(StatusCode.INACTIVE);
    });

    // Test 22: Handling large metadata objects
    it('shouldHandleLargeMetadataObjects', () => {
        const input = newCreateLedgerInput('Large Metadata Ledger');
        const largeMetadata: Record<string, any> = {};
        
        // Create a large metadata object with 1000 keys
        for (let i = 0; i < 1000; i++) {
            largeMetadata[`key${i}`] = `value${i}`;
        }
        
        const result = withMetadata(input, largeMetadata);
        
        expect(Object.keys(result.metadata!).length).toBe(1000);
        expect(result.metadata!.key0).toBe('value0');
        expect(result.metadata!.key999).toBe('value999');
    });

    // Import validators for the tests
    const { validateCreateLedgerInput, validateUpdateLedgerInput } = require('../../src/models/validators/ledger-validator');
    const { validateMetadata } = require('../../src/util/validation');

    // Test 23: Validating create ledger input with valid data
    it('shouldValidateCreateLedgerInputWithValidData', () => {
        const input = newCreateLedgerInput('Valid Ledger Name');
        const result = validateCreateLedgerInput(input);
        
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
    });

    // Test 24: Validating create ledger input with empty name
    it('shouldFailValidationForCreateLedgerInputWithEmptyName', () => {
        const input = newCreateLedgerInput('');
        const result = validateCreateLedgerInput(input);
        
        expect(result.valid).toBe(false);
        expect(result.message).toBe('name cannot be empty');
        expect(result.fieldErrors).toHaveProperty('name');
        expect(result.fieldErrors!.name).toContain('name cannot be empty');
    });

    // Test 25: Validating create ledger input with null input
    it('shouldFailValidationForNullCreateLedgerInput', () => {
        const result = validateCreateLedgerInput(null as any);
        
        expect(result.valid).toBe(false);
        expect(result.message).toBe('input is required');
        expect(result.fieldErrors).toHaveProperty('input');
    });

    // Test 26: Validating create ledger input with undefined name
    it('shouldFailValidationForCreateLedgerInputWithUndefinedName', () => {
        const input = { status: StatusCode.ACTIVE } as any;
        const result = validateCreateLedgerInput(input);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors).toHaveProperty('name');
    });

    // Test 27: Validating update ledger input with valid data
    it('shouldValidateUpdateLedgerInputWithValidData', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.name = 'Updated Ledger Name';
        
        const result = validateUpdateLedgerInput(updateInput);
        
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
    });

    // Test 28: Validating update ledger input with empty fields
    it('shouldFailValidationForUpdateLedgerInputWithNoFields', () => {
        const updateInput = newUpdateLedgerInput();
        const result = validateUpdateLedgerInput(updateInput);
        
        expect(result.valid).toBe(false);
        expect(result.message).toBe('At least one field must be provided for update');
        expect(result.fieldErrors).toHaveProperty('input');
    });

    // Test 29: Validating update ledger input with empty name
    it('shouldFailValidationForUpdateLedgerInputWithEmptyName', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.name = '';
        
        const result = validateUpdateLedgerInput(updateInput);
        
        expect(result.valid).toBe(false);
        expect(result.message).toBe('name cannot be empty');
        expect(result.fieldErrors).toHaveProperty('name');
    });

    // Test 30: Validating update ledger input with null input
    it('shouldFailValidationForNullUpdateLedgerInput', () => {
        const result = validateUpdateLedgerInput(null as any);
        
        expect(result.valid).toBe(false);
        expect(result.message).toBe('input is required');
        expect(result.fieldErrors).toHaveProperty('input');
    });

    // Test 31: Validating update ledger input with status only
    it('shouldValidateUpdateLedgerInputWithStatusOnly', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.status = StatusCode.INACTIVE;
        
        const result = validateUpdateLedgerInput(updateInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 32: Validating update ledger input with metadata only
    it('shouldValidateUpdateLedgerInputWithMetadataOnly', () => {
        const updateInput = newUpdateLedgerInput();
        updateInput.metadata = { key: 'value' };
        
        const result = validateUpdateLedgerInput(updateInput);
        
        expect(result.valid).toBe(true);
    });

    // Test 33: Validating metadata with valid data
    it('shouldValidateMetadataWithValidData', () => {
        const metadata = {
            fiscalYear: '2023',
            accountingStandard: 'GAAP',
            baseCurrency: 'USD',
            departments: ['Finance', 'Operations', 'Sales']
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(true);
    });

    // Test 34: Validating metadata with empty object
    it('shouldValidateEmptyMetadata', () => {
        const metadata = {};
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(true);
    });

    // Test 35: Validating metadata with null value
    it('shouldValidateMetadataWithNullValue', () => {
        const metadata = {
            nullValue: null
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(true);
    });

    // Test 36: Validating metadata with different value types
    it('shouldValidateMetadataWithDifferentValueTypes', () => {
        const metadata = {
            stringValue: 'test',
            numberValue: 123,
            booleanValue: true,
            arrayValue: [1, 2, 3],
            objectValue: { nested: 'value' }
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(true);
    });

    // Test 37: Validating metadata with very long string
    it('shouldFailValidationForMetadataWithVeryLongString', () => {
        const veryLongString = 'a'.repeat(300); // Longer than DEFAULT_VALIDATION_CONFIG.maxStringLength
        const metadata = {
            longString: veryLongString
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(false);
        expect(result.fieldErrors).toBeDefined();
        expect(result.fieldErrors!['metadata']).toBeDefined();
        expect(result.message).toContain('exceeds maximum length');
    });

    // Test 38: Validating metadata with empty key
    it('shouldFailValidationForMetadataWithEmptyKey', () => {
        const metadata = {
            '': 'empty key'
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(false);
        expect(result.message).toContain('metadata keys cannot be empty');
    });

    // Test 39: Validating metadata with very long key
    it('shouldFailValidationForMetadataWithVeryLongKey', () => {
        const veryLongKey = 'a'.repeat(70); // Longer than 64 characters
        const metadata = {
            [veryLongKey]: 'value'
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(false);
        expect(result.message).toContain('exceeds maximum length of 64 characters');
    });

    // Test 40: Validating metadata with number out of range
    it('shouldFailValidationForMetadataWithNumberOutOfRange', () => {
        const metadata = {
            hugeNumber: 10000000000 // Greater than 9999999999
        };
        
        const result = validateMetadata(metadata);
        
        expect(result.valid).toBe(false);
        expect(result.message).toContain('outside of safe range');
    });

    // Test 41: Validating metadata with custom configuration
    it('shouldValidateMetadataWithCustomConfig', () => {
        const metadata = {
            shortString: 'test'
        };
        
        // Custom config with very small max string length
        const customConfig = {
            maxStringLength: 3
        };
        
        const result = validateMetadata(metadata, customConfig);
        
        expect(result.valid).toBe(true);
    });

    // Test 42: Validating very large metadata exceeding size limit
    it('shouldFailValidationForVeryLargeMetadata', () => {
        const largeMetadata: Record<string, any> = {};
        
        // Create a large metadata object with many long strings
        for (let i = 0; i < 100; i++) {
            largeMetadata[`key${i}`] = 'a'.repeat(200);
        }
        
        // Custom config with small max metadata size
        const customConfig = {
            maxMetadataSize: 1000
        };
        
        const result = validateMetadata(largeMetadata, customConfig);
        
        expect(result.valid).toBe(false);
        expect(result.message).toContain('size exceeds maximum of');
    });
});
