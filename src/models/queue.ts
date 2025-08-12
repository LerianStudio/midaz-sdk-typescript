/**
 * Queue model and related types
 *
 * Queues are used to temporarily store transaction data before processing,
 * allowing for batched or asynchronous transaction handling.
 */

import { BaseModel } from './common';

/**
 * Queue data item represents a single data item in a queue
 */
export interface QueueData {
  /** Unique identifier for this queue data item */
  id: string;

  /** The actual data stored as any object */
  value: any;
}

/**
 * Queue represents a transaction queue in the Midaz system
 */
export interface Queue extends BaseModel {
  /** Organization ID that owns this queue */
  organizationId: string;

  /** Ledger ID associated with this queue */
  ledgerId: string;

  /** Audit ID for tracking purposes */
  auditId: string;

  /** Account ID associated with this queue */
  accountId: string;

  /** Collection of data items in this queue */
  queueData: QueueData[];
}

/**
 * Input for creating queue data
 */
export interface CreateQueueDataInput {
  /** Unique identifier for the queue data item */
  id: string;

  /** The data to store */
  value: any;
}

/**
 * Builder for queue operations
 */
export class QueueBuilder {
  private queue: Partial<Queue>;

  constructor(organizationId: string, ledgerId: string, accountId: string) {
    this.queue = {
      organizationId,
      ledgerId,
      accountId,
      queueData: [],
    };
  }

  /**
   * Set audit ID for the queue
   */
  withAuditId(auditId: string): QueueBuilder {
    this.queue.auditId = auditId;
    return this;
  }

  /**
   * Add a data item to the queue
   */
  addQueueData(id: string, value: any): QueueBuilder {
    if (!this.queue.queueData) {
      this.queue.queueData = [];
    }

    this.queue.queueData.push({
      id,
      value,
    });

    return this;
  }

  /**
   * Add multiple data items to the queue
   */
  addMultipleQueueData(items: CreateQueueDataInput[]): QueueBuilder {
    if (!this.queue.queueData) {
      this.queue.queueData = [];
    }

    items.forEach((item) => {
      this.queue.queueData!.push({
        id: item.id,
        value: item.value,
      });
    });

    return this;
  }

  /**
   * Remove a data item from the queue by ID
   */
  removeQueueData(id: string): QueueBuilder {
    if (this.queue.queueData) {
      this.queue.queueData = this.queue.queueData.filter((item) => item.id !== id);
    }
    return this;
  }

  /**
   * Clear all data items from the queue
   */
  clearQueueData(): QueueBuilder {
    this.queue.queueData = [];
    return this;
  }

  /**
   * Get the current queue data count
   */
  getDataCount(): number {
    return this.queue.queueData ? this.queue.queueData.length : 0;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.getDataCount() === 0;
  }

  /**
   * Build the final Queue (partial for creation)
   */
  build(): Omit<Queue, keyof BaseModel> {
    return {
      organizationId: this.queue.organizationId!,
      ledgerId: this.queue.ledgerId!,
      auditId: this.queue.auditId || '',
      accountId: this.queue.accountId!,
      queueData: this.queue.queueData || [],
    };
  }
}

/**
 * Helper function to create a queue builder
 */
export function createQueueBuilder(
  organizationId: string,
  ledgerId: string,
  accountId: string
): QueueBuilder {
  return new QueueBuilder(organizationId, ledgerId, accountId);
}

/**
 * Utility functions for queue operations
 */
export class QueueUtils {
  /**
   * Find a queue data item by ID
   */
  static findQueueDataById(queue: Queue, id: string): QueueData | undefined {
    return queue.queueData.find((item) => item.id === id);
  }

  /**
   * Get queue data items by value type
   */
  static getQueueDataByType<T>(queue: Queue, typeCheck: (value: any) => value is T): T[] {
    return queue.queueData.filter((item) => typeCheck(item.value)).map((item) => item.value);
  }

  /**
   * Get total size of queue data (number of items)
   */
  static getQueueSize(queue: Queue): number {
    return queue.queueData.length;
  }

  /**
   * Check if queue contains data with specific ID
   */
  static hasQueueDataWithId(queue: Queue, id: string): boolean {
    return queue.queueData.some((item) => item.id === id);
  }

  /**
   * Get all queue data IDs
   */
  static getAllQueueDataIds(queue: Queue): string[] {
    return queue.queueData.map((item) => item.id);
  }
}
