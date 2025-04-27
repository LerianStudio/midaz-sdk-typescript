/**
 * Tests for HttpAssetApiClient
 */

import { Asset, CreateAssetInput, UpdateAssetInput } from '../../../src/models/asset';
import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { validateCreateAssetInput, validateUpdateAssetInput } from '../../../src/models/validators/asset-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpAssetApiClient } from '../../../src/api/http/http-asset-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { MidazError, ErrorCategory, ErrorCode } from '../../../src/util/error';

// Mock dependencies
jest.mock('../../../src/models/validators/asset-validator');
// Validation mock
const validateMock = jest.fn();
jest.mock('../../../src/util/validation', () => ({
  validate: (input: any, validator: any) => {
    // Call the mock function to track calls and allow for return value configuration
    return validateMock(input, validator);
  },
}));

describe('HttpAssetApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const assetId = 'asset-789';

  // Mock asset data
  const mockAsset: Asset = {
    id: assetId,
    name: 'Test Asset',
    code: 'TEST',
    organizationId: orgId,
    ledgerId: ledgerId,
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    type: 'currency',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock asset list response
  const mockAssetListResponse: ListResponse<Asset> = {
    items: [mockAsset],
    meta: {
      total: 1,
      count: 1,
      nextCursor: 'next-cursor'
    }
  };

  // Mocks
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;

  // Class under test
  let client: HttpAssetApiClient;

  beforeEach(() => {
    // Create mock implementations
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn()
    } as unknown as jest.Mocked<Span>;

    mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn()
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      buildAssetUrl: jest.fn().mockImplementation((orgId, ledgerId, assetId) => {
        let url = `/organizations/${orgId}/ledgers/${ledgerId}/assets`;
        if (assetId) {
          url += `/${assetId}`;
        }
        return url;
      })
    } as unknown as jest.Mocked<UrlBuilder>;

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpAssetApiClient(
      mockHttpClient,
      mockUrlBuilder,
      mockObservability
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listAssets', () => {
    it('should successfully list assets', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAssetListResponse);

      // Act
      const result = await client.listAssets(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockAssetListResponse);
      expect(mockUrlBuilder.buildAssetUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: undefined
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAssetListResponse);
      const options: ListOptions = { limit: 10, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listAssets(orgId, ledgerId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: options
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listAssets('', ledgerId)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listAssets(orgId, '')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listAssets(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', 'API Error');
    });
  });

  describe('getAsset', () => {
    it('should successfully get an asset by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAsset);

      // Act
      const result = await client.getAsset(orgId, ledgerId, assetId);

      // Assert
      expect(result).toEqual(mockAsset);
      expect(mockUrlBuilder.buildAssetUrl).toHaveBeenCalledWith(orgId, ledgerId, assetId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String)
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should set spans with asset information', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAsset);

      // Act
      await client.getAsset(orgId, ledgerId, assetId);

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('orgId', orgId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('ledgerId', ledgerId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('assetId', assetId);
    });

    it('should record metrics after successful request', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockAsset);

      // Act
      await client.getAsset(orgId, ledgerId, assetId);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith('assets.get', 1, expect.objectContaining({
        orgId,
        ledgerId,
        assetId,
        assetCode: 'TEST'
      }));
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getAsset('', ledgerId, assetId)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getAsset(orgId, '', assetId)).rejects.toThrow();
    });

    it('should throw error when missing assetId', async () => {
      // Act & Assert
      await expect(client.getAsset(orgId, ledgerId, '')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Asset not found',
        statusCode: 404
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getAsset(orgId, ledgerId, assetId)).rejects.toThrow('Asset not found');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', 'Asset not found');
    });
  });

  describe('createAsset', () => {
    const createInput: CreateAssetInput = {
      name: 'New Asset',
      code: 'NEW',
      type: 'currency'
    };

    it('should successfully create an asset', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockAsset);

      // Act
      const result = await client.createAsset(orgId, ledgerId, createInput);

      // Assert
      expect(result).toEqual(mockAsset);
      expect(mockUrlBuilder.buildAssetUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        createInput
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should set appropriate spans when creating an asset', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockAsset);

      // Act
      await client.createAsset(orgId, ledgerId, createInput);

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('orgId', orgId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('ledgerId', ledgerId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('assetCode', 'NEW');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('assetName', 'New Asset');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('assetType', 'currency');
    });

    it('should update span with created asset ID after success', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce({
        ...mockAsset,
        id: 'new-asset-123'
      });

      // Act
      await client.createAsset(orgId, ledgerId, createInput);

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('assetId', 'new-asset-123');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.createAsset(orgId, ledgerId, createInput)).rejects.toThrow('Validation error');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.createAsset('', ledgerId, createInput)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.createAsset(orgId, '', createInput)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createAsset(orgId, ledgerId, createInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', 'API Error');
    });
  });

  describe('updateAsset', () => {
    const updateInput: UpdateAssetInput = {
      name: 'Updated Asset'
    };

    it('should successfully update an asset', async () => {
      // Arrange
      mockHttpClient.patch.mockResolvedValueOnce({ ...mockAsset, name: 'Updated Asset' });

      // Act
      const result = await client.updateAsset(orgId, ledgerId, assetId, updateInput);

      // Assert
      expect(result).toEqual({ ...mockAsset, name: 'Updated Asset' });
      expect(mockUrlBuilder.buildAssetUrl).toHaveBeenCalledWith(orgId, ledgerId, assetId);
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        expect.any(String),
        updateInput
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should set update-specific spans when updating with name', async () => {
      // Arrange
      mockHttpClient.patch.mockResolvedValueOnce({ ...mockAsset, name: 'Updated Asset' });

      // Act
      await client.updateAsset(orgId, ledgerId, assetId, { name: 'Updated Asset' });

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedName', 'Updated Asset');
    });

    it('should set update-specific spans when updating with metadata', async () => {
      // Arrange
      mockHttpClient.patch.mockResolvedValueOnce({
        ...mockAsset,
        metadata: { test: 'value' }
      });

      // Act
      await client.updateAsset(orgId, ledgerId, assetId, { metadata: { test: 'value' } });

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
    });

    it('should set update-specific spans when updating with status', async () => {
      // Arrange
      mockHttpClient.patch.mockResolvedValueOnce({
        ...mockAsset,
        status: { code: StatusCode.INACTIVE, timestamp: new Date().toISOString() }
      });

      // Act
      await client.updateAsset(orgId, ledgerId, assetId, { status: StatusCode.INACTIVE });

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', StatusCode.INACTIVE);
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.updateAsset(orgId, ledgerId, assetId, updateInput)).rejects.toThrow('Validation error');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updateAsset('', ledgerId, assetId, updateInput)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updateAsset(orgId, '', assetId, updateInput)).rejects.toThrow();
    });

    it('should throw error when missing assetId', async () => {
      // Act & Assert
      await expect(client.updateAsset(orgId, ledgerId, '', updateInput)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateAsset(orgId, ledgerId, assetId, updateInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', 'API Error');
    });
  });

  describe('deleteAsset', () => {
    it('should successfully delete an asset', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteAsset(orgId, ledgerId, assetId);

      // Assert
      expect(mockUrlBuilder.buildAssetUrl).toHaveBeenCalledWith(orgId, ledgerId, assetId);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        expect.any(String)
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should record delete-specific metrics', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteAsset(orgId, ledgerId, assetId);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith('assets.delete', 1, expect.objectContaining({
        orgId,
        ledgerId,
        assetId
      }));
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.deleteAsset('', ledgerId, assetId)).rejects.toThrow();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deleteAsset(orgId, '', assetId)).rejects.toThrow();
    });

    it('should throw error when missing assetId', async () => {
      // Act & Assert
      await expect(client.deleteAsset(orgId, ledgerId, '')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deleteAsset(orgId, ledgerId, assetId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', 'API Error');
    });
  });
});