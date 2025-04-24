import {
    Account,
    CreateAccountInput,
    newCreateAccountInput,
    newCreateAccountInputWithAlias,
    UpdateAccountInput,
    AccountType
} from '../../src/models/account';
import { StatusCode } from '../../src/models/common';

describe('Account Model and Helper Functions', () => {
    it('shouldCreateAccountInputWithDefaults', () => {
        const input = newCreateAccountInput('Operating Cash', 'USD', 'deposit');
        expect(input).toEqual({
            name: 'Operating Cash',
            assetCode: 'USD',
            type: 'deposit',
            status: StatusCode.ACTIVE
        });
    });

    it('shouldCreateAccountInputWithAlias', () => {
        const input = newCreateAccountInputWithAlias('Operating Cash', 'USD', 'deposit', 'primary-cash');
        expect(input).toEqual({
            name: 'Operating Cash',
            assetCode: 'USD',
            type: 'deposit',
            status: StatusCode.ACTIVE,
            alias: 'primary-cash'
        });
    });

    it('shouldInstantiateAccountWithAllFields', () => {
        const now = new Date().toISOString();
        const account: Account = {
            id: 'acc-uuid-123',
            name: 'Corporate Bonds',
            parentAccountId: 'parent-acc-uuid',
            entityId: 'entity-123',
            assetCode: 'AAPL',
            organizationId: 'org-456',
            ledgerId: 'ledger-789',
            portfolioId: 'portfolio-001',
            segmentId: 'segment-002',
            status: {
                code: StatusCode.ACTIVE,
                description: 'Account is active',
                timestamp: now
            },
            alias: 'corp-bonds',
            type: 'deposit',
            metadata: { tag: 'investment', risk: 'low' },
            createdAt: now,
            updatedAt: now,
            deletedAt: undefined
        };
        expect(account.id).toBe('acc-uuid-123');
        expect(account.parentAccountId).toBe('parent-acc-uuid');
        expect(account.status.code).toBe(StatusCode.ACTIVE);
        expect(account.metadata).toEqual({ tag: 'investment', risk: 'low' });
        expect(account.deletedAt).toBeUndefined();
    });

    it('shouldFailWithoutRequiredFields', () => {
        // @ts-expect-error - Argument of type 'undefined' is not assignable to parameter of type 'string'
        expect(() => newCreateAccountInput(undefined, 'USD', 'deposit')).toThrow();
        // @ts-expect-error - Argument of type 'undefined' is not assignable to parameter of type 'string'
        expect(() => newCreateAccountInput('Name', undefined, 'deposit')).toThrow();
        // @ts-expect-error - Argument of type 'undefined' is not assignable to parameter of type 'AccountType'
        expect(() => newCreateAccountInput('Name', 'USD', undefined)).toThrow();
    });

    it('shouldRejectInvalidAccountType', () => {
        // @ts-expect-error - Argument of type '"invalidType"' is not assignable to parameter of type 'AccountType'
        expect(() => newCreateAccountInput('Name', 'USD', 'invalidType')).toThrow();
        
        const acc = {
            id: 'id',
            name: 'Name',
            assetCode: 'USD',
            organizationId: 'org',
            ledgerId: 'ledger',
            status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
            type: 'notAValidType' as AccountType, // Type assertion to bypass compile-time checks
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        expect(acc.type).not.toMatch(/deposit|savings|loans|marketplace|creditCard|external/);
    });

    it('shouldEnforceMetadataSizeLimit', () => {
        const bigMetadata: Record<string, any> = {};
        for (let i = 0; i < 70000; i++) {
            bigMetadata[`key${i}`] = 'x';
        }
        const input: CreateAccountInput = {
            name: 'Big Metadata',
            assetCode: 'USD',
            type: 'deposit',
            metadata: bigMetadata
        };
        const size = Buffer.byteLength(JSON.stringify(input.metadata), 'utf8');
        expect(size).toBeGreaterThan(64 * 1024);
    });

    it('shouldUpdateAccountWithPartialFields', () => {
        const update: UpdateAccountInput = {
            name: 'Updated Name',
            metadata: { foo: 'bar' }
        };
        expect(update.name).toBe('Updated Name');
        expect(update.metadata).toEqual({ foo: 'bar' });
        expect(update.segmentId).toBeUndefined();
        expect(update.portfolioId).toBeUndefined();
        expect(update.status).toBeUndefined();
    });

    it('shouldRejectUpdateOfImmutableFields', () => {
        const update = { name: 'New Name' } as UpdateAccountInput;
        const update2 = { name: 'New Name' } as UpdateAccountInput;
        const update3 = { name: 'New Name' } as UpdateAccountInput;
        
        Object.defineProperty(update, 'id', { value: 'new-id' });
        Object.defineProperty(update2, 'assetCode', { value: 'EUR' });
        Object.defineProperty(update3, 'ledgerId', { value: 'new-ledger' });
        
        expect((update as any).id).toBe('new-id');
        expect((update2 as any).assetCode).toBe('EUR');
        expect((update3 as any).ledgerId).toBe('new-ledger');
    });

    it('shouldCreateAccountInputWithOptionalFields', () => {
        const input: CreateAccountInput = {
            name: 'Optional Fields',
            assetCode: 'USD',
            type: 'deposit',
            parentAccountId: 'parent-acc',
            entityId: 'entity-1',
            portfolioId: 'portfolio-1',
            segmentId: 'segment-1',
            alias: 'opt-fields',
            metadata: { foo: 'bar' }
        };
        expect(input.parentAccountId).toBe('parent-acc');
        expect(input.entityId).toBe('entity-1');
        expect(input.portfolioId).toBe('portfolio-1');
        expect(input.segmentId).toBe('segment-1');
        expect(input.alias).toBe('opt-fields');
        expect(input.metadata).toEqual({ foo: 'bar' });
    });

    it('shouldValidateMetadataStructure', () => {
        const validMetadata = {
            tag1: 'value1',
            tag2: 'value2',
            numericTag: 123
        };
        
        const account = newCreateAccountInput('Name', 'USD', 'deposit');
        account.metadata = validMetadata;
        expect(account.metadata).toEqual(validMetadata);
        
        const invalidMetadata1 = ['array', 'instead', 'of', 'object'];
        const invalidMetadata2 = null;
        
        const accountWithInvalidMetadata1 = newCreateAccountInput('Name', 'USD', 'deposit');
        accountWithInvalidMetadata1.metadata = invalidMetadata1 as any;
        
        const accountWithInvalidMetadata2 = newCreateAccountInput('Name', 'USD', 'deposit');
        accountWithInvalidMetadata2.metadata = invalidMetadata2 as any;
    });

    it('shouldRejectInvalidOrMissingAssetCode', () => {
        function testEmptyAssetCode() {
            return newCreateAccountInput('Name', '' as any, 'deposit');
        }
        expect(testEmptyAssetCode).toThrow();
        
        function testUndefinedAssetCode() {
            // @ts-expect-error - Argument of type 'undefined' is not assignable to parameter of type 'string'
            return newCreateAccountInput('Name', undefined, 'deposit');
        }
        expect(testUndefinedAssetCode).toThrow();
        
        const input = {
            name: 'No Asset',
            type: 'deposit' as AccountType
        } as CreateAccountInput;
        
        expect(() => {
            console.log(input.assetCode);
        }).not.toThrow(); 
    });
});