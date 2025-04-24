/**
 * @file Tests for the OrganizationsServiceImpl implementation
 * @description Unit tests for the OrganizationsService implementation
 */

import { OrganizationsServiceImpl } from '../../../src/entities/implementations/organizations-impl';
import { OrganizationApiClient } from '../../../src/api/interfaces/organization-api-client';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '../../../src/models/organization';
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

// Mock the organization-validator
jest.mock('../../../src/models/validators/organization-validator', () => {
  return {
    validateCreateOrganizationInput: jest.fn().mockImplementation((input) => {
      if (!input.name) {
        throw new ValidationError('Organization name is required');
      }
      return { valid: true };
    }),
    validateUpdateOrganizationInput: jest.fn().mockImplementation((input) => {
      return { valid: true };
    })
  };
});

describe('OrganizationsServiceImpl', () => {
  let organizationsService: OrganizationsServiceImpl;
  let organizationApiClient: jest.Mocked<OrganizationApiClient>;
  let mockObservability: jest.Mocked<Observability>;
  let config: any;

  // Test data
  const organizationId = 'org_123';
  const organizationName = 'Test Organization';
  
  const mockOrganization: Organization = {
    id: organizationId,
    legalName: organizationName,
    legalDocument: "123456789",
    doingBusinessAs: organizationName,
    status: {
      code: StatusCode.ACTIVE,
      timestamp: '2023-01-01T00:00:00Z'
    },
    address: {
      line1: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US"
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };
  
  const mockOrganizationsList: ListResponse<Organization> = {
    items: [mockOrganization],
    meta: {
      total: 1,
      count: 1
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock OrganizationApiClient
    organizationApiClient = {
      listOrganizations: jest.fn().mockImplementation((options) => {
        return Promise.resolve(mockOrganizationsList);
      }),
      getOrganization: jest.fn().mockImplementation((id) => {
        if (!id) throw new ValidationError('Organization ID is required');
        return Promise.resolve(mockOrganization);
      }),
      createOrganization: jest.fn().mockImplementation((input) => {
        if (!input.legalName) throw new ValidationError('Organization name is required');
        return Promise.resolve(mockOrganization);
      }),
      updateOrganization: jest.fn().mockImplementation((id, input) => {
        if (!id) throw new ValidationError('Organization ID is required');
        return Promise.resolve(mockOrganization);
      }),
      deleteOrganization: jest.fn().mockImplementation((id) => {
        if (!id) throw new ValidationError('Organization ID is required');
        return Promise.resolve();
      })
    } as unknown as jest.Mocked<OrganizationApiClient>;
    
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
    organizationsService = new OrganizationsServiceImpl(organizationApiClient, mockObservability);
  });

  describe('listOrganizations', () => {
    it('should list organizations successfully', async () => {
      // Execute
      const result = await organizationsService.listOrganizations();
      
      // Verify
      expect(organizationApiClient.listOrganizations).toHaveBeenCalled();
      expect(result).toEqual(mockOrganizationsList);
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
      await organizationsService.listOrganizations(listOptions);
      
      // Verify
      expect(organizationApiClient.listOrganizations).toHaveBeenCalledWith(listOptions);
    });
    
    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      organizationApiClient.listOrganizations.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(organizationsService.listOrganizations())
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getOrganization', () => {
    it('should get an organization by ID successfully', async () => {
      // Execute
      const result = await organizationsService.getOrganization(organizationId);
      
      // Verify
      expect(organizationApiClient.getOrganization).toHaveBeenCalledWith(organizationId);
      expect(result).toEqual(mockOrganization);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      organizationApiClient.getOrganization.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(organizationsService.getOrganization(''))
        .rejects.toThrow('Organization ID is required');
      expect(organizationApiClient.getOrganization).toHaveBeenCalledWith('');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      organizationApiClient.getOrganization.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(organizationsService.getOrganization(organizationId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('createOrganization', () => {
    it('should create an organization successfully', async () => {
      // Setup
      const createInput: CreateOrganizationInput = {
        legalName: organizationName,
        legalDocument: "123456789",
        doingBusinessAs: organizationName,
        status: StatusCode.ACTIVE,
        address: {
          line1: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zipCode: "94105",
          country: "US"
        }
      };
      
      // Execute
      const result = await organizationsService.createOrganization(createInput);
      
      // Verify
      expect(organizationApiClient.createOrganization).toHaveBeenCalledWith(createInput);
      expect(result).toEqual(mockOrganization);
    });
    
    it('should throw a validation error for invalid input', async () => {
      // Setup
      const invalidInput = {} as CreateOrganizationInput;
      
      // Execute & Verify
      await expect(organizationsService.createOrganization(invalidInput))
        .rejects.toThrow('Organization name is required');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const createInput: CreateOrganizationInput = {
        legalName: organizationName,
        legalDocument: "123456789",
        doingBusinessAs: organizationName,
        status: StatusCode.ACTIVE,
        address: {
          line1: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zipCode: "94105",
          country: "US"
        }
      };
      
      const errorMessage = 'API Error';
      organizationApiClient.createOrganization.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(organizationsService.createOrganization(createInput))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('updateOrganization', () => {
    it('should update an organization successfully', async () => {
      // Setup
      const updateInput: UpdateOrganizationInput = {
        legalName: 'Updated Organization'
      };
      
      // Execute
      const result = await organizationsService.updateOrganization(organizationId, updateInput);
      
      // Verify
      expect(organizationApiClient.updateOrganization).toHaveBeenCalledWith(organizationId, updateInput);
      expect(result).toEqual(mockOrganization);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const updateInput: UpdateOrganizationInput = {
        legalName: 'Updated Organization'
      };
      const validationError = new Error('Organization ID is required');
      organizationApiClient.updateOrganization.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(organizationsService.updateOrganization('', updateInput))
        .rejects.toThrow('Organization ID is required');
      expect(organizationApiClient.updateOrganization).toHaveBeenCalledWith('', updateInput);
    });
    
    it('should handle API errors', async () => {
      // Setup
      const updateInput: UpdateOrganizationInput = {
        legalName: 'Updated Organization'
      };
      
      const errorMessage = 'API Error';
      organizationApiClient.updateOrganization.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(organizationsService.updateOrganization(organizationId, updateInput))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete an organization successfully', async () => {
      // Execute
      await organizationsService.deleteOrganization(organizationId);
      
      // Verify
      expect(organizationApiClient.deleteOrganization).toHaveBeenCalledWith(organizationId);
    });
    
    it('should delegate validation to the API client', async () => {
      // Setup
      const validationError = new Error('Organization ID is required');
      organizationApiClient.deleteOrganization.mockRejectedValueOnce(validationError);
      
      // Execute & Verify
      await expect(organizationsService.deleteOrganization(''))
        .rejects.toThrow('Organization ID is required');
      expect(organizationApiClient.deleteOrganization).toHaveBeenCalledWith('');
    });
    
    it('should handle API errors', async () => {
      // Setup
      const errorMessage = 'API Error';
      organizationApiClient.deleteOrganization.mockRejectedValueOnce(new Error(errorMessage));
      
      // Execute & Verify
      await expect(organizationsService.deleteOrganization(organizationId))
        .rejects.toThrow(errorMessage);
    });
  });
});