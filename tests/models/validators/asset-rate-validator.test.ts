import { validateUpdateAssetRateInput } from '../../../src/models/validators/asset-rate-validator';
import { UpdateAssetRateInput } from '../../../src/models/asset-rate';

const validInput: UpdateAssetRateInput = {
  from: 'BRL',
  to: 'USD',
  rate: 520,
  scale: 2,
  ttl: 3600,
  source: 'Central Bank',
  externalId: '019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f',
};

describe('validateUpdateAssetRateInput', () => {
  it('accepts the full ledger contract', () => {
    const result = validateUpdateAssetRateInput(validInput);

    expect(result.valid).toBe(true);
    expect(result.fieldErrors).toBeUndefined();
  });

  it('accepts the minimal required contract', () => {
    const result = validateUpdateAssetRateInput({ from: 'BRL', to: 'USD', rate: 1 });

    expect(result.valid).toBe(true);
  });

  it('rejects a rate of zero, which the ledger answers with 400 rate is a required field', () => {
    const result = validateUpdateAssetRateInput({ from: 'BRL', to: 'USD', rate: 0 });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.rate?.join(' ')).toMatch(/greater than zero/i);
  });

  it('rejects a negative rate', () => {
    const result = validateUpdateAssetRateInput({ from: 'BRL', to: 'USD', rate: -520 });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.rate?.join(' ')).toMatch(/greater than zero/i);
  });

  it.each(['from', 'to'] as const)('requires %s', (field) => {
    const result = validateUpdateAssetRateInput({ ...validInput, [field]: '' });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.[field]?.join(' ')).toMatch(/required/i);
  });

  it.each([
    ['from', 'B'],
    ['from', 'ABCDEFGHIJK'],
    ['to', 'U'],
    ['to', 'ABCDEFGHIJK'],
  ])('rejects %s outside 2-10 characters (%s)', (field, value) => {
    const result = validateUpdateAssetRateInput({ ...validInput, [field]: value });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.[field]?.join(' ')).toMatch(/between 2 and 10/i);
  });

  it('requires rate', () => {
    const result = validateUpdateAssetRateInput({
      from: 'BRL',
      to: 'USD',
    } as unknown as UpdateAssetRateInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.rate?.join(' ')).toMatch(/required/i);
  });

  it('rejects a fractional rate and names scale as the fix', () => {
    const result = validateUpdateAssetRateInput({ ...validInput, rate: 5.2 });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.rate?.join(' ')).toMatch(/scale/);
    expect(result.message).toContain('scale');
  });

  it.each([NaN, Infinity])('rejects a non-finite rate (%p)', (rate) => {
    const result = validateUpdateAssetRateInput({ ...validInput, rate });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.rate).toBeDefined();
  });

  it.each(['scale', 'ttl'] as const)('rejects a negative %s', (field) => {
    const result = validateUpdateAssetRateInput({ ...validInput, [field]: -1 });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.[field]?.join(' ')).toMatch(/non-negative integer/i);
  });

  it.each(['scale', 'ttl'] as const)('rejects a fractional %s', (field) => {
    const result = validateUpdateAssetRateInput({ ...validInput, [field]: 1.5 });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.[field]?.join(' ')).toMatch(/non-negative integer/i);
  });

  it('rejects a source longer than 200 characters', () => {
    const result = validateUpdateAssetRateInput({ ...validInput, source: 'x'.repeat(201) });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.source?.join(' ')).toMatch(/200/);
  });

  it('accepts a source of exactly 200 characters', () => {
    const result = validateUpdateAssetRateInput({ ...validInput, source: 'x'.repeat(200) });

    expect(result.valid).toBe(true);
  });

  it('rejects an externalId that is not a UUID', () => {
    const result = validateUpdateAssetRateInput({ ...validInput, externalId: 'not-a-uuid' });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors?.externalId?.join(' ')).toMatch(/uuid/i);
  });

  it('reports every offending field at once', () => {
    const result = validateUpdateAssetRateInput({ from: '', to: 'U', rate: 5.2, scale: -1 });

    expect(result.valid).toBe(false);
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(['from', 'rate', 'scale', 'to']);
  });
});
