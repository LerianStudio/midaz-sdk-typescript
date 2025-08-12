/**
 * Transaction Route model and related types
 *
 * Transaction routes define routing configuration for transactions,
 * specifying how transactions should be processed using operation routes.
 */

import { BaseModel, Metadata } from './common';

/**
 * Transaction Route represents routing configuration for transactions
 */
export interface TransactionRoute extends BaseModel {
  /** Unique identifier for the transaction route */
  id: string;

  /** Organization ID that owns this transaction route */
  organizationId: string;

  /** Ledger ID where this transaction route belongs */
  ledgerId: string;

  /** Short title summarizing the purpose of the transaction */
  title: string;

  /** Detailed description of the transaction route */
  description: string;

  /** Array of operation route IDs that make up this transaction route */
  operationRoutes: string[];

  /** Custom metadata for the transaction route */
  metadata?: Metadata;

  /** Timestamp when the transaction route was created */
  createdAt: string;

  /** Timestamp when the transaction route was last updated */
  updatedAt: string;

  /** Timestamp when the transaction route was deleted (if applicable) */
  deletedAt?: string;
}

/**
 * Input for creating a new transaction route
 */
export interface CreateTransactionRouteInput {
  /** Short title summarizing the purpose of the transaction */
  title: string;

  /** Detailed description of the transaction route */
  description: string;

  /** Array of operation route IDs that make up this transaction route */
  operationRoutes: string[];

  /** Custom metadata for the transaction route */
  metadata?: Metadata;
}

/**
 * Input for updating an existing transaction route
 */
export interface UpdateTransactionRouteInput {
  /** Short title summarizing the purpose of the transaction */
  title?: string;

  /** Detailed description of the transaction route */
  description?: string;

  /** Array of operation route IDs that make up this transaction route */
  operationRoutes?: string[];

  /** Custom metadata for the transaction route */
  metadata?: Metadata;
}

/**
 * Builder for creating transaction route input
 */
export class TransactionRouteBuilder {
  private input: CreateTransactionRouteInput;

  constructor(title: string, description: string, operationRoutes: string[]) {
    this.input = {
      title,
      description,
      operationRoutes: [...operationRoutes],
    };
  }

  /**
   * Add an operation route ID to the transaction route
   */
  addOperationRoute(operationRouteId: string): TransactionRouteBuilder {
    if (!this.input.operationRoutes.includes(operationRouteId)) {
      this.input.operationRoutes.push(operationRouteId);
    }
    return this;
  }

  /**
   * Remove an operation route ID from the transaction route
   */
  removeOperationRoute(operationRouteId: string): TransactionRouteBuilder {
    this.input.operationRoutes = this.input.operationRoutes.filter((id) => id !== operationRouteId);
    return this;
  }

  /**
   * Set metadata for the transaction route
   */
  withMetadata(metadata: Metadata): TransactionRouteBuilder {
    this.input.metadata = metadata;
    return this;
  }

  /**
   * Build the final CreateTransactionRouteInput
   */
  build(): CreateTransactionRouteInput {
    return {
      ...this.input,
      operationRoutes: [...this.input.operationRoutes],
    };
  }
}

/**
 * Builder for updating transaction route input
 */
export class UpdateTransactionRouteBuilder {
  private input: UpdateTransactionRouteInput;

  constructor() {
    this.input = {};
  }

  /**
   * Set title for the transaction route
   */
  withTitle(title: string): UpdateTransactionRouteBuilder {
    this.input.title = title;
    return this;
  }

  /**
   * Set description for the transaction route
   */
  withDescription(description: string): UpdateTransactionRouteBuilder {
    this.input.description = description;
    return this;
  }

  /**
   * Set operation routes for the transaction route
   */
  withOperationRoutes(operationRoutes: string[]): UpdateTransactionRouteBuilder {
    this.input.operationRoutes = [...operationRoutes];
    return this;
  }

  /**
   * Add an operation route ID to the transaction route
   */
  addOperationRoute(operationRouteId: string): UpdateTransactionRouteBuilder {
    if (!this.input.operationRoutes) {
      this.input.operationRoutes = [];
    }
    if (!this.input.operationRoutes.includes(operationRouteId)) {
      this.input.operationRoutes.push(operationRouteId);
    }
    return this;
  }

  /**
   * Remove an operation route ID from the transaction route
   */
  removeOperationRoute(operationRouteId: string): UpdateTransactionRouteBuilder {
    if (this.input.operationRoutes) {
      this.input.operationRoutes = this.input.operationRoutes.filter(
        (id) => id !== operationRouteId
      );
    }
    return this;
  }

  /**
   * Set metadata for the transaction route
   */
  withMetadata(metadata: Metadata): UpdateTransactionRouteBuilder {
    this.input.metadata = metadata;
    return this;
  }

  /**
   * Build the final UpdateTransactionRouteInput
   */
  build(): UpdateTransactionRouteInput {
    return {
      ...this.input,
      operationRoutes: this.input.operationRoutes ? [...this.input.operationRoutes] : undefined,
    };
  }
}

/**
 * Helper function to create a transaction route builder
 */
export function createTransactionRouteBuilder(
  title: string,
  description: string,
  operationRoutes: string[]
): TransactionRouteBuilder {
  return new TransactionRouteBuilder(title, description, operationRoutes);
}

/**
 * Helper function to create an update transaction route builder
 */
export function createUpdateTransactionRouteBuilder(): UpdateTransactionRouteBuilder {
  return new UpdateTransactionRouteBuilder();
}
