# Working with Portfolios

This guide explains how to work with portfolios using the Midaz SDK.

## Portfolio Model

Portfolios are collections of accounts that belong to a specific entity within an organization and ledger. The Portfolio model has the following structure:

```typescript
interface Portfolio {
  id: string;
  name: string;
  entityId: string;
  ledgerId: string;
  organizationId: string;
  status: {
    code: string;
    description: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
```

## Creating Portfolios

### Using the Builder Pattern

The recommended way to create portfolios is using the builder pattern through the `createPortfolioBuilder` function:

```typescript
import { createPortfolioBuilder, StatusCode } from 'midaz-sdk';

// Create a portfolio input using the builder
const portfolioInput = createPortfolioBuilder('client_12345', 'Retirement Portfolio')
  .withMetadata({
    riskProfile: 'conservative',
    investmentStrategy: 'income',
    targetReturn: '5%'
  })
  .build();

// Create the portfolio
const portfolio = await client.entities.portfolios.createPortfolio(
  organizationId,
  ledgerId,
  portfolioInput
);
```

### Using Helper Functions

Alternatively, you can use the helper functions:

```typescript
import { newCreatePortfolioInput, withMetadata, withStatus, StatusCode } from 'midaz-sdk';

// Create basic portfolio input
const portfolioInput = newCreatePortfolioInput('client_12345', 'Investment Portfolio');

// Add additional properties
const enhancedInput = withMetadata(
  withStatus(portfolioInput, StatusCode.ACTIVE),
  {
    riskProfile: 'aggressive',
    investmentStrategy: 'growth',
    targetReturn: '10%'
  }
);

// Create the portfolio
const portfolio = await client.entities.portfolios.createPortfolio(
  organizationId,
  ledgerId,
  enhancedInput
);
```

Note that:
- The `entityId` and `name` are required fields for portfolio creation
- Additional properties can be set using the chainable `with*` methods or helper functions
- The `status` field can be explicitly set or will use the default (typically 'ACTIVE')

## Retrieving Portfolios

### Get a Specific Portfolio

```typescript
// Get a specific portfolio by ID
const portfolio = await client.entities.portfolios.getPortfolio(
  organizationId,
  ledgerId,
  portfolioId
);

console.log(`Portfolio: ${portfolio.name} (${portfolio.id})`);
console.log(`Entity: ${portfolio.entityId}`);
console.log(`Status: ${portfolio.status.code}`);
```

### List Portfolios

```typescript
// List portfolios with pagination
const portfolioList = await client.entities.portfolios.listPortfolios(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Total portfolios: ${portfolioList.total}`);
for (const portfolio of portfolioList.data) {
  console.log(`- ${portfolio.name} (${portfolio.id}): Entity ${portfolio.entityId}`);
}
```

## Updating Portfolios

### Using the Builder Pattern

```typescript
import { createUpdatePortfolioBuilder, StatusCode } from 'midaz-sdk';

// Create a portfolio update using the builder
const updateInput = createUpdatePortfolioBuilder()
  .withName('Conservative Retirement Portfolio')
  .withMetadata({
    riskProfile: 'very conservative',
    investmentStrategy: 'income and preservation',
    targetReturn: '4%'
  })
  .build();

// Update the portfolio
const updatedPortfolio = await client.entities.portfolios.updatePortfolio(
  organizationId,
  ledgerId,
  portfolioId,
  updateInput
);
```

### Using Helper Functions

```typescript
import { newUpdatePortfolioInput, withName, withMetadata } from 'midaz-sdk';

// Create update input
const updateInput = newUpdatePortfolioInput();

// Add updates
const enhancedUpdate = withMetadata(
  withName(updateInput, 'Growth Investment Portfolio'),
  {
    riskProfile: 'moderate',
    investmentStrategy: 'balanced growth',
    targetReturn: '7%'
  }
);

// Update the portfolio
const updatedPortfolio = await client.entities.portfolios.updatePortfolio(
  organizationId,
  ledgerId,
  portfolioId,
  enhancedUpdate
);
```

Note that:
- Only certain fields can be updated (name, status, metadata)
- The `entityId` cannot be changed after portfolio creation
- Only fields included in the update input will be modified

## Deleting Portfolios

```typescript
// Delete a portfolio
await client.entities.portfolios.deletePortfolio(
  organizationId,
  ledgerId,
  portfolioId
);

