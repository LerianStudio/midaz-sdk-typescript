/**
 * @file Client-side guards for the block, unblock and annotation endpoints
 *
 * All three take the full transaction body, and none of them honours `pending`: block
 * and unblock force it to false server-side, while on annotation it corrupts the
 * operation directions (both legs come back `CREDIT`). The TypeScript types make it
 * unrepresentable; these validators are the second line for JavaScript callers.
 */
import { BlockFundsInput } from '../../../src/models/transaction';
import {
  validateBlockFundsInput,
  validateCreateAnnotationInput,
  validateUnblockFundsInput,
} from '../../../src/models/validators/transaction-validator';

describe('label-only transaction validators', () => {
  const input: BlockFundsInput = {
    chartOfAccountsGroupName: 'BLOCKS',
    description: 'Block 100',
    send: {
      asset: 'BRL',
      value: '100',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
      distribute: { to: [{ account: 'acc-b', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  const validators = [
    ['validateBlockFundsInput', validateBlockFundsInput, 'block'],
    ['validateUnblockFundsInput', validateUnblockFundsInput, 'unblock'],
    ['validateCreateAnnotationInput', validateCreateAnnotationInput, 'annotation'],
  ] as const;

  it.each(validators)('%s accepts a well-formed full transaction', (_name, validator) => {
    expect(validator(input)).toEqual({ valid: true });
  });

  it.each(validators)('%s rejects pending, naming the endpoint', (_name, validator, endpoint) => {
    const result = validator({ ...input, pending: true } as unknown as BlockFundsInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('pending');
    expect(result.message).toContain(endpoint);
  });

  it.each(validators)('%s rejects pending even when false', (_name, validator) => {
    const result = validator({ ...input, pending: false } as unknown as BlockFundsInput);

    expect(result.valid).toBe(false);
    expect(result.message).toContain('pending');
  });

  it.each(validators)('%s accepts pending explicitly left undefined', (_name, validator) => {
    expect(validator({ ...input, pending: undefined } as unknown as BlockFundsInput).valid).toBe(
      true
    );
  });

  it.each(validators)('%s requires a source, which the ledger 400s without', (_name, validator) => {
    const result = validator({
      ...input,
      send: { asset: 'BRL', value: '100', distribute: input.send!.distribute },
    } as BlockFundsInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.source']);
  });

  it.each(validators)(
    '%s requires a distribute, which the ledger 400s without',
    (_name, validator) => {
      const result = validator({
        ...input,
        send: { asset: 'BRL', value: '100', source: input.send!.source },
      } as BlockFundsInput);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors).toHaveProperty(['send.distribute']);
    }
  );

  it.each(validators)('%s rejects a non-decimal value, naming its path', (_name, validator) => {
    const result = validator({
      ...input,
      send: {
        ...input.send!,
        source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: 'lots' } }] },
      },
    } as BlockFundsInput);

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(['send.source.from[0].amount.value']);
  });

  it.each(validators)('%s requires a send block', (_name, validator) => {
    const result = validator({ description: 'no send' } as unknown as BlockFundsInput);

    expect(result.valid).toBe(false);
  });
});
