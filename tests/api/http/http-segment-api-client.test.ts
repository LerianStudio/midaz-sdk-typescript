/**
 * Tests for HttpSegmentApiClient
 */

import { ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { validateCreateSegmentInput, validateUpdateSegmentInput } from '../../../src/models/validators/segment-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { validate } from '../../../src/util/validation';
import { HttpSegmentApiClient } from '../../../src/api/http/http-segment-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { CreateSegmentInput, Segment, UpdateSegmentInput } from '../../../src/api/interfaces/segment-api-client';

// Mock dependencies
jest.mock('../../../src/models/validators/segment-validator');
jest.mock('../../../src/util/validation', () => ({
  validate: jest.fn()
}));

describe('HttpSegmentApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const segmentId = 'segment-789';
  const parentSegmentId = 'segment-parent-123';

  // Mock segment data
  const mockSegment: Segment = {
    id: segmentId,
    name: 'Test Segment',
    organizationId: orgId,
    ledgerId: ledgerId,
    parentSegmentId: parentSegmentId,
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    metadata: { category: 'test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock segment list response
  const mockSegmentListResponse: ListResponse<Segment> = {
    items: [mockSegment],
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
  let client: HttpSegmentApiClient;

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
      buildSegmentUrl: jest.fn().mockImplementation((orgId, ledgerId) => {
        return `/organizations/${orgId}/ledgers/${ledgerId}/segments`;
      })
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    jest.clearAllMocks();
    (validate as jest.Mock).mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpSegmentApiClient(
      mockHttpClient,
      mockUrlBuilder,
      mockObservability
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listSegments', () => {
    it('should successfully list segments', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockSegmentListResponse);

      // Act
      const result = await client.listSegments(orgId, ledgerId);

      // Assert
      expect(result).toEqual(mockSegmentListResponse);
      expect(mockUrlBuilder.buildSegmentUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/ledgers/${ledgerId}/segments`),
        { params: undefined }
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'segments.list.count',
        1,
        expect.objectContaining({
          orgId,
          ledgerId
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockSegmentListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listSegments(orgId, ledgerId, options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: options }
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.listSegments('', ledgerId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.listSegments(orgId, '')).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listSegments(orgId, ledgerId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getSegment', () => {
    it('should successfully get a segment by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockSegment);

      // Act
      const result = await client.getSegment(orgId, ledgerId, segmentId);

      // Assert
      expect(result).toEqual(mockSegment);
      expect(mockUrlBuilder.buildSegmentUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/segments/${segmentId}`
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'segments.get',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          segmentId
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.getSegment('', ledgerId, segmentId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.getSegment(orgId, '', segmentId)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing segmentId', async () => {
      // Act & Assert
      await expect(client.getSegment(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getSegment(orgId, ledgerId, segmentId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('createSegment', () => {
    const createInput: CreateSegmentInput = {
      name: 'New Segment',
      parentSegmentId: parentSegmentId,
      status: StatusCode.ACTIVE,
      metadata: { category: 'new' }
    };

    it('should successfully create a segment', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockSegment);

      // Act
      const result = await client.createSegment(orgId, ledgerId, createInput);

      // Assert
      expect(result).toEqual(mockSegment);
      expect(mockUrlBuilder.buildSegmentUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/segments`,
        createInput
      );
      expect(validate).toHaveBeenCalledWith(createInput, validateCreateSegmentInput);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'segments.create',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          segmentName: createInput.name
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('segmentName', createInput.name);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('segmentId', mockSegment.id);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const validationError = new Error('Validation error');
      (validate as jest.Mock).mockImplementationOnce(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(client.createSegment(orgId, ledgerId, createInput)).rejects.toThrow('Validation error');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockSpan.recordException).toHaveBeenCalledWith(validationError);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.createSegment('', ledgerId, createInput)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.createSegment(orgId, '', createInput)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createSegment(orgId, ledgerId, createInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('updateSegment', () => {
    const updateInput: UpdateSegmentInput = {
      name: 'Updated Segment',
      status: StatusCode.INACTIVE,
      metadata: { category: 'updated' }
    };

    it('should successfully update a segment', async () => {
      // Arrange
      const updatedSegment = {
        ...mockSegment,
        name: updateInput.name,
        status: { code: updateInput.status || StatusCode.INACTIVE, timestamp: new Date().toISOString() },
        metadata: updateInput.metadata
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedSegment);

      // Act
      const result = await client.updateSegment(orgId, ledgerId, segmentId, updateInput);

      // Assert
      expect(result).toEqual(updatedSegment);
      expect(mockUrlBuilder.buildSegmentUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/segments/${segmentId}`,
        updateInput
      );
      expect(validate).toHaveBeenCalledWith(updateInput, validateUpdateSegmentInput);
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'segments.update',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          segmentId
        })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedName', updateInput.name);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', updateInput.status);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should handle partial updates with only name', async () => {
      // Arrange
      const partialInput: UpdateSegmentInput = { name: 'Renamed Segment' };
      const updatedSegment = { ...mockSegment, name: partialInput.name };
      mockHttpClient.patch.mockResolvedValueOnce(updatedSegment);

      // Act
      const result = await client.updateSegment(orgId, ledgerId, segmentId, partialInput);

      // Assert
      expect(result).toEqual(updatedSegment);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedName', partialInput.name);
      // Status and metadata attributes should not be set
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedStatus', expect.anything());
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedMetadata', expect.anything());
    });

    it('should handle partial updates with only status', async () => {
      // Arrange
      const partialInput: UpdateSegmentInput = { status: StatusCode.INACTIVE };
      const updatedSegment = { 
        ...mockSegment, 
        status: { code: partialInput.status || StatusCode.INACTIVE, timestamp: new Date().toISOString() } 
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedSegment);

      // Act
      const result = await client.updateSegment(orgId, ledgerId, segmentId, partialInput);

      // Assert
      expect(result).toEqual(updatedSegment);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', partialInput.status);
      // Name and metadata attributes should not be set
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedName', expect.anything());
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedMetadata', expect.anything());
    });

    it('should handle partial updates with only metadata', async () => {
      // Arrange
      const partialInput: UpdateSegmentInput = { metadata: { category: 'test-updated' } };
      const updatedSegment = { ...mockSegment, metadata: partialInput.metadata };
      mockHttpClient.patch.mockResolvedValueOnce(updatedSegment);

      // Act
      const result = await client.updateSegment(orgId, ledgerId, segmentId, partialInput);

      // Assert
      expect(result).toEqual(updatedSegment);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      // Name and status attributes should not be set
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedName', expect.anything());
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('updatedStatus', expect.anything());
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const validationError = new Error('Validation error');
      (validate as jest.Mock).mockImplementationOnce(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(client.updateSegment(orgId, ledgerId, segmentId, updateInput)).rejects.toThrow('Validation error');
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
      expect(mockSpan.recordException).toHaveBeenCalledWith(validationError);
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.updateSegment('', ledgerId, segmentId, updateInput)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.updateSegment(orgId, '', segmentId, updateInput)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing segmentId', async () => {
      // Act & Assert
      await expect(client.updateSegment(orgId, ledgerId, '', updateInput)).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateSegment(orgId, ledgerId, segmentId, updateInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('deleteSegment', () => {
    it('should successfully delete a segment', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteSegment(orgId, ledgerId, segmentId);

      // Assert
      expect(mockUrlBuilder.buildSegmentUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/organizations/${orgId}/ledgers/${ledgerId}/segments/${segmentId}`
      );
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'segments.delete',
        1,
        expect.objectContaining({
          orgId,
          ledgerId,
          segmentId
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing orgId', async () => {
      // Act & Assert
      await expect(client.deleteSegment('', ledgerId, segmentId)).rejects.toThrow('orgId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing ledgerId', async () => {
      // Act & Assert
      await expect(client.deleteSegment(orgId, '', segmentId)).rejects.toThrow('ledgerId is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should throw error when missing segmentId', async () => {
      // Act & Assert
      await expect(client.deleteSegment(orgId, ledgerId, '')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deleteSegment(orgId, ledgerId, segmentId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('private methods', () => {
    describe('validateRequiredParams', () => {
      it('should validate required parameters and throw error if missing', async () => {
        // Test with missing parameters indirectly through getSegment
        await expect(client.getSegment('', ledgerId, segmentId)).rejects.toThrow('orgId is required');
        await expect(client.getSegment(orgId, '', segmentId)).rejects.toThrow('ledgerId is required');
        await expect(client.getSegment(orgId, ledgerId, '')).rejects.toThrow('id is required');
        
        // Verify the error is recorded on the span
        expect(mockSpan.recordException).toHaveBeenCalled();
      });
    });

    describe('recordMetrics', () => {
      it('should record metrics with the observability provider', async () => {
        // Use a public method to indirectly test the private recordMetrics method
        mockHttpClient.get.mockResolvedValueOnce(mockSegment);
        
        // Act
        await client.getSegment(orgId, ledgerId, segmentId);
        
        // Assert
        expect(mockObservability.recordMetric).toHaveBeenCalledWith(
          'segments.get',
          1,
          expect.objectContaining({
            orgId,
            ledgerId,
            segmentId
          })
        );
      });

      it('should handle empty tags', async () => {
        // Access the private method using type assertion for testing
        (client as any).recordMetrics('test.metric', 1);
        
        // Assert
        expect(mockObservability.recordMetric).toHaveBeenCalledWith(
          'test.metric',
          1,
          {}
        );
      });
    });
  });
});