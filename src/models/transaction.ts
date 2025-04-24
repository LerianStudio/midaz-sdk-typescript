import { ApiResponse, Status } from './common';

export interface Transaction extends ApiResponse {
  id: string;
  amount: number;
  scale: number;
  assetCode: string;
  status: Status;
  ledgerId: string;
  organizationId: string;
  operations: Operation[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  externalId?: string;
  description?: string;
}

export interface Operation {
  id: string;
  accountId: string;
  accountAlias?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: Amount;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Amount {
  value: string | number;
  assetCode: string;
  scale: number;
}

export interface CreateTransactionInput {
  amount?: number;
  scale?: number;
  assetCode?: string;
  description?: string;
  chartOfAccountsGroupName?: string;
  operations: OperationInput[];
  metadata?: Record<string, any>;
  externalId?: string;
}

export interface OperationInput {
  accountId: string;
  accountAlias?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: AmountInput;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AmountInput {
  value: string | number;
  assetCode: string;
  scale: number;
}

// Transformation logic moved to transaction-transformer.ts

export interface UpdateTransactionInput {
  metadata?: Record<string, any>;
  description?: string;
  externalId?: string;
}
