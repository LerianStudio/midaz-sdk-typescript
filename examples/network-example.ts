/**
 * Network Utility Example
 *
 * This example demonstrates how to use the network utilities from the Midaz SDK
 * to make HTTP requests with advanced features like retries, timeouts, and error handling.
 */

import { HttpClient } from '../src/util/network';
import { ErrorCategory, MidazError } from '../src/util/error';

// Example 1: Basic HTTP Client Usage
async function basicHttpClientExample() {
  console.log('\n=== Basic HTTP Client Example ===');

  // Create an HTTP client with default settings
  const httpClient = new HttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000, // 10 seconds
  });

  try {
    // Make a GET request
    console.log('Making GET request to /posts/1...');
    const post = await httpClient.get('/posts/1');
    console.log('Response:', post);

    // Make a POST request
    console.log('\nMaking POST request to /posts...');
    const newPost = await httpClient.post('/posts', {
      body: {
        title: 'New Post',
        body: 'This is a new post created with the Midaz SDK',
        userId: 1,
      },
    });
    console.log('Response:', newPost);

    // Make a PUT request
    console.log('\nMaking PUT request to /posts/1...');
    const updatedPost = await httpClient.put('/posts/1', {
      body: {
        id: 1,
        title: 'Updated Post',
        body: 'This post has been updated with the Midaz SDK',
        userId: 1,
      },
    });
    console.log('Response:', updatedPost);

    // Make a DELETE request
    console.log('\nMaking DELETE request to /posts/1...');
    const deleteResponse = await httpClient.delete('/posts/1');
    console.log('Response:', deleteResponse);
  } catch (error) {
    if (error instanceof MidazError) {
      console.error('Error making request:', error.message);
      console.error('Error category:', error.category);
      console.error('Error code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 2: Advanced HTTP Client Configuration
async function advancedHttpClientExample() {
  console.log('\n=== Advanced HTTP Client Example ===');

  // Create an HTTP client with advanced configuration
  const httpClient = new HttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 15000, // 15 seconds
    headers: {
      'X-API-Key': 'demo-api-key',
      'User-Agent': 'Midaz-SDK-Example/1.0',
    },
    keepAliveEnabled: true,
    maxSockets: 5,
  });

  try {
    // Make a request with query parameters
    console.log('Making GET request with query parameters...');
    const posts = await httpClient.get('/posts', {
      params: {
        userId: 1,
        _limit: 5,
      },
    });
    console.log(`Fetched ${posts.length} posts`);

    // Make a request with a custom timeout
    console.log('\nMaking GET request with custom timeout...');
    const comments = await httpClient.get('/posts/1/comments', {
      timeout: 5000, // 5 seconds
    });
    console.log(`Fetched ${comments.length} comments`);
  } catch (error) {
    if (error instanceof MidazError) {
      console.error('Error making request:', error.message);
      console.error('Error category:', error.category);
      console.error('Error code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 3: Error Handling and Retries
async function errorHandlingExample() {
  console.log('\n=== Error Handling and Retries Example ===');

  // Create an HTTP client with retry configuration
  const httpClient = new HttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 5000,
    // Set retry policy configuration inline
    maxRetries: 3,
    retryDelay: 1000,
    /* retryPolicy: new RetryPolicy({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      retryCondition: (error: Error): boolean => {
        if (error instanceof MidazError) {
          return (
            error.category === ErrorCategory.NETWORK ||
            (error.statusCode !== undefined && error.statusCode >= 500)
          );
        }
        return false;
      },
    }), */
  });

  try {
    // Simulate a request to a non-existent endpoint (will cause 404)
    console.log('Making GET request to non-existent endpoint...');
    await httpClient.get('/non-existent-endpoint');
  } catch (error) {
    if (error instanceof MidazError) {
      console.error('Error making request:', error.message);
      console.error('Error category:', error.category);
      console.error('Error code:', error.code);
      console.error('Status code:', error.statusCode);
      console.error('Was retried:', error.category === ErrorCategory.NETWORK);
      console.error('Status code:', error.statusCode || 'N/A');
    } else {
      console.error('Unexpected error:', error);
    }
  }

  // Create a client that will simulate network errors
  const unreliableClient = new HttpClient({
    baseURL: 'https://this-domain-does-not-exist-123456789.com',
    timeout: 3000,
  });

  try {
    // This should fail with a DNS resolution error
    console.log('\nMaking request to non-existent domain (will retry)...');
    await unreliableClient.get('/api');
  } catch (error) {
    if (error instanceof MidazError) {
      console.error('Error making request:', error.message);
      console.error('Error category:', error.category);
      console.error('Error code:', error.code);
      console.error('Was retried:', error.category === ErrorCategory.NETWORK);
      console.error('Status code:', error.statusCode || 'N/A');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 4: Request Cancellation
async function requestCancellationExample() {
  console.log('\n=== Request Cancellation Example ===');

  // Create an HTTP client
  const httpClient = new HttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 30000, // Long timeout
  });

  // Create an AbortController
  const controller = new AbortController();
  const signal = controller.signal;

  // Set up a timeout to cancel the request after 1 second
  setTimeout(() => {
    console.log('Cancelling request...');
    controller.abort();
  }, 1000);

  try {
    // Make a request that would normally take longer
    console.log('Making GET request with cancellation...');
    await httpClient.get('/posts', {
      signal,
      params: {
        _delay: 3000, // Simulate a 3-second delay
      },
    });
    console.log('Request completed successfully (this should not happen)');
  } catch (error) {
    if (error instanceof MidazError) {
      console.error('Error making request:', error.message);
      console.error('Error category:', error.category);
      console.error('Error code:', error.code);
      console.error('Was cancelled:', error.category === ErrorCategory.CANCELLATION);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run the examples
async function runExamples() {
  try {
    await basicHttpClientExample();
    await advancedHttpClientExample();
    await errorHandlingExample();
    await requestCancellationExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
// Note: In a pure TypeScript/ESM environment, this check is handled differently
// For Node.js execution:
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
}
