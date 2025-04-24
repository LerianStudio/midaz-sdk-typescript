/**
 * @file Tests for the AssetsServiceImpl implementation
 * @description Unit tests for the AssetsService implementation
 */

import { AssetsServiceImpl } from '../../../src/entities/implementations/assets-impl';
import { Observability } from '../../../src/util/observability';
import { 
  Asset, 
  CreateAssetInput, 
  UpdateAssetInput 
} from '../../../src/models/asset';
import { ListResponse, StatusCode } from '../../../src/models/common';
import { AssetApiClient } from '../../../src/api/interfaces/asset-api-client';

// Mock the Observability
jest.mock('../../../src/util/observability/observability', () => {
  return {
    Observability: jest.fn().mockImplementation(() => {
      return {
        startSpan: jest.fn().mockReturnValue({
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          setStatus: jest.fn(),
          end: jest.fn()
        }),
        recordMetric: jest.fn()
      };
    })
  };
});

describe('AssetsServiceImpl', () => {
  let assetsService: AssetsServiceImpl;
  let mockAssetApiClient: jest.Mocked<AssetApiClient>;
  let observability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const assetId = 'ast_789';
  
  const mockAsset: Asset = {
    id: assetId,
    code: 'USD',
    name: 'US Dollar',
    type: 'currency',
    status: {
      code: 'ACTIVE',
      timestamp: '2023-01-01T00:00:00Z'
    },
    ledgerId: ledgerId,
    organizationId: orgId,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };
  
  const mockAssetsList: ListResponse<Asset> = {
    items: [mockAsset],
    meta: {
      total: 1,
      count: 1
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock AssetApiClient
    mockAssetApiClient = {
      listAssets: jest.fn(),
      getAsset: jest.fn(),
      createAsset: jest.fn(),
      updateAsset: jest.fn(),
      deleteAsset: jest.fn()
    } as unknown as jest.Mocked<AssetApiClient>;
    
    // Create a mock Observability instance
    observability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      }),
      recordMetric: jest.fn()
    } as unknown as jest.Mocked<Observability>;
    
    // Create the service instance
    assetsService = new AssetsServiceImpl(mockAssetApiClient, observability);
  });

  describe('listAssets', () => {
    it('should list assets successfully', async () => {
      // Setup
      mockAssetApiClient.listAssets.mockResolvedValueOnce(mockAssetsList);
      
      // Execute
      const result = await assetsService.listAssets(orgId, ledgerId);
      
      // Verify
      expect(mockAssetApiClient.listAssets).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined
      );
      expect(result).toEqual(mockAssetsList);
    });
    
    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = { 
        limit: 5, 
        offset: 10,
        filter: { code: 'USD' }
      };
      mockAssetApiClient.listAssets.mockResolvedValueOnce(mockAssetsList);
      
      // Execute
      const result = await assetsService.listAssets(orgId, ledgerId, listOptions);
      
      // Verify
      expect(mockAssetApiClient.listAssets).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        listOptions
      );
      expect(result).toEqual(mockAssetsList);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      mockAssetApiClient.listAssets.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(assetsService.listAssets('', ledgerId))
        .rejects.toThrow('Organization ID is required');
      expect(mockAssetApiClient.listAssets).toHaveBeenCalledWith(
        '',
        ledgerId,
        undefined
      );
    });
    
    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockAssetApiClient.listAssets.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(assetsService.listAssets(orgId, ledgerId))
        .rejects.toThrow('API Error');
    });
  });

  describe('getAsset', () => {
    it('should get an asset by ID successfully', async () => {
      // Setup
      mockAssetApiClient.getAsset.mockResolvedValueOnce(mockAsset);
      
      // Execute
      const result = await assetsService.getAsset(orgId, ledgerId, assetId);
      
      // Verify
      expect(mockAssetApiClient.getAsset).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        assetId
      );
      expect(result).toEqual(mockAsset);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Validation failed');
      mockAssetApiClient.getAsset.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(assetsService.getAsset('', ledgerId, assetId))
        .rejects.toThrow('Validation failed');
      expect(mockAssetApiClient.getAsset).toHaveBeenCalledWith(
        '',
        ledgerId,
        assetId
      );
    });
    
    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockAssetApiClient.getAsset.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(assetsService.getAsset(orgId, ledgerId, assetId))
        .rejects.toThrow('API Error');
    });
  });

  describe('createAsset', () => {
    it('should create an asset successfully', async () => {
      // Setup
      const createInput: CreateAssetInput = {
        code: 'EUR',
        name: 'Euro',
        type: 'currency'
      };
      mockAssetApiClient.createAsset.mockResolvedValueOnce(mockAsset);
      
      // Execute
      const result = await assetsService.createAsset(orgId, ledgerId, createInput);
      
      // Verify
      expect(mockAssetApiClient.createAsset).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        createInput
      );
      expect(result).toEqual(mockAsset);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const createInput: CreateAssetInput = {
        code: 'EUR',
        name: 'Euro',
        type: 'currency'
      };
      const validationError = new Error('Validation failed');
      mockAssetApiClient.createAsset.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(assetsService.createAsset('', ledgerId, createInput))
        .rejects.toThrow('Validation failed');
      expect(mockAssetApiClient.createAsset).toHaveBeenCalledWith(
        '',
        ledgerId,
        createInput
      );
    });
    
    it('should handle API errors', async () => {
      // Setup
      const createInput: CreateAssetInput = {
        code: 'EUR',
        name: 'Euro',
        type: 'currency'
      };
      const apiError = new Error('API Error');
      mockAssetApiClient.createAsset.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(assetsService.createAsset(orgId, ledgerId, createInput))
        .rejects.toThrow('API Error');
    });
  });

  describe('updateAsset', () => {
    it('should update an asset successfully', async () => {
      // Setup
      const updateInput: UpdateAssetInput = {
        name: 'Updated US Dollar',
        status: StatusCode.INACTIVE
      };
      mockAssetApiClient.updateAsset.mockResolvedValueOnce(mockAsset);
      
      // Execute
      const result = await assetsService.updateAsset(orgId, ledgerId, assetId, updateInput);
      
      // Verify
      expect(mockAssetApiClient.updateAsset).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        assetId,
        updateInput
      );
      expect(result).toEqual(mockAsset);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const updateInput: UpdateAssetInput = {
        name: 'Updated US Dollar'
      };
      const validationError = new Error('Validation failed');
      mockAssetApiClient.updateAsset.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(assetsService.updateAsset('', ledgerId, assetId, updateInput))
        .rejects.toThrow('Validation failed');
      expect(mockAssetApiClient.updateAsset).toHaveBeenCalledWith(
        '',
        ledgerId,
        assetId,
        updateInput
      );
    });
    
    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdateAssetInput = {
        name: 'Updated US Dollar'
      };
      const apiError = new Error('API Error');
      mockAssetApiClient.updateAsset.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(assetsService.updateAsset(orgId, ledgerId, assetId, updateInput))
        .rejects.toThrow('API Error');
    });
  });

  describe('deleteAsset', () => {
    it('should delete an asset successfully', async () => {
      // Setup
      mockAssetApiClient.deleteAsset.mockResolvedValueOnce(undefined);
      
      // Execute
      await assetsService.deleteAsset(orgId, ledgerId, assetId);
      
      // Verify
      expect(mockAssetApiClient.deleteAsset).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        assetId
      );
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Validation failed');
      mockAssetApiClient.deleteAsset.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(assetsService.deleteAsset('', ledgerId, assetId))
        .rejects.toThrow('Validation failed');
      expect(mockAssetApiClient.deleteAsset).toHaveBeenCalledWith(
        '',
        ledgerId,
        assetId
      );
    });
    
    it('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API Error');
      mockAssetApiClient.deleteAsset.mockRejectedValueOnce(apiError);
      
      // Execute & Verify
      await expect(assetsService.deleteAsset(orgId, ledgerId, assetId))
        .rejects.toThrow('API Error');
    });
  });
});
