import { createUpdateAssetRateInput, UpdateAssetRateInput } from '../../src/models/asset-rate';

describe('createUpdateAssetRateInput', () => {
  it('builds the minimal required triple', () => {
    const input = createUpdateAssetRateInput('BRL', 'USD', 520);

    expect(input).toEqual({ from: 'BRL', to: 'USD', rate: 520 });
  });

  it('carries every optional field through', () => {
    const externalId = '019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f';

    const input = createUpdateAssetRateInput('BRL', 'USD', 520, {
      scale: 2,
      source: 'Central Bank',
      ttl: 3600,
      externalId,
      metadata: { rateName: 'Official Exchange Rate' },
    });

    expect(input).toEqual({
      from: 'BRL',
      to: 'USD',
      rate: 520,
      scale: 2,
      source: 'Central Bank',
      ttl: 3600,
      externalId,
      metadata: { rateName: 'Official Exchange Rate' },
    });
  });

  it('omits optional keys that were not supplied rather than emitting undefined', () => {
    const input = createUpdateAssetRateInput('BRL', 'USD', 520, { scale: 2 });

    expect(Object.keys(input).sort()).toEqual(['from', 'rate', 'scale', 'to']);
  });

  it('keeps a zero scale, which is a meaningful value', () => {
    const input = createUpdateAssetRateInput('BTC', 'USD', 43000, { scale: 0, ttl: 0 });

    expect(input.scale).toBe(0);
    expect(input.ttl).toBe(0);
  });

  it('does not coerce the rate, leaving integer enforcement to the validator', () => {
    const input: UpdateAssetRateInput = createUpdateAssetRateInput('BRL', 'USD', 5.2);

    expect(input.rate).toBe(5.2);
  });
});
