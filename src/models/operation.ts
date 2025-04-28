/**
 * Operation model
 */
export interface Operation {
  id: string;
  transactionId: string;
  accountId: string;
  assetId: string;
  amount: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Operation input for creation
 */
export interface OperationInput {
  accountId: string;
  assetId: string;
  amount: string;
  type: 'DEBIT' | 'CREDIT';
  metadata?: Record<string, any>;
}
