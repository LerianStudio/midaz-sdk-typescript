/**
 * to standardize common operations and reduce code duplication
 */

/**
 * Metadata value types that can be stored in a model's metadata
 */
export type MetadataValue = string | number | boolean | null | MetadataObject | MetadataArray;

/**
 * Metadata object type for nested objects
 */
export interface MetadataObject {
  [key: string]: MetadataValue;
}

/**
 * Metadata array type for nested arrays
 */
export type MetadataArray = MetadataValue[];

/**
 * Base interface for all buildable models with common fields
 * This interface defines the common fields that most models have
 */
export interface BuildableModel {
  metadata?: Record<string, MetadataValue>;
  status?: string;
  name?: string;
}

/**
 * Generic builder interface for all models
 * This interface defines the common methods that all builders should provide
 */
export interface Builder<T extends BuildableModel, B> {
  /**
   * Get the built model
   */
  build(): T;

  /**
   * Set metadata on the model
   */
  withMetadata(metadata: Record<string, MetadataValue>): B;

  /**
   * Set status on the model (if applicable)
   */
  withStatus?(status: string): B;

  /**
   * Set name on the model (if applicable)
   */
  withName?(name: string): B;
}

/**
 * Base builder class implementing the common builder methods
 */
export class ModelBuilder<T extends BuildableModel, B extends Builder<T, B>>
  implements Builder<T, B>
{
  protected model: T;

  constructor(model: T) {
    this.model = model;
  }

  /**
   * Get the built model
   */
  build(): T {
    return { ...this.model };
  }

  /**
   * Set metadata on the model
   */
  withMetadata(metadata: Record<string, MetadataValue>): B {
    this.model.metadata = metadata;
    return this as unknown as B;
  }

  /**
   * Set status on the model (if applicable)
   */
  withStatus(status: string): B {
    if ('status' in this.model) {
      this.model.status = status;
    }
    return this as unknown as B;
  }

  /**
   * Set name on the model (if applicable)
   */
  withName(name: string): B {
    if ('name' in this.model) {
      this.model.name = name;
    }
    return this as unknown as B;
  }
}

// Removed original functional helper methods since we now use the builder pattern
