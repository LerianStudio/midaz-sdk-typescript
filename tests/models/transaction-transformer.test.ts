import {
  toApiInflow,
  toApiOutflow,
  toApiTransaction,
} from '../../src/models/transaction-transformer';
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

describe('toApiTransaction leg field parity', () => {
  const withLegFields = (extra: Record<string, any>): CreateTransactionInput => {
    const input = buildInput('100');
    Object.assign((input.send as any).source.from[0], extra);

    return input;
  };

  it('puts balanceKey on the wire', () => {
    const result = toApiTransaction(withLegFields({ balanceKey: 'asset-freeze' }));

    expect(result.send.source.from[0].balanceKey).toBe('asset-freeze');
  });

  it('puts chartOfAccounts on the wire', () => {
    const result = toApiTransaction(withLegFields({ chartOfAccounts: '1000' }));

    expect(result.send.source.from[0].chartOfAccounts).toBe('1000');
  });

  it('puts routeId on the wire', () => {
    const result = toApiTransaction(
      withLegFields({ routeId: '8dbf1c9e-3a2b-4a55-9f1e-2c0f6b7d4e11' })
    );

    expect(result.send.source.from[0].routeId).toBe('8dbf1c9e-3a2b-4a55-9f1e-2c0f6b7d4e11');
  });

  it('puts an integer share on the wire and omits the amount it replaces', () => {
    const input = buildInput('100');
    (input.send as any).distribute.to = [
      { account: 'smoke-b', share: { percentage: 60 } },
      { account: 'smoke-c', share: { percentage: 40, percentageOfPercentage: 100 } },
    ];

    const result = toApiTransaction(input);

    expect(result.send.distribute.to[0].share).toEqual({ percentage: 60 });
    expect(result.send.distribute.to[0]).not.toHaveProperty('amount');
    expect(result.send.distribute.to[1].share).toEqual({
      percentage: 40,
      percentageOfPercentage: 100,
    });
  });

  it('puts a rate on the wire with its value coerced to a decimal string', () => {
    const result = toApiTransaction(
      withLegFields({
        rate: {
          from: 'BRL',
          to: 'USD',
          value: 550,
          externalId: '00000000-0000-0000-0000-000000000000',
        },
      })
    );

    expect(result.send.source.from[0].rate).toEqual({
      from: 'BRL',
      to: 'USD',
      value: '550',
      externalId: '00000000-0000-0000-0000-000000000000',
    });
  });

  it('mirrors send.asset into an amount that omits it', () => {
    const input = buildInput('100');
    delete (input.send as any).source.from[0].amount.asset;

    const result = toApiTransaction(input);

    expect(result.send.source.from[0].amount).toEqual({ asset: 'BRL', value: '100' });
  });

  it('refuses a leg carrying remaining, which the ledger counts but never credits', () => {
    const input = withLegFields({ remaining: 'remaining' });

    expect(() => toApiTransaction(input)).toThrow(ValidationError);
    expect(() => toApiTransaction(input)).toThrow('send.source.from[0].remaining');
  });

  it('refuses an amount asset that differs from send.asset instead of letting it be ignored', () => {
    const input = buildInput('100');
    (input.send as any).distribute.to[0].amount.asset = 'USD';

    expect(() => toApiTransaction(input)).toThrow('send.distribute.to[0].amount.asset');
  });

  it('omits every leg field the caller did not supply', () => {
    const result = toApiTransaction(buildInput('100'));

    expect(result.send.source.from[0]).not.toHaveProperty('balanceKey');
    expect(result.send.source.from[0]).not.toHaveProperty('share');
    expect(result.send.source.from[0]).not.toHaveProperty('rate');
    expect(result.send.source.from[0]).not.toHaveProperty('routeId');
    expect(result.send.source.from[0]).not.toHaveProperty('chartOfAccounts');
    expect(result.send.source.from[0]).not.toHaveProperty('remaining');
  });
});

describe('toApiInflow and toApiOutflow leg field parity', () => {
  it('mirrors send.asset and carries the new leg fields on an inflow', () => {
    const result = toApiInflow({
      send: {
        asset: 'BRL',
        value: '100',
        distribute: {
          to: [{ account: 'smoke-b', amount: { value: '100' }, balanceKey: 'default' } as any],
        },
      },
    } as any);

    expect(result.send.distribute.to[0].amount).toEqual({ asset: 'BRL', value: '100' });
    expect(result.send.distribute.to[0].balanceKey).toBe('default');
  });

  it('refuses a remaining leg on an outflow', () => {
    const build = () =>
      toApiOutflow({
        send: {
          asset: 'BRL',
          value: '100',
          source: {
            from: [{ account: 'smoke-a', amount: { asset: 'BRL', value: '100' }, remaining: 'r' }],
          },
        },
      } as any);

    expect(build).toThrow('send.source.from[0].remaining');
  });
});

describe('toApiTransaction field parity', () => {
  const withFields = (extra: Partial<CreateTransactionInput>): CreateTransactionInput => ({
    ...buildInput('100'),
    ...extra,
  });

  it('puts routeId on the wire', () => {
    const result = toApiTransaction(
      withFields({ routeId: 'd389ba81-e807-4bcc-a26a-019edcd12dfc' })
    );

    expect(result.routeId).toBe('d389ba81-e807-4bcc-a26a-019edcd12dfc');
  });

  it('puts transactionDate on the wire', () => {
    const result = toApiTransaction(withFields({ transactionDate: '2025-01-02T03:04:05Z' }));

    expect(result.transactionDate).toBe('2025-01-02T03:04:05Z');
  });

  it('puts skip on the wire', () => {
    const result = toApiTransaction(withFields({ skip: { fees: true } }));

    expect(result.skip).toEqual({ fees: true });
  });

  it('puts a skip that turns everything off on the wire rather than dropping it', () => {
    const result = toApiTransaction(withFields({ skip: { fees: false, tracer: false } }));

    expect(result.skip).toEqual({ fees: false, tracer: false });
  });

  it('omits the three fields entirely when the caller supplied none', () => {
    const result = toApiTransaction(buildInput('100'));

    expect(result).not.toHaveProperty('routeId');
    expect(result).not.toHaveProperty('transactionDate');
    expect(result).not.toHaveProperty('skip');
  });

  it('keeps code on the wire even though the ledger never echoes it back', () => {
    const result = toApiTransaction(withFields({ code: 'TR-12345' }));

    expect(result.code).toBe('TR-12345');
  });
});
