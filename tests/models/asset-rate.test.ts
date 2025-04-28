import {
    AssetRate,
    createUpdateAssetRateInput,
    UpdateAssetRateInput
} from '../../src/models/asset-rate';

describe('Asset Rate Model and Helper Functions', () => {
    // Test 1: Creating an asset rate input with string dates
    it('shouldCreateAssetRateInputWithStringDates', () => {
        const effectiveAt = '2023-01-01T00:00:00Z';
        const expirationAt = '2023-01-02T00:00:00Z';
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            effectiveAt,
            expirationAt
        );
        
        expect(input).toEqual({
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt,
            expirationAt
        });
    });

    // Test 2: Creating an asset rate input with Date objects
    it('shouldCreateAssetRateInputWithDateObjects', () => {
        const effectiveDate = new Date('2023-01-01T00:00:00Z');
        const expirationDate = new Date('2023-01-02T00:00:00Z');
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            effectiveDate,
            expirationDate
        );
        
        expect(input).toEqual({
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: effectiveDate.toISOString(),
            expirationAt: expirationDate.toISOString()
        });
    });

    // Test 3: Creating an asset rate input with mixed date types
    it('shouldCreateAssetRateInputWithMixedDateTypes', () => {
        const effectiveDate = new Date('2023-01-01T00:00:00Z');
        const expirationAt = '2023-01-02T00:00:00Z';
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            effectiveDate,
            expirationAt
        );
        
        expect(input).toEqual({
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: effectiveDate.toISOString(),
            expirationAt
        });
    });

    // Test 4: Creating an asset rate input with reverse mixed date types
    it('shouldCreateAssetRateInputWithReverseMixedDateTypes', () => {
        const effectiveAt = '2023-01-01T00:00:00Z';
        const expirationDate = new Date('2023-01-02T00:00:00Z');
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            effectiveAt,
            expirationDate
        );
        
        expect(input).toEqual({
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt,
            expirationAt: expirationDate.toISOString()
        });
    });

    // Test 5: Creating an asset rate input with integer rate
    it('shouldCreateAssetRateInputWithIntegerRate', () => {
        const input = createUpdateAssetRateInput(
            'BTC',
            'USD',
            43000,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.rate).toBe(43000);
    });

    // Test 6: Creating an asset rate input with decimal rate
    it('shouldCreateAssetRateInputWithDecimalRate', () => {
        const input = createUpdateAssetRateInput(
            'ETH',
            'USD',
            2543.75,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.rate).toBe(2543.75);
    });

    // Test 7: Creating an asset rate input with very small rate
    it('shouldCreateAssetRateInputWithVerySmallRate', () => {
        const input = createUpdateAssetRateInput(
            'SHIB',
            'USD',
            0.00000912,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.rate).toBe(0.00000912);
    });

    // Test 8: Creating an asset rate input with very large rate
    it('shouldCreateAssetRateInputWithVeryLargeRate', () => {
        const largeRate = 1000000000000; // 1 trillion
        const input = createUpdateAssetRateInput(
            'USD',
            'VND',
            largeRate,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.rate).toBe(largeRate);
    });

    // Test 9: Creating an asset rate with same day effective and expiration
    it('shouldCreateAssetRateWithSameDayEffectiveAndExpiration', () => {
        const sameDay = '2023-01-01T00:00:00Z';
        const sameDayEnd = '2023-01-01T23:59:59Z';
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            sameDay,
            sameDayEnd
        );
        
        expect(input.effectiveAt).toBe(sameDay);
        expect(input.expirationAt).toBe(sameDayEnd);
    });

    // Test 10: Creating an asset rate with long-term expiration
    it('shouldCreateAssetRateWithLongTermExpiration', () => {
        const effectiveAt = '2023-01-01T00:00:00Z';
        const farFuture = '2030-01-01T00:00:00Z';
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            effectiveAt,
            farFuture
        );
        
        expect(input.effectiveAt).toBe(effectiveAt);
        expect(input.expirationAt).toBe(farFuture);
    });

    // Test 11: Creating an asset rate with special characters in asset codes
    it('shouldCreateAssetRateWithSpecialCharactersInAssetCodes', () => {
        const input = createUpdateAssetRateInput(
            'USD-TEST',
            'EUR_TEST',
            0.92,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.fromAsset).toBe('USD-TEST');
        expect(input.toAsset).toBe('EUR_TEST');
    });

    // Test 12: Creating an asset rate with lowercase asset codes
    it('shouldCreateAssetRateWithLowercaseAssetCodes', () => {
        const input = createUpdateAssetRateInput(
            'usd',
            'eur',
            0.92,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.fromAsset).toBe('usd');
        expect(input.toAsset).toBe('eur');
    });

    // Test 13: Creating an asset rate with empty asset codes
    it('shouldCreateAssetRateWithEmptyAssetCodes', () => {
        const input = createUpdateAssetRateInput(
            '',
            '',
            1.0,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.fromAsset).toBe('');
        expect(input.toAsset).toBe('');
    });

    // Test 14: Creating an asset rate with rate of 1.0
    it('shouldCreateAssetRateWithRateOfOne', () => {
        const input = createUpdateAssetRateInput(
            'USD',
            'USD',
            1.0,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.rate).toBe(1.0);
    });

    // Test 15: Creating a complete asset rate object
    it('shouldCreateCompleteAssetRateObject', () => {
        const now = new Date().toISOString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowIso = tomorrow.toISOString();
        
        const completeAssetRate: AssetRate = {
            id: 'rate_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            createdAt: now,
            updatedAt: now,
            effectiveAt: now,
            expirationAt: tomorrowIso
        };
        
        expect(completeAssetRate.id).toBe('rate_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
        expect(completeAssetRate.fromAsset).toBe('USD');
        expect(completeAssetRate.toAsset).toBe('EUR');
        expect(completeAssetRate.rate).toBe(0.92);
        expect(completeAssetRate.createdAt).toBe(now);
        expect(completeAssetRate.updatedAt).toBe(now);
        expect(completeAssetRate.effectiveAt).toBe(now);
        expect(completeAssetRate.expirationAt).toBe(tomorrowIso);
    });

    // Test 16: Creating an asset rate with current date and time
    it('shouldCreateAssetRateWithCurrentDateTime', () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            now,
            tomorrow
        );
        
        expect(input.effectiveAt).toBe(now.toISOString());
        expect(input.expirationAt).toBe(tomorrow.toISOString());
    });

    // Test 17: Creating an asset rate with millisecond precision
    it('shouldCreateAssetRateWithMillisecondPrecision', () => {
        const preciseDate = new Date('2023-01-01T00:00:00.123Z');
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            preciseDate,
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.effectiveAt).toBe('2023-01-01T00:00:00.123Z');
    });

    // Test 18: Creating an asset rate with non-standard date format
    it('shouldCreateAssetRateWithNonStandardDateFormat', () => {
        const date = new Date('January 1, 2023 00:00:00');
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            date,
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.effectiveAt).toBe(date.toISOString());
    });

    // Test 19: Creating an asset rate with same asset codes
    it('shouldCreateAssetRateWithSameAssetCodes', () => {
        const input = createUpdateAssetRateInput(
            'USD',
            'USD',
            1.0,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.fromAsset).toBe('USD');
        expect(input.toAsset).toBe('USD');
        expect(input.rate).toBe(1.0);
    });

    // Test 20: Creating an asset rate with numeric asset codes
    it('shouldCreateAssetRateWithNumericAssetCodes', () => {
        const input = createUpdateAssetRateInput(
            '123',
            '456',
            2.5,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.fromAsset).toBe('123');
        expect(input.toAsset).toBe('456');
    });

    // Test 21: Creating an asset rate with different timezones
    it('shouldCreateAssetRateWithDifferentTimezones', () => {
        // Create dates with explicit timezone offsets
        const effectiveDate = new Date('2023-01-01T00:00:00-05:00'); // EST
        const expirationDate = new Date('2023-01-02T00:00:00+01:00'); // CET
        
        const input = createUpdateAssetRateInput(
            'USD',
            'EUR',
            0.92,
            effectiveDate,
            expirationDate
        );
        
        // Date objects will be converted to UTC in ISO string
        expect(input.effectiveAt).toBe(effectiveDate.toISOString());
        expect(input.expirationAt).toBe(expirationDate.toISOString());
    });

    // Test 22: Creating an asset rate with fractional rate
    it('shouldCreateAssetRateWithFractionalRate', () => {
        const input = createUpdateAssetRateInput(
            'USD',
            'JPY',
            110.5,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.rate).toBe(110.5);
    });

    // Test 23: Verifying the structure of UpdateAssetRateInput
    it('shouldVerifyStructureOfUpdateAssetRateInput', () => {
        const input: UpdateAssetRateInput = {
            fromAsset: 'USD',
            toAsset: 'EUR',
            rate: 0.92,
            effectiveAt: '2023-01-01T00:00:00Z',
            expirationAt: '2023-01-02T00:00:00Z'
        };
        
        expect(input).toHaveProperty('fromAsset');
        expect(input).toHaveProperty('toAsset');
        expect(input).toHaveProperty('rate');
        expect(input).toHaveProperty('effectiveAt');
        expect(input).toHaveProperty('expirationAt');
    });

    // Test 24: Creating an asset rate with long asset codes
    it('shouldCreateAssetRateWithLongAssetCodes', () => {
        const longCode1 = 'VERY_LONG_ASSET_CODE_FOR_TESTING_PURPOSES_1';
        const longCode2 = 'VERY_LONG_ASSET_CODE_FOR_TESTING_PURPOSES_2';
        
        const input = createUpdateAssetRateInput(
            longCode1,
            longCode2,
            1.5,
            '2023-01-01T00:00:00Z',
            '2023-01-02T00:00:00Z'
        );
        
        expect(input.fromAsset).toBe(longCode1);
        expect(input.toAsset).toBe(longCode2);
    });
});
