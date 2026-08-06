# Working with Asset Rates

This guide explains how to work with asset rates using the Midaz SDK.

## Asset Rate Model

The Asset Rate model represents exchange rates between different assets and has the following structure:

```typescript
interface AssetRate {
  id: string;
  organizationId: string;
  ledgerId: string;
  externalId: string;
  from: string;
  to: string;
  rate: number;
  scale: number | null;
  source: string | null;
  ttl: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}
```

### The rate is an integer, not a float

The ledger carries the value as the integer `rate` paired with `scale`, the number
of decimal places. `1 USD = 0.92 EUR` is `{ rate: 92, scale: 2 }`. Sending a
fractional `rate` is rejected — the SDK validator catches it before the request
leaves, and the server would otherwise answer `0094 invalid value for field
'rate': expected type 'int'`.

The effective value is therefore `rate / 10 ** (scale ?? 0)`.

Validity is expressed as `ttl` in seconds, not as an effective/expiration pair.

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

const value = rate.rate / 10 ** (rate.scale ?? 0);
console.log(`Exchange rate: 1 ${rate.from} = ${value} ${rate.to}`);
console.log(`Valid for ${rate.ttl} seconds from ${rate.updatedAt}`);
```

Passing the same code as source and destination short-circuits to a synthetic
identity rate (`rate: 1`, `scale: 0`) without touching the network.

### Get an Asset Rate by External ID

Every rate carries an `externalId` — supplied by you at write time, or generated
by the ledger — which addresses it directly:

```typescript
const rate = await client.entities.assetRates.getAssetRateByExternalId(
  organizationId,
  ledgerId,
  '019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f'
);
```

## Creating and Updating Asset Rates

The SDK provides a helper function for creating or updating asset rates:

```typescript
import { createUpdateAssetRateInput } from 'midaz-sdk';

// Create input for a new USD to EUR exchange rate: 1 USD = 0.92 EUR
// Method 1: Create input object directly
const rateInput = {
  from: 'USD',
  to: 'EUR',
  rate: 92,
  scale: 2,
  ttl: 86400,
  source: 'Central Bank',
};

// Method 2: Use the helper function
const helperRateInput = createUpdateAssetRateInput('USD', 'EUR', 92, {
  scale: 2,
  ttl: 86400,
  source: 'Central Bank',
});

// Create or update the asset rate
const newRate = await client.entities.assetRates.createOrUpdateAssetRate(
  organizationId,
  ledgerId,
  helperRateInput
);

console.log(`Asset rate created/updated: ${newRate.id}`);
```

Note that:

- Only `from`, `to` and `rate` are required; `scale`, `ttl`, `source`, `externalId`
  and `metadata` are optional
- `from` and `to` must be 2 to 10 characters
- Omitting `scale` means the rate is taken as a whole number
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
    // Create multiple asset rates, all scaled to 2 decimal places
    const ratesToCreate = [
      // USD to EUR conversion: 0.92
      createUpdateAssetRateInput('USD', 'EUR', 92, { scale: 2, ttl: 86400 }),

      // EUR to USD conversion: 1.09 (inverse of the above)
      createUpdateAssetRateInput('EUR', 'USD', 109, { scale: 2, ttl: 86400 }),

      // BTC to USD conversion: 43000.00
      createUpdateAssetRateInput('BTC', 'USD', 4300000, { scale: 2, ttl: 86400 }),
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
      console.log(
        `Created rate: 1 ${rate.from} = ${rate.rate / 10 ** (rate.scale ?? 0)} ${rate.to}`
      );
    }

    // Retrieve a specific rate
    const usdToEurRate = await client.entities.assetRates.getAssetRate(
      organizationId,
      ledgerId,
      'USD',
      'EUR'
    );

    console.log(
      `Retrieved rate: 1 ${usdToEurRate.from} = ${
        usdToEurRate.rate / 10 ** (usdToEurRate.scale ?? 0)
      } ${usdToEurRate.to}`
    );

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
async function convertAmount(client, organizationId, ledgerId, amount, from, to) {
  // Get the exchange rate
  const rate = await client.entities.assetRates.getAssetRate(organizationId, ledgerId, from, to);

  // Unscale before applying it
  const factor = rate.rate / 10 ** (rate.scale ?? 0);

  return {
    originalAmount: amount,
    originalAsset: from,
    convertedAmount: amount * factor,
    convertedAsset: to,
    rate: factor,
    ttl: rate.ttl,
  };
}

// Example usage
const conversion = await convertAmount(client, organizationId, ledgerId, 100, 'USD', 'EUR');

console.log(
  `${conversion.originalAmount} ${conversion.originalAsset} = ${conversion.convertedAmount} ${conversion.convertedAsset}`
);
```
