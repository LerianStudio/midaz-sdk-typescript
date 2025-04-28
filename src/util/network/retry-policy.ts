/**
 * @file Retry policy
 * @description Configurable retry logic with exponential backoff for API requests
 */

import { MidazError } from '../error';

/**
 * Retry configuration options for controlling retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts @default 3 */
  maxRetries?: number;

  /** Initial delay between retries in milliseconds @default 100 */
  initialDelay?: number;

  /** Maximum delay between retries in milliseconds @default 1000 */
  maxDelay?: number;

  /** HTTP status codes that should trigger a retry @default [408, 429, 500, 502, 503, 504] */
  retryableStatusCodes?: number[];

  /** Custom function to determine if an error should trigger a retry */
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
 * const result = await retryPolicy.execute(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   if (!response.ok) {
 *     throw new Error(`HTTP error ${response.status}`);
 *   }
 *   return response.json();
 * });
 * ```
 */
export class RetryPolicy {
  /** Maximum number of retry attempts @private */
  private maxRetries: number;

  /** Initial delay between retries in milliseconds @private */
  private initialDelay: number;

  /** Maximum delay between retries in milliseconds @private */
  private maxDelay: number;

  /** HTTP status codes that should trigger a retry @private */
  private retryableStatusCodes: number[];

  /** Custom function to determine if an error should trigger a retry @private */
  private retryCondition?: (error: Error) => boolean;

  /** Creates a new retry policy with specified or default options */
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
   * @param onAttempt - Optional callback that receives the current attempt number and retry information
   * @returns Promise resolving to the function's result
   * @throws Error if all retry attempts fail
   */
  public async execute<T>(
    fn: () => Promise<T>, 
    onAttempt?: (info: { attempt: number; maxRetries: number; delay?: number }) => void
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      // Call the onAttempt callback if provided
      if (onAttempt) {
        onAttempt({ attempt, maxRetries: this.maxRetries });
      }
      
      try {
        return await fn();
      } catch (error) {
        const err = error as Error;
        lastError = err;

        if (attempt >= this.maxRetries || !this.isRetryable(err)) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        
        // Call the onAttempt callback with delay information if provided
        if (onAttempt) {
          onAttempt({ attempt, maxRetries: this.maxRetries, delay });
        }
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /** Checks if an error is retryable @private */
  private isRetryable(error: unknown): boolean {
    if (this.retryCondition && error instanceof Error) {
      return this.retryCondition(error);
    }

    if (error instanceof MidazError && error.statusCode) {
      return this.retryableStatusCodes.includes(error.statusCode);
    }

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

  /** Calculates delay with exponential backoff and jitter @private */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.initialDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 100;
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  /** Sleeps for a specified duration in milliseconds @private */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
