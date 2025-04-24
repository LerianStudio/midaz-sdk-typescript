/**
 * @file Retry policy implementation for the Midaz SDK
 * @description Provides configurable retry logic with exponential backoff for API requests
 */

import { MidazError } from '../error';

/**
 * Retry configuration options for controlling retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay between retries in milliseconds
   * @default 100
   */
  initialDelay?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 1000
   */
  maxDelay?: number;

  /**
   * HTTP status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryableStatusCodes?: number[];

  /**
   * Custom function to determine if an error should trigger a retry
   * This function will be called with the error object and should return true if the request should be retried
   */
  retryCondition?: (error: Error) => boolean;
}

// Import ConfigService
import { ConfigService } from '../config';

/**
 * Default retry options
 * @internal
 */
function getDefaultRetryOptions(): RetryOptions {
  const configService = ConfigService.getInstance();
  const retryPolicyConfig = configService.getRetryPolicyConfig();
  
  return {
    maxRetries: retryPolicyConfig.maxRetries,
    initialDelay: retryPolicyConfig.initialDelay,
    maxDelay: retryPolicyConfig.maxDelay,
    retryableStatusCodes: retryPolicyConfig.retryableStatusCodes,
  };
}

/**
 * Retry policy for handling transient failures
 *
 * This class provides configurable retry logic with exponential backoff
 * for API requests that fail due to transient issues.
 *
 * @example
 * ```typescript
 * // Create a retry policy with custom options
 * const retryPolicy = new RetryPolicy({
 *   maxRetries: 5,
 *   initialDelay: 200,
 *   maxDelay: 2000,
 *   retryableStatusCodes: [429, 500, 503]
 * });
 *
 * // Use the retry policy to execute a function with retries
 * try {
 *   const result = await retryPolicy.execute(async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) {
 *       throw new Error(`HTTP error ${response.status}`);
 *     }
 *     return response.json();
 *   });
 *   console.log('Success:', result);
 * } catch (error) {
 *   console.error('Failed after retries:', error);
 * }
 * ```
 */
export class RetryPolicy {
  /**
   * Maximum number of retry attempts
   * @private
   */
  private maxRetries: number;

  /**
   * Initial delay between retries in milliseconds
   * @private
   */
  private initialDelay: number;

  /**
   * Maximum delay between retries in milliseconds
   * @private
   */
  private maxDelay: number;

  /**
   * HTTP status codes that should trigger a retry
   * @private
   */
  private retryableStatusCodes: number[];

  /**
   * Custom function to determine if an error should trigger a retry
   * @private
   */
  private retryCondition?: (error: Error) => boolean;

  /**
   * Creates a new retry policy
   *
   * @param options - Configuration options for the retry policy
   */
  constructor(options: RetryOptions = {}) {
    const defaultOptions = getDefaultRetryOptions();
    // Use explicit type assertions to avoid type errors
    this.maxRetries = (options.maxRetries !== undefined ? options.maxRetries : defaultOptions.maxRetries) as number;
    this.initialDelay = (options.initialDelay !== undefined ? options.initialDelay : defaultOptions.initialDelay) as number;
    this.maxDelay = (options.maxDelay !== undefined ? options.maxDelay : defaultOptions.maxDelay) as number;
    this.retryableStatusCodes = (options.retryableStatusCodes || defaultOptions.retryableStatusCodes) as number[];
    this.retryCondition = options.retryCondition;
  }

  /**
   * Executes a function with retry logic
   *
   * @param fn - Function to execute with retry logic
   * @returns Promise resolving to the function's result
   * @throws Error if all retry attempts fail
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Execute the function
        return await fn();
      } catch (error) {
        // Cast error to Error type
        const err = error as Error;
        lastError = err;

        // Check if we've reached the maximum number of retries
        if (attempt >= this.maxRetries) {
          break;
        }

        // Check if the error is retryable
        if (!this.isRetryable(err)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // If we've reached this point, all retry attempts have failed
    throw lastError;
  }

  /**
   * Checks if an error is retryable
   *
   * @param error - Error to check
   * @returns Whether the error is retryable
   * @private
   */
  private isRetryable(error: unknown): boolean {
    // Check custom retry condition if provided
    if (this.retryCondition && error instanceof Error) {
      return this.retryCondition(error);
    }

    // Check if the error is a MidazError with a status code
    if (error instanceof MidazError && error.statusCode) {
      return this.retryableStatusCodes.includes(error.statusCode);
    }

    // Check for network errors
    if (
      error instanceof Error &&
      error.message &&
      typeof error.message === 'string' &&
      (error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ECONNRESET'))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Calculates the delay for a retry attempt with exponential backoff
   *
   * @param attempt - Current attempt number (0-based)
   * @returns Delay in milliseconds
   * @private
   */
  private calculateDelay(attempt: number): number {
    // Calculate delay with exponential backoff: initialDelay * 2^attempt
    const exponentialDelay = this.initialDelay * Math.pow(2, attempt);

    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * 100;

    // Ensure delay doesn't exceed maximum
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  /**
   * Sleeps for a specified duration
   *
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after the specified duration
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
