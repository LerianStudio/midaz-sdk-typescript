# Working with Organizations

This guide explains how to work with organizations using the Midaz SDK.

## Organization Model

The Organization model has the following structure:

```typescript
interface Organization {
  id: string;
  name: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
```

## Creating Organizations

### Using the Builder Pattern

The recommended way to create organizations is using the builder pattern through the `createOrganizationBuilder` function:

```typescript
import { createOrganizationBuilder } from 'midaz-sdk';

// Create an organization input using the builder
const organizationInput = createOrganizationBuilder('Acme Corporation')
  .withMetadata({
    industry: 'Technology',
    country: 'United States',
  })
  .build();

// Create the organization
const organization = await client.entities.organizations.createOrganization(organizationInput);
```

Note that:

- The `createOrganizationBuilder` function requires the `name` parameter as this is a required field
- The `status` field is set in the model but not included in the output of the builder
- Validation happens at runtime rather than during build
- Additional properties can be set using the chainable `with*` methods

## Retrieving Organizations

### Get a Specific Organization

```typescript
// Get a specific organization by ID
const organization = await client.entities.organizations.getOrganization(organizationId);

console.log(`Organization: ${organization.name} (${organization.id})`);
```

### List Organizations

```typescript
// List organizations with pagination
const organizationList = await client.entities.organizations.listOrganizations({
  limit: 50,
  offset: 0,
});

console.log(`Total organizations: ${organizationList.total}`);
for (const org of organizationList.data) {
  console.log(`- ${org.name} (${org.id})`);
}
```

## Updating Organizations

```typescript
// Update an organization
const updatedOrganization = await client.entities.organizations.updateOrganization(organizationId, {
  name: 'Acme Corporation Global',
  metadata: {
    ...organization.metadata,
    industry: 'Technology and Finance',
    website: 'https://acme-global.com',
  },
});
```

## Managing Organization Ledgers

### Create a Ledger

```typescript
import { createLedgerBuilder } from 'midaz-sdk';

// Create a ledger for an organization
const ledgerInput = createLedgerBuilder('Main Ledger')
  .withMetadata({
    description: 'Primary ledger for tracking all financial activities',
    currency: 'USD',
  })
  .build();

const ledger = await client.entities.organizations.createLedger(organizationId, ledgerInput);
```

### List Organization Ledgers

```typescript
// List ledgers for an organization
const ledgers = await client.entities.organizations.listLedgers(organizationId, {
  limit: 20,
  offset: 0,
});

console.log(`Total ledgers: ${ledgers.total}`);
for (const ledger of ledgers.data) {
  console.log(`- ${ledger.name} (${ledger.id})`);
}
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create an organization with enhanced recovery
const result = await withEnhancedRecovery(() =>
  client.entities.organizations.createOrganization(organizationInput)
);

if (result.success) {
  const organization = result.data;
  console.log(`Organization created: ${organization.name} (${organization.id})`);
} else {
  console.error(`Failed to create organization: ${result.error.message}`);
}
```

## Example: Complete Organization Management

```typescript
// Organization management example
async function manageOrganizations(client) {
  try {
    // Create a new organization
    const organizationInput = createOrganizationBuilder('Global Enterprises')
      .withMetadata({
        industry: 'Finance',
        headquarters: 'New York',
        foundedYear: 2010,
      })
      .build();

    const organization = await client.entities.organizations.createOrganization(organizationInput);
    console.log(`Created organization: ${organization.name} (${organization.id})`);

    // Get the organization details
    const retrievedOrg = await client.entities.organizations.getOrganization(organization.id);
    console.log(`Retrieved organization: ${retrievedOrg.name}`);

    // Create a ledger for the organization
    const ledgerInput = createLedgerBuilder('Global Ledger')
      .withMetadata({
        description: 'Global operations ledger',
        baseCurrency: 'USD',
      })
      .build();

    const ledger = await client.entities.organizations.createLedger(organization.id, ledgerInput);
    console.log(`Created ledger: ${ledger.name} (${ledger.id})`);

    // Update the organization
    const updatedOrg = await client.entities.organizations.updateOrganization(organization.id, {
      name: 'Global Enterprises Inc.',
      metadata: {
        ...organization.metadata,
        stockSymbol: 'GEI',
        ceo: 'Jane Smith',
      },
    });
    console.log(`Updated organization: ${updatedOrg.name}`);

    // List all organizations
    const organizations = await client.entities.organizations.listOrganizations({ limit: 10 });
    console.log(`Listed ${organizations.data.length} organizations`);

    // List ledgers for the organization
    const ledgers = await client.entities.organizations.listLedgers(organization.id, { limit: 10 });
    console.log(`Listed ${ledgers.data.length} ledgers for organization ${organization.id}`);

    return {
      created: organization,
      updated: updatedOrg,
      ledger: ledger,
      organizations: organizations.data,
      ledgers: ledgers.data,
    };
  } catch (error) {
    console.error(`Organization management error: ${error.message}`);
    throw error;
  }
}
```
