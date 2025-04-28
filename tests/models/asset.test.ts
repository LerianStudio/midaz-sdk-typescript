import {
    CreateAssetInput,
    UpdateAssetInput,
    Asset,
    newCreateAssetInput,
    newCreateAssetInputWithType,
    newUpdateAssetInput,
    withMetadata,
    withName,
    withStatus
} from '../../src/models/asset';
import { StatusCode } from '../../src/models/common';

describe('Asset Model and Helper Functions', () => {
    // Test 1: Basic asset input creation
    it('shouldCreateAssetInputWithRequiredFields', () => {
        const input = newCreateAssetInput('US Dollar', 'USD');
        expect(input).toEqual({
            name: 'US Dollar',
            code: 'USD'
        });
    });

    // Test 2: Asset input creation with type
    it('shouldCreateAssetInputWithType', () => {
        const input = newCreateAssetInputWithType('US Dollar', 'USD', 'CURRENCY');
        expect(input).toEqual({
            name: 'US Dollar',
            code: 'USD',
            type: 'CURRENCY'
        });
    });

    // Test 3: Setting status on asset input
    it('shouldSetStatusOnAssetInput', () => {
        const input = newCreateAssetInput('Test Asset', 'TEST');
        const result = withStatus(input, StatusCode.ACTIVE);
        
        expect(result).toEqual({
            name: 'Test Asset',
            code: 'TEST',
            status: StatusCode.ACTIVE
        });
        
        // Should modify the original object (reference)
        expect(input).toBe(result);
    });

    // Test 4: Setting metadata on asset input
    it('shouldSetMetadataOnAssetInput', () => {
        const input = newCreateAssetInput('Euro', 'EUR');
        const metadata = {
            symbol: '€',
            decimalPlaces: 2,
            isoCode: 'EUR'
        };
        
        const result = withMetadata(input, metadata);
        
        expect(result).toEqual({
            name: 'Euro',
            code: 'EUR',
            metadata
        });
        
        // Should modify the original object (reference)
        expect(input).toBe(result);
    });

    // Test 5: Creating empty update input
    it('shouldCreateEmptyUpdateInput', () => {
        const updateInput = newUpdateAssetInput();
        expect(updateInput).toEqual({});
    });

    // Test 6: Setting name on update input
    it('shouldSetNameOnUpdateInput', () => {
        const updateInput = newUpdateAssetInput();
        const result = withName(updateInput, 'Renamed Asset');
        
        expect(result).toEqual({
            name: 'Renamed Asset'
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 7: Chaining helper methods
    it('shouldSupportChainingHelperMethods', () => {
        const input = newCreateAssetInput('Bitcoin', 'BTC');
        const result = withMetadata(
            withStatus(input, StatusCode.ACTIVE),
            { type: 'CRYPTOCURRENCY', decimalPlaces: 8 }
        );
        
        expect(result).toEqual({
            name: 'Bitcoin',
            code: 'BTC',
            status: StatusCode.ACTIVE,
            metadata: {
                type: 'CRYPTOCURRENCY',
                decimalPlaces: 8
            }
        });
    });

    // Test 8: Chaining helper methods for update input
    it('shouldSupportChainingHelperMethodsForUpdateInput', () => {
        const updateInput = newUpdateAssetInput();
        const result = withName(
            withMetadata(updateInput, { isRestricted: true }),
            'Restricted Asset'
        );
        
        expect(result).toEqual({
            name: 'Restricted Asset',
            metadata: {
                isRestricted: true
            }
        });
    });

    // Test 9: Handling empty strings for required fields
    it('shouldHandleEmptyStringsForRequiredFields', () => {
        const input = newCreateAssetInput('', '');
        expect(input.name).toBe('');
        expect(input.code).toBe('');
    });

    // Test 10: Handling special characters in asset name and code
    it('shouldHandleSpecialCharactersInAssetNameAndCode', () => {
        const specialName = 'Asset with special chars: !@#$%^&*()';
        const specialCode = 'CODE!@#';
        
        const input = newCreateAssetInput(specialName, specialCode);
        
        expect(input.name).toBe(specialName);
        expect(input.code).toBe(specialCode);
    });

    // Test 11: Handling complex metadata objects
    it('shouldHandleComplexMetadataObjects', () => {
        const input = newCreateAssetInput('Complex Asset', 'COMPLEX');
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

    // Test 12: Setting status to different values
    it('shouldSetStatusToDifferentValues', () => {
        const input = newCreateAssetInput('Status Test', 'STATUS');
        
        const activeResult = withStatus(input, StatusCode.ACTIVE);
        expect(activeResult.status).toBe(StatusCode.ACTIVE);
        
        const inactiveResult = withStatus(input, StatusCode.INACTIVE);
        expect(inactiveResult.status).toBe(StatusCode.INACTIVE);
        
        const pendingResult = withStatus(input, StatusCode.PENDING);
        expect(pendingResult.status).toBe(StatusCode.PENDING);
    });

    // Test 13: Overriding existing values
    it('shouldOverrideExistingValues', () => {
        const input = newCreateAssetInputWithType('Original Name', 'CODE', 'ORIGINAL_TYPE');
        
        // Override with withStatus
        const withStatusResult = withStatus(input, StatusCode.ACTIVE);
        expect(withStatusResult.status).toBe(StatusCode.ACTIVE);
        
        // Override status again
        const overriddenStatus = withStatus(input, StatusCode.INACTIVE);
        expect(overriddenStatus.status).toBe(StatusCode.INACTIVE);
        
        // Override with withMetadata
        const withMetadataResult = withMetadata(input, { key: 'value' });
        expect(withMetadataResult.metadata).toEqual({ key: 'value' });
        
        // Override metadata again
        const overriddenMetadata = withMetadata(input, { newKey: 'newValue' });
        expect(overriddenMetadata.metadata).toEqual({ newKey: 'newValue' });
    });

    // Test 14: Creating an asset with all fields
    it('shouldCreateCompleteAsset', () => {
        const now = new Date().toISOString();
        const completeAsset: Asset = {
            id: 'ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            name: 'Complete Asset',
            type: 'CURRENCY',
            code: 'COMPLETE',
            status: {
                code: StatusCode.ACTIVE,
                timestamp: now
            },
            ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            createdAt: now,
            updatedAt: now,
            metadata: {
                key: 'value'
            }
        };
        
        expect(completeAsset.id).toBe('ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeAsset.name).toBe('Complete Asset');
        expect(completeAsset.type).toBe('CURRENCY');
        expect(completeAsset.code).toBe('COMPLETE');
        expect(completeAsset.status.code).toBe(StatusCode.ACTIVE);
        expect(completeAsset.ledgerId).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeAsset.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeAsset.createdAt).toBe(now);
        expect(completeAsset.updatedAt).toBe(now);
        expect(completeAsset.metadata).toEqual({ key: 'value' });
    });

    // Test 15: Creating an asset with optional fields omitted
    it('shouldCreateAssetWithOptionalFieldsOmitted', () => {
        const minimalAsset: Asset = {
            id: 'ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            name: 'Minimal Asset',
            type: 'CURRENCY',
            code: 'MINIMAL',
            status: {
                code: StatusCode.ACTIVE,
                timestamp: new Date().toISOString()
            },
            ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(minimalAsset.metadata).toBeUndefined();
    });

    // Test 16: Setting metadata on update input
    it('shouldSetMetadataOnUpdateInput', () => {
        const updateInput = newUpdateAssetInput();
        const metadata = { key: 'value' };
        
        const result = withMetadata(updateInput, metadata);
        
        expect(result).toEqual({
            metadata
        });
    });

    // Test 17: Handling long asset names
    it('shouldHandleLongAssetNames', () => {
        const longName = 'A'.repeat(256); // 256 characters
        const input = newCreateAssetInput(longName, 'LONG');
        
        expect(input.name.length).toBe(256);
        expect(input.name).toBe(longName);
    });

    // Test 18: Handling long asset codes
    it('shouldHandleLongAssetCodes', () => {
        const longCode = 'C'.repeat(50); // 50 characters
        const input = newCreateAssetInput('Long Code Asset', longCode);
        
        expect(input.code.length).toBe(50);
        expect(input.code).toBe(longCode);
    });

    // Test 19: Handling large metadata objects
    it('shouldHandleLargeMetadataObjects', () => {
        const input = newCreateAssetInput('Large Metadata Asset', 'LARGE');
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

    // Test 20: Setting name to empty string in update input
    it('shouldSetEmptyNameInUpdateInput', () => {
        const updateInput = newUpdateAssetInput();
        const result = withName(updateInput, '');
        
        expect(result.name).toBe('');
    });

    // Test 21: Handling null metadata values
    it('shouldHandleNullMetadataValues', () => {
        const input = newCreateAssetInput('Null Metadata Asset', 'NULL');
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

    // Test 22: Creating update input with multiple fields
    it('shouldCreateUpdateInputWithMultipleFields', () => {
        const updateInput = newUpdateAssetInput();
        updateInput.name = 'Updated Name';
        updateInput.status = StatusCode.INACTIVE;
        updateInput.metadata = { updated: true };
        
        expect(updateInput).toEqual({
            name: 'Updated Name',
            status: StatusCode.INACTIVE,
            metadata: { updated: true }
        });
    });
});
