# Network Utilities

The Midaz SDK provides robust network utilities for making HTTP requests with features like automatic retries, connection pooling, and consistent error handling.

## HTTP Client

The `HttpClient` class provides a powerful interface for making HTTP requests with built-in support for retries, error handling, and performance optimization.

### Basic Usage

```typescript
import { HttpClient } from 'midaz-sdk/util/network';

// Create an HTTP client
const httpClient = new HttpClient({
  baseUrls: {
    onboarding: 'https://api.midaz.io/v1/onboarding',
    transaction: 'https://api.midaz.io/v1/transaction'
  },
  apiKey: 'your-api-key',
  debug: true
});

// Make a GET request
const organizations = await httpClient.get('onboarding/organizations', {
  params: { limit: 10, status: 'active' }
});

// Make a POST request
const newOrg = await httpClient.post('onboarding/organizations', {
  name: 'New Organization',
  metadata: { industry: 'Finance' }
});

// Make a PUT request to update a resource
const updatedOrg = await httpClient.put(
  'onboarding/organizations/org_12345',
  { status: 'inactive' }
);

// Make a DELETE request
await httpClient.delete('onboarding/organizations/org_12345');
```

### Configuration Options

The HTTP client can be configured with various options:

```typescript
import { HttpClient, RetryPolicy } from 'midaz-sdk/util/network';
import { Cache } from 'midaz-sdk/util/cache';

// Create a custom retry policy
const retryPolicy = new RetryPolicy({
  maxRetries: 5,
  initialDelay: 200,
  maxDelay: 2000
});

// Create a cache instance
const cache = new Cache({
  ttl: 60000 // 1 minute
});

// Create an HTTP client with advanced options
const httpClient = new HttpClient({
  baseUrls: {
    onboarding: 'https://api.midaz.io/v1/onboarding',
    transaction: 'https://api.midaz.io/v1/transaction'
  },
  apiKey: 'your-api-key',
  retryPolicy,
  cache,
  timeout: 30000, // 30 seconds
  headers: {
    'User-Agent': 'Midaz-SDK/1.0.0',
    'X-Custom-Header': 'custom-value'
  },
  
  // Connection pooling for performance
  keepAlive: true,
  maxSockets: 20,
  keepAliveMsecs: 1000,
  
  // Security options
  tlsOptions: {
    rejectUnauthorized: true,
    // For mutual TLS
    cert: fs.readFileSync('client.crt'),
    key: fs.readFileSync('client.key')
  }
});
```

### Custom Request Options

Each request method accepts options for fine-grained control:

```typescript
// Make a GET request with custom options
const result = await httpClient.get('transaction/accounts', {
  // Query parameters
  params: {
    limit: 20,
    status: 'active',
    sortBy: 'createdAt'
  },
  
  // Request timeout (overrides client default)
  timeout: 5000,
  
  // Custom headers for this request only
  headers: {
    'X-Request-ID': 'req_123456',
    'X-Custom-Value': 'some-value'
  },
  
  // Abort signal for cancellation
  signal: abortController.signal,
  
  // Disable caching for this request
  useCache: false,
  
  // Custom idempotency key
  idempotencyKey: 'custom-idempotency-key-12345'
});
```

### Response Handling

The HTTP client parses responses based on content type and handles errors consistently:

```typescript
try {
  // Make an API request
  const result = await httpClient.get('transaction/accounts/acc_12345');
  
  // Process successful response
  console.log(`Account name: ${result.name}`);
  console.log(`Balance: ${result.balance}`);
} catch (error) {
  if (error.category === 'not_found') {
    console.error('Account not found');
  } else if (error.category === 'authentication') {
    console.error('Authentication failed');
  } else if (error.category === 'network') {
    console.error(`Network error: ${error.message}`);
  } else {
    console.error(`Unexpected error: ${error.message}`);
  }
}
```

### Resource Management

The HTTP client manages connections intelligently, but you can explicitly control resources:

```typescript
// Check connection statistics
const stats = httpClient.getConnectionStats();
console.log(`Active HTTPS connections: ${stats.httpsConnections.active}`);
console.log(`Idle HTTPS connections: ${stats.httpsConnections.idle}`);

// Close idle connections to free resources
const closedCount = httpClient.closeIdleConnections();
console.log(`Closed ${closedCount} idle connections`);

// When completely done with the client
httpClient.destroy();
```

## Retry Policy

The `RetryPolicy` class provides configurable retry logic with exponential backoff for handling transient failures.

### Basic Usage

```typescript
import { RetryPolicy } from 'midaz-sdk/util/network';

// Create a retry policy with default options
const retryPolicy = new RetryPolicy();

// Use the retry policy to execute a function with retries
try {
  const result = await retryPolicy.execute(async () => {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  });
  
  console.log('Operation succeeded:', result);
} catch (error) {
  console.error('Operation failed after all retries:', error);
}
```

### Custom Retry Configuration

```typescript
import { RetryPolicy } from 'midaz-sdk/util/network';

// Create a retry policy with custom options
const retryPolicy = new RetryPolicy({
  // Maximum number of retry attempts
  maxRetries: 5,
  
  // Initial delay between retries (ms)
  initialDelay: 200,
  
  // Maximum delay between retries (ms)
  maxDelay: 10000,
  
  // HTTP status codes that should trigger a retry
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // Custom function to determine if an error should trigger a retry
  retryCondition: (error) => {
    // Retry on network errors or specific error messages
    if (error.message && error.message.includes('network')) {
      return true;
    }
    // Retry on rate limit errors
    if (error.code === 'rate_limit_exceeded') {
      return true;
    }
    return false;
  }
});
```

