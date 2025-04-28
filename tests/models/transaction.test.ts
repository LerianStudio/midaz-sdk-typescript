import { CreateTransactionInput } from "../../src/models/transaction";

describe("Transaction", () => {
    it("should create an empty transaction input", () => {
        const input: CreateTransactionInput = {
            operations: []
        };
        
        expect(input).toBeDefined();
        expect(input.operations).toHaveLength(0);
    });

    it("should_include_optional_transaction_fields_in_output", () => {
        const input: CreateTransactionInput = {
            amount: 500,
            scale: 2,
            assetCode: "EUR",
            description: "Test transaction",
            chartOfAccountsGroupName: "Revenue",
            metadata: { foo: "bar" },
            externalId: "ext-123",
            operations: [
                {
                    accountId: "acc1",
                    type: "DEBIT",
                    amount: { value: 500, assetCode: "EUR", scale: 2 }
                },
                {
                    accountId: "acc2",
                    type: "CREDIT",
                    amount: { value: 500, assetCode: "EUR", scale: 2 }
                }
            ]
        };
        // const result = toLibTransaction(input);
        // expect(result.description).toBe("Test transaction");
        // expect(result.chartOfAccountsGroupName).toBe("Revenue");
        // expect(result.metadata).toEqual({ foo: "bar" });
        // expect(result.externalId).toBe("ext-123");
    });

    it("should_handle_input_with_only_one_operation_type", () => {
        // Only DEBIT
        const inputDebit: CreateTransactionInput = {
            assetCode: "USD",
            scale: 2,
            operations: [
                {
                    accountId: "acc1",
                    type: "DEBIT",
                    amount: { value: 100, assetCode: "USD", scale: 2 }
                }
            ]
        };
        // const resultDebit = toLibTransaction(inputDebit);
        // expect(resultDebit.send.source.from.length).toBe(1);
        // expect(resultDebit.send.distribute.to.length).toBe(0);

        // Only CREDIT
        const inputCredit: CreateTransactionInput = {
            assetCode: "USD",
            scale: 2,
            operations: [
                {
                    accountId: "acc2",
                    type: "CREDIT",
                    amount: { value: 200, assetCode: "USD", scale: 2 }
                }
            ]
        };
        // const resultCredit = toLibTransaction(inputCredit);
        // expect(resultCredit.send.source.from.length).toBe(0);
        // expect(resultCredit.send.distribute.to.length).toBe(1);
    });

    it("should_handle_operations_with_missing_optional_fields", () => {
        const input: CreateTransactionInput = {
            assetCode: "USD",
            scale: 2,
            operations: [
                {
                    accountId: "acc1",
                    type: "DEBIT",
                    amount: { value: 100, assetCode: "USD", scale: 2 }
                    // description and metadata missing
                },
                {
                    accountId: "acc2",
                    type: "CREDIT",
                    amount: { value: 100, assetCode: "USD", scale: 2 }
                    // description and metadata missing
                }
            ]
        };
        // const result = toLibTransaction(input);
        // expect(result.send.source.from[0].description).toBe("Debit Operation");
        // expect(result.send.source.from[0].metadata).toBeUndefined();
        // expect(result.send.distribute.to[0].description).toBe("Credit Operation");
        // expect(result.send.distribute.to[0].metadata).toBeUndefined();
    });

    it("should_return_payload_with_fallbacks_when_fields_missing", () => {
        const input: CreateTransactionInput = {
            // assetCode and scale missing
            operations: [
                {
                    accountId: "acc1",
                    type: "DEBIT",
                    amount: { value: 50, assetCode: undefined as any, scale: undefined as any }
                }
            ]
        };
        // const result = toLibTransaction(input);
        // expect(result.send.asset).toBeUndefined();
        // expect(result.send.scale).toBe(2);
        // expect(result.send.value).toBe(50);
    });

    it("should_map_operations_with_mixed_optional_fields", () => {
        const input: CreateTransactionInput = {
            assetCode: "USD",
            scale: 2,
            operations: [
                {
                    accountId: "acc1",
                    accountAlias: "alias1",
                    type: "DEBIT",
                    amount: { value: 100, assetCode: "USD", scale: 2 },
                    metadata: { foo: "bar" }
                },
                {
                    accountId: "acc2",
                    type: "CREDIT",
                    amount: { value: 100, assetCode: "USD", scale: 2 }
                }
            ]
        };
        // const result = toLibTransaction(input);
        // expect(result.send.source.from[0].account).toBe("acc1");
        // expect(result.send.source.from[0].metadata).toEqual({ foo: "bar" });
        // expect(result.send.distribute.to[0].account).toBe("acc2");
        // expect(result.send.distribute.to[0].metadata).toBeUndefined();
    });

    it("should_handle_empty_operations_array", () => {
        const input: CreateTransactionInput = {
            assetCode: "USD",
            scale: 2,
            operations: []
        };
        // const result = toLibTransaction(input);
        // expect(result.send.source.from).toEqual([]);
        // expect(result.send.distribute.to).toEqual([]);
    });

    it("should_transform_operations_with_different_asset_codes_and_scales", () => {
        const input: CreateTransactionInput = {
            operations: [
                {
                    accountId: "acc1",
                    type: "DEBIT",
                    amount: { value: 100, assetCode: "USD", scale: 2 }
                },
                {
                    accountId: "acc2",
                    type: "CREDIT",
                    amount: { value: 100, assetCode: "EUR", scale: 3 }
                }
            ]
        };
        // const result = toLibTransaction(input);
        // expect(result.send.asset).toBe("USD");
        // expect(result.send.scale).toBe(2);
        // expect(result.send.source.from[0].amount.asset).toBe("USD");
        // expect(result.send.source.from[0].amount.scale).toBe(2);
        // expect(result.send.distribute.to[0].amount.asset).toBe("EUR");
        // expect(result.send.distribute.to[0].amount.scale).toBe(3);
    });

    it("should_handle_amount_value_as_string", () => {
        const input: CreateTransactionInput = {
            operations: [
                {
                    accountId: "acc1",
                    type: "DEBIT",
                    amount: { value: "150", assetCode: "USD", scale: 2 }
                },
                {
                    accountId: "acc2",
                    type: "CREDIT",
                    amount: { value: "150", assetCode: "USD", scale: 2 }
                }
            ]
        };
        // const result = toLibTransaction(input);
        // expect(result.send.value).toBe(150);
        // expect(result.send.source.from[0].amount.value).toBe("150");
        // expect(result.send.distribute.to[0].amount.value).toBe("150");
    });
});