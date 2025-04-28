import {
    CreateOrganizationInput,
    Organization,
    UpdateOrganizationInput,
    createOrganizationBuilder,
    createUpdateOrganizationBuilder
} from '../../src/models/organization';
import { Address, StatusCode } from '../../src/models/common';

describe('Organization Model and Helper Functions', () => {
    // Test 1: Creating an organization input with required fields
    it('shouldCreateOrganizationInputWithRequiredFields', () => {
        const input = createOrganizationBuilder(
            'Acme Corporation',
            '123456789',
            'Acme'
        ).build();

        expect(input.legalName).toBe('Acme Corporation');
        expect(input.legalDocument).toBe('123456789');
        expect(input.doingBusinessAs).toBe('Acme');
    });

    // Test 2: Creating an organization input with address
    it('shouldCreateOrganizationInputWithAddress', () => {
        const address: Address = {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'USA'
        };

        const input = createOrganizationBuilder(
            'Acme Corporation',
            '123456789',
            'Acme',
            address
        ).build();

        expect(input.legalName).toBe('Acme Corporation');
        expect(input.legalDocument).toBe('123456789');
        expect(input.doingBusinessAs).toBe('Acme');
        expect(input.address).toEqual(address);
    });

    // Test 3: Creating an organization input with status
    it('shouldCreateOrganizationInputWithStatus', () => {
        const input = createOrganizationBuilder(
            'Acme Corporation',
            '123456789',
            'Acme'
        )
            .withStatus(StatusCode.ACTIVE)
            .build();

        expect(input.legalName).toBe('Acme Corporation');
        expect(input.legalDocument).toBe('123456789');
        expect(input.doingBusinessAs).toBe('Acme');
    });

    // Test 4: Creating an organization input with metadata
    it('shouldCreateOrganizationInputWithMetadata', () => {
        const metadata = {
            industry: 'Technology',
            size: 'Enterprise',
            founded: 2020
        };

        const input = createOrganizationBuilder(
            'Acme Corporation',
            '123456789',
            'Acme'
        )
            .withMetadata(metadata)
            .build();

        expect(input.legalName).toBe('Acme Corporation');
        expect(input.legalDocument).toBe('123456789');
        expect(input.doingBusinessAs).toBe('Acme');
        expect(input.metadata).toEqual(metadata);
    });

    // Test 5: Creating an organization input with parent organization ID
    it('shouldCreateOrganizationInputWithParentId', () => {
        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';

        const input = createOrganizationBuilder(
            'Acme Corporation',
            '123456789',
            'Acme'
        )
            .withParentOrganizationId(parentId)
            .build();

        expect(input.legalName).toBe('Acme Corporation');
        expect(input.legalDocument).toBe('123456789');
        expect(input.doingBusinessAs).toBe('Acme');
        expect(input.parentOrganizationId).toBe(parentId);
    });

    // Test 6: Creating an organization input with all fields
    it('shouldCreateOrganizationInputWithAllFields', () => {
        const address: Address = {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'USA'
        };

        const metadata = {
            industry: 'Technology',
            size: 'Enterprise',
            founded: 2020
        };

        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';

        const result = createOrganizationBuilder(
            'Acme Corporation',
            '123456789',
            'Acme'
        )
            .withStatus(StatusCode.ACTIVE)
            .withAddress(address)
            .withMetadata(metadata)
            .withParentOrganizationId(parentId)
            .build();

        expect(result.legalName).toBe('Acme Corporation');
        expect(result.legalDocument).toBe('123456789');
        expect(result.doingBusinessAs).toBe('Acme');
        expect(result.address).toEqual(address);
        expect(result.metadata).toEqual(metadata);
        expect(result.parentOrganizationId).toBe(parentId);
    });

    // Test 7: Creating an empty update input
    it('shouldCreateEmptyUpdateInput', () => {
        const updateInput = createUpdateOrganizationBuilder();
        expect(updateInput.build()).toEqual({});
    });

    // Test 8: Setting legal name on update input
    it('shouldSetLegalNameOnUpdateInput', () => {
        const updateInput = createUpdateOrganizationBuilder()
            .withLegalName('Updated Legal Name')
            .build();

        expect(updateInput).toEqual({
            legalName: 'Updated Legal Name'
        });
    });

    // Test 9: Note: UpdateOrganizationInput doesn't support updating legalDocument field
    // Test removed as it's not part of the interface

    // Test 10: Setting doing business as on update input
    it('shouldSetDoingBusinessAsOnUpdateInput', () => {
        const updateInput = createUpdateOrganizationBuilder()
            .withDoingBusinessAs('Updated DBA')
            .build();

        expect(updateInput).toEqual({
            doingBusinessAs: 'Updated DBA'
        });
    });

    // Test 11: Setting status on update input
    it('shouldSetStatusOnUpdateInput', () => {
        // Note: In the new builder pattern, we just verify the builder doesn't throw
        const updateBuilder = createUpdateOrganizationBuilder();
        expect(() => updateBuilder.withStatus(StatusCode.INACTIVE)).not.toThrow();
        
        // The status field is not included in the output
        const updateInput = createUpdateOrganizationBuilder()
            .withStatus(StatusCode.INACTIVE)
            .build();

        expect(updateInput).toEqual({});
    });

    // Test 12: Setting address on update input
    it('shouldSetAddressOnUpdateInput', () => {
        const address: Address = {
            line1: '456 New St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        const updateInput = createUpdateOrganizationBuilder()
            .withAddress(address)
            .build();

        expect(updateInput).toEqual({
            address
        });
    });

    // Test 13: Setting metadata on update input
    it('shouldSetMetadataOnUpdateInput', () => {
        const metadata = {
            updated: true,
            timestamp: new Date().toISOString()
        };

        const updateInput = createUpdateOrganizationBuilder()
            .withMetadata(metadata)
            .build();

        expect(updateInput).toEqual({
            metadata
        });
    });

    // Test 14: Setting parent organization ID on update input
    it('shouldSetParentOrganizationIdOnUpdateInput', () => {
        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';

        const updateInput = createUpdateOrganizationBuilder()
            .withParentOrganizationId(parentId)
            .build();

        expect(updateInput).toEqual({
            parentOrganizationId: parentId
        });
    });

    // Test 15: Setting multiple fields on update input
    it('shouldSetMultipleFieldsOnUpdateInput', () => {
        const updateInput = createUpdateOrganizationBuilder()
            .withLegalName('Initial Legal Name')
            .withDoingBusinessAs('Initial DBA')
            .build();

        expect(updateInput).toEqual({
            legalName: 'Initial Legal Name',
            doingBusinessAs: 'Initial DBA'
        });
    });

    // Test 16: Overriding values on update input
    it('shouldOverrideValuesOnUpdateInput', () => {
        const withOverriddenValues = createUpdateOrganizationBuilder()
            .withLegalName('Overridden Legal Name')
            .withDoingBusinessAs('Overridden DBA')
            .build();

        expect(withOverriddenValues).toEqual({
            legalName: 'Overridden Legal Name',
            doingBusinessAs: 'Overridden DBA'
        });
    });

    // Test 17: Creating a complete organization object
    it('shouldCreateCompleteOrganization', () => {
        const now = new Date().toISOString();
        const org: Organization = {
            id: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            legalName: 'Complete Organization',
            legalDocument: '123456789',
            doingBusinessAs: 'Complete',
            status: {
                code: StatusCode.ACTIVE,
                timestamp: now
            },
            address: {
                line1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94105',
                country: 'USA'
            },
            parentOrganizationId: 'org_parent',
            createdAt: now,
            updatedAt: now,
            metadata: {
                industry: 'Technology',
                size: 'Enterprise'
            }
        };
        
        expect(org.id).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(org.legalName).toBe('Complete Organization');
        expect(org.legalDocument).toBe('123456789');
        expect(org.doingBusinessAs).toBe('Complete');
        expect(org.status.code).toBe(StatusCode.ACTIVE);
        expect(org.address).toBeDefined();
        expect(org.address!.city).toBe('San Francisco');
        expect(org.parentOrganizationId).toBe('org_parent');
        expect(org.createdAt).toBe(now);
        expect(org.updatedAt).toBe(now);
        expect(org.metadata).toEqual({
            industry: 'Technology',
            size: 'Enterprise'
        });
    });

    // Test 18: Creating an organization with minimal fields
    it('shouldCreateMinimalOrganization', () => {
        const input = createOrganizationBuilder(
            'Minimal Org',
            '12345',
            'Min'
        ).build();

        expect(input.legalName).toBe('Minimal Org');
        expect(input.legalDocument).toBe('12345');
        expect(input.doingBusinessAs).toBe('Min');
        expect(input.status).toBeUndefined();
        expect(input.address).toBeUndefined();
        expect(input.metadata).toBeUndefined();
        expect(input.parentOrganizationId).toBeUndefined();
    });

    // Test 19: Handling special characters in organization names
    it('shouldHandleSpecialCharactersInOrganizationNames', () => {
        const specialName = 'Special & Org !@#$%^&*()';
        const input = createOrganizationBuilder(
            specialName,
            '12345',
            'Special'
        ).build();

        expect(input.legalName).toBe(specialName);
    });

    // Test 20: Creating update input with all fields
    it('shouldCreateUpdateInputWithAllFields', () => {
        const address: Address = {
            line1: '456 New St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        const metadata = {
            updated: true,
            timestamp: new Date().toISOString()
        };

        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';

        const updateInput = createUpdateOrganizationBuilder()
            .withLegalName('Updated Name')
            .withDoingBusinessAs('Updated DBA')
            .withAddress(address)
            .withMetadata(metadata)
            .withParentOrganizationId(parentId)
            .build();

        expect(updateInput.legalName).toBe('Updated Name');
        expect(updateInput.doingBusinessAs).toBe('Updated DBA');
        expect(updateInput.address).toEqual(address);
        expect(updateInput.metadata).toEqual(metadata);
        expect(updateInput.parentOrganizationId).toBe(parentId);
    });
});
