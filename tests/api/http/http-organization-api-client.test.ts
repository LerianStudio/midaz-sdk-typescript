/**
 * Tests for HttpOrganizationApiClient
 */

import { Address, ListOptions, ListResponse, StatusCode } from '../../../src/models/common';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpOrganizationApiClient } from '../../../src/api/http/http-organization-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';
import {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from '../../../src/api/interfaces/organization-api-client';

// Mock dependencies
jest.mock('../../../src/models/validators/organization-validator');
import {
  validateCreateOrganizationInput,
  validateUpdateOrganizationInput,
} from '../../../src/models/validators/organization-validator';
// Validation mock
const validateMock = jest.fn();
jest.mock('../../../src/util/validation', () => ({
  validate: (input: any, validator: any) => {
    // Call the mock function to track calls and allow for return value configuration
    return validateMock(input, validator);
  },
}));

describe('HttpOrganizationApiClient', () => {
  // Sample data
  const orgId = 'org-123';
  const apiVersion = 'v1';

  // Mock address
  const address: Address = {
    line1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA',
  };

  // Mock organization data
  const mockOrganization: Organization = {
    id: orgId,
    name: 'Test Organization',
    legalName: 'Test Organization Inc.',
    legalDocument: 'ABC123456',
    doingBusinessAs: 'TestOrg',
    address,
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { industry: 'Technology' },
  };

  // Mock organization list response
  const mockOrganizationListResponse: ListResponse<Organization> = {
    items: [mockOrganization],
    meta: {
      total: 1,
      count: 1,
      nextCursor: 'next-cursor',
    },
  };

  // Mocks
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;

  // Class under test
  let client: HttpOrganizationApiClient;

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
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      buildOrganizationUrl: jest.fn().mockImplementation((id?) => {
        let url = '/organizations';
        if (id) {
          url += `/${id}`;
        }
        return url;
      }),
      getApiVersion: jest.fn().mockReturnValue(apiVersion),
    } as unknown as jest.Mocked<UrlBuilder>;

    // Reset all mocks
    mockHttpClient.get.mockReset();
    mockHttpClient.post.mockReset();
    mockHttpClient.patch.mockReset();
    mockHttpClient.delete.mockReset();

    // Set default behavior for validation mock
    validateMock.mockImplementation(() => {
      return { valid: true };
    });

    // Create client instance
    client = new HttpOrganizationApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    // Access the protected apiVersion property by using type assertion
    (client as any).apiVersion = apiVersion;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('listOrganizations', () => {
    it('should successfully list organizations', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOrganizationListResponse);

      // Act
      const result = await client.listOrganizations();

      // Assert
      expect(result).toEqual(mockOrganizationListResponse);
      expect(mockUrlBuilder.buildOrganizationUrl).toHaveBeenCalledWith();
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'organizations.list.count',
        1,
        expect.any(Object)
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should apply list options when provided', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOrganizationListResponse);
      const options: ListOptions = { limit: 10, offset: 20, filter: { status: StatusCode.ACTIVE } };

      // Act
      await client.listOrganizations(options);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('limit', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('offset', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasFilters', true);
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.listOrganizations()).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('getOrganization', () => {
    it('should successfully get an organization by ID', async () => {
      // Arrange
      mockHttpClient.get.mockResolvedValueOnce(mockOrganization);

      // Act
      const result = await client.getOrganization(orgId);

      // Assert
      expect(result).toEqual(mockOrganization);
      expect(mockUrlBuilder.buildOrganizationUrl).toHaveBeenCalledWith(orgId);
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'organizations.get',
        1,
        expect.objectContaining({ organizationId: orgId })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('organizationId', orgId);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing organizationId', async () => {
      // Act & Assert
      await expect(client.getOrganization('')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Organization not found',
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.getOrganization(orgId)).rejects.toThrow('Organization not found');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('createOrganization', () => {
    const createInput: CreateOrganizationInput = {
      legalName: 'New Organization Inc.',
      legalDocument: 'XYZ789012',
      doingBusinessAs: 'NewOrg',
      address: {
        line1: '456 Tech Blvd',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94107',
        country: 'USA',
      },
      metadata: { industry: 'Finance' },
    };

    it('should successfully create an organization', async () => {
      // Arrange
      mockHttpClient.post.mockResolvedValueOnce(mockOrganization);
      (validateCreateOrganizationInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.createOrganization(createInput);

      // Assert
      expect(result).toEqual(mockOrganization);
      expect(mockUrlBuilder.buildOrganizationUrl).toHaveBeenCalledWith();
      expect(mockHttpClient.post).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'organizations.create',
        1,
        expect.any(Object)
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('legalName', createInput.legalName);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasLegalDocument', true);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('hasMetadata', true);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('organizationId', mockOrganization.id);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.createOrganization(createInput)).rejects.toThrow(
        'Failed to create organization'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      (validateCreateOrganizationInput as jest.Mock).mockReturnValueOnce({ valid: true });
      const error = new Error('API Error');
      mockHttpClient.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.createOrganization(createInput)).rejects.toThrow(
        'Failed to create organization'
      );
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('updateOrganization', () => {
    const updateInput: UpdateOrganizationInput = {
      legalName: 'Updated Organization Inc.',
      doingBusinessAs: 'UpdatedOrg',
      status: StatusCode.INACTIVE,
      metadata: { industry: 'Healthcare' },
    };

    it('should successfully update an organization', async () => {
      // Arrange
      const updatedOrganization = {
        ...mockOrganization,
        legalName: updateInput.legalName,
        doingBusinessAs: updateInput.doingBusinessAs,
        status: {
          code: updateInput.status || StatusCode.INACTIVE,
          timestamp: new Date().toISOString(),
        },
      };
      mockHttpClient.patch.mockResolvedValueOnce(updatedOrganization);
      (validateUpdateOrganizationInput as jest.Mock).mockReturnValueOnce({ valid: true });

      // Act
      const result = await client.updateOrganization(orgId, updateInput);

      // Assert
      expect(result).toEqual(updatedOrganization);
      expect(mockUrlBuilder.buildOrganizationUrl).toHaveBeenCalledWith(orgId);
      expect(mockHttpClient.patch).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'organizations.update',
        1,
        expect.objectContaining({ organizationId: orgId })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedLegalName', updateInput.legalName);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'updatedDoingBusinessAs',
        updateInput.doingBusinessAs
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', updateInput.status);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      validateMock.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Act & Assert
      await expect(client.updateOrganization(orgId, updateInput)).rejects.toThrow(
        'Validation error'
      );
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should throw error when missing organizationId', async () => {
      // Act & Assert
      await expect(client.updateOrganization('', updateInput)).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      (validateUpdateOrganizationInput as jest.Mock).mockReturnValueOnce({ valid: true });
      const error = new Error('API Error');
      mockHttpClient.patch.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.updateOrganization(orgId, updateInput)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });

    it('should set span attributes for all updated fields', async () => {
      // Arrange
      const fullUpdateInput: UpdateOrganizationInput = {
        legalName: 'Fully Updated Corp',
        doingBusinessAs: 'UpdatedCorp',
        status: StatusCode.INACTIVE,
        address: {
          line1: '789 Update Ave',
          city: 'New City',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        metadata: {
          updated: true,
          date: new Date().toISOString(),
        },
        parentOrganizationId: 'parent-org-456',
      };

      mockHttpClient.patch.mockResolvedValueOnce(mockOrganization);

      // Act
      await client.updateOrganization(orgId, fullUpdateInput);

      // Assert
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'updatedLegalName',
        fullUpdateInput.legalName
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'updatedDoingBusinessAs',
        fullUpdateInput.doingBusinessAs
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedStatus', fullUpdateInput.status);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedAddress', true);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('updatedMetadata', true);
    });
  });

  describe('deleteOrganization', () => {
    it('should successfully delete an organization', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValueOnce(undefined);

      // Act
      await client.deleteOrganization(orgId);

      // Assert
      expect(mockUrlBuilder.buildOrganizationUrl).toHaveBeenCalledWith(orgId);
      expect(mockHttpClient.delete).toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'organizations.delete',
        1,
        expect.objectContaining({ organizationId: orgId })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should throw error when missing organizationId', async () => {
      // Act & Assert
      await expect(client.deleteOrganization('')).rejects.toThrow('id is required');
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockHttpClient.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.deleteOrganization(orgId)).rejects.toThrow('API Error');
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', error.message);
    });
  });

  describe('private methods', () => {
    it('should validate required parameters and throw error if missing', async () => {
      // The validateRequiredParams method is private, but we can test it indirectly
      // through the public methods that use it

      // Test with missing parameters
      await expect(client.getOrganization('')).rejects.toThrow('id is required');

      // Verify the error is recorded on the span
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should record metrics with the observability provider', async () => {
      // Use a public method to indirectly test the private recordMetrics method
      mockHttpClient.get.mockResolvedValueOnce(mockOrganization);

      // Act
      await client.getOrganization(orgId);

      // Assert
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'organizations.get',
        1,
        expect.objectContaining({
          organizationId: orgId,
        })
      );
    });
  });
});
