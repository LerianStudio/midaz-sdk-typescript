/**
 * @file Validation of UpdateTransactionInput, the body of PATCH .../transactions/{id}
 *
 * Verified live against midaz main @33cb93f: the endpoint accepts only
 * `{description?, metadata?}` (any other key is 400/0053) and refuses a description
 * longer than 256 characters with 400/0047.
 */
import { validateUpdateTransactionInput } from '../../../src/models/validators/transaction-validator';

describe('validateUpdateTransactionInput', () => {
  it('accepts an empty body, which the ledger treats as a no-op', () => {
    expect(validateUpdateTransactionInput({}).valid).toBe(true);
  });

  it('accepts a description and a metadata patch together', () => {
    const result = validateUpdateTransactionInput({
      description: 'patched desc',
      metadata: { only: 'this' },
    });

    expect(result.valid).toBe(true);
  });

  it('accepts a description of exactly 256 characters', () => {
    expect(validateUpdateTransactionInput({ description: 'y'.repeat(256) }).valid).toBe(true);
  });

  it('rejects a description of 257 characters, which the ledger answers 400/0047', () => {
    const result = validateUpdateTransactionInput({ description: 'x'.repeat(257) });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('description');
    expect(result.message).toContain('256');
  });

  it('rejects a key outside the two the endpoint accepts, naming it', () => {
    const result = validateUpdateTransactionInput({ externalId: 'ext-1' } as any);

    expect(result.valid).toBe(false);
    expect(result.message).toContain('externalId');
  });

  it('rejects a missing input', () => {
    const result = validateUpdateTransactionInput(undefined as any);

    expect(result.valid).toBe(false);
  });

  it('rejects metadata whose key exceeds the shared metadata limit', () => {
    const result = validateUpdateTransactionInput({ metadata: { ['k'.repeat(200)]: 'v' } });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('metadata');
  });
});
