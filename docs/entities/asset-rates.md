# Working with Asset Rates

This guide explains how to work with asset rates using the Midaz SDK.

## Asset Rate Model

The Asset Rate model represents exchange rates between different assets and has the following structure:

```typescript
interface AssetRate {
  id: string;
  fromAsset: string;
  toAsset: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
  effectiveAt: string;
  expirationAt: string;
}
```

## Retrieving Asset Rates

### Get a Specific Asset Rate

To retrieve the exchange rate between two assets:

```typescript
// Get the exchange rate between USD and EUR
const rate = await client.entities.assetRates.getAssetRate(
  organizationId,
  ledgerId,
  'USD', // Source asset code
  'EUR' // Destination asset code
);

console.log(`Exchange rate: 1 ${rate.fromAsset} = ${rate.rate} ${rate.toAsset}`);
console.log(`Effective from: ${rate.effectiveAt} to ${rate.expirationAt}`);
```

## Creating and Updating Asset Rates

The SDK provides a helper function for creating or updating asset rates:

```typescript
import { createUpdateAssetRateInput } from 'midaz-sdk';

// Create input for a new USD to EUR exchange rate
// Method 1: Create input object directly
const rateInput = {
  fromAsset: 'USD',
  toAsset: 'EUR',
  rate: 0.92,
  effectiveAt: '2023-09-15T00:00:00Z',
  expirationAt: '2023-09-16T00:00:00Z',
};

// Method 2: Use the helper function
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

const helperRateInput = createUpdateAssetRateInput('USD', 'EUR', 0.92, now, tomorrow);

// Create or update the asset rate
const newRate = await client.entities.assetRates.createOrUpdateAssetRate(
  organizationId,
  ledgerId,
  helperRateInput
);

console.log(`Asset rate created/updated: ${newRate.id}`);
```

Note that:

- The `createUpdateAssetRateInput` function handles date conversion automatically
- All fields are required when creating or updating a rate
- If a rate already exists for the given asset pair, it will be updated

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create/update an asset rate with enhanced recovery
const result = await withEnhancedRecovery(() =>
  client.entities.assetRates.createOrUpdateAssetRate(organizationId, ledgerId, rateInput)
);

if (result.success) {
  const rate = result.data;
  console.log(`Asset rate created/updated: ${rate.id}`);
} else {
  console.error(`Failed to create/update asset rate: ${result.error.message}`);
}
```

## Example: Asset Rate Management

```typescript
// Asset rate management example
async function manageAssetRates(client, organizationId, ledgerId) {
  try {
    // Create multiple asset rates
    const ratesToCreate = [
      // USD to EUR conversion
      createUpdateAssetRateInput(
        'USD',
        'EUR',
        0.92,
        new Date(),
        new Date(Date.now() + 86400000) // Valid for 24 hours
      ),

      // EUR to USD conversion (inverse of the above)
      createUpdateAssetRateInput('EUR', 'USD', 1.09, new Date(), new Date(Date.now() + 86400000)),

      // BTC to USD conversion
      createUpdateAssetRateInput('BTC', 'USD', 43000, new Date(), new Date(Date.now() + 86400000)),
    ];

    // Create/update each rate
    const createdRates = [];
    for (const rateInput of ratesToCreate) {
      const rate = await client.entities.assetRates.createOrUpdateAssetRate(
        organizationId,
        ledgerId,
        rateInput
      );
      createdRates.push(rate);
      console.log(`Created rate: 1 ${rate.fromAsset} = ${rate.rate} ${rate.toAsset}`);
    }

    // Retrieve a specific rate
    const usdToEurRate = await client.entities.assetRates.getAssetRate(
      organizationId,
      ledgerId,
      'USD',
      'EUR'
    );

    console.log(
      `Retrieved rate: 1 ${usdToEurRate.fromAsset} = ${usdToEurRate.rate} ${usdToEurRate.toAsset}`
    );
    console.log(`Effective from: ${usdToEurRate.effectiveAt} to ${usdToEurRate.expirationAt}`);

    return {
      createdRates,
      retrievedRate: usdToEurRate,
    };
  } catch (error) {
    console.error(`Asset rate management error: ${error.message}`);
    throw error;
  }
}
```

## Common Use Cases

### Currency Conversion

Asset rates are commonly used for currency conversion in multi-currency ledgers:

```typescript
// Function to convert an amount from one asset to another
async function convertAmount(client, organizationId, ledgerId, amount, fromAsset, toAsset) {
  // Get the exchange rate
  const rate = await client.entities.assetRates.getAssetRate(
    organizationId,
    ledgerId,
    fromAsset,
    toAsset
  );

  // Perform conversion
  const convertedAmount = amount * rate.rate;

  return {
    originalAmount: amount,
    originalAsset: fromAsset,
    convertedAmount,
    convertedAsset: toAsset,
    rate: rate.rate,
    effectiveAt: rate.effectiveAt,
  };
}

// Example usage
const conversion = await convertAmount(client, organizationId, ledgerId, 100, 'USD', 'EUR');

console.log(
  `${conversion.originalAmount} ${conversion.originalAsset} = ${conversion.convertedAmount} ${conversion.convertedAsset}`
);
```
