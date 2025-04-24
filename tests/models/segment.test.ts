import {
    Segment,
    CreateSegmentInput,
    UpdateSegmentInput,
    newCreateSegmentInput,
    newUpdateSegmentInput,
    withStatus,
    withMetadata,
    withName
} from '../../src/models/segment';
import { StatusCode } from '../../src/models/common';

describe('Segment Model and Helper Functions', () => {
    // Test 1: Creating a segment input with required fields
    it('shouldCreateSegmentInputWithRequiredFields', () => {
        const input = newCreateSegmentInput('North America');
        expect(input).toEqual({
            name: 'North America'
        });
    });

    // Test 2: Creating an empty update segment input
    it('shouldCreateEmptyUpdateSegmentInput', () => {
        const updateInput = newUpdateSegmentInput();
        expect(updateInput).toEqual({});
    });

    // Test 3: Setting name on update input
    it('shouldSetNameOnUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        const result = withName(updateInput, 'Asia-Pacific Region');
        
        expect(result).toEqual({
            name: 'Asia-Pacific Region'
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 4: Setting status on create input
    it('shouldSetStatusOnCreateInput', () => {
        const createInput = newCreateSegmentInput('Legacy Region');
        const result = withStatus(createInput, StatusCode.INACTIVE);
        
        expect(result).toEqual({
            name: 'Legacy Region',
            status: StatusCode.INACTIVE
        });
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 5: Setting status on update input
    it('shouldSetStatusOnUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        const result = withStatus(updateInput, StatusCode.ACTIVE);
        
        expect(result).toEqual({
            status: StatusCode.ACTIVE
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 6: Setting metadata on create input
    it('shouldSetMetadataOnCreateInput', () => {
        const createInput = newCreateSegmentInput('EMEA');
        const metadata = {
            regionCode: 'EU',
            countries: ['UK', 'FR', 'DE', 'IT', 'ES'],
            currency: 'EUR',
            headquarters: 'London'
        };
        
        const result = withMetadata(createInput, metadata);
        
        expect(result).toEqual({
            name: 'EMEA',
            metadata
        });
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 7: Setting metadata on update input
    it('shouldSetMetadataOnUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        const metadata = {
            regionCode: 'EMEA',
            headquarters: 'Paris'
        };
        
        const result = withMetadata(updateInput, metadata);
        
        expect(result).toEqual({
            metadata
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 8: Chaining helper methods for update input
    it('shouldSupportChainingHelperMethodsForUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        
        const metadata = {
            regionCode: 'APAC',
            headquarters: 'Singapore'
        };
        
        const result = withName(
            withMetadata(
                withStatus(updateInput, StatusCode.ACTIVE),
                metadata
            ),
            'Asia-Pacific Region'
        );
        
        expect(result).toEqual({
            name: 'Asia-Pacific Region',
            status: StatusCode.ACTIVE,
            metadata
        });
    });

    // Test 9: Chaining helper methods for create input
    it('shouldSupportChainingHelperMethodsForCreateInput', () => {
        const createInput = newCreateSegmentInput('North America');
        
        const metadata = {
            regionCode: 'NA',
            countries: ['US', 'CA', 'MX'],
            currency: 'USD'
        };
        
        const result = withMetadata(
            withStatus(createInput, StatusCode.ACTIVE),
            metadata
        );
        
        expect(result).toEqual({
            name: 'North America',
            status: StatusCode.ACTIVE,
            metadata
        });
    });

    // Test 10: Creating a complete segment object
    it('shouldCreateCompleteSegmentObject', () => {
        const now = new Date().toISOString();
        
        const metadata = {
            regionCode: 'NA',
            countries: ['US', 'CA', 'MX'],
            currency: 'USD'
        };
        
        const completeSegment: Segment = {
            id: 'seg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            name: 'North America',
            ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            status: {
                code: StatusCode.ACTIVE,
                description: 'Segment is active and operational',
                timestamp: now
            },
            createdAt: now,
            updatedAt: now,
            metadata
        };
        
        expect(completeSegment.id).toBe('seg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeSegment.name).toBe('North America');
        expect(completeSegment.ledgerId).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeSegment.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeSegment.status.code).toBe(StatusCode.ACTIVE);
        expect(completeSegment.status.description).toBe('Segment is active and operational');
        expect(completeSegment.createdAt).toBe(now);
        expect(completeSegment.updatedAt).toBe(now);
        expect(completeSegment.metadata).toEqual(metadata);
    });

    // Test 11: Creating a segment with minimum required fields
    it('shouldCreateSegmentWithMinimumRequiredFields', () => {
        const now = new Date().toISOString();
        
        const minimalSegment: Segment = {
            id: 'seg_minimal',
            name: 'Minimal Segment',
            ledgerId: 'ldg_01',
            organizationId: 'org_01',
            status: {
                code: StatusCode.ACTIVE,
                timestamp: now
            },
            createdAt: now,
            updatedAt: now
        };
        
        expect(minimalSegment.metadata).toBeUndefined();
        expect(minimalSegment.deletedAt).toBeUndefined();
        expect(minimalSegment.status.description).toBeUndefined();
    });

    // Test 12: Handling empty strings for name
    it('shouldHandleEmptyStringsForName', () => {
        const input = newCreateSegmentInput('');
        expect(input.name).toBe('');
    });

    // Test 13: Setting empty name in update input
    it('shouldSetEmptyNameInUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        const result = withName(updateInput, '');
        
        expect(result.name).toBe('');
    });

    // Test 14: Handling different status values
    it('shouldHandleDifferentStatusValues', () => {
        const createInput = newCreateSegmentInput('Status Test');
        
        const activeResult = withStatus(createInput, StatusCode.ACTIVE);
        expect(activeResult.status).toBe(StatusCode.ACTIVE);
        
        const inactiveResult = withStatus(createInput, StatusCode.INACTIVE);
        expect(inactiveResult.status).toBe(StatusCode.INACTIVE);
        
        const pendingResult = withStatus(createInput, StatusCode.PENDING);
        expect(pendingResult.status).toBe(StatusCode.PENDING);
    });

    // Test 15: Handling complex metadata objects
    it('shouldHandleComplexMetadataObjects', () => {
        const input = newCreateSegmentInput('Complex Metadata Segment');
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

    // Test 16: Overriding existing values
    it('shouldOverrideExistingValues', () => {
        const updateInput = newUpdateSegmentInput();
        
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

    // Test 17: Creating update input with direct property assignment
    it('shouldCreateUpdateInputWithDirectPropertyAssignment', () => {
        const updateInput: UpdateSegmentInput = {};
        updateInput.name = 'Direct Assignment';
        updateInput.status = StatusCode.ACTIVE;
        updateInput.metadata = { directlyAssigned: true };
        
        expect(updateInput).toEqual({
            name: 'Direct Assignment',
            status: StatusCode.ACTIVE,
            metadata: { directlyAssigned: true }
        });
    });

    // Test 18: Setting only name in update input
    it('shouldSetOnlyNameInUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        updateInput.name = 'Only Name';
        
        expect(updateInput).toEqual({
            name: 'Only Name'
        });
        expect(updateInput.status).toBeUndefined();
        expect(updateInput.metadata).toBeUndefined();
    });

    // Test 19: Setting only status in update input
    it('shouldSetOnlyStatusInUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        updateInput.status = StatusCode.ACTIVE;
        
        expect(updateInput).toEqual({
            status: StatusCode.ACTIVE
        });
        expect(updateInput.name).toBeUndefined();
        expect(updateInput.metadata).toBeUndefined();
    });

    // Test 20: Setting only metadata in update input
    it('shouldSetOnlyMetadataInUpdateInput', () => {
        const updateInput = newUpdateSegmentInput();
        updateInput.metadata = { onlyMetadata: true };
        
        expect(updateInput).toEqual({
            metadata: { onlyMetadata: true }
        });
        expect(updateInput.name).toBeUndefined();
        expect(updateInput.status).toBeUndefined();
    });

    // Test 21: Handling long segment names
    it('shouldHandleLongSegmentNames', () => {
        const longName = 'A'.repeat(256); // 256 characters
        const input = newCreateSegmentInput(longName);
        
        expect(input.name.length).toBe(256);
        expect(input.name).toBe(longName);
    });

    // Test 22: Handling null metadata values
    it('shouldHandleNullMetadataValues', () => {
        const input = newCreateSegmentInput('Null Metadata Segment');
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

    // Test 23: Creating a segment with deletedAt timestamp
    it('shouldCreateSegmentWithDeletedAtTimestamp', () => {
        const now = new Date().toISOString();
        
        const deletedSegment: Segment = {
            id: 'seg_deleted',
            name: 'Deleted Segment',
            ledgerId: 'ldg_01',
            organizationId: 'org_01',
            status: {
                code: StatusCode.INACTIVE,
                description: 'Segment has been deleted',
                timestamp: now
            },
            createdAt: now,
            updatedAt: now,
            deletedAt: now
        };
        
        expect(deletedSegment.deletedAt).toBe(now);
        expect(deletedSegment.status.code).toBe(StatusCode.INACTIVE);
    });

    // Test 24: Handling special characters in segment names
    it('shouldHandleSpecialCharactersInSegmentNames', () => {
        const specialName = 'Segment with special chars: !@#$%^&*()';
        const input = newCreateSegmentInput(specialName);
        
        expect(input.name).toBe(specialName);
    });
});
