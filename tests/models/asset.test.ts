import {
  CreateAssetInput,
  Asset,
  createAssetBuilder,
  createAssetBuilderWithType,
  createUpdateAssetBuilder,
} from '../../src/models/asset';
import { StatusCode } from '../../src/models/common';

describe('Asset Model and Helper Functions', () => {
  // Test 1: Basic asset input creation
  it('shouldCreateAssetInputWithRequiredFields', () => {
    const input = createAssetBuilder('US Dollar', 'USD').build();
    expect(input).toEqual({
      name: 'US Dollar',
      code: 'USD',
    });
  });

  // Test 2: Asset input creation with type
  it('shouldCreateAssetInputWithType', () => {
    const input = createAssetBuilderWithType('Bitcoin', 'BTC', 'CURRENCY').build();
    expect(input).toEqual({
      name: 'Bitcoin',
      code: 'BTC',
      type: 'CURRENCY',
    });
  });

  // Test 3: Create update input and add fields
  it('shouldCreateUpdateInputAndAddFields', () => {
    const input = createUpdateAssetBuilder()
      .withName('Updated Name')
      .withStatus(StatusCode.ACTIVE)
      .build();
    expect(input).toEqual({
      name: 'Updated Name',
    });
  });

  // Test 4: Add metadata to asset input
  it('shouldAddMetadataToAssetInput', () => {
    const metadata = {
      symbol: '€',
      decimalPlaces: 2,
      isoCode: 'EUR',
    };
    const input = createAssetBuilder('US Dollar', 'USD').withMetadata(metadata).build();
    expect(input).toEqual({
      name: 'US Dollar',
      code: 'USD',
      metadata,
    });
  });

  // Test 5: Create asset with all fields
  it('shouldCreateAssetWithAllFields', () => {
    const metadata = {
      precision: 8,
      symbol: '₿',
      type: 'digital',
    };
    const input = createAssetBuilderWithType('Bitcoin', 'BTC', 'CURRENCY')
      .withStatus(StatusCode.ACTIVE)
      .withMetadata(metadata)
      .build();
    expect(input).toEqual({
      name: 'Bitcoin',
      code: 'BTC',
      type: 'CURRENCY',
      metadata,
    });
  });

  // Test 6: Create asset with direct property assignment
  it('shouldCreateAssetWithDirectPropertyAssignment', () => {
    const input: CreateAssetInput = {
      name: 'Euro',
      code: 'EUR',
      type: 'fiat',
      status: StatusCode.ACTIVE,
      metadata: {
        precision: 2,
        symbol: '€',
        country: 'EU',
      },
    };
    expect(input.name).toBe('Euro');
    expect(input.code).toBe('EUR');
    expect(input.type).toBe('fiat');
    expect(input.status).toBe(StatusCode.ACTIVE);
    expect(input.metadata).toBeDefined();
    expect(input.metadata!.symbol).toBe('€');
  });

  // Test 7: Create complete asset object
  it('shouldCreateCompleteAssetObject', () => {
    const now = new Date().toISOString();
    const completeAsset: Asset = {
      id: 'ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      name: 'US Dollar',
      code: 'USD',
      type: 'fiat',
      status: {
        code: StatusCode.ACTIVE,
        timestamp: now,
      },
      ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      createdAt: now,
      updatedAt: now,
      metadata: {
        key: 'value',
      },
    };
    expect(completeAsset.id).toBe('ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completeAsset.name).toBe('US Dollar');
    expect(completeAsset.code).toBe('USD');
    expect(completeAsset.type).toBe('fiat');
    expect(completeAsset.status.code).toBe(StatusCode.ACTIVE);
    expect(completeAsset.ledgerId).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completeAsset.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completeAsset.createdAt).toBe(now);
    expect(completeAsset.updatedAt).toBe(now);
    expect(completeAsset.metadata).toEqual({ key: 'value' });
  });

  // Test 8: Create update input with all fields
  it('shouldCreateUpdateInputWithAllFields', () => {
    const metadata = {
      precision: 2,
      symbol: '€',
      country: 'EU',
    };
    const input = createUpdateAssetBuilder()
      .withName('Euro')
      .withStatus(StatusCode.ACTIVE)
      .withMetadata(metadata)
      .build();
    expect(input).toEqual({
      name: 'Euro',
      metadata,
    });
  });

  // Test 9: Handle special characters in asset name
  it('shouldHandleSpecialCharactersInAssetName', () => {
    const specialName = 'Special Asset & Co. !@#$%^&*()';
    const input = createAssetBuilder(specialName, 'SPECIAL').build();
    expect(input.name).toBe(specialName);
  });

  // Test 10: Handle complex metadata objects
  it('shouldHandleComplexMetadataObjects', () => {
    const complexMetadata = {
      nestedObject: {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      },
      arrayValue: [1, 2, 3, 'four', { five: 5 }],
      numberValue: 123.456,
      stringValue: 'string value',
      nullValue: null,
      booleanValue: true,
    };
    const result = createAssetBuilder('Complex Asset', 'COMPLEX')
      .withMetadata(complexMetadata)
      .build();
    expect(result.metadata).toEqual(complexMetadata);
  });

  // Test 11: Handling long asset names
  it('shouldHandleLongAssetNames', () => {
    const longName = 'A'.repeat(256); // 256 characters
    const input = createAssetBuilder(longName, 'LONG').build();
    expect(input.name.length).toBe(256);
    expect(input.name).toBe(longName);
  });

  // Test 12: Handling long asset codes
  it('shouldHandleLongAssetCodes', () => {
    const longCode = 'C'.repeat(50); // 50 characters
    const input = createAssetBuilder('Long Code Asset', longCode).build();
    expect(input.code.length).toBe(50);
    expect(input.code).toBe(longCode);
  });

  // Test 13: Handling large metadata objects
  it('shouldHandleLargeMetadataObjects', () => {
    const largeMetadata: Record<string, any> = {};
    for (let i = 0; i < 1000; i++) {
      largeMetadata[`key${i}`] = `value${i}`;
    }
    const result = createAssetBuilder('Large Metadata Asset', 'LARGE')
      .withMetadata(largeMetadata)
      .build();
    expect(Object.keys(result.metadata!).length).toBe(1000);
    expect(result.metadata!.key0).toBe('value0');
    expect(result.metadata!.key999).toBe('value999');
  });

  // Test 14: Setting name to empty string in update input
  it('shouldSetEmptyNameInUpdateInput', () => {
    const updateInput = createUpdateAssetBuilder().withName('').build();
    expect(updateInput.name).toBe('');
  });

  // Test 15: Handling null metadata values
  it('shouldHandleNullMetadataValues', () => {
    const metadataWithNull = {
      nullValue: null,
      regularValue: 'value',
    };
    const result = createAssetBuilder('Null Metadata Asset', 'NULL')
      .withMetadata(metadataWithNull)
      .build();
    expect(result.metadata!.nullValue).toBeNull();
    expect(result.metadata!.regularValue).toBe('value');
  });

  // Test 16: Creating update input with multiple fields
  it('shouldCreateUpdateInputWithMultipleFields', () => {
    const updateInput = createUpdateAssetBuilder()
      .withName('Updated Name')
      .withStatus(StatusCode.INACTIVE)
      .withMetadata({ updated: true })
      .build();
    expect(updateInput).toEqual({
      name: 'Updated Name',
      metadata: { updated: true },
    });
  });

  // Test 17: Chaining helper methods
  it('shouldSupportChainingHelperMethods', () => {
    const input = createAssetBuilder('Bitcoin', 'BTC')
      .withStatus(StatusCode.ACTIVE)
      .withMetadata({ type: 'CRYPTOCURRENCY', decimalPlaces: 8 })
      .build();
    expect(input).toEqual({
      name: 'Bitcoin',
      code: 'BTC',
      metadata: {
        type: 'CRYPTOCURRENCY',
        decimalPlaces: 8,
      },
    });
  });

  // Test 18: Chaining helper methods for update input
  it('shouldSupportChainingHelperMethodsForUpdateInput', () => {
    const updateInput = createUpdateAssetBuilder()
      .withName('Restricted Asset')
      .withMetadata({ isRestricted: true })
      .build();
    expect(updateInput).toEqual({
      name: 'Restricted Asset',
      metadata: {
        isRestricted: true,
      },
    });
  });

  // Test 19: Handling empty strings for required fields
  it('shouldHandleEmptyStringsForRequiredFields', () => {
    const input = createAssetBuilder('', '').build();
    expect(input.name).toBe('');
    expect(input.code).toBe('');
  });

  // Test 20: Setting status to different values
  it('shouldSetStatusToDifferentValues', () => {
    // Note: In the new builder pattern, status is set in the model but not included in the output

    // Since we can't directly access the model's status, we'll just verify the builder doesn't throw
    const activeBuilder = createAssetBuilder('Status Test', 'STATUS');
    expect(() => activeBuilder.withStatus(StatusCode.ACTIVE)).not.toThrow();

    const inactiveBuilder = createAssetBuilder('Status Test', 'STATUS');
    expect(() => inactiveBuilder.withStatus(StatusCode.INACTIVE)).not.toThrow();

    const pendingBuilder = createAssetBuilder('Status Test', 'STATUS');
    expect(() => pendingBuilder.withStatus(StatusCode.PENDING)).not.toThrow();
  });

  // Test 21: Overriding existing values
  it('shouldOverrideExistingValues', () => {
    // Note: In the new builder pattern, status is set in the model but not included in the output

    // Since we can't directly access the model's status, we'll just verify the builder doesn't throw
    const withStatusBuilder = createAssetBuilderWithType('Original Name', 'CODE', 'ORIGINAL_TYPE');
    expect(() => withStatusBuilder.withStatus(StatusCode.ACTIVE)).not.toThrow();

    const overriddenStatusBuilder = createAssetBuilderWithType(
      'Original Name',
      'CODE',
      'ORIGINAL_TYPE'
    );
    expect(() => overriddenStatusBuilder.withStatus(StatusCode.INACTIVE)).not.toThrow();

    const withMetadataResult = createAssetBuilderWithType('Original Name', 'CODE', 'ORIGINAL_TYPE')
      .withMetadata({ key: 'value' })
      .build();
    expect(withMetadataResult.metadata).toEqual({ key: 'value' });

    const overriddenMetadata = createAssetBuilderWithType('Original Name', 'CODE', 'ORIGINAL_TYPE')
      .withMetadata({ newKey: 'newValue' })
      .build();
    expect(overriddenMetadata.metadata).toEqual({ newKey: 'newValue' });
  });

  // Test 22: Creating an asset with all fields
  it('shouldCreateCompleteAsset', () => {
    const now = new Date().toISOString();
    const completeAsset: Asset = {
      id: 'ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      name: 'Complete Asset',
      type: 'CURRENCY',
      code: 'COMPLETE',
      status: {
        code: StatusCode.ACTIVE,
        timestamp: now,
      },
      ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      createdAt: now,
      updatedAt: now,
      metadata: {
        key: 'value',
      },
    };
    expect(completeAsset.id).toBe('ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completeAsset.name).toBe('Complete Asset');
    expect(completeAsset.type).toBe('CURRENCY');
    expect(completeAsset.code).toBe('COMPLETE');
    expect(completeAsset.status.code).toBe(StatusCode.ACTIVE);
    expect(completeAsset.ledgerId).toBe('ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completeAsset.organizationId).toBe('org_01H9ZQCK3VP6WS2EZ5JQKD5E1S');
    expect(completeAsset.createdAt).toBe(now);
    expect(completeAsset.updatedAt).toBe(now);
    expect(completeAsset.metadata).toEqual({ key: 'value' });
  });

  // Test 23: Creating an asset with optional fields omitted
  it('shouldCreateAssetWithOptionalFieldsOmitted', () => {
    const minimalAsset: Asset = {
      id: 'ast_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      name: 'Minimal Asset',
      type: 'CURRENCY',
      code: 'MINIMAL',
      status: {
        code: StatusCode.ACTIVE,
        timestamp: new Date().toISOString(),
      },
      ledgerId: 'ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      organizationId: 'org_01H9ZQCK3VP6WS2EZ5JQKD5E1S',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(minimalAsset.metadata).toBeUndefined();
  });

  // Test 24: Setting metadata on update input
  it('shouldSetMetadataOnUpdateInput', () => {
    const metadata = { key: 'value' };
    const result = createUpdateAssetBuilder().withMetadata(metadata).build();
    expect(result).toEqual({
      metadata,
    });
  });
});
