import {
  newCreatePortfolioInput,
  newUpdatePortfolioInput,
  Portfolio,
  UpdatePortfolioInput,
  withMetadata,
  withName,
  withStatus,
} from '../../src/models/portfolio';
import { StatusCode } from '../../src/models/common';

describe('Portfolio Model and Helper Functions', () => {
  // Test 1: Creating a portfolio input with required fields
  it('shouldCreatePortfolioInputWithRequiredFields', () => {
    const input = newCreatePortfolioInput('client_12345', 'Retirement Portfolio');
    expect(input).toEqual({
      entityId: 'client_12345',
      name: 'Retirement Portfolio',
    });
  });

  // Test 2: Creating an empty update portfolio input
  it('shouldCreateEmptyUpdatePortfolioInput', () => {
    const updateInput = newUpdatePortfolioInput();
    expect(updateInput).toEqual({});
  });

  // Test 3: Setting name on update input
  it('shouldSetNameOnUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    const result = withName(updateInput, 'Long-Term Growth Portfolio');

    expect(result).toEqual({
      name: 'Long-Term Growth Portfolio',
    });

    // Should modify the original object (reference)
    expect(updateInput).toBe(result);
  });

  // Test 4: Setting status on create input
  it('shouldSetStatusOnCreateInput', () => {
    const createInput = newCreatePortfolioInput('client_12345', 'Legacy Portfolio');
    const result = withStatus(createInput, StatusCode.INACTIVE);

    expect(result).toEqual({
      entityId: 'client_12345',
      name: 'Legacy Portfolio',
      status: StatusCode.INACTIVE,
    });

    // Should modify the original object (reference)
    expect(createInput).toBe(result);
  });

  // Test 5: Setting status on update input
  it('shouldSetStatusOnUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    const result = withStatus(updateInput, StatusCode.ACTIVE);

    expect(result).toEqual({
      status: StatusCode.ACTIVE,
    });

    // Should modify the original object (reference)
    expect(updateInput).toBe(result);
  });

  // Test 6: Setting metadata on create input
  it('shouldSetMetadataOnCreateInput', () => {
    const createInput = newCreatePortfolioInput('client_12345', 'Growth Portfolio');
    const metadata = {
      riskProfile: 'aggressive',
      investmentStrategy: 'growth',
      targetReturn: '10%',
      assetClasses: ['equities', 'alternatives'],
      rebalanceFrequency: 'quarterly',
    };

    const result = withMetadata(createInput, metadata);

    expect(result).toEqual({
      entityId: 'client_12345',
      name: 'Growth Portfolio',
      metadata,
    });

    // Should modify the original object (reference)
    expect(createInput).toBe(result);
  });

  // Test 7: Setting metadata on update input
  it('shouldSetMetadataOnUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    const metadata = {
      riskProfile: 'moderate',
      targetReturn: '7%',
    };

    const result = withMetadata(updateInput, metadata);

    expect(result).toEqual({
      metadata,
    });

    // Should modify the original object (reference)
    expect(updateInput).toBe(result);
  });

  // Test 8: Chaining helper methods for update input
  it('shouldSupportChainingHelperMethodsForUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();

    const metadata = {
      riskProfile: 'moderate',
      investmentStrategy: 'balanced',
    };

    const result = withName(
      withMetadata(withStatus(updateInput, StatusCode.ACTIVE), metadata),
      'Balanced Growth Portfolio'
    );

    expect(result).toEqual({
      name: 'Balanced Growth Portfolio',
      status: StatusCode.ACTIVE,
      metadata,
    });
  });

  // Test 9: Chaining helper methods for create input
  it('shouldSupportChainingHelperMethodsForCreateInput', () => {
    const createInput = newCreatePortfolioInput('client_12345', 'Retirement Portfolio');

    const metadata = {
      riskProfile: 'conservative',
      investmentStrategy: 'income',
      targetReturn: '5%',
    };

    const result = withMetadata(withStatus(createInput, StatusCode.ACTIVE), metadata);

    expect(result).toEqual({
      entityId: 'client_12345',
      name: 'Retirement Portfolio',
      status: StatusCode.ACTIVE,
      metadata,
    });
  });

  // Test 10: Creating a complete portfolio object
  it('shouldCreateCompletePortfolioObject', () => {
    const now = new Date().toISOString();

    const metadata = {
      riskProfile: 'moderate',
      investmentStrategy: 'growth',
      targetReturn: '8%',
    };

    const completePortfolio: Portfolio = {
      id: 'pfl_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      name: 'Investment Portfolio',
      entityId: 'client_12345',
      ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      status: {
        code: StatusCode.ACTIVE,
        description: 'Portfolio is active and operational',
        timestamp: now,
      },
      createdAt: now,
      updatedAt: now,
      metadata,
    };

    expect(completePortfolio.id).toBe('pfl_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completePortfolio.name).toBe('Investment Portfolio');
    expect(completePortfolio.entityId).toBe('client_12345');
    expect(completePortfolio.ledgerId).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completePortfolio.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completePortfolio.status.code).toBe(StatusCode.ACTIVE);
    expect(completePortfolio.status.description).toBe('Portfolio is active and operational');
    expect(completePortfolio.createdAt).toBe(now);
    expect(completePortfolio.updatedAt).toBe(now);
    expect(completePortfolio.metadata).toEqual(metadata);
  });

  // Test 11: Creating a portfolio with minimum required fields
  it('shouldCreatePortfolioWithMinimumRequiredFields', () => {
    const now = new Date().toISOString();

    const minimalPortfolio: Portfolio = {
      id: 'pfl_minimal',
      name: 'Minimal Portfolio',
      entityId: 'client_minimal',
      ledgerId: 'ldg_01',
      organizationId: 'org_01',
      status: {
        code: StatusCode.ACTIVE,
        timestamp: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    expect(minimalPortfolio.metadata).toBeUndefined();
    expect(minimalPortfolio.deletedAt).toBeUndefined();
    expect(minimalPortfolio.status.description).toBeUndefined();
  });

  // Test 12: Handling empty strings for required fields
  it('shouldHandleEmptyStringsForRequiredFields', () => {
    const input = newCreatePortfolioInput('', '');
    expect(input.entityId).toBe('');
    expect(input.name).toBe('');
  });

  // Test 13: Setting empty name in update input
  it('shouldSetEmptyNameInUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    const result = withName(updateInput, '');

    expect(result.name).toBe('');
  });

  // Test 14: Handling different status values
  it('shouldHandleDifferentStatusValues', () => {
    const createInput = newCreatePortfolioInput('client_12345', 'Status Test');

    const activeResult = withStatus(createInput, StatusCode.ACTIVE);
    expect(activeResult.status).toBe(StatusCode.ACTIVE);

    const inactiveResult = withStatus(createInput, StatusCode.INACTIVE);
    expect(inactiveResult.status).toBe(StatusCode.INACTIVE);

    const pendingResult = withStatus(createInput, StatusCode.PENDING);
    expect(pendingResult.status).toBe(StatusCode.PENDING);
  });

  // Test 15: Handling complex metadata objects
  it('shouldHandleComplexMetadataObjects', () => {
    const input = newCreatePortfolioInput('client_12345', 'Complex Metadata Portfolio');
    const complexMetadata = {
      nestedObject: {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      },
      arrayValue: [1, 2, 3, 4, 5],
      mixedArray: ['string', 123, true, { key: 'value' }, ['nested', 'array']],
      nullValue: null,
      booleanValue: true,
    };

    const result = withMetadata(input, complexMetadata);

    expect(result.metadata).toEqual(complexMetadata);
  });

  // Test 16: Overriding existing values
  it('shouldOverrideExistingValues', () => {
    const updateInput = newUpdatePortfolioInput();

    // Set initial values
    const withInitialValues = withName(
      withMetadata(withStatus(updateInput, StatusCode.ACTIVE), { key1: 'value1' }),
      'Initial Name'
    );

    expect(withInitialValues).toEqual({
      name: 'Initial Name',
      status: StatusCode.ACTIVE,
      metadata: { key1: 'value1' },
    });

    // Override values
    const withOverriddenValues = withName(
      withMetadata(withStatus(updateInput, StatusCode.INACTIVE), { key2: 'value2' }),
      'Overridden Name'
    );

    expect(withOverriddenValues).toEqual({
      name: 'Overridden Name',
      status: StatusCode.INACTIVE,
      metadata: { key2: 'value2' },
    });
  });

  // Test 17: Creating update input with direct property assignment
  it('shouldCreateUpdateInputWithDirectPropertyAssignment', () => {
    const updateInput: UpdatePortfolioInput = {};
    updateInput.name = 'Direct Assignment';
    updateInput.status = StatusCode.ACTIVE;
    updateInput.metadata = { directlyAssigned: true };

    expect(updateInput).toEqual({
      name: 'Direct Assignment',
      status: StatusCode.ACTIVE,
      metadata: { directlyAssigned: true },
    });
  });

  // Test 18: Setting only name in update input
  it('shouldSetOnlyNameInUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    updateInput.name = 'Only Name';

    expect(updateInput).toEqual({
      name: 'Only Name',
    });
    expect(updateInput.status).toBeUndefined();
    expect(updateInput.metadata).toBeUndefined();
  });

  // Test 19: Setting only status in update input
  it('shouldSetOnlyStatusInUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    updateInput.status = StatusCode.ACTIVE;

    expect(updateInput).toEqual({
      status: StatusCode.ACTIVE,
    });
    expect(updateInput.name).toBeUndefined();
    expect(updateInput.metadata).toBeUndefined();
  });

  // Test 20: Setting only metadata in update input
  it('shouldSetOnlyMetadataInUpdateInput', () => {
    const updateInput = newUpdatePortfolioInput();
    updateInput.metadata = { onlyMetadata: true };

    expect(updateInput).toEqual({
      metadata: { onlyMetadata: true },
    });
    expect(updateInput.name).toBeUndefined();
    expect(updateInput.status).toBeUndefined();
  });

  // Test 21: Handling long portfolio names
  it('shouldHandleLongPortfolioNames', () => {
    const longName = 'A'.repeat(256); // 256 characters
    const input = newCreatePortfolioInput('client_12345', longName);

    expect(input.name.length).toBe(256);
    expect(input.name).toBe(longName);
  });

  // Test 22: Handling null metadata values
  it('shouldHandleNullMetadataValues', () => {
    const input = newCreatePortfolioInput('client_12345', 'Null Metadata Portfolio');
    const metadataWithNull = {
      nullValue: null,
      undefinedValue: undefined,
      regularValue: 'value',
    };

    const result = withMetadata(input, metadataWithNull);

    expect(result.metadata!.nullValue).toBeNull();
    expect(result.metadata!.undefinedValue).toBeUndefined();
    expect(result.metadata!.regularValue).toBe('value');
  });

  // Test 23: Creating a portfolio with deletedAt timestamp
  it('shouldCreatePortfolioWithDeletedAtTimestamp', () => {
    const now = new Date().toISOString();

    const deletedPortfolio: Portfolio = {
      id: 'pfl_deleted',
      name: 'Deleted Portfolio',
      entityId: 'client_deleted',
      ledgerId: 'ldg_01',
      organizationId: 'org_01',
      status: {
        code: StatusCode.INACTIVE,
        description: 'Portfolio has been deleted',
        timestamp: now,
      },
      createdAt: now,
      updatedAt: now,
      deletedAt: now,
    };

    expect(deletedPortfolio.deletedAt).toBe(now);
    expect(deletedPortfolio.status.code).toBe(StatusCode.INACTIVE);
  });

  // Test 24: Handling special characters in portfolio names
  it('shouldHandleSpecialCharactersInPortfolioNames', () => {
    const specialName = 'Portfolio with special chars: !@#$%^&*()';
    const input = newCreatePortfolioInput('client_12345', specialName);

    expect(input.name).toBe(specialName);
  });
});
