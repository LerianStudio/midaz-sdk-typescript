# Working with Segments

This guide explains how to work with segments using the Midaz SDK.

## Segment Model

Segments allow for further categorization and grouping of accounts or other entities within a ledger. The Segment model has the following structure:

```typescript
interface Segment {
  id: string;
  name: string;
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

Segments are commonly used for:
- Business unit categorization (departments, divisions)
- Geographic segmentation (regions, countries)
- Product line segmentation (product categories)
- Customer segmentation (market segments, industries)
- Regulatory reporting (tax jurisdictions, regulatory categories)

## Creating Segments

### Using the Builder Pattern

The recommended way to create segments is using the builder pattern through the `createSegmentBuilder` function:

```typescript
import { createSegmentBuilder, StatusCode } from 'midaz-sdk';

// Create a segment input using the builder
const segmentInput = createSegmentBuilder('North America')
  .withMetadata({
    regionCode: 'NA',
    countries: ['US', 'CA', 'MX'],
    currency: 'USD'
  })
  .build();

// Create the segment
const segment = await client.entities.segments.createSegment(
  organizationId,
  ledgerId,
  segmentInput
);
```

### Using Helper Functions

Alternatively, you can use the helper functions:

```typescript
import { newCreateSegmentInput, withMetadata, withStatus, StatusCode } from 'midaz-sdk';

// Create basic segment input
const segmentInput = newCreateSegmentInput('North America');

// Add additional properties
const enhancedInput = withMetadata(
  withStatus(segmentInput, StatusCode.ACTIVE),
  {
    regionCode: 'NA',
    countries: ['US', 'CA', 'MX'],
    currency: 'USD'
  }
);

// Create the segment
const segment = await client.entities.segments.createSegment(
  organizationId,
  ledgerId,
  enhancedInput
);
```

Note that:
- The `name` is a required field for segment creation
- Additional properties can be set using the chainable `with*` methods or helper functions
- The `status` field can be explicitly set or will use the default (typically 'ACTIVE')

## Retrieving Segments

### Get a Specific Segment

```typescript
// Get a specific segment by ID
const segment = await client.entities.segments.getSegment(
  organizationId,
  ledgerId,
  segmentId
);