console.log(`Portfolio ${portfolioId} has been deleted`);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create a portfolio with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.portfolios.createPortfolio(
    organizationId,
    ledgerId,
    portfolioInput
  )
);

if (result.success) {
  const portfolio = result.data;
  console.log(`Portfolio created: ${portfolio.name} (${portfolio.id})`);
} else {
  console.error(`Failed to create portfolio: ${result.error.message}`);
}
```

## Example: Portfolio Management

```typescript
// Portfolio management example
async function managePortfolios(client, organizationId, ledgerId) {
  try {
    // Create a new portfolio
    const portfolioInput = createPortfolioBuilder('client_67890', 'Growth Portfolio')
      .withMetadata({
        riskProfile: 'aggressive',
        investmentStrategy: 'growth',
        targetReturn: '10%',
        assetClasses: ['equities', 'alternatives'],
        rebalanceFrequency: 'quarterly'
      })
      .build();

    const portfolio = await client.entities.portfolios.createPortfolio(
      organizationId,
      ledgerId,
      portfolioInput
    );
    console.log(`Created portfolio: ${portfolio.name} (${portfolio.id})`);

    // Get the portfolio details
    const retrievedPortfolio = await client.entities.portfolios.getPortfolio(
      organizationId,
      ledgerId,
      portfolio.id
    );
    console.log(`Retrieved portfolio: ${retrievedPortfolio.name}`);
    console.log(`Entity: ${retrievedPortfolio.entityId}`);
    console.log(`Status: ${retrievedPortfolio.status.code}`);

    // Update the portfolio
    const updateInput = createUpdatePortfolioBuilder()
      .withName('Balanced Growth Portfolio')
      .withMetadata({
        ...retrievedPortfolio.metadata,
        riskProfile: 'moderate',
        rebalanceFrequency: 'monthly'
      })
      .build();

    const updatedPortfolio = await client.entities.portfolios.updatePortfolio(
      organizationId,
      ledgerId,
      portfolio.id,
      updateInput
    );
    console.log(`Updated portfolio: ${updatedPortfolio.name}`);

    // List all portfolios
    const portfolios = await client.entities.portfolios.listPortfolios(
      organizationId,
      ledgerId,
      { limit: 10 }
    );
    console.log(`Listed ${portfolios.data.length} portfolios`);

    return {
      created: portfolio,
      updated: updatedPortfolio,
      list: portfolios.data
    };
  } catch (error) {
    console.error(`Portfolio management error: ${error.message}`);
    throw error;
  }
}
```

## Common Use Cases

### Client Portfolio Management

```typescript
// Organize accounts into client portfolios
async function organizeClientPortfolios(client, organizationId, ledgerId, clientData) {
  const results = [];
  
  for (const clientInfo of clientData) {
    // Create a portfolio for each client
    const portfolioInput = createPortfolioBuilder(
      clientInfo.id,
      `${clientInfo.name} Portfolio`
    )
      .withMetadata({
        clientType: clientInfo.type,
        relationshipManager: clientInfo.manager,
        onboardingDate: clientInfo.since
      })
      .build();
    
    const portfolio = await client.entities.portfolios.createPortfolio(
      organizationId,
      ledgerId,
      portfolioInput
    );
    
    results.push({
      clientId: clientInfo.id,
      clientName: clientInfo.name,
      portfolioId: portfolio.id
    });
  }
  
  return results;
}
```

### Risk Profiling

```typescript
// Categorize portfolios by risk profile
async function categorizeByRiskProfile(client, organizationId, ledgerId) {
  // Get all portfolios
  const allPortfolios = await client.entities.portfolios.listPortfolios(
    organizationId,
    ledgerId,
    { limit: 1000 }
  );
  
  // Group by risk profile
  const profileGroups = {
    conservative: [],
    moderate: [],
    aggressive: [],
    unknown: []
  };
  
  for (const portfolio of allPortfolios.data) {
    const riskProfile = portfolio.metadata?.riskProfile?.toLowerCase() || 'unknown';
    
    if (profileGroups[riskProfile]) {
      profileGroups[riskProfile].push(portfolio);
    } else {
      profileGroups.unknown.push(portfolio);
    }
  }
  
  // Report on findings
  for (const [profile, portfolios] of Object.entries(profileGroups)) {
    console.log(`${profile}: ${portfolios.length} portfolios`);
  }
  
  return profileGroups;
}
```
