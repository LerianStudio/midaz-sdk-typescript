/**
 * @file Tests for the AssetRatesServiceImpl implementation
 * @description Unit tests for the AssetRatesService implementation
 */

import { AssetRatesServiceImpl } from '../../../src/entities/implementations/asset-rates-impl';
import { AssetRateApiClient } from '../../../src/api/interfaces/asset-rate-api-client';
import { AssetRate, UpdateAssetRateInput } from '../../../src/models/asset-rate';
import { ValidationError } from '../../../src/util/validation';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';
import { Observability } from '../../../src/util/observability/observability';

// Mock the Observability
jest.mock('../../../src/util/observability/observability', () => {
  return {
    Observability: jest.fn().mockImplementation(() => {
      return {
        startSpan: jest.fn().mockReturnValue({
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          setStatus: jest.fn(),
          end: jest.fn(),
        }),
        recordMetric: jest.fn(),
      };
    }),
  };
});

describe('AssetRatesServiceImpl', () => {
  let assetRatesService: AssetRatesServiceImpl;
  let assetRateApiClient: jest.Mocked<AssetRateApiClient>;
  let mockObservability: jest.Mocked<Observability>;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const sourceAssetCode = 'USD';
  const destinationAssetCode = 'EUR';
  const rateId = 'rate_789';

  const externalId = '019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f';

  const mockAssetRate: AssetRate = {
    id: rateId,
    organizationId: orgId,
    ledgerId,
    externalId,
    from: sourceAssetCode,
    to: destinationAssetCode,
    rate: 92,
    scale: 2,
    source: 'Central Bank',
    ttl: 3600,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    metadata: {},
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock AssetRateApiClient
    assetRateApiClient = {
      getAssetRate: jest.fn(),
      getAssetRateByExternalId: jest.fn(),
      createOrUpdateAssetRate: jest.fn(),
    } as unknown as jest.Mocked<AssetRateApiClient>;

    // Create mock Observability
    mockObservability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
      }),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    // Create the service instance
    assetRatesService = new AssetRatesServiceImpl(assetRateApiClient, mockObservability);
  });

  describe('getAssetRate', () => {
    it('should get an asset rate successfully', async () => {
      // Setup
      assetRateApiClient.getAssetRate.mockResolvedValueOnce(mockAssetRate);

      // Execute
      const result = await assetRatesService.getAssetRate(
        orgId,
        ledgerId,
        sourceAssetCode,
        destinationAssetCode
      );

      // Verify
      expect(assetRateApiClient.getAssetRate).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        sourceAssetCode,
        destinationAssetCode
      );
      expect(result).toEqual(mockAssetRate);
    });

    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new ValidationError('Organization ID is required');
      assetRateApiClient.getAssetRate.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(
        assetRatesService.getAssetRate('', ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow('Organization ID is required');

      expect(assetRateApiClient.getAssetRate).toHaveBeenCalledWith(
        '',
        ledgerId,
        sourceAssetCode,
        destinationAssetCode
      );
    });

    it('should delegate validation of other parameters to the API client', async () => {
      // Setup - test for empty destination asset code
      const validationError = new ValidationError('Destination asset code is required');
      assetRateApiClient.getAssetRate.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(
        assetRatesService.getAssetRate(orgId, ledgerId, sourceAssetCode, '')
      ).rejects.toThrow('Destination asset code is required');

      expect(assetRateApiClient.getAssetRate).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        sourceAssetCode,
        ''
      );
    });

    it('should handle API errors', async () => {
      // Setup
      const apiError = new MidazError({
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'API Error',
        operation: 'getAssetRate',
      });
      assetRateApiClient.getAssetRate.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(
        assetRatesService.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow(apiError);
    });
  });

  describe('createOrUpdateAssetRate', () => {
    it('should create or update an asset rate successfully', async () => {
      // Setup
      const input: UpdateAssetRateInput = {
        from: sourceAssetCode,
        to: destinationAssetCode,
        rate: 92,
        scale: 2,
      };

      assetRateApiClient.createOrUpdateAssetRate.mockResolvedValueOnce(mockAssetRate);

      // Execute
      const result = await assetRatesService.createOrUpdateAssetRate(orgId, ledgerId, input);

      // Verify
      expect(assetRateApiClient.createOrUpdateAssetRate).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        input
      );
      expect(result).toEqual(mockAssetRate);
    });

    it('should delegate validation to the API client', async () => {
      // Setup
      const input: UpdateAssetRateInput = {
        from: sourceAssetCode,
        to: destinationAssetCode,
        rate: 92,
        scale: 2,
      };

      const validationError = new ValidationError('Organization ID is required');
      assetRateApiClient.createOrUpdateAssetRate.mockRejectedValueOnce(validationError);

      // Execute & Verify
      await expect(assetRatesService.createOrUpdateAssetRate('', ledgerId, input)).rejects.toThrow(
        'Organization ID is required'
      );

      expect(assetRateApiClient.createOrUpdateAssetRate).toHaveBeenCalledWith('', ledgerId, input);
    });

    it('should handle API errors', async () => {
      // Setup
      const input: UpdateAssetRateInput = {
        from: sourceAssetCode,
        to: destinationAssetCode,
        rate: 92,
        scale: 2,
      };

      const apiError = new Error('API Error');
      assetRateApiClient.createOrUpdateAssetRate.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(
        assetRatesService.createOrUpdateAssetRate(orgId, ledgerId, input)
      ).rejects.toThrow(apiError);
    });
  });

  describe('getAssetRateByExternalId', () => {
    it('should delegate to the API client', async () => {
      assetRateApiClient.getAssetRateByExternalId.mockResolvedValueOnce(mockAssetRate);

      const result = await assetRatesService.getAssetRateByExternalId(orgId, ledgerId, externalId);

      expect(assetRateApiClient.getAssetRateByExternalId).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        externalId
      );
      expect(result).toEqual(mockAssetRate);
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('API Error');
      assetRateApiClient.getAssetRateByExternalId.mockRejectedValueOnce(apiError);

      await expect(
        assetRatesService.getAssetRateByExternalId(orgId, ledgerId, externalId)
      ).rejects.toThrow(apiError);
    });
  });
});
