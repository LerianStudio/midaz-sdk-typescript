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
});
