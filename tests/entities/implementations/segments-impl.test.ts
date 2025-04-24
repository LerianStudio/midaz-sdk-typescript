/**
 * @file Tests for the SegmentsServiceImpl implementation
 * @description Unit tests for the SegmentsService implementation
 */

import { SegmentsServiceImpl } from '../../../src/entities/implementations/segments-impl';
import { SegmentApiClient } from '../../../src/api/interfaces/segment-api-client';
import { Segment, CreateSegmentInput, UpdateSegmentInput } from '../../../src/models/segment';
import { ListResponse, StatusCode } from '../../../src/models/common';
import { Observability } from '../../../src/util/observability/observability';
import { ValidationError } from '../../../src/util/validation';

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

// Mock the segment-validator
jest.mock('../../../src/models/validators/segment-validator', () => {
  return {
    validateCreateSegmentInput: jest.fn().mockImplementation((input) => {
      if (!input.name) {
        throw new ValidationError('Segment name is required');
      }
      return { valid: true };
    }),
    validateUpdateSegmentInput: jest.fn().mockImplementation((input) => {
      return { valid: true };
    })
  };
});

describe('SegmentsServiceImpl', () => {
  let segmentsService: SegmentsServiceImpl;
  let segmentApiClient: jest.Mocked<SegmentApiClient>;
  let mockObservability: jest.Mocked<Observability>;
  let config: any;

  // Test data
  const orgId = 'org_123';
  const ledgerId = 'ldg_456';
  const segmentId = 'seg_789';
  const segmentName = 'Test Segment';
  
  const mockSegment: Segment = {
    id: segmentId,
    name: segmentName,
    organizationId: orgId,
    ledgerId: ledgerId,
    status: {
      code: StatusCode.ACTIVE,
      timestamp: '2023-01-01T00:00:00Z'
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };
  
  const mockSegmentsList: ListResponse<Segment> = {
    items: [mockSegment],
    meta: {
      total: 1,
      count: 1
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock SegmentApiClient
    segmentApiClient = {
      listSegments: jest.fn().mockImplementation((orgId, ledgerId, options) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        return Promise.resolve(mockSegmentsList);
      }),
      getSegment: jest.fn().mockImplementation((orgId, ledgerId, id) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!id) throw new ValidationError('Segment ID is required');
        return Promise.resolve(mockSegment);
      }),
      createSegment: jest.fn().mockImplementation((orgId, ledgerId, input) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!input.name) throw new ValidationError('Segment name is required');
        return Promise.resolve(mockSegment);
      }),
      updateSegment: jest.fn().mockImplementation((orgId, ledgerId, id, input) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!id) throw new ValidationError('Segment ID is required');
        return Promise.resolve(mockSegment);
      }),
      deleteSegment: jest.fn().mockImplementation((orgId, ledgerId, id) => {
        if (!orgId) throw new ValidationError('Organization ID is required');
        if (!ledgerId) throw new ValidationError('Ledger ID is required');
        if (!id) throw new ValidationError('Segment ID is required');
        return Promise.resolve();
      })
    } as unknown as jest.Mocked<SegmentApiClient>;
    
    // Create mock Observability
    mockObservability = {
      startSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn()
      }),
      recordMetric: jest.fn()
    } as unknown as jest.Mocked<Observability>;
    
    // Create config for reference
    config = {
      environment: 'sandbox'
    };
    
    // Create the service instance
    segmentsService = new SegmentsServiceImpl(segmentApiClient, mockObservability);
  });

  describe('listSegments', () => {
    it('should list segments successfully', async () => {
      // Execute
      const result = await segmentsService.listSegments(orgId, ledgerId);
      
      // Verify
      expect(segmentApiClient.listSegments).toHaveBeenCalledWith(orgId, ledgerId, undefined);
      expect(result).toEqual(mockSegmentsList);
    });
    
    it('should apply list options when provided', async () => {
      // Setup
      const listOptions = {
        limit: 10,
        offset: 0,
        filter: {
          status: 'ACTIVE'
        },
        sort: {
          field: 'createdAt',
          order: 'DESC'
        }
      };
      
      // Execute
      await segmentsService.listSegments(orgId, ledgerId, listOptions);
      
      // Verify
      expect(segmentApiClient.listSegments).toHaveBeenCalledWith(orgId, ledgerId, listOptions);
    });
    
    it('should delegate validation to the API client for missing orgId', async () => {
      // Execute & Verify
      await expect(segmentsService.listSegments('', ledgerId))
        .rejects.toThrow('Organization ID is required');
      
      // Verify API client was called with empty orgId
      expect(segmentApiClient.listSegments).toHaveBeenCalledWith('', ledgerId, undefined);
    });
    
    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Execute & Verify
      await expect(segmentsService.listSegments(orgId, ''))
        .rejects.toThrow('Ledger ID is required');
      
      // Verify API client was called with empty ledgerId
      expect(segmentApiClient.listSegments).toHaveBeenCalledWith(orgId, '', undefined);
    });
    
    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      segmentApiClient.listSegments.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(segmentsService.listSegments(orgId, ledgerId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getSegment', () => {
    it('should get a segment by ID successfully', async () => {
      // Execute
      const result = await segmentsService.getSegment(orgId, ledgerId, segmentId);
      
      // Verify
      expect(segmentApiClient.getSegment).toHaveBeenCalledWith(orgId, ledgerId, segmentId);
      expect(result).toEqual(mockSegment);
    });
    
    it('should delegate validation to the API client for missing orgId', async () => {
      // Execute & Verify
      await expect(segmentsService.getSegment('', ledgerId, segmentId))
        .rejects.toThrow('Organization ID is required');
      
      // Verify API client was called with empty orgId
      expect(segmentApiClient.getSegment).toHaveBeenCalledWith('', ledgerId, segmentId);
    });
    
    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Execute & Verify
      await expect(segmentsService.getSegment(orgId, '', segmentId))
        .rejects.toThrow('Ledger ID is required');
      
      // Verify API client was called with empty ledgerId
      expect(segmentApiClient.getSegment).toHaveBeenCalledWith(orgId, '', segmentId);
    });
    
    it('should delegate validation to the API client for missing segmentId', async () => {
      // Execute & Verify
      await expect(segmentsService.getSegment(orgId, ledgerId, ''))
        .rejects.toThrow('Segment ID is required');
      
      // Verify API client was called with empty segmentId
      expect(segmentApiClient.getSegment).toHaveBeenCalledWith(orgId, ledgerId, '');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      segmentApiClient.getSegment.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(segmentsService.getSegment(orgId, ledgerId, segmentId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('createSegment', () => {
    it('should create a segment successfully', async () => {
      // Setup
      const createInput: CreateSegmentInput = {
        name: segmentName,
        status: StatusCode.ACTIVE
      };
      
      // Execute
      const result = await segmentsService.createSegment(orgId, ledgerId, createInput);
      
      // Verify
      expect(segmentApiClient.createSegment).toHaveBeenCalledWith(orgId, ledgerId, createInput);
      expect(result).toEqual(mockSegment);
    });
    
    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const createInput: CreateSegmentInput = {
        name: segmentName,
        status: StatusCode.ACTIVE
      };
      
      // Execute & Verify
      await expect(segmentsService.createSegment('', ledgerId, createInput))
        .rejects.toThrow('Organization ID is required');
      
      // Verify API client was called with empty orgId
      expect(segmentApiClient.createSegment).toHaveBeenCalledWith('', ledgerId, createInput);
    });
    
    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const createInput: CreateSegmentInput = {
        name: segmentName,
        status: StatusCode.ACTIVE
      };
      
      // Execute & Verify
      await expect(segmentsService.createSegment(orgId, '', createInput))
        .rejects.toThrow('Ledger ID is required');
      
      // Verify API client was called with empty ledgerId
      expect(segmentApiClient.createSegment).toHaveBeenCalledWith(orgId, '', createInput);
    });
    
    it('should delegate validation to the API client for invalid input', async () => {
      // Setup
      const invalidInput = {} as CreateSegmentInput;
      
      // Execute & Verify
      await expect(segmentsService.createSegment(orgId, ledgerId, invalidInput))
        .rejects.toThrow('Segment name is required');
      
      // Verify API client was called with the invalid input
      expect(segmentApiClient.createSegment).toHaveBeenCalledWith(orgId, ledgerId, invalidInput);
    });
    
    it('should handle API errors', async () => {
      // Setup
      const createInput: CreateSegmentInput = {
        name: segmentName,
        status: StatusCode.ACTIVE
      };
      
      const errorMessage = 'API Error';
      segmentApiClient.createSegment.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(segmentsService.createSegment(orgId, ledgerId, createInput))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updateSegment', () => {
    it('should update a segment successfully', async () => {
      // Setup
      const updateInput: UpdateSegmentInput = {
        name: 'Updated Segment'
      };
      
      // Execute
      const result = await segmentsService.updateSegment(orgId, ledgerId, segmentId, updateInput);
      
      // Verify
      expect(segmentApiClient.updateSegment).toHaveBeenCalledWith(orgId, ledgerId, segmentId, updateInput);
      expect(result).toEqual(mockSegment);
    });
    
    it('should delegate validation to the API client for missing orgId', async () => {
      // Setup
      const updateInput: UpdateSegmentInput = {
        name: 'Updated Segment'
      };
      
      // Execute & Verify
      await expect(segmentsService.updateSegment('', ledgerId, segmentId, updateInput))
        .rejects.toThrow('Organization ID is required');
      
      // Verify API client was called with empty orgId
      expect(segmentApiClient.updateSegment).toHaveBeenCalledWith('', ledgerId, segmentId, updateInput);
    });
    
    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Setup
      const updateInput: UpdateSegmentInput = {
        name: 'Updated Segment'
      };
      
      // Execute & Verify
      await expect(segmentsService.updateSegment(orgId, '', segmentId, updateInput))
        .rejects.toThrow('Ledger ID is required');
      
      // Verify API client was called with empty ledgerId
      expect(segmentApiClient.updateSegment).toHaveBeenCalledWith(orgId, '', segmentId, updateInput);
    });
    
    it('should delegate validation to the API client for missing segmentId', async () => {
      // Setup
      const updateInput: UpdateSegmentInput = {
        name: 'Updated Segment'
      };
      
      // Execute & Verify
      await expect(segmentsService.updateSegment(orgId, ledgerId, '', updateInput))
        .rejects.toThrow('Segment ID is required');
      
      // Verify API client was called with empty segmentId
      expect(segmentApiClient.updateSegment).toHaveBeenCalledWith(orgId, ledgerId, '', updateInput);
    });
    
    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdateSegmentInput = {
        name: 'Updated Segment'
      };
      
      const errorMessage = 'API Error';
      segmentApiClient.updateSegment.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(segmentsService.updateSegment(orgId, ledgerId, segmentId, updateInput))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('deleteSegment', () => {
    it('should delete a segment successfully', async () => {
      // Execute
      await segmentsService.deleteSegment(orgId, ledgerId, segmentId);
      
      // Verify
      expect(segmentApiClient.deleteSegment).toHaveBeenCalledWith(orgId, ledgerId, segmentId);
    });
    
    it('should delegate validation to the API client for missing orgId', async () => {
      // Execute & Verify
      await expect(segmentsService.deleteSegment('', ledgerId, segmentId))
        .rejects.toThrow('Organization ID is required');
      
      // Verify API client was called with empty orgId
      expect(segmentApiClient.deleteSegment).toHaveBeenCalledWith('', ledgerId, segmentId);
    });
    
    it('should delegate validation to the API client for missing ledgerId', async () => {
      // Execute & Verify
      await expect(segmentsService.deleteSegment(orgId, '', segmentId))
        .rejects.toThrow('Ledger ID is required');
      
      // Verify API client was called with empty ledgerId
      expect(segmentApiClient.deleteSegment).toHaveBeenCalledWith(orgId, '', segmentId);
    });
    
    it('should delegate validation to the API client for missing segmentId', async () => {
      // Execute & Verify
      await expect(segmentsService.deleteSegment(orgId, ledgerId, ''))
        .rejects.toThrow('Segment ID is required');
      
      // Verify API client was called with empty segmentId
      expect(segmentApiClient.deleteSegment).toHaveBeenCalledWith(orgId, ledgerId, '');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      segmentApiClient.deleteSegment.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(segmentsService.deleteSegment(orgId, ledgerId, segmentId))
        .rejects.toThrow(errorMessage);
    });
  });
});