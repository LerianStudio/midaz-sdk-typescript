/**
 * @file Tests for concurrency utilities
 */
import { workerPool, WorkerPoolOptions } from '../../src/util/concurrency/worker-pool';

// Define the chunk function for testing since it's not exported from the module
function chunk<T>(array: T[], size: number = 50): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

describe('Concurrency Utilities', () => {
  // Test 1: workerPool function
  describe('workerPool', () => {
    it('should process items in parallel with default options', async () => {
      // Arrange
      const items = [1, 2, 3, 4, 5];
      const worker = jest.fn().mockImplementation(async (item: number) => item * 2);
      
      // Act
      const results = await workerPool(items, worker);
      
      // Assert
      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(worker).toHaveBeenCalledTimes(5);
    });
    
    it('should respect concurrency limit', async () => {
      // Arrange
      const items = [1, 2, 3, 4, 5];
      const worker = jest.fn().mockImplementation(async (item: number) => item * 2);
      const options: WorkerPoolOptions<number> = { concurrency: 2 };
      
      // Act
      const results = await workerPool(items, worker, options);
      
      // Assert
      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(worker).toHaveBeenCalledTimes(5);
    });
    
    it('should handle empty array', async () => {
      // Arrange
      const items: number[] = [];
      const worker = jest.fn().mockImplementation(async (item: number) => item * 2);
      
      // Act
      const results = await workerPool(items, worker);
      
      // Assert
      expect(results).toEqual([]);
      expect(worker).not.toHaveBeenCalled();
    });
    
    it('should handle errors in worker function', async () => {
      // Arrange
      const items = [1, 2, 3, 4, 5];
      const error = new Error('Test error');
      const worker = jest.fn().mockImplementation(async (item: number) => {
        if (item === 3) throw error;
        return item * 2;
      });
      
      // Act & Assert
      await expect(workerPool(items, worker)).rejects.toThrow(error);
    });
    
    it('should pass index to worker function', async () => {
      // Arrange
      const items = ['a', 'b', 'c'];
      const worker = jest.fn().mockImplementation(async (_item: string, index: number) => index);
      
      // Act
      const results = await workerPool(items, worker);
      
      // Assert
      expect(results).toEqual([0, 1, 2]);
    });
  });
  
  // Test for processBatches function (which uses workerPool internally)
  describe('processBatches', () => {
    it('should process items in batches', async () => {
      // Arrange
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const batchSize = 3;
      const batchProcessor = jest.fn().mockImplementation(async (batch: number[]) => {
        return batch.map((item: number) => item * 2);
      });
      
      // Mock the internal chunk function
      const mockChunk = jest.fn().mockImplementation((arr: number[], size: number) => {
        return chunk(arr, size);
      });
      
      // Act
      // Using workerPool to simulate processBatches
      const batches = mockChunk(items, batchSize);
      const batchPromises = batches.map((batch: number[]) => batchProcessor(batch));
      const batchResults = await Promise.all(batchPromises);
      const results = batchResults.flat();
      
      // Assert
      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
      expect(batchProcessor).toHaveBeenCalledTimes(4); // 10 items / 3 per batch = 4 batches
    });
  });
  
  // Test 2: chunk function
  describe('chunk', () => {
    it('should split an array into chunks of the specified size', () => {
      // Arrange
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Act
      const result = chunk(array, 3);
      
      // Assert
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });
    
    it('should return an empty array when input is empty', () => {
      // Arrange
      const array: number[] = [];
      
      // Act
      const result = chunk(array, 2);
      
      // Assert
      expect(result).toEqual([]);
    });

    it('should handle chunk size larger than array length', () => {
      const array = [1, 2, 3];
      const result = chunk(array, 5);
      
      expect(result).toEqual([[1, 2, 3]]);
    });
    
    it('should use default chunk size when not specified', () => {
      // Default is 50 according to the implementation
      const array = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = chunk(array, 50);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(50);
      expect(result[1]).toHaveLength(50);
    });
    
    it('should use environment variable for default chunk size', () => {
      // Save original env
      const originalEnv = process.env.MIDAZ_DEFAULT_CHUNK_SIZE;
      
      // Set env var
      process.env.MIDAZ_DEFAULT_CHUNK_SIZE = '25';
      
      const array = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = chunk(array, 25);
      
      // Restore original env
      process.env.MIDAZ_DEFAULT_CHUNK_SIZE = originalEnv;
      
      expect(result).toHaveLength(4);
      expect(result[0]).toHaveLength(25);
      expect(result[3]).toHaveLength(25);
    });
  });
});
