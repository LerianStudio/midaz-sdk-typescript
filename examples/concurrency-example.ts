/**
 * Concurrency Utility Example
 *
 * This example demonstrates how to use the concurrency utilities from the Midaz SDK
 * to implement parallel processing with controlled concurrency.
 */

import { chunk, workerPool } from '../src/util/concurrency';

// Example 1: Basic Worker Pool Usage
async function basicWorkerPoolExample(): Promise<void> {
  console.log('\n=== Basic Worker Pool Example ===');

  // Create a list of items to process
  const items: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  console.log('Processing items:', items);

  // Process items with a worker pool (3 concurrent operations)
  const results: number[] = await workerPool(
    items,
    async (item: number, _index: number): Promise<number> => {
      // Simulate a time-consuming operation
      console.log(`Processing item ${item}...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return item * 2;
    },
    {
      concurrency: 3,
      preserveOrder: true, // Results will be in the same order as input
    }
  );

  console.log('Results:', results);
  // Output: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
}

// Example 2: Unordered Worker Pool for Maximum Throughput
async function unorderedWorkerPoolExample(): Promise<void> {
  console.log('\n=== Unordered Worker Pool Example ===');

  // Create a list of items with varying processing times
  const items: { id: number; processingTime: number }[] = [
    { id: 1, processingTime: 3000 },
    { id: 2, processingTime: 1000 },
    { id: 3, processingTime: 2000 },
    { id: 4, processingTime: 500 },
    { id: 5, processingTime: 1500 },
  ];

  console.log(
    'Processing items with varying times:',
    items.map((item) => item.id)
  );

  // Process items with an unordered worker pool (2 concurrent operations)
  const startTime: number = Date.now();

  const results: { id: number; result: string; originalIndex: number }[] = await workerPool(
    items,
    async (
      item: { id: number; processingTime: number },
      index: number
    ): Promise<{ id: number; result: string; originalIndex: number }> => {
      console.log(`Starting item ${item.id} (processing time: ${item.processingTime}ms)...`);
      await new Promise((resolve) => setTimeout(resolve, item.processingTime));
      console.log(`Finished item ${item.id}`);
      return {
        id: item.id,
        result: `Processed item ${item.id}`,
        originalIndex: index,
      };
    },
    {
      concurrency: 2,
      preserveOrder: false, // Results will be returned as they complete
    }
  );

  const totalTime: number = Date.now() - startTime;

  console.log('Results (unordered):', results);
  console.log(`Total processing time: ${totalTime}ms`);
}

// Example 3: Processing Data in Chunks
async function chunkProcessingExample(): Promise<void> {
  console.log('\n=== Chunk Processing Example ===');

  // Create a larger dataset
  const largeDataset: string[] = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

  console.log(`Processing large dataset with ${largeDataset.length} items`);

  // Divide the dataset into chunks of size 10
  const chunkSize = 10;
  const chunks: string[][] = chunk(largeDataset, chunkSize);

  console.log(`Divided into ${chunks.length} chunks of size ${chunkSize}`);

  // Process each chunk with the worker pool
  const results: string[][] = await workerPool(
    chunks,
    async (chunkItems: string[], chunkIndex: number): Promise<string[]> => {
      console.log(`Processing chunk ${chunkIndex + 1} with ${chunkItems.length} items...`);

      // Simulate batch processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Process all items in the chunk
      return chunkItems.map((item) => `Processed ${item}`);
    },
    {
      concurrency: 2,
      preserveOrder: true,
    }
  );

  // Flatten the results
  const flatResults: string[] = results.flat();

  console.log(`Processed ${flatResults.length} items in chunks`);
  console.log('First 5 results:', flatResults.slice(0, 5));
}

// Example 4: Real-world API Batch Processing
async function apiBatchProcessingExample(): Promise<void> {
  console.log('\n=== API Batch Processing Example ===');

  // Simulate a list of user IDs to fetch
  const userIds: string[] = [
    'user1',
    'user2',
    'user3',
    'user4',
    'user5',
    'user6',
    'user7',
    'user8',
    'user9',
    'user10',
  ];

  console.log(`Fetching details for ${userIds.length} users...`);

  // Mock API function
  const fetchUserDetails = async (userId: string): Promise<any> => {
    // Simulate API call with random response time (200-800ms)
    const responseTime: number = 200 + Math.floor(Math.random() * 600);
    await new Promise((resolve) => setTimeout(resolve, responseTime));

    // Simulate occasional API errors
    if (Math.random() < 0.2) {
      throw new Error(`API error for user ${userId}`);
    }

    return {
      id: userId,
      name: `User ${userId.replace('user', '')}`,
      email: `${userId}@example.com`,
      status: Math.random() > 0.5 ? 'active' : 'inactive',
    };
  };

  // Process user IDs with retry logic
  const errorMessages: string[] = [];

  const userDetails: any[] = await workerPool(
    userIds,
    async (userId: string, _index: number): Promise<any> => {
      console.log(`Fetching details for ${userId}...`);

      // Try up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const details: any = await fetchUserDetails(userId);
          console.log(`Successfully fetched details for ${userId}`);
          return details;
        } catch (error: any) {
          const errorMsg = `Attempt ${attempt} failed for ${userId}: ${error.message}`;
          errorMessages.push(errorMsg);

          if (attempt === 3) {
            // Return partial data on final failure
            return {
              id: userId,
              error: 'Failed to fetch complete details',
              partial: true,
            };
          }

          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }

      // This return is needed to satisfy TypeScript, though it should never be reached
      return {
        id: userId,
        error: 'Failed to fetch complete details',
        partial: true,
      };
    },
    {
      concurrency: 3,
      preserveOrder: true,
      continueOnError: true,
      onError: (error: Error, index: number) => {
        const errorMsg = `Error processing user ${userIds[index]}: ${error.message}`;
        errorMessages.push(errorMsg);
      },
    }
  );

  console.log('User details:', userDetails);

  // Print error messages after showing the results
  if (errorMessages.length > 0) {
    console.log('\nError messages during processing:');
    errorMessages.forEach((msg) => console.error(msg));
  }
}

// Run the examples
async function runExamples(): Promise<void> {
  try {
    await basicWorkerPoolExample();
    await unorderedWorkerPoolExample();
    await chunkProcessingExample();
    await apiBatchProcessingExample();
  } catch (error: any) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
// Note: In a pure TypeScript/ESM environment, this check is handled differently
// For Node.js execution:
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
}
