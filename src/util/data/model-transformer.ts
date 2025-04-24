/**
 * @file Model transformer utilities
 * @description Utilities for transforming models between different formats
 */

import { ApiResponse } from '../../models/common';

/**
 * Base interface for model transformers
 * Defines methods for transforming models between client and API formats
 *
 * @template TClient - The client-side model type
 * @template TApi - The API model type
 */
export interface ModelTransformer<TClient, TApi> {
  /**
   * Transforms a client model to an API model
   *
   * @param model - The client model to transform
   * @returns The transformed API model
   */
  toApiModel(model: TClient): TApi;

  /**
   * Transforms an API model to a client model
   *
   * @param model - The API model to transform
   * @returns The transformed client model
   */
  toClientModel(model: TApi): TClient;
}

/**
 * Creates a model transformer with the given transformation functions
 *
 * @template TClient - The client-side model type
 * @template TApi - The API model type
 * @param toApiModel - Function to transform client model to API model
 * @param toClientModel - Function to transform API model to client model
 * @returns A model transformer
 */
export function createModelTransformer<TClient, TApi>(
  toApiModel: (model: TClient) => TApi,
  toClientModel: (model: TApi) => TClient
): ModelTransformer<TClient, TApi> {
  return {
    toApiModel,
    toClientModel,
  };
}

/**
 * Transforms a single API response or an array of API responses to client models
 *
 * @template TClient - The client-side model type
 * @template TApi - The API model type
 * @param transformer - The model transformer to use
 * @param response - The API response to transform (single model, array, or ApiResponse)
 * @returns Transformed client model(s)
 */
export function transformResponse<TClient, TApi>(
  transformer: ModelTransformer<TClient, TApi>,
  response: TApi | TApi[] | ApiResponse
): TClient | TClient[] | ApiResponse {
  // If response is an array, transform each item
  if (Array.isArray(response)) {
    return response.map((item) => transformer.toClientModel(item));
  }

  // If response has items property and items is an array, transform items
  if (
    response &&
    typeof response === 'object' &&
    'items' in response &&
    Array.isArray((response as any).items)
  ) {
    const listResponse = response as any;
    return {
      ...listResponse,
      items: listResponse.items.map((item: TApi) => transformer.toClientModel(item)),
    };
  }

  // If response is a single model, transform it
  if (response && typeof response === 'object' && !('items' in response)) {
    return transformer.toClientModel(response as TApi);
  }

  // Otherwise, return the response as is
  return response as any;
}

/**
 * Transforms a request from client format to API format
 *
 * @template TClient - The client-side model type
 * @template TApi - The API model type
 * @param transformer - The model transformer to use
 * @param request - The client request to transform
 * @returns Transformed API request
 */
export function transformRequest<TClient, TApi>(
  transformer: ModelTransformer<TClient, TApi>,
  request: TClient
): TApi {
  return transformer.toApiModel(request);
}
