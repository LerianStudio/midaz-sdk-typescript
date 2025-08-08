/**
 * Operation Route model and related types
 * 
 * Operation routes define routing configuration for operations,
 * specifying how operations should be processed and directed.
 */

import { BaseModel, Metadata } from './common';

/**
 * Account rule for operation routing
 */
export interface AccountRule {
  /** Type of rule (alias, account_type, etc.) */
  ruleType: 'alias' | 'account_type';
  
  /** Value to validate against (alias name or array of account types) */
  validIf: string | string[];
}

/**
 * Operation Route represents routing configuration for operations
 */
export interface OperationRoute extends BaseModel {
  /** Unique identifier for the operation route */
  id: string;
  
  /** Organization ID that owns this operation route */
  organizationId: string;
  
  /** Ledger ID where this operation route belongs */
  ledgerId: string;
  
  /** Short title summarizing the purpose of the operation */
  title: string;
  
  /** Detailed description of the operation route purpose and usage */
  description: string;
  
  /** Type of operation (source, destination) */
  operationType: 'source' | 'destination';
  
  /** Account selection rules */
  account?: AccountRule;
  
  /** Custom metadata for the operation route */
  metadata?: Metadata;
  
  /** Timestamp when the operation route was created */
  createdAt: string;
  
  /** Timestamp when the operation route was last updated */
  updatedAt: string;
  
  /** Timestamp when the operation route was deleted (if applicable) */
  deletedAt?: string;
}

/**
 * Input for creating a new operation route
 */
export interface CreateOperationRouteInput {
  /** Short title summarizing the purpose of the operation */
  title: string;
  
  /** Detailed description of the operation route purpose and usage */
  description: string;
  
  /** Type of operation (source, destination) */
  operationType: 'source' | 'destination';
  
  /** Account selection rules */
  account?: AccountRule;
  
  /** Custom metadata for the operation route */
  metadata?: Metadata;
}

/**
 * Input for updating an existing operation route
 */
export interface UpdateOperationRouteInput {
  /** Short title summarizing the purpose of the operation */
  title?: string;
  
  /** Detailed description of the operation route purpose and usage */
  description?: string;
  
  /** Account selection rules */
  account?: AccountRule;
  
  /** Custom metadata for the operation route */
  metadata?: Metadata;
}

/**
 * Builder for creating operation route input
 */
export class OperationRouteBuilder {
  private input: CreateOperationRouteInput;

  constructor(title: string, description: string, operationType: 'source' | 'destination') {
    this.input = {
      title,
      description,
      operationType,
    };
  }

  /**
   * Set account rule using alias-based selection
   */
  withAccountAlias(alias: string): OperationRouteBuilder {
    this.input.account = {
      ruleType: 'alias',
      validIf: alias,
    };
    return this;
  }

  /**
   * Set account rule using account type-based selection
   */
  withAccountTypes(accountTypes: string[]): OperationRouteBuilder {
    this.input.account = {
      ruleType: 'account_type',
      validIf: accountTypes,
    };
    return this;
  }

  /**
   * Set metadata for the operation route
   */
  withMetadata(metadata: Metadata): OperationRouteBuilder {
    this.input.metadata = metadata;
    return this;
  }

  /**
   * Build the final CreateOperationRouteInput
   */
  build(): CreateOperationRouteInput {
    return { ...this.input };
  }
}

/**
 * Builder for updating operation route input
 */
export class UpdateOperationRouteBuilder {
  private input: UpdateOperationRouteInput;

  constructor() {
    this.input = {};
  }

  /**
   * Set title for the operation route
   */
  withTitle(title: string): UpdateOperationRouteBuilder {
    this.input.title = title;
    return this;
  }

  /**
   * Set description for the operation route
   */
  withDescription(description: string): UpdateOperationRouteBuilder {
    this.input.description = description;
    return this;
  }

  /**
   * Set account rule using alias-based selection
   */
  withAccountAlias(alias: string): UpdateOperationRouteBuilder {
    this.input.account = {
      ruleType: 'alias',
      validIf: alias,
    };
    return this;
  }

  /**
   * Set account rule using account type-based selection
   */
  withAccountTypes(accountTypes: string[]): UpdateOperationRouteBuilder {
    this.input.account = {
      ruleType: 'account_type',
      validIf: accountTypes,
    };
    return this;
  }

  /**
   * Set metadata for the operation route
   */
  withMetadata(metadata: Metadata): UpdateOperationRouteBuilder {
    this.input.metadata = metadata;
    return this;
  }

  /**
   * Build the final UpdateOperationRouteInput
   */
  build(): UpdateOperationRouteInput {
    return { ...this.input };
  }
}

/**
 * Helper function to create an operation route builder
 */
export function createOperationRouteBuilder(
  title: string,
  description: string,
  operationType: 'source' | 'destination'
): OperationRouteBuilder {
  return new OperationRouteBuilder(title, description, operationType);
}

/**
 * Helper function to create an update operation route builder
 */
export function createUpdateOperationRouteBuilder(): UpdateOperationRouteBuilder {
  return new UpdateOperationRouteBuilder();
}