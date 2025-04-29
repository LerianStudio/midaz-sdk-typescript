/**
 */

import { ModelTransformer } from './model-transformer';

/**
 * Factory for creating version-specific model transformers
 * 
 * @template TClient - Client-side model type
 * @template TApiV1 - API model type for v1
 * @template TApiV2 - API model type for v2
 */
export interface VersionTransformerFactory<TClient, _TApiV1 = TClient, _TApiV2 = TClient> {
  /**
   * Get a model transformer for the specified API version
   * 
   * @returns Appropriate transformer for the version
   */
  getTransformer(version: string): ModelTransformer<TClient, any>;
}

/**
 * Creates a factory for version-specific model transformers
 * 
 * @returns A version transformer factory
 */
export function createVersionTransformerFactory<TClient>(
  transformers: Record<string, ModelTransformer<TClient, any>>,
  defaultVersion = 'v1'
): VersionTransformerFactory<TClient> {
  return {
    getTransformer(version: string): ModelTransformer<TClient, any> {
      return transformers[version] || transformers[defaultVersion];
    }
  };
}

/**
 * Identity transformer that doesn't change model format
 * Useful for creating version-specific transformers when not all versions need transformation
 * 
 * @template T - Model type
 */
export function createIdentityTransformer<T>(): ModelTransformer<T, T> {
  return {
    toApiModel: (model: T) => model,
    toClientModel: (model: T) => model
  };
}