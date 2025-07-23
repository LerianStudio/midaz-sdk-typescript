import { AccountTypesServiceImpl } from '../../../src/entities/implementations/account-types-impl';
import { AccountTypeApiClient } from '../../../src/api/interfaces/account-type-api-client';
import { Observability } from '../../../src/util/observability/observability';
import { CreateAccountTypeInput, UpdateAccountTypeInput } from '../../../src/models/account-type';
import { ListOptions } from '../../../src/models/common';

describe('AccountTypesServiceImpl', () => {
  let apiClientMock: jest.Mocked<AccountTypeApiClient>;
  let observabilityMock: jest.Mocked<Observability>;
  let service: AccountTypesServiceImpl;
  let spanMock: any;

  const orgId = 'org-123';
  const ledgerId = 'ldg-456';
  const accountTypeId = 'act-789';

  beforeEach(() => {
    spanMock = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    };

    apiClientMock = {
      listAccountTypes: jest.fn(),
      getAccountType: jest.fn(),
      createAccountType: jest.fn(),
      updateAccountType: jest.fn(),
      deleteAccountType: jest.fn(),
    } as any;

    observabilityMock = {
      startSpan: jest.fn(() => spanMock),
    } as any;

    service = new AccountTypesServiceImpl(apiClientMock, observabilityMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testCases = [
    {
      method: 'listAccountTypes',
      args: [orgId, ledgerId, { limit: 10 } as ListOptions],
      apiMethod: 'listAccountTypes',
      expectedSpanName: 'listAccountTypes',
      attributes: { orgId, ledgerId },
      successValue: { items: [], total: 0 },
    },
    {
      method: 'getAccountType',
      args: [orgId, ledgerId, accountTypeId],
      apiMethod: 'getAccountType',
      expectedSpanName: 'getAccountType',
      attributes: { orgId, ledgerId, accountTypeId },
      successValue: { id: accountTypeId, name: 'Test', keyValue: 'TEST' },
    },
    {
      method: 'createAccountType',
      args: [orgId, ledgerId, { name: 'New', keyValue: 'NEW' } as CreateAccountTypeInput],
      apiMethod: 'createAccountType',
      expectedSpanName: 'createAccountType',
      attributes: { orgId, ledgerId, accountTypeName: 'New' },
      successValue: { id: 'new-id', name: 'New', keyValue: 'NEW' },
    },
    {
      method: 'updateAccountType',
      args: [orgId, ledgerId, accountTypeId, { name: 'Updated' } as UpdateAccountTypeInput],
      apiMethod: 'updateAccountType',
      expectedSpanName: 'updateAccountType',
      attributes: { orgId, ledgerId, accountTypeId },
      successValue: { id: accountTypeId, name: 'Updated', keyValue: 'OLD' },
    },
    {
      method: 'deleteAccountType',
      args: [orgId, ledgerId, accountTypeId],
      apiMethod: 'deleteAccountType',
      expectedSpanName: 'deleteAccountType',
      attributes: { orgId, ledgerId, accountTypeId },
      successValue: undefined,
    },
  ];

  testCases.forEach(({ method, args, apiMethod, expectedSpanName, attributes, successValue }) => {
    describe(method, () => {
      it('should call the api client and manage spans on success', async () => {
        (apiClientMock[apiMethod as keyof AccountTypeApiClient] as jest.Mock).mockResolvedValue(
          successValue
        );

        const result = await (service as any)[method](...args);

        expect(observabilityMock.startSpan).toHaveBeenCalledWith(expectedSpanName);
        Object.entries(attributes).forEach(([key, value]) => {
          expect(spanMock.setAttribute).toHaveBeenCalledWith(key, value);
        });
        expect(apiClientMock[apiMethod as keyof AccountTypeApiClient]).toHaveBeenCalledWith(
          ...args
        );
        if (method === 'createAccountType') {
          expect(spanMock.setAttribute).toHaveBeenCalledWith('accountTypeId', 'new-id');
        }
        expect(spanMock.setStatus).toHaveBeenCalledWith('ok');
        expect(spanMock.end).toHaveBeenCalled();
        expect(result).toEqual(successValue);
      });

      it('should handle errors and manage spans correctly', async () => {
        const error = new Error('API Error');
        (apiClientMock[apiMethod as keyof AccountTypeApiClient] as jest.Mock).mockRejectedValue(
          error
        );

        await expect((service as any)[method](...args)).rejects.toThrow(error);

        expect(observabilityMock.startSpan).toHaveBeenCalledWith(expectedSpanName);
        expect(spanMock.recordException).toHaveBeenCalledWith(error);
        expect(spanMock.setStatus).toHaveBeenCalledWith('error', error.message);
        expect(spanMock.end).toHaveBeenCalled();
      });
    });
  });
});
