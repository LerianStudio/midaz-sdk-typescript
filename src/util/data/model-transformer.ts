/**
 */

import { ApiResponse } from '../../models/common';

/**
 * Interface for transforming models between client and API formats
 *
 * @template TClient - Client-side model type
 * @template TApi - API model type
 */
export interface ModelTransformer<TClient, TApi> {
  /** Transforms a client model to an API model */
  toApiModel(model: TClient): TApi;

  /** Transforms an API model to a client model */
  toClientModel(model: TApi): TClient;
}

/**
 * Creates a model transformer with the given transformation functions
 *
 * @template TClient - Client-side model type
 * @template TApi - API model type
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
 * Transforms API responses to client models (single, array, or paginated)
 *
 * @template TClient - Client-side model type
 * @template TApi - API model type
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
 * @template TClient - Client-side model type
 * @template TApi - API model type
 */
export function transformRequest<TClient, TApi>(
  transformer: ModelTransformer<TClient, TApi>,
  request: TClient
): TApi {
  return transformer.toApiModel(request);
}
