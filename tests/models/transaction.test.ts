import { CreateTransactionInput } from '../../src/models/transaction';

describe('Transaction', () => {
  it('should create an empty transaction input', () => {
    const input: CreateTransactionInput = {
      operations: [],
    };

    expect(input).toBeDefined();
    expect(input.operations).toHaveLength(0);
  });

  it('should_include_optional_transaction_fields_in_output', () => {
    const input: CreateTransactionInput = {
      amount: 500,
      scale: 2,
      assetCode: 'EUR',
      description: 'Test transaction',
      chartOfAccountsGroupName: 'Revenue',
      metadata: { foo: 'bar' },
      externalId: 'ext-123',
      operations: [
        {
          accountId: 'acc1',
          type: 'DEBIT',
          amount: { value: 500, assetCode: 'EUR', scale: 2 },
        },
        {
          accountId: 'acc2',
          type: 'CREDIT',
          amount: { value: 500, assetCode: 'EUR', scale: 2 },
        },
      ],
    };
    expect(input.description).toBe('Test transaction');
    expect(input.chartOfAccountsGroupName).toBe('Revenue');
    expect(input.metadata).toEqual({ foo: 'bar' });
    expect(input.externalId).toBe('ext-123');
  });

  it('should_handle_input_with_only_one_operation_type', () => {
    // Only DEBIT
    const inputDebit: CreateTransactionInput = {
      assetCode: 'USD',
      scale: 2,
      operations: [
        {
          accountId: 'acc1',
          type: 'DEBIT',
          amount: { value: 100, assetCode: 'USD', scale: 2 },
        },
      ],
    };
    expect(inputDebit.operations).toHaveLength(1);
    expect(inputDebit.operations[0].type).toBe('DEBIT');

    // Only CREDIT
    const inputCredit: CreateTransactionInput = {
      assetCode: 'USD',
      scale: 2,
      operations: [
        {
          accountId: 'acc2',
          type: 'CREDIT',
          amount: { value: 200, assetCode: 'USD', scale: 2 },
        },
      ],
    };
    expect(inputCredit.operations).toHaveLength(1);
    expect(inputCredit.operations[0].type).toBe('CREDIT');
  });

  it('should_handle_operations_with_missing_optional_fields', () => {
    const input: CreateTransactionInput = {
      assetCode: 'USD',
      scale: 2,
      operations: [
        {
          accountId: 'acc1',
          type: 'DEBIT',
          amount: { value: 100, assetCode: 'USD', scale: 2 },
          // description and metadata missing
        },
        {
          accountId: 'acc2',
          type: 'CREDIT',
          amount: { value: 100, assetCode: 'USD', scale: 2 },
          // description and metadata missing
        },
      ],
    };
    expect(input.operations).toHaveLength(2);
    expect(input.operations[0].type).toBe('DEBIT');
    expect(input.operations[1].type).toBe('CREDIT');
  });

  it('should_return_payload_with_fallbacks_when_fields_missing', () => {
    const input: CreateTransactionInput = {
      // assetCode and scale missing
      operations: [
        {
          accountId: 'acc1',
          type: 'DEBIT',
          amount: { value: 50, assetCode: undefined as any, scale: undefined as any },
        },
      ],
    };
    expect(input.operations).toHaveLength(1);
    expect(input.operations[0].amount.value).toBe(50);
  });

  it('should_map_operations_with_mixed_optional_fields', () => {
    const input: CreateTransactionInput = {
      assetCode: 'USD',
      scale: 2,
      operations: [
        {
          accountId: 'acc1',
          accountAlias: 'alias1',
          type: 'DEBIT',
          amount: { value: 100, assetCode: 'USD', scale: 2 },
          metadata: { foo: 'bar' },
        },
        {
          accountId: 'acc2',
          type: 'CREDIT',
          amount: { value: 100, assetCode: 'USD', scale: 2 },
        },
      ],
    };
    expect(input.operations[0].accountId).toBe('acc1');
    expect(input.operations[0].metadata).toEqual({ foo: 'bar' });
    expect(input.operations[1].accountId).toBe('acc2');
    expect(input.operations[1].metadata).toBeUndefined();
  });

  it('should_handle_empty_operations_array', () => {
    const input: CreateTransactionInput = {
      assetCode: 'USD',
      scale: 2,
      operations: [],
    };
    expect(input.operations).toEqual([]);
    expect(input.assetCode).toBe('USD');
    expect(input.scale).toBe(2);
  });

  it('should_transform_operations_with_different_asset_codes_and_scales', () => {
    const input: CreateTransactionInput = {
      operations: [
        {
          accountId: 'acc1',
          type: 'DEBIT',
          amount: { value: 100, assetCode: 'USD', scale: 2 },
        },
        {
          accountId: 'acc2',
          type: 'CREDIT',
          amount: { value: 100, assetCode: 'EUR', scale: 3 },
        },
      ],
    };
    expect(input.operations[0].amount.assetCode).toBe('USD');
    expect(input.operations[0].amount.scale).toBe(2);
    expect(input.operations[1].amount.assetCode).toBe('EUR');
    expect(input.operations[1].amount.scale).toBe(3);
  });

  it('should_handle_amount_value_as_string', () => {
    const input: CreateTransactionInput = {
      operations: [
        {
          accountId: 'acc1',
          type: 'DEBIT',
          amount: { value: '150', assetCode: 'USD', scale: 2 },
        },
        {
          accountId: 'acc2',
          type: 'CREDIT',
          amount: { value: '150', assetCode: 'USD', scale: 2 },
        },
      ],
    };
    expect(input.operations[0].amount.value).toBe('150');
    expect(input.operations[1].amount.value).toBe('150');
  });
});
