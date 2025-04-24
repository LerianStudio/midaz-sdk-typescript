import {
    Organization,
    CreateOrganizationInput,
    UpdateOrganizationInput,
    newCreateOrganizationInput,
    newUpdateOrganizationInput,
    withStatus,
    withAddress,
    withMetadata,
    withParentOrganizationId,
    withLegalName,
    withDoingBusinessAs
} from '../../src/models/organization';
import { Address, StatusCode } from '../../src/models/common';

describe('Organization Model and Helper Functions', () => {
    // Test 1: Creating an organization input with required fields
    it('shouldCreateOrganizationInputWithRequiredFields', () => {
        const input = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
        expect(input).toEqual({
            legalName: 'Acme Corporation',
            legalDocument: '123456789',
            doingBusinessAs: 'Acme',
            address: {
                line1: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            }
        });
    });

    // Test 2: Creating an organization input with custom address
    it('shouldCreateOrganizationInputWithCustomAddress', () => {
        const address: Address = {
            line1: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const input = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme',
            address
        );
        
        expect(input).toEqual({
            legalName: 'Acme Corporation',
            legalDocument: '123456789',
            doingBusinessAs: 'Acme',
            address
        });
    });

    // Test 3: Creating an empty update organization input
    it('shouldCreateEmptyUpdateOrganizationInput', () => {
        const updateInput = newUpdateOrganizationInput();
        expect(updateInput).toEqual({});
    });

    // Test 4: Setting legal name on update input
    it('shouldSetLegalNameOnUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        const result = withLegalName(updateInput, 'Acme Global Corporation');
        
        expect(result).toEqual({
            legalName: 'Acme Global Corporation'
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 5: Setting doing business as on update input
    it('shouldSetDoingBusinessAsOnUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        const result = withDoingBusinessAs(updateInput, 'Acme Global');
        
        expect(result).toEqual({
            doingBusinessAs: 'Acme Global'
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 6: Setting status on update input
    it('shouldSetStatusOnUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        const result = withStatus(updateInput, StatusCode.ACTIVE);
        
        expect(result).toEqual({
            status: StatusCode.ACTIVE
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 7: Setting address on update input
    it('shouldSetAddressOnUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        const address: Address = {
            line1: '456 Market Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const result = withAddress(updateInput, address);
        
        expect(result).toEqual({
            address
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 8: Setting metadata on update input
    it('shouldSetMetadataOnUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        const metadata = {
            industry: 'Technology',
            employeeCount: 500,
            website: 'https://acme.example.com'
        };
        
        const result = withMetadata(updateInput, metadata);
        
        expect(result).toEqual({
            metadata
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 9: Setting parent organization ID on update input
    it('shouldSetParentOrganizationIdOnUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';
        
        const result = withParentOrganizationId(updateInput, parentId);
        
        expect(result).toEqual({
            parentOrganizationId: parentId
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 10: Setting address on create input
    it('shouldSetAddressOnCreateInput', () => {
        const createInput = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
        const address: Address = {
            line1: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const result = withAddress(createInput, address);
        
        expect(result.address).toEqual(address);
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 11: Setting metadata on create input
    it('shouldSetMetadataOnCreateInput', () => {
        const createInput = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
        const metadata = {
            industry: 'Technology',
            employeeCount: 500,
            website: 'https://acme.example.com'
        };
        
        const result = withMetadata(createInput, metadata);
        
        expect(result.metadata).toEqual(metadata);
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 12: Setting parent organization ID on create input
    it('shouldSetParentOrganizationIdOnCreateInput', () => {
        const createInput = newCreateOrganizationInput(
            'Acme Subsidiary',
            '987654321',
            'Acme Sub'
        );
        
        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';
        
        const result = withParentOrganizationId(createInput, parentId);
        
        expect(result.parentOrganizationId).toEqual(parentId);
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 13: Setting status on create input
    it('shouldSetStatusOnCreateInput', () => {
        const createInput = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
        const result = withStatus(createInput, StatusCode.PENDING);
        
        expect(result.status).toEqual(StatusCode.PENDING);
        
        // Should modify the original object (reference)
        expect(createInput).toBe(result);
    });

    // Test 14: Chaining helper methods for update input
    it('shouldSupportChainingHelperMethodsForUpdateInput', () => {
        const updateInput = newUpdateOrganizationInput();
        
        const address: Address = {
            line1: '456 Market Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const metadata = {
            industry: 'Technology',
            employeeCount: 750
        };
        
        const result = withLegalName(
            withDoingBusinessAs(
                withAddress(
                    withMetadata(
                        withStatus(updateInput, StatusCode.ACTIVE),
                        metadata
                    ),
                    address
                ),
                'Acme Global'
            ),
            'Acme Global Corporation'
        );
        
        expect(result).toEqual({
            legalName: 'Acme Global Corporation',
            doingBusinessAs: 'Acme Global',
            status: StatusCode.ACTIVE,
            address,
            metadata
        });
    });

    // Test 15: Chaining helper methods for create input
    it('shouldSupportChainingHelperMethodsForCreateInput', () => {
        const createInput = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
        const address: Address = {
            line1: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const metadata = {
            industry: 'Technology',
            employeeCount: 500
        };
        
        const parentId = 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S';
        
        const result = withParentOrganizationId(
            withMetadata(
                withAddress(
                    withStatus(createInput, StatusCode.ACTIVE),
                    address
                ),
                metadata
            ),
            parentId
        );
        
        expect(result).toEqual({
            legalName: 'Acme Corporation',
            legalDocument: '123456789',
            doingBusinessAs: 'Acme',
            status: StatusCode.ACTIVE,
            address,
            metadata,
            parentOrganizationId: parentId
        });
    });

    // Test 16: Creating a complete organization object
    it('shouldCreateCompleteOrganizationObject', () => {
        const now = new Date().toISOString();
        
        const address: Address = {
            line1: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const metadata = {
            industry: 'Technology',
            website: 'https://acme.example.com'
        };
        
        const completeOrg: Organization = {
            id: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            legalName: 'Acme Corporation',
            legalDocument: '123456789',
            doingBusinessAs: 'Acme',
            status: {
                code: StatusCode.ACTIVE,
                description: 'Organization is active and operational',
                timestamp: now
            },
            address,
            createdAt: now,
            updatedAt: now,
            metadata
        };
        
        expect(completeOrg.id).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeOrg.legalName).toBe('Acme Corporation');
        expect(completeOrg.legalDocument).toBe('123456789');
        expect(completeOrg.doingBusinessAs).toBe('Acme');
        expect(completeOrg.status.code).toBe(StatusCode.ACTIVE);
        expect(completeOrg.status.description).toBe('Organization is active and operational');
        expect(completeOrg.address).toEqual(address);
        expect(completeOrg.createdAt).toBe(now);
        expect(completeOrg.updatedAt).toBe(now);
        expect(completeOrg.metadata).toEqual(metadata);
    });

    // Test 17: Creating an organization with parent organization ID
    it('shouldCreateOrganizationWithParentOrganizationId', () => {
        const now = new Date().toISOString();
        
        const parentOrg: Organization = {
            id: 'org_parent',
            legalName: 'Parent Corporation',
            legalDocument: '123456789',
            doingBusinessAs: 'Parent',
            status: {
                code: StatusCode.ACTIVE,
                timestamp: now
            },
            address: {
                line1: '123 Main Street',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94105',
                country: 'US'
            },
            createdAt: now,
            updatedAt: now
        };
        
        const childOrg: Organization = {
            id: 'org_child',
            legalName: 'Child Corporation',
            legalDocument: '987654321',
            doingBusinessAs: 'Child',
            parentOrganizationId: parentOrg.id,
            status: {
                code: StatusCode.ACTIVE,
                timestamp: now
            },
            address: {
                line1: '456 Market Street',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94105',
                country: 'US'
            },
            createdAt: now,
            updatedAt: now
        };
        
        expect(childOrg.parentOrganizationId).toBe(parentOrg.id);
    });

    // Test 18: Handling empty strings for required fields
    it('shouldHandleEmptyStringsForRequiredFields', () => {
        const input = newCreateOrganizationInput('', '', '');
        
        expect(input.legalName).toBe('');
        expect(input.legalDocument).toBe('');
        expect(input.doingBusinessAs).toBe('');
    });

    // Test 19: Handling special characters in organization names
    it('shouldHandleSpecialCharactersInOrganizationNames', () => {
        const specialLegalName = 'Acme & Co. (Special) Chars: !@#$%^&*()';
        const specialDBA = 'Acme & Co. !@#';
        
        const input = newCreateOrganizationInput(
            specialLegalName,
            '123456789',
            specialDBA
        );
        
        expect(input.legalName).toBe(specialLegalName);
        expect(input.doingBusinessAs).toBe(specialDBA);
    });

    // Test 20: Handling complex metadata objects
    it('shouldHandleComplexMetadataObjects', () => {
        const input = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
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

    // Test 21: Overriding existing values
    it('shouldOverrideExistingValues', () => {
        const updateInput = newUpdateOrganizationInput();
        
        // Set initial values
        const withInitialValues = withLegalName(
            withDoingBusinessAs(
                withStatus(updateInput, StatusCode.ACTIVE),
                'Initial DBA'
            ),
            'Initial Legal Name'
        );
        
        expect(withInitialValues).toEqual({
            legalName: 'Initial Legal Name',
            doingBusinessAs: 'Initial DBA',
            status: StatusCode.ACTIVE
        });
        
        // Override values
        const withOverriddenValues = withLegalName(
            withDoingBusinessAs(
                withStatus(updateInput, StatusCode.INACTIVE),
                'Overridden DBA'
            ),
            'Overridden Legal Name'
        );
        
        expect(withOverriddenValues).toEqual({
            legalName: 'Overridden Legal Name',
            doingBusinessAs: 'Overridden DBA',
            status: StatusCode.INACTIVE
        });
    });

    // Test 22: Creating update input with direct property assignment
    it('shouldCreateUpdateInputWithDirectPropertyAssignment', () => {
        const updateInput: UpdateOrganizationInput = {};
        
        updateInput.legalName = 'Direct Legal Name';
        updateInput.doingBusinessAs = 'Direct DBA';
        updateInput.status = StatusCode.ACTIVE;
        updateInput.metadata = { directlyAssigned: true };
        
        expect(updateInput).toEqual({
            legalName: 'Direct Legal Name',
            doingBusinessAs: 'Direct DBA',
            status: StatusCode.ACTIVE,
            metadata: { directlyAssigned: true }
        });
    });

    // Test 23: Handling complex address objects
    it('shouldHandleComplexAddressObjects', () => {
        const input = newCreateOrganizationInput(
            'Acme Corporation',
            '123456789',
            'Acme'
        );
        
        const complexAddress: Address = {
            line1: '123 Main Street',
            line2: 'Suite 456',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'US'
        };
        
        const result = withAddress(input, complexAddress);
        
        expect(result.address).toEqual(complexAddress);
        expect(result.address!.line2).toBe('Suite 456');
    });
});
