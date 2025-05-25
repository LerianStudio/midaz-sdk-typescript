/**
 * Tests for HttpAssetRateApiClient
 */

import { AssetRate, UpdateAssetRateInput } from '../../../src/models/asset-rate';
import { validateUpdateAssetRateInput } from '../../../src/models/validators/asset-rate-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpAssetRateApiClient } from '../../../src/api/http/http-asset-rate-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';
import { ValidationError } from '../../../src/util/validation';

// Mock dependencies
jest.mock('../../../src/models/validators/asset-rate-validator');

describe('HttpAssetRateApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const sourceAssetCode = 'USD';
  const destinationAssetCode = 'EUR';
  const rateId = 'rate_USD_EUR';
  const rateValue = 0.92;

  // Mock asset rate data
  const mockAssetRate: AssetRate = {
    id: rateId,
    fromAsset: sourceAssetCode,
    toAsset: destinationAssetCode,
    rate: rateValue,
    effectiveAt: new Date().toISOString(),
    expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mocks
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;

  // Class under test
  let client: HttpAssetRateApiClient;

  beforeEach(() => {
    // Create mock implementations
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      getBaseUrl: jest.fn().mockReturnValue('https://api.example.com'),
      buildUrl: jest.fn().mockImplementation((path) => `https://api.example.com${path}`),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();

    // Create client instance
    client = new HttpAssetRateApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getAssetRate', () => {
    it('should successfully get an asset rate', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce([mockAssetRate]);

      // Act
      const result = await client.getAssetRate(
        orgId,
        ledgerId,
        sourceAssetCode,
        destinationAssetCode
      );

      // Assert
      expect(result).toEqual(mockAssetRate);
      expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.get.success',
        1,
        expect.objectContaining({
          organizationId: orgId,
          ledgerId,
          sourceAssetCode,
          destinationAssetCode,
        })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.value',
        mockAssetRate.rate,
        expect.objectContaining({
          organizationId: orgId,
          ledgerId,
          sourceAssetCode,
          destinationAssetCode,
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should return 1.0 rate when source and destination assets are the same', async () => {
      // Act
      const result = await client.getAssetRate(orgId, ledgerId, sourceAssetCode, sourceAssetCode);

      // Assert
      expect(result.rate).toEqual(1.0);
      expect(result.fromAsset).toEqual(sourceAssetCode);
      expect(result.toAsset).toEqual(sourceAssetCode);
      expect(mockHttpClient.get).not.toHaveBeenCalled(); // No API call should be made
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.get.sameAsset',
        1,
        expect.objectContaining({
          organizationId: orgId,
          ledgerId,
          sourceAssetCode,
          destinationAssetCode: sourceAssetCode,
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw NotFoundError when rate not found in response', async () => {
      // Arrange
      // Return an empty array or array without the requested rate
      mockHttpClient.get.mockResolvedValueOnce([
        {
          ...mockAssetRate,
          toAsset: 'JPY', // Different destination asset
        },
      ]);

      // Act & Assert
      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow(`assetRate '${sourceAssetCode}-${destinationAssetCode}' not found`);
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('should throw error when missing organizationId', async () => {
      // Act & Assert
      await expect(
        client.getAssetRate('', ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow('organizationId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(
        client.getAssetRate(orgId, '', sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing sourceAssetCode', async () => {
      // Act & Assert
      await expect(client.getAssetRate(orgId, ledgerId, '', destinationAssetCode)).rejects.toThrow(
        'sourceAssetCode is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing destinationAssetCode', async () => {
      // Act & Assert
      await expect(client.getAssetRate(orgId, ledgerId, sourceAssetCode, '')).rejects.toThrow(
        'destinationAssetCode is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      // Arrange
      const error = new Error('Network Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow(`Failed to get asset rate for ${sourceAssetCode}-${destinationAssetCode}`);
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('should handle MidazError being thrown', async () => {
      // Arrange
      const midazError = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Asset not found',
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(midazError);

      // Act & Assert
      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toEqual(midazError);
      expect(mockSpan.recordException).toHaveBeenCalledWith(midazError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', midazError.message);
    });

    it('should wrap unexpected errors in MidazError', async () => {
      // We need to mock validateRequiredParams to throw a non-MidazError, non-ValidationError
      // Override the method temporarily using jest.spyOn for this specific test
      const spy = jest.spyOn(client as any, 'validateRequiredParams');
      spy.mockImplementationOnce(() => {
        throw new Error('Unexpected Error: Something went wrong');
      });

      // Act & Assert
      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow('Unexpected error: Unexpected Error: Something went wrong');

      // Restore the original implementation
      spy.mockRestore();
    });
  });

  describe('createOrUpdateAssetRate', () => {
    const updateInput: UpdateAssetRateInput = {
      fromAsset: sourceAssetCode,
      toAsset: destinationAssetCode,
      rate: rateValue,
      effectiveAt: new Date().toISOString(),
      expirationAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('should successfully create or update an asset rate', async () => {
      // Arrange
      mockHttpClient.put.mockResolvedValueOnce(mockAssetRate);
      (validateUpdateAssetRateInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.createOrUpdateAssetRate(orgId, ledgerId, updateInput);

      // Assert
      expect(result).toEqual(mockAssetRate);
      expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
      expect(mockHttpClient.put).toHaveBeenCalledWith(expect.any(String), {
        toAsset: updateInput.toAsset,
        rate: updateInput.rate,
        effectiveAt: updateInput.effectiveAt,
        expirationAt: updateInput.expirationAt,
      });
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.createOrUpdate.success',
        1,
        expect.objectContaining({
          organizationId: orgId,
          ledgerId,
          fromAsset: updateInput.fromAsset,
          toAsset: updateInput.toAsset,
        })
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.value',
        updateInput.rate,
        expect.objectContaining({
          organizationId: orgId,
          ledgerId,
          fromAsset: updateInput.fromAsset,
          toAsset: updateInput.toAsset,
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should set span attributes correctly', async () => {
      // Arrange
      mockHttpClient.put.mockResolvedValueOnce(mockAssetRate);
      (validateUpdateAssetRateInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      await client.createOrUpdateAssetRate(orgId, ledgerId, updateInput);

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('organizationId', orgId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('ledgerId', ledgerId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('fromAsset', updateInput.fromAsset);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('toAsset', updateInput.toAsset);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('rate', updateInput.rate);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('effectiveAt', updateInput.effectiveAt);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('expirationAt', updateInput.expirationAt);
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const validationError = new ValidationError('Validation failed');
      (validateUpdateAssetRateInput as jest.Mock).mockImplementationOnce(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(client.createOrUpdateAssetRate(orgId, ledgerId, updateInput)).rejects.toThrow(
        validationError
      );
      expect(mockHttpClient.put).not.toHaveBeenCalled();
      expect(mockSpan.recordException).toHaveBeenCalledWith(validationError);
    });

    it('should throw error when missing organizationId', async () => {
      // Act & Assert
      await expect(client.createOrUpdateAssetRate('', ledgerId, updateInput)).rejects.toThrow(
        'organizationId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.createOrUpdateAssetRate(orgId, '', updateInput)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      // Arrange
      const error = new Error('Network Error');
      mockHttpClient.put.mockRejectedValueOnce(error);
      (validateUpdateAssetRateInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act & Assert
      await expect(client.createOrUpdateAssetRate(orgId, ledgerId, updateInput)).rejects.toThrow(
        'Failed to create or update asset rate'
      );
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('should handle MidazError being thrown', async () => {
      // Arrange
      const midazError = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid data',
        statusCode: 400,
      });
      mockHttpClient.put.mockRejectedValueOnce(midazError);
      (validateUpdateAssetRateInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act & Assert
      await expect(client.createOrUpdateAssetRate(orgId, ledgerId, updateInput)).rejects.toEqual(
        midazError
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(midazError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', midazError.message);
    });

    it('should wrap unexpected errors in MidazError', async () => {
      // We need to mock validateRequiredParams to throw a non-MidazError, non-ValidationError
      // Override the method temporarily using jest.spyOn for this specific test
      const spy = jest.spyOn(client as any, 'validateRequiredParams');
      spy.mockImplementationOnce(() => {
        throw new Error('Unexpected Error: Something went wrong');
      });

      // Act & Assert
      await expect(client.createOrUpdateAssetRate(orgId, ledgerId, updateInput)).rejects.toThrow(
        'Unexpected error: Unexpected Error: Something went wrong'
      );

      // Restore the original implementation
      spy.mockRestore();
    });
  });

  describe('private methods', () => {
    describe('buildAssetRateUrl', () => {
      it('should build the correct asset rate URL', async () => {
        // Use getAssetRate to indirectly test the private method
        mockHttpClient.get.mockResolvedValueOnce([mockAssetRate]);

        await client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode);

        // Check that the URL was built correctly
        expect(mockUrlBuilder.getBaseUrl).toHaveBeenCalledWith('transaction');
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/organizations/${orgId}/ledgers/${ledgerId}/assets/${sourceAssetCode}/rates`
          )
        );
      });
    });

    describe('validateRequiredParams', () => {
      it('should validate required parameters and throw error if missing', async () => {
        // Test with missing parameters indirectly through getAssetRate
        await expect(
          client.getAssetRate('', ledgerId, sourceAssetCode, destinationAssetCode)
        ).rejects.toThrow('organizationId is required');
        await expect(
          client.getAssetRate(orgId, '', sourceAssetCode, destinationAssetCode)
        ).rejects.toThrow('ledgerId is required');
        await expect(
          client.getAssetRate(orgId, ledgerId, '', destinationAssetCode)
        ).rejects.toThrow('sourceAssetCode is required');
        await expect(client.getAssetRate(orgId, ledgerId, sourceAssetCode, '')).rejects.toThrow(
          'destinationAssetCode is required'
        );

        // Verify the error is recorded on the span
        expect(mockSpan.recordException).toHaveBeenCalled();
      });
    });

    describe('recordMetrics', () => {
      it('should record metrics with the observability provider', async () => {
        // Use a public method to indirectly test the private recordMetrics method
        mockHttpClient.get.mockResolvedValueOnce([mockAssetRate]);

        // Act
        await client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode);

        // Assert
        expect(mockObservability.recordMetric).toHaveBeenCalledWith(
          'assetRate.get.success',
          1,
          expect.objectContaining({
            organizationId: orgId,
            ledgerId,
            sourceAssetCode,
            destinationAssetCode,
          })
        );
        expect(mockObservability.recordMetric).toHaveBeenCalledWith(
          'assetRate.value',
          mockAssetRate.rate,
          expect.objectContaining({
            organizationId: orgId,
            ledgerId,
            sourceAssetCode,
            destinationAssetCode,
          })
        );
      });
    });
  });
});