### Retry with Progress Tracking

```typescript
import { RetryPolicy } from 'midaz-sdk/util/network';

const retryPolicy = new RetryPolicy({
  maxRetries: 3,
  initialDelay: 1000
});

try {
  const result = await retryPolicy.execute(
    async () => {
      // Function that might fail
      return await fetchSensitiveData(userId);
    },
    // Callback for each attempt
    (info) => {
      console.log(
        `Attempt ${info.attempt}/${info.maxRetries} ` +
        `${info.delay ? `(retry in ${info.delay}ms)` : ''}`
      );
    }
  );
  
  console.log('Data retrieved successfully');
} catch (error) {
  console.error('Failed to retrieve data after multiple attempts');
}
```

## Advanced Examples

### Handling Authentication

```typescript
import { HttpClient } from 'midaz-sdk/util/network';

class ApiService {
  private httpClient: HttpClient;
  private accessToken: string | null = null;
  
  constructor(baseUrl: string, apiKey: string) {
    this.httpClient = new HttpClient({
      baseUrls: { api: baseUrl },
      apiKey
    });
  }
  
  async authenticate() {
    try {
      const authResponse = await this.httpClient.post('api/auth', {
        apiKey: this.httpClient.getApiKey()
      });
      
      this.accessToken = authResponse.accessToken;
      
      // Update client headers with the new token
      this.httpClient.updateConfig({
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      return authResponse;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }
  
  async getAccounts() {
    if (!this.accessToken) {
      await this.authenticate();
    }
    
    try {
      return await this.httpClient.get('api/accounts');
    } catch (error) {
      // If authentication error, try to refresh token once
      if (error.category === 'authentication') {
        await this.authenticate();
        return await this.httpClient.get('api/accounts');
      }
      throw error;
    }
  }
}
```

### Uploading Files

```typescript
import { HttpClient } from 'midaz-sdk/util/network';
import { createReadStream } from 'fs';
import { basename } from 'path';
import FormData from 'form-data';

async function uploadDocument(client, orgId, filePath) {
  // Create a form with the file
  const form = new FormData();
  form.append('file', createReadStream(filePath));
  form.append('fileName', basename(filePath));
  form.append('organizationId', orgId);
  
  // Custom headers for multipart/form-data
  const headers = {
    ...form.getHeaders()
  };
  
  // Upload the document
  return client.post('onboarding/documents', form, {
    headers,
    timeout: 60000 // 1 minute for uploads
  });
}

// Usage
const httpClient = new HttpClient({
  baseUrls: { onboarding: 'https://api.midaz.io/v1/onboarding' },
  apiKey: 'your-api-key'
});

try {
  const document = await uploadDocument(
    httpClient,
    'org_12345',
    '/path/to/statement.pdf'
  );
  
  console.log(`Document uploaded with ID: ${document.id}`);
} catch (error) {
  console.error('Upload failed:', error);
}
```

### Downloading Large Files

```typescript
import { HttpClient } from 'midaz-sdk/util/network';
import { createWriteStream } from 'fs';

async function downloadReport(client, reportId, outputPath) {
  // Make a request with response type 'stream'
  const response = await client.get(`transaction/reports/${reportId}`, {
    responseType: 'stream',
    timeout: 120000 // 2 minutes for large downloads
  });
  
  // Create a write stream to the output file
  const writer = createWriteStream(outputPath);
  
  // Pipe the response stream to the file
  response.pipe(writer);
  
  // Return a promise that resolves when the download completes
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Usage
const httpClient = new HttpClient({
  baseUrls: { transaction: 'https://api.midaz.io/v1/transaction' },
  apiKey: 'your-api-key'
});

try {
  await downloadReport(
    httpClient,
    'report_12345',
    './reports/quarterly-summary.pdf'
  );
  
  console.log('Report downloaded successfully');
} catch (error) {
  console.error('Download failed:', error);
}
```

### Integrating with Enhanced Recovery

```typescript
import { HttpClient, RetryPolicy } from 'midaz-sdk/util/network';
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

async function processBankTransaction(client, transaction) {
  // Create a custom retry policy for this critical operation
  const criticalRetryPolicy = new RetryPolicy({
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000
  });
  
  // Update client with the custom retry policy
  client.updateConfig({
    retryPolicy: criticalRetryPolicy
  });
  
  // Use enhanced recovery with the HTTP client
  const result = await withEnhancedRecovery(
    async () => {
      // Create the transaction
      const response = await client.post(
        'transaction/transfers',
        transaction
      );
      
      // Verify the transaction was processed
      const status = await client.get(
        `transaction/transfers/${response.id}/status`
      );
      
      if (status.state !== 'completed') {
        throw new Error(`Transaction not completed: ${status.state}`);
      }
      
      return { ...response, status };
    },
    {
      // Additional recovery options
      fallbackAttempts: 2,
      enableSmartRecovery: true,
      
      // Transform operation for fallback attempts
      transformOperation: (error, attempt) => {
        if (error.message.includes('insufficient_funds')) {
          // Try with a lower amount on fallback
          const reducedAmount = transaction.amount * 0.9;
          const fallbackTx = { ...transaction, amount: reducedAmount };
          
          return async () => {
            return client.post('transaction/transfers', fallbackTx);
          };
        }
        return null;
      }
    }
  );
  
  return result;
}
```
