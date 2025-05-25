/**
 * Timeout Budget Manager
 * Tracks remaining time across retries to ensure operations complete within a total timeout
 */

export interface TimeoutBudgetOptions {
  /**
   * Total timeout budget in milliseconds
   */
  totalTimeout: number;

  /**
   * Minimum timeout per request in milliseconds
   * Ensures each retry gets at least this much time
   * @default 1000
   */
  minRequestTimeout?: number;

  /**
   * Buffer time to reserve for cleanup/processing between retries
   * @default 100
   */
  bufferTime?: number;
}

/**
 * Manages timeout budget across retries
 */
export class TimeoutBudget {
  private readonly startTime: number;
  private readonly totalTimeout: number;
  private readonly minRequestTimeout: number;
  private readonly bufferTime: number;
  private attemptCount = 0;

  constructor(options: TimeoutBudgetOptions) {
    this.startTime = Date.now();
    this.totalTimeout = options.totalTimeout;
    this.minRequestTimeout = options.minRequestTimeout || 1000;
    this.bufferTime = options.bufferTime || 100;
  }

  /**
   * Gets the remaining total budget
   */
  getRemainingBudget(): number {
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.totalTimeout - elapsed);
  }

  /**
   * Gets the timeout for the next request
   */
  getNextTimeout(requestedTimeout?: number): number {
    this.attemptCount++;
    const remaining = this.getRemainingBudget();

    // If we're out of budget, return 0
    if (remaining <= this.bufferTime) {
      return 0;
    }

    // Calculate available time for this request
    const availableTime = remaining - this.bufferTime;

    // Use requested timeout if provided and it fits in budget
    if (requestedTimeout && requestedTimeout <= availableTime) {
      return requestedTimeout;
    }

    // Otherwise use available time, but ensure minimum timeout
    return Math.max(this.minRequestTimeout, availableTime);
  }

  /**
   * Checks if we have budget for another attempt
   */
  hasRemainingBudget(): boolean {
    return this.getRemainingBudget() > this.minRequestTimeout + this.bufferTime;
  }

  /**
   * Gets the number of attempts made
   */
  getAttemptCount(): number {
    return this.attemptCount;
  }

  /**
   * Gets elapsed time since budget creation
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Creates an abort signal that triggers when budget expires
   */
  createAbortSignal(): AbortSignal {
    const controller = new AbortController();
    const remaining = this.getRemainingBudget();

    if (remaining <= 0) {
      controller.abort();
    } else {
      setTimeout(() => controller.abort(), remaining);
    }

    return controller.signal;
  }
}

/**
 * Timeout budget manager for tracking budgets across multiple operations
 */
export class TimeoutBudgetManager {
  private budgets: Map<string, TimeoutBudget> = new Map();
  private defaultOptions: TimeoutBudgetOptions;

  constructor(defaultOptions: TimeoutBudgetOptions) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Creates a new timeout budget
   */
  createBudget(key: string, options?: Partial<TimeoutBudgetOptions>): TimeoutBudget {
    const budget = new TimeoutBudget({
      ...this.defaultOptions,
      ...options,
    });
    this.budgets.set(key, budget);
    return budget;
  }

  /**
   * Gets an existing budget
   */
  getBudget(key: string): TimeoutBudget | undefined {
    return this.budgets.get(key);
  }

  /**
   * Removes a budget
   */
  removeBudget(key: string): void {
    this.budgets.delete(key);
  }

  /**
   * Cleans up expired budgets
   */
  cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, budget] of this.budgets.entries()) {
      if (!budget.hasRemainingBudget()) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.budgets.delete(key);
    }
  }

  /**
   * Gets all active budgets
   */
  getActiveBudgets(): Map<string, TimeoutBudget> {
    return new Map(this.budgets);
  }

  /**
   * Clears all budgets
   */
  clear(): void {
    this.budgets.clear();
  }
}