console.log(`Segment: ${segment.name} (${segment.id})`);
console.log(`Status: ${segment.status.code}`);
if (segment.metadata) {
  console.log(`Metadata: ${JSON.stringify(segment.metadata, null, 2)}`);
}
```

### List Segments

```typescript
// List segments with pagination
const segmentList = await client.entities.segments.listSegments(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Total segments: ${segmentList.total}`);
for (const segment of segmentList.data) {
  console.log(`- ${segment.name} (${segment.id})`);
}
```

## Updating Segments

### Using the Builder Pattern

```typescript
import { createUpdateSegmentBuilder, StatusCode } from 'midaz-sdk';

// Create a segment update using the builder
const updateInput = createUpdateSegmentBuilder()
  .withName('North America Region')
  .withMetadata({
    regionCode: 'NAR',
    countries: ['US', 'CA', 'MX'],
    currency: 'USD',
    timeZones: ['EST', 'CST', 'MST', 'PST']
  })
  .build();

// Update the segment
const updatedSegment = await client.entities.segments.updateSegment(
  organizationId,
  ledgerId,
  segmentId,
  updateInput
);
```

### Using Helper Functions

```typescript
import { newUpdateSegmentInput, withName, withMetadata } from 'midaz-sdk';

// Create update input
const updateInput = newUpdateSegmentInput();

// Add updates
const enhancedUpdate = withMetadata(
  withName(updateInput, 'North America Region'),
  {
    regionCode: 'NAR',
    countries: ['US', 'CA', 'MX'],
    currency: 'USD',
    timeZones: ['EST', 'CST', 'MST', 'PST']
  }
);

// Update the segment
const updatedSegment = await client.entities.segments.updateSegment(
  organizationId,
  ledgerId,
  segmentId,
  enhancedUpdate
);
```

Note that:
- Only certain fields can be updated (name, status, metadata)
- Only fields included in the update input will be modified

## Deleting Segments

```typescript
// Delete a segment
await client.entities.segments.deleteSegment(
  organizationId,
  ledgerId,
  segmentId
);

console.log(`Segment ${segmentId} has been deleted`);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create a segment with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.segments.createSegment(
    organizationId,
    ledgerId,
    segmentInput
  )
);

if (result.success) {
  const segment = result.data;
  console.log(`Segment created: ${segment.name} (${segment.id})`);
} else {
  console.error(`Failed to create segment: ${result.error.message}`);
}
```

## Example: Segment Management

```typescript
// Segment management example
async function manageSegments(client, organizationId, ledgerId) {
  try {
    // Create a new segment
    const segmentInput = createSegmentBuilder('EMEA')
      .withMetadata({
        regionCode: 'EU',
        countries: ['UK', 'FR', 'DE', 'IT', 'ES'],
        currency: 'EUR',
        headquarters: 'London'
      })
      .build();

    const segment = await client.entities.segments.createSegment(
      organizationId,
      ledgerId,
      segmentInput
    );
    console.log(`Created segment: ${segment.name} (${segment.id})`);

    // Get the segment details
    const retrievedSegment = await client.entities.segments.getSegment(
      organizationId,
      ledgerId,
      segment.id
    );
    console.log(`Retrieved segment: ${retrievedSegment.name}`);
    console.log(`Status: ${retrievedSegment.status.code}`);

    // Update the segment
    const updateInput = createUpdateSegmentBuilder()
      .withName('Europe, Middle East, and Africa')
      .withMetadata({
        ...retrievedSegment.metadata,
        countries: [
          'UK', 'FR', 'DE', 'IT', 'ES',
          'AE', 'SA', 'ZA', 'EG', 'NG'
        ]
      })
      .build();

    const updatedSegment = await client.entities.segments.updateSegment(
      organizationId,
      ledgerId,
      segment.id,
      updateInput
    );
    console.log(`Updated segment: ${updatedSegment.name}`);

    // List all segments
    const segments = await client.entities.segments.listSegments(
      organizationId,
      ledgerId,
      { limit: 10 }
    );
    console.log(`Listed ${segments.data.length} segments`);

    return {
      created: segment,
      updated: updatedSegment,
      list: segments.data
    };
  } catch (error) {
    console.error(`Segment management error: ${error.message}`);
    throw error;
  }
}
```

## Common Use Cases

### Geographic Organization

```typescript
// Create geographic segments for global reporting
async function createGeographicSegments(client, organizationId, ledgerId) {
  const geographicRegions = [
    {
      name: 'North America',
      metadata: {
        regionCode: 'NA',
        countries: ['US', 'CA', 'MX'],
        currency: 'USD',
        headquarters: 'New York'
      }
    },
    {
      name: 'Europe',
      metadata: {
        regionCode: 'EU',
        countries: ['UK', 'FR', 'DE', 'IT', 'ES'],
        currency: 'EUR',
        headquarters: 'London'
      }
    },
    {
      name: 'Asia Pacific',
      metadata: {
        regionCode: 'APAC',
        countries: ['JP', 'CN', 'SG', 'AU', 'IN'],
        currency: 'USD',
        headquarters: 'Singapore'
      }
    }
  ];
  
  const results = [];
  
  for (const region of geographicRegions) {
    const segmentInput = createSegmentBuilder(region.name)
      .withMetadata(region.metadata)
      .build();
    
    const segment = await client.entities.segments.createSegment(
      organizationId,
      ledgerId,
      segmentInput
    );
    
    results.push({
      name: region.name,
      id: segment.id
    });
  }
  
  return results;
}
```

### Business Unit Segmentation

```typescript
// Create segments for business units
async function createBusinessUnitSegments(client, organizationId, ledgerId, businessUnits) {
  const results = [];
  
  for (const unit of businessUnits) {
    const segmentInput = createSegmentBuilder(unit.name)
      .withMetadata({
        unitCode: unit.code,
        departmentHead: unit.head,
        costCenter: unit.costCenter,
        budget: unit.budget
      })
      .build();
    
    const segment = await client.entities.segments.createSegment(
      organizationId,
      ledgerId,
      segmentInput
    );
    
    results.push({
      name: unit.name,
      id: segment.id
    });
  }
  
  return results;
}
```
