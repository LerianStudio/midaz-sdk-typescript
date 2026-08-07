/**
 * @file Client-side guards for the single-sided flow endpoints
 *
 * The TypeScript types already make the forbidden sub-object unrepresentable; these
 * validators are the second line for JavaScript callers, who reach the wire otherwise
 * and get an opaque 400/0053 back from midaz.
 */
import { CreateInflowInput, CreateOutflowInput } from '../../../src/models/transaction';
import {
  validateCreateInflowInput,
  validateCreateOutflowInput,
} from '../../../src/models/validators/transaction-validator';

describe('validateCreateInflowInput', () => {
  const input: CreateInflowInput = {
    description: 'Deposit',
    send: {
      asset: 'BRL',
      value: '100',
      distribute: { to: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  it('accepts a well-formed inflow', () => {
    expect(validateCreateInflowInput(input)).toEqual({ valid: true });
  });

  it('rejects a source, naming the field', () => {
    const result = validateCreateInflowInput({
      ...input,
      send: { ...input.send, source: { from: [] } },
    } as unknown as CreateInflowInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.source']);
    expect(result.message).toContain('send.source');
  });

  it('rejects pending, which the inflow endpoint does not accept', () => {
    const result = validateCreateInflowInput({
      ...input,
      pending: true,
    } as unknown as CreateInflowInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('pending');
    expect(result.message).toContain('pending');
  });

  it('accepts pending explicitly left undefined', () => {
    expect(
      validateCreateInflowInput({ ...input, pending: undefined } as unknown as CreateInflowInput)
        .valid
    ).toBe(true);
  });

  it('requires a send block', () => {
    const result = validateCreateInflowInput({
      description: 'Deposit',
    } as unknown as CreateInflowInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('send');
  });

  it('requires at least one destination', () => {
    const result = validateCreateInflowInput({
      ...input,
      send: { asset: 'BRL', value: '100', distribute: { to: [] } },
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.distribute.to']);
  });

  it('rejects a non-decimal leg value, naming its path', () => {
    const result = validateCreateInflowInput({
      ...input,
      send: {
        asset: 'BRL',
        value: '100',
        distribute: { to: [{ account: 'acc-a', amount: { asset: 'BRL', value: 'abc' } }] },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.distribute.to[0].amount.value']);
  });

  it('rejects a description over 256 characters, as the ledger does with 0047', () => {
    const result = validateCreateInflowInput({ ...input, description: 'd'.repeat(257) });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('description');
  });

  it('accepts a description of exactly 256 characters', () => {
    expect(validateCreateInflowInput({ ...input, description: 'd'.repeat(256) }).valid).toBe(true);
  });

  it('rejects a chartOfAccountsGroupName over 256 characters', () => {
    const result = validateCreateInflowInput({
      ...input,
      chartOfAccountsGroupName: 'c'.repeat(257),
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('chartOfAccountsGroupName');
  });

  it('rejects a code over 100 characters', () => {
    const result = validateCreateInflowInput({ ...input, code: 'c'.repeat(101) });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('code');
  });

  it('rejects a non-UUID routeId', () => {
    const result = validateCreateInflowInput({ ...input, routeId: 'not-a-uuid' });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('routeId');
  });

  it('accepts a UUID routeId', () => {
    expect(
      validateCreateInflowInput({ ...input, routeId: '8dbf1c9e-3a2b-4a55-9f1e-2c0f6b7d4e11' }).valid
    ).toBe(true);
  });

  it('requires send.asset, which the leg asset comparison silently skips without', () => {
    const result = validateCreateInflowInput({
      ...input,
      send: {
        value: '100',
        distribute: { to: [{ account: 'acc-a', amount: { asset: 'USD', value: '100' } }] },
      },
    } as unknown as CreateInflowInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.asset']);
  });
});

describe('validateCreateOutflowInput', () => {
  const input: CreateOutflowInput = {
    description: 'Withdrawal',
    send: {
      asset: 'BRL',
      value: '40',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '40' } }] },
    },
  };

  it('accepts a well-formed outflow', () => {
    expect(validateCreateOutflowInput(input)).toEqual({ valid: true });
  });

  it('accepts pending, which the outflow endpoint supports', () => {
    expect(validateCreateOutflowInput({ ...input, pending: true })).toEqual({ valid: true });
  });

  it('rejects a distribute, naming the field', () => {
    const result = validateCreateOutflowInput({
      ...input,
      send: { ...input.send, distribute: { to: [] } },
    } as unknown as CreateOutflowInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.distribute']);
    expect(result.message).toContain('send.distribute');
  });

  it('requires at least one source', () => {
    const result = validateCreateOutflowInput({
      ...input,
      send: { asset: 'BRL', value: '40', source: { from: [] } },
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.source.from']);
  });

  it('rejects a non-decimal send value, naming its path', () => {
    const result = validateCreateOutflowInput({
      ...input,
      send: { ...input.send, value: 'abc' },
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.value']);
  });

  it('rejects a code over 100 characters, as the ledger does with 0047', () => {
    const result = validateCreateOutflowInput({ ...input, code: 'c'.repeat(101) });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('code');
  });

  it('rejects a description over 256 characters', () => {
    const result = validateCreateOutflowInput({ ...input, description: 'd'.repeat(257) });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('description');
  });

  it('rejects a non-UUID routeId', () => {
    const result = validateCreateOutflowInput({ ...input, routeId: 'not-a-uuid' });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('routeId');
  });

  it('requires send.asset', () => {
    const result = validateCreateOutflowInput({
      ...input,
      send: {
        value: '40',
        source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '40' } }] },
      },
    } as unknown as CreateOutflowInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.asset']);
  });
});
