/**
 * @file Wire shape of the single-sided flow endpoints
 *
 * `POST /transactions/inflow` takes `{asset, value, distribute}` and `POST
 * /transactions/outflow` takes `{asset, value, source}`. Body decoding is strict on
 * midaz main @33cb93f, so any field the Go input struct does not declare comes back
 * as 400/0053 — the transformers must emit an allowlist, never a spread.
 */
import { CreateInflowInput, CreateOutflowInput } from '../../src/models/transaction';
import { toApiInflow, toApiOutflow } from '../../src/models/transaction-transformer';
import { ValidationError } from '../../src/util/validation';

describe('toApiInflow', () => {
  const input: CreateInflowInput = {
    chartOfAccountsGroupName: 'FUNDING',
    description: 'Deposit',
    send: {
      asset: 'BRL',
      value: '100',
      distribute: { to: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  it('emits asset, value and distribute only', () => {
    expect(toApiInflow(input)).toEqual({
      chartOfAccountsGroupName: 'FUNDING',
      description: 'Deposit',
      send: {
        asset: 'BRL',
        value: '100',
        distribute: {
          to: [{ accountAlias: 'acc-a', amount: { asset: 'BRL', value: '100' } }],
        },
      },
    });
  });

  it('never emits a source, which the ledger rejects with 0053', () => {
    const withSource = { ...input, send: { ...input.send, source: { from: [] } } };

    expect(toApiInflow(withSource as unknown as CreateInflowInput).send).not.toHaveProperty(
      'source'
    );
  });

  it('never emits pending, which the inflow input struct does not declare', () => {
    const withPending = { ...input, pending: true };

    expect(toApiInflow(withPending as unknown as CreateInflowInput)).not.toHaveProperty('pending');
  });

  it('coerces numeric values to decimal strings', () => {
    const numeric: CreateInflowInput = {
      ...input,
      send: {
        asset: 'BRL',
        value: 100,
        distribute: { to: [{ account: 'acc-a', amount: { asset: 'BRL', value: 100 } }] },
      },
    };

    const body = toApiInflow(numeric);

    expect(body.send.value).toBe('100');
    expect(body.send.distribute.to[0].amount.value).toBe('100');
  });

  it('refuses a value it cannot serialize losslessly, naming the path', () => {
    const lossy: CreateInflowInput = {
      ...input,
      send: {
        asset: 'BRL',
        value: '100',
        distribute: {
          to: [{ account: 'acc-a', amount: { asset: 'BRL', value: 1e21 } }],
        },
      },
    };

    expect(() => toApiInflow(lossy)).toThrow(ValidationError);
    expect(() => toApiInflow(lossy)).toThrow('send.distribute.to[0].amount.value');
  });

  it('carries the optional leg fields the ledger accepts', () => {
    const rich: CreateInflowInput = {
      ...input,
      code: 'TR1',
      route: '00000000-0000-0000-0000-000000000000',
      metadata: { reference: 'nf-1' },
      send: {
        asset: 'BRL',
        value: '100',
        distribute: {
          to: [
            {
              account: 'acc-a',
              amount: { asset: 'BRL', value: '100' },
              description: 'leg',
              route: 'route-1',
              metadata: { tag: 'x' },
            },
          ],
        },
      },
    };

    const body = toApiInflow(rich);

    expect(body.code).toBe('TR1');
    expect(body.route).toBe('00000000-0000-0000-0000-000000000000');
    expect(body.metadata).toEqual({ reference: 'nf-1' });
    expect(body.send.distribute.to[0]).toEqual({
      accountAlias: 'acc-a',
      amount: { asset: 'BRL', value: '100' },
      description: 'leg',
      route: 'route-1',
      metadata: { tag: 'x' },
    });
  });

  it('puts routeId on the wire, which the inflow input struct validates as a UUID', () => {
    const body = toApiInflow({ ...input, routeId: '8dbf1c9e-3a2b-4a55-9f1e-2c0f6b7d4e11' });

    expect(body.routeId).toBe('8dbf1c9e-3a2b-4a55-9f1e-2c0f6b7d4e11');
  });

  it('omits routeId when the caller supplied none', () => {
    expect(toApiInflow(input)).not.toHaveProperty('routeId');
  });

  it('keeps the idempotency key out of the body, since it rides as a header', () => {
    const body = toApiInflow({ ...input, idempotencyKey: 'dep-1', idempotencyTtlSeconds: 600 });

    expect(body).not.toHaveProperty('idempotencyKey');
    expect(body).not.toHaveProperty('idempotencyTtlSeconds');
  });
});

describe('toApiOutflow', () => {
  const input: CreateOutflowInput = {
    chartOfAccountsGroupName: 'WITHDRAWAL',
    description: 'Withdrawal',
    send: {
      asset: 'BRL',
      value: '40',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '40' } }] },
    },
  };

  it('emits asset, value and source only', () => {
    expect(toApiOutflow(input)).toEqual({
      chartOfAccountsGroupName: 'WITHDRAWAL',
      description: 'Withdrawal',
      send: {
        asset: 'BRL',
        value: '40',
        source: { from: [{ accountAlias: 'acc-a', amount: { asset: 'BRL', value: '40' } }] },
      },
    });
  });

  it('never emits a distribute, which the ledger rejects with 0053', () => {
    const withDistribute = { ...input, send: { ...input.send, distribute: { to: [] } } };

    expect(toApiOutflow(withDistribute as unknown as CreateOutflowInput).send).not.toHaveProperty(
      'distribute'
    );
  });

  it('emits pending, which outflow supports and inflow does not', () => {
    expect(toApiOutflow({ ...input, pending: true }).pending).toBe(true);
  });

  it('omits pending when the caller left it alone', () => {
    expect(toApiOutflow(input)).not.toHaveProperty('pending');
  });

  it('refuses a value it cannot serialize losslessly, naming the path', () => {
    const lossy: CreateOutflowInput = {
      ...input,
      send: {
        asset: 'BRL',
        value: '40',
        source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: Infinity } }] },
      },
    };

    expect(() => toApiOutflow(lossy)).toThrow('send.source.from[0].amount.value');
  });
});
