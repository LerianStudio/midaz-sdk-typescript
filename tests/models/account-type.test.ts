import { CreateAccountTypeInput, createAccountTypeBuilder } from '../../src/models/account-type';

describe('AccountType Model and Builder', () => {
  it('should create an AccountTypeInput with the correct name and keyValue', () => {
    const input: CreateAccountTypeInput = createAccountTypeBuilder('Cash Account', 'CASH').build();

    expect(input.name).toBe('Cash Account');
    expect(input.keyValue).toBe('CASH');
    expect(input.description).toBeUndefined();
  });

  it('should create an AccountTypeInput with a description', () => {
    const input: CreateAccountTypeInput = createAccountTypeBuilder('Liability Account', 'LIABILITY')
      .withDescription('Used for tracking debts')
      .build();

    expect(input.name).toBe('Liability Account');
    expect(input.keyValue).toBe('LIABILITY');
    expect(input.description).toBe('Used for tracking debts');
  });

  it('should reflect the last set value when chaining', () => {
    const builder = createAccountTypeBuilder('Equity Account', 'EQUITY');

    // Chain methods
    builder.withDescription('Initial Description');
    builder.withDescription('Final Description');

    const input = builder.build();

    expect(input.description).toBe('Final Description');
  });

  it('should not modify a built object after builder is changed', () => {
    const builder = createAccountTypeBuilder('Test', 'TEST');

    // First build
    const input1 = builder.withDescription('First').build();

    // Second build after modification
    const input2 = builder.withDescription('Second').build();

    expect(input1.description).toBe('First');
    expect(input2.description).toBe('Second');
  });
});
