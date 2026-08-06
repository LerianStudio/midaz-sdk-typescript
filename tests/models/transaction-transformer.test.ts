import { toApiTransaction } from '../../src/models/transaction-transformer';
import { CreateTransactionInput } from '../../src/models/transaction';
import { ValidationError } from '../../src/util/validation';

const buildInput = (
  sendValue: any,
  fromValue: any = sendValue,
  toValue: any = sendValue
): CreateTransactionInput =>
  ({
    chartOfAccountsGroupName: 'group',
    description: 'transfer',
    send: {
      asset: 'BRL',
      value: sendValue,
      source: {
        from: [{ account: 'smoke-a', amount: { asset: 'BRL', value: fromValue } }],
      },
      distribute: {
        to: [{ account: 'smoke-b', amount: { asset: 'BRL', value: toValue } }],
      },
    },
  }) as CreateTransactionInput;

describe('toApiTransaction decimal value handling', () => {
  it('passes a valid decimal string through unchanged', () => {
    const result = toApiTransaction(buildInput('100.50'));

    expect(result.send.value).toBe('100.50');
    expect(result.send.source.from[0].amount.value).toBe('100.50');
    expect(result.send.distribute.to[0].amount.value).toBe('100.50');
  });

  it('serializes an integer number as a decimal string', () => {
    const result = toApiTransaction(buildInput(100));

    expect(result.send.value).toBe('100');
    expect(result.send.source.from[0].amount.value).toBe('100');
    expect(result.send.distribute.to[0].amount.value).toBe('100');
  });

  it('serializes a float with an exact representation as a decimal string', () => {
    const result = toApiTransaction(buildInput(0.5));

    expect(result.send.value).toBe('0.5');
    expect(result.send.source.from[0].amount.value).toBe('0.5');
  });

  it('keeps the asset and account transformation intact while coercing', () => {
    const result = toApiTransaction(buildInput(1));

    expect(result.send.asset).toBe('BRL');
    expect(result.send.source.from[0].accountAlias).toBe('smoke-a');
    expect(result.send.distribute.to[0].accountAlias).toBe('smoke-b');
  });

  it('rebuilds each operation amount without dropping the asset the ledger requires', () => {
    const result = toApiTransaction(buildInput(1));

    expect(result.send.source.from[0].amount).toEqual({ asset: 'BRL', value: '1' });
    expect(result.send.distribute.to[0].amount).toEqual({ asset: 'BRL', value: '1' });
  });

  it('carries every other operation amount field through the rebuild', () => {
    const input = buildInput('10');
    (input.send as any).source.from[0].amount.scale = 2;
    (input.send as any).distribute.to[0].amount.scale = 2;

    const result = toApiTransaction(input);

    expect(result.send.source.from[0].amount).toEqual({ asset: 'BRL', scale: 2, value: '10' });
    expect(result.send.distribute.to[0].amount).toEqual({ asset: 'BRL', scale: 2, value: '10' });
  });

  it('rejects NaN naming the offending path', () => {
    expect(() => toApiTransaction(buildInput(Number.NaN))).toThrow(ValidationError);
    expect(() => toApiTransaction(buildInput(Number.NaN))).toThrow('send.value');
  });

  it('rejects Infinity naming the offending path', () => {
    expect(() => toApiTransaction(buildInput(Number.POSITIVE_INFINITY))).toThrow('send.value');
  });

  it('rejects a number beyond the safe integer range', () => {
    expect(() => toApiTransaction(buildInput(Number.MAX_SAFE_INTEGER + 2))).toThrow('send.value');
  });

  it('rejects a number that only serializes in exponent notation', () => {
    expect(() => toApiTransaction(buildInput(1e21))).toThrow('send.value');
  });

  it('rejects a non-numeric string', () => {
    expect(() => toApiTransaction(buildInput('abc'))).toThrow('send.value');
  });

  it('names the exact source path of the offending nested value', () => {
    const input = buildInput('10');
    (input.send as any).source.from.push({
      account: 'smoke-c',
      amount: { asset: 'BRL', value: Number.NaN },
    });

    expect(() => toApiTransaction(input)).toThrow('send.source.from[1].amount.value');
  });

  it('names the exact distribute path of the offending nested value', () => {
    const input = buildInput('10', '10', 'not-a-number');

    expect(() => toApiTransaction(input)).toThrow('send.distribute.to[0].amount.value');
  });

  it('rejects a value that is neither string nor number', () => {
    const input = buildInput('10', { amount: 10 } as any);

    expect(() => toApiTransaction(input)).toThrow('send.source.from[0].amount.value');
  });

  it('exposes the offending path in the validation error field errors', () => {
    expect.assertions(2);

    try {
      toApiTransaction(buildInput('10', '10', Number.NaN));
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toHaveProperty([
        'send.distribute.to[0].amount.value',
      ]);
    }
  });
});
