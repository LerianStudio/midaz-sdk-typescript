import { HttpAccountTypeApiClient } from '../../../src/api/http/http-account-type-api-client';
import { HttpClient } from '../../../src/util/network/http-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { Observability } from '../../../src/util/observability/observability';
import { ListOptions } from '../../../src/models/common';
import { CreateAccountTypeInput, UpdateAccountTypeInput } from '../../../src/models/account-type';

jest.mock('../../../src/api/url-builder');

describe('HttpAccountTypeApiClient', () => {
  let httpClientMock: jest.Mocked<HttpClient>;
  let urlBuilderMock: jest.Mocked<UrlBuilder>;
  let observabilityMock: jest.Mocked<Observability>;
  let client: HttpAccountTypeApiClient;

  const orgId = 'org-123';
  const ledgerId = 'ldg-456';
  const accountTypeId = 'act-789';

  beforeEach(() => {
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Now UrlBuilder is mocked via jest.mock
    urlBuilderMock = new (UrlBuilder as any)();
    (urlBuilderMock.getApiVersion as jest.Mock).mockReturnValue('v1');

    // Mock getUrl for HttpAccountTypeApiClient
    const getUrl = (org: string, ledger: string, path: string = '') =>
      `organizations/${org}/ledgers/${ledger}/account-types${path}`;

    observabilityMock = {
      startSpan: jest.fn(() => ({
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn(),
      })),
    } as any;

    client = new (class extends HttpAccountTypeApiClient {
      public getUrl(org: string, ledger: string, path: string = ''): string {
        return getUrl(org, ledger, path);
      }
    })(httpClientMock, urlBuilderMock, observabilityMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAccountTypes', () => {
    it('should call getRequest with the correct URL and options', async () => {
      const options: ListOptions = { limit: 10, page: 1 };
      const expectedUrl = `organizations/${orgId}/ledgers/${ledgerId}/account-types`;
      (client as any).getRequest = jest.fn();

      await client.listAccountTypes(orgId, ledgerId, options);

      expect((client as any).getRequest).toHaveBeenCalledWith('listAccountTypes', expectedUrl, {
        params: options,
      });
    });
  });

  describe('getAccountType', () => {
    it('should call getRequest with the correct URL', async () => {
      const expectedUrl = `organizations/${orgId}/ledgers/${ledgerId}/account-types/${accountTypeId}`;
      (client as any).getRequest = jest.fn();

      await client.getAccountType(orgId, ledgerId, accountTypeId);

      expect((client as any).getRequest).toHaveBeenCalledWith('getAccountType', expectedUrl);
    });
  });

  describe('createAccountType', () => {
    it('should call postRequest with the correct URL and input', async () => {
      const input: CreateAccountTypeInput = { name: 'New Type', keyValue: 'NEW_KEY' };
      const expectedUrl = `organizations/${orgId}/ledgers/${ledgerId}/account-types`;
      (client as any).postRequest = jest.fn();

      await client.createAccountType(orgId, ledgerId, input);

      expect((client as any).postRequest).toHaveBeenCalledWith(
        'createAccountType',
        expectedUrl,
        input
      );
    });
  });

  describe('updateAccountType', () => {
    it('should call patchRequest with the correct URL and input', async () => {
      const input: UpdateAccountTypeInput = { name: 'Updated Type' };
      const expectedUrl = `organizations/${orgId}/ledgers/${ledgerId}/account-types/${accountTypeId}`;
      (client as any).patchRequest = jest.fn();

      await client.updateAccountType(orgId, ledgerId, accountTypeId, input);

      expect((client as any).patchRequest).toHaveBeenCalledWith(
        'updateAccountType',
        expectedUrl,
        input
      );
    });
  });

  describe('deleteAccountType', () => {
    it('should call deleteRequest with the correct URL', async () => {
      const expectedUrl = `organizations/${orgId}/ledgers/${ledgerId}/account-types/${accountTypeId}`;
      (client as any).deleteRequest = jest.fn();

      await client.deleteAccountType(orgId, ledgerId, accountTypeId);

      expect((client as any).deleteRequest).toHaveBeenCalledWith('deleteAccountType', expectedUrl);
    });
  });
});
