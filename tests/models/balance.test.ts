import {
    Balance,
    newUpdateBalanceInput,
    UpdateBalanceInput,
    withAllowReceiving,
    withAllowSending
} from '../../src/models/balance';

describe('Balance Model and Helper Functions', () => {
    // Test 1: Creating an empty balance update input
    it('shouldCreateEmptyUpdateBalanceInput', () => {
        const updateInput = newUpdateBalanceInput();
        expect(updateInput).toEqual({});
    });

    // Test 2: Setting allowSending to true
    it('shouldSetAllowSendingToTrue', () => {
        const updateInput = newUpdateBalanceInput();
        const result = withAllowSending(updateInput, true);
        
        expect(result).toEqual({
            allowSending: true
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 3: Setting allowSending to false
    it('shouldSetAllowSendingToFalse', () => {
        const updateInput = newUpdateBalanceInput();
        const result = withAllowSending(updateInput, false);
        
        expect(result).toEqual({
            allowSending: false
        });
    });

    // Test 4: Setting allowReceiving to true
    it('shouldSetAllowReceivingToTrue', () => {
        const updateInput = newUpdateBalanceInput();
        const result = withAllowReceiving(updateInput, true);
        
        expect(result).toEqual({
            allowReceiving: true
        });
        
        // Should modify the original object (reference)
        expect(updateInput).toBe(result);
    });

    // Test 5: Setting allowReceiving to false
    it('shouldSetAllowReceivingToFalse', () => {
        const updateInput = newUpdateBalanceInput();
        const result = withAllowReceiving(updateInput, false);
        
        expect(result).toEqual({
            allowReceiving: false
        });
    });

    // Test 6: Chaining helper methods
    it('shouldSupportChainingHelperMethods', () => {
        const updateInput = newUpdateBalanceInput();
        const result = withAllowSending(
            withAllowReceiving(updateInput, true),
            false
        );
        
        expect(result).toEqual({
            allowSending: false,
            allowReceiving: true
        });
    });

    // Test 7: Overriding existing values
    it('shouldOverrideExistingValues', () => {
        const updateInput = newUpdateBalanceInput();
        
        // Set initial values
        const withInitialValues = withAllowSending(
            withAllowReceiving(updateInput, true),
            true
        );
        
        expect(withInitialValues).toEqual({
            allowSending: true,
            allowReceiving: true
        });
        
        // Override values
        const withOverriddenValues = withAllowSending(
            withAllowReceiving(updateInput, false),
            false
        );
        
        expect(withOverriddenValues).toEqual({
            allowSending: false,
            allowReceiving: false
        });
    });

    // Test 8: Creating a complete balance object
    it('shouldCreateCompleteBalanceObject', () => {
        const now = new Date().toISOString();
        const completeBalance: Balance = {
            id: 'bal_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            accountId: 'acc_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            alias: 'operating-cash',
            assetCode: 'USD',
            available: 10000,
            onHold: 500,
            scale: 100,
            version: 42,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: now,
            updatedAt: now,
            metadata: {
                lastReconciled: now
            }
        };
        
        expect(completeBalance.id).toBe('bal_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeBalance.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeBalance.ledgerId).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeBalance.accountId).toBe('acc_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeBalance.alias).toBe('operating-cash');
        expect(completeBalance.assetCode).toBe('USD');
        expect(completeBalance.available).toBe(10000);
        expect(completeBalance.onHold).toBe(500);
        expect(completeBalance.scale).toBe(100);
        expect(completeBalance.version).toBe(42);
        expect(completeBalance.accountType).toBe('ASSET');
        expect(completeBalance.allowSending).toBe(true);
        expect(completeBalance.allowReceiving).toBe(true);
        expect(completeBalance.createdAt).toBe(now);
        expect(completeBalance.updatedAt).toBe(now);
        expect(completeBalance.metadata).toEqual({ lastReconciled: now });
    });

    // Test 9: Creating a balance with minimum required fields
    it('shouldCreateBalanceWithMinimumRequiredFields', () => {
        const now = new Date().toISOString();
        const minimalBalance: Balance = {
            id: 'bal_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            accountId: 'acc_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            alias: 'minimal-balance',
            assetCode: 'USD',
            available: 0,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: now,
            updatedAt: now
        };
        
        expect(minimalBalance.metadata).toBeUndefined();
    });

    // Test 10: Calculating monetary values from scaled integers
    it('shouldCalculateMonetaryValuesFromScaledIntegers', () => {
        const balance: Balance = {
            id: 'bal_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            accountId: 'acc_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            alias: 'scaled-balance',
            assetCode: 'USD',
            available: 10000,
            onHold: 500,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Calculate monetary values
        const availableAmount = balance.available / balance.scale;
        const onHoldAmount = balance.onHold / balance.scale;
        const totalAmount = (balance.available + balance.onHold) / balance.scale;
        
        expect(availableAmount).toBe(100);
        expect(onHoldAmount).toBe(5);
        expect(totalAmount).toBe(105);
    });

    // Test 11: Handling different scale values
    it('shouldHandleDifferentScaleValues', () => {
        // Scale 1 (whole numbers)
        const wholeNumberBalance: Balance = {
            id: 'bal_scale1',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'whole-numbers',
            assetCode: 'WHOLE',
            available: 100,
            onHold: 50,
            scale: 1,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Scale 100 (2 decimal places)
        const twoDecimalBalance: Balance = {
            id: 'bal_scale100',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'two-decimals',
            assetCode: 'USD',
            available: 12345,
            onHold: 6789,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Scale 1000000 (6 decimal places)
        const sixDecimalBalance: Balance = {
            id: 'bal_scale1000000',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'six-decimals',
            assetCode: 'BTC',
            available: 123456789,
            onHold: 987654321,
            scale: 1000000,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Calculate monetary values
        expect(wholeNumberBalance.available / wholeNumberBalance.scale).toBe(100);
        expect(twoDecimalBalance.available / twoDecimalBalance.scale).toBe(123.45);
        expect(sixDecimalBalance.available / sixDecimalBalance.scale).toBe(123.456789);
    });

    // Test 12: Handling zero values
    it('shouldHandleZeroValues', () => {
        const zeroBalance: Balance = {
            id: 'bal_zero',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'zero-balance',
            assetCode: 'USD',
            available: 0,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(zeroBalance.available).toBe(0);
        expect(zeroBalance.onHold).toBe(0);
        expect(zeroBalance.available / zeroBalance.scale).toBe(0);
        expect(zeroBalance.onHold / zeroBalance.scale).toBe(0);
        expect((zeroBalance.available + zeroBalance.onHold) / zeroBalance.scale).toBe(0);
    });

    // Test 13: Handling negative values
    it('shouldHandleNegativeValues', () => {
        const negativeBalance: Balance = {
            id: 'bal_negative',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'negative-balance',
            assetCode: 'USD',
            available: -5000,
            onHold: 1000,
            scale: 100,
            version: 1,
            accountType: 'LIABILITY',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(negativeBalance.available / negativeBalance.scale).toBe(-50);
        expect(negativeBalance.onHold / negativeBalance.scale).toBe(10);
        expect((negativeBalance.available + negativeBalance.onHold) / negativeBalance.scale).toBe(-40);
    });

    // Test 14: Handling large integer values
    it('shouldHandleLargeIntegerValues', () => {
        const largeBalance: Balance = {
            id: 'bal_large',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'large-balance',
            assetCode: 'USD',
            available: 9007199254740991, // MAX_SAFE_INTEGER
            onHold: 1000000000000,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(largeBalance.available).toBe(9007199254740991);
        expect(largeBalance.onHold).toBe(1000000000000);
        
        // Calculate monetary values (these will be very large numbers)
        const availableAmount = largeBalance.available / largeBalance.scale;
        const onHoldAmount = largeBalance.onHold / largeBalance.scale;
        
        expect(availableAmount).toBe(90071992547409.91);
        expect(onHoldAmount).toBe(10000000000);
    });

    // Test 15: Creating an update input with direct property assignment
    it('shouldCreateUpdateInputWithDirectPropertyAssignment', () => {
        const updateInput: UpdateBalanceInput = {};
        updateInput.allowSending = true;
        updateInput.allowReceiving = false;
        
        expect(updateInput).toEqual({
            allowSending: true,
            allowReceiving: false
        });
    });

    // Test 16: Setting only allowSending in update input
    it('shouldSetOnlyAllowSendingInUpdateInput', () => {
        const updateInput = newUpdateBalanceInput();
        updateInput.allowSending = true;
        
        expect(updateInput).toEqual({
            allowSending: true
        });
        expect(updateInput.allowReceiving).toBeUndefined();
    });

    // Test 17: Setting only allowReceiving in update input
    it('shouldSetOnlyAllowReceivingInUpdateInput', () => {
        const updateInput = newUpdateBalanceInput();
        updateInput.allowReceiving = true;
        
        expect(updateInput).toEqual({
            allowReceiving: true
        });
        expect(updateInput.allowSending).toBeUndefined();
    });

    // Test 18: Testing different account types
    it('shouldSupportDifferentAccountTypes', () => {
        const assetBalance: Balance = {
            id: 'bal_asset',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'asset-balance',
            assetCode: 'USD',
            available: 1000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const liabilityBalance: Balance = {
            id: 'bal_liability',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'liability-balance',
            assetCode: 'USD',
            available: -2000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'LIABILITY',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const equityBalance: Balance = {
            id: 'bal_equity',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'equity-balance',
            assetCode: 'USD',
            available: 5000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'EQUITY',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(assetBalance.accountType).toBe('ASSET');
        expect(liabilityBalance.accountType).toBe('LIABILITY');
        expect(equityBalance.accountType).toBe('EQUITY');
    });

    // Test 19: Testing balance with complex metadata
    it('shouldSupportComplexMetadata', () => {
        const balanceWithMetadata: Balance = {
            id: 'bal_metadata',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'metadata-balance',
            assetCode: 'USD',
            available: 1000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                lastReconciled: new Date().toISOString(),
                tags: ['primary', 'operating', 'cash'],
                limits: {
                    daily: 10000,
                    monthly: 100000
                },
                owner: {
                    id: 'user_123',
                    name: 'John Doe',
                    email: 'john@example.com'
                }
            }
        };
        
        expect(balanceWithMetadata.metadata).toBeDefined();
        expect(Array.isArray(balanceWithMetadata.metadata!.tags)).toBe(true);
        expect(balanceWithMetadata.metadata!.tags.length).toBe(3);
        expect(balanceWithMetadata.metadata!.limits.daily).toBe(10000);
        expect(balanceWithMetadata.metadata!.owner.name).toBe('John Doe');
    });

    // Test 20: Testing balance version increments
    it('shouldHandleVersionIncrements', () => {
        // Create initial balance
        const initialBalance: Balance = {
            id: 'bal_version',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'version-balance',
            assetCode: 'USD',
            available: 1000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Simulate a balance update (e.g., after a transaction)
        const updatedBalance: Balance = {
            ...initialBalance,
            available: 1500,
            version: initialBalance.version + 1,
            updatedAt: new Date().toISOString()
        };
        
        // Simulate another balance update
        const finalBalance: Balance = {
            ...updatedBalance,
            available: 1200,
            onHold: 300,
            version: updatedBalance.version + 1,
            updatedAt: new Date().toISOString()
        };
        
        expect(initialBalance.version).toBe(1);
        expect(updatedBalance.version).toBe(2);
        expect(finalBalance.version).toBe(3);
        
        // Verify that the available and onHold amounts were updated correctly
        expect(initialBalance.available).toBe(1000);
        expect(initialBalance.onHold).toBe(0);
        
        expect(updatedBalance.available).toBe(1500);
        expect(updatedBalance.onHold).toBe(0);
        
        expect(finalBalance.available).toBe(1200);
        expect(finalBalance.onHold).toBe(300);
        
        // The total should remain the same between the second and third updates
        const totalUpdated = updatedBalance.available / updatedBalance.scale;
        const totalFinal = (finalBalance.available + finalBalance.onHold) / finalBalance.scale;
        
        expect(totalUpdated).toBe(15);
        expect(totalFinal).toBe(15);
    });

    // Test 21: Testing balance with locked sending/receiving
    it('shouldHandleLockedSendingAndReceiving', () => {
        const lockedBalance: Balance = {
            id: 'bal_locked',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'locked-balance',
            assetCode: 'USD',
            available: 1000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: false,
            allowReceiving: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(lockedBalance.allowSending).toBe(false);
        expect(lockedBalance.allowReceiving).toBe(false);
    });

    // Test 22: Testing balance with mixed sending/receiving permissions
    it('shouldHandleMixedSendingAndReceivingPermissions', () => {
        const depositOnlyBalance: Balance = {
            id: 'bal_deposit_only',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'deposit-only-balance',
            assetCode: 'USD',
            available: 1000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: false,
            allowReceiving: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const withdrawOnlyBalance: Balance = {
            id: 'bal_withdraw_only',
            organizationId: 'org_id',
            ledgerId: 'ldg_id',
            accountId: 'acc_id',
            alias: 'withdraw-only-balance',
            assetCode: 'USD',
            available: 1000,
            onHold: 0,
            scale: 100,
            version: 1,
            accountType: 'ASSET',
            allowSending: true,
            allowReceiving: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        expect(depositOnlyBalance.allowSending).toBe(false);
        expect(depositOnlyBalance.allowReceiving).toBe(true);
        
        expect(withdrawOnlyBalance.allowSending).toBe(true);
        expect(withdrawOnlyBalance.allowReceiving).toBe(false);
    });
});
