/**
 * @file Enhanced recovery export compatibility
 * @description Provides compatibility exports for the workflow example
 */

import { executeTransaction } from './error-handler';
import { createTransactionVerification, withEnhancedRecovery } from './enhanced-error-recovery';

/**
 * Executes a transaction with retry
 */
export const executeWithRetry = executeTransaction;

/**
 * Executes a transaction with verification
 */
export const executeWithVerification = async (
  operation: () => Promise<any>,
  verifyFn: () => Promise<boolean>,
  options: any = {}
) => {
  return withEnhancedRecovery(operation, {
    usePolledVerification: true,
    verifyOperation: createTransactionVerification(verifyFn),
    ...options
  });
};

/**
 * Error recovery wrapper
 * @deprecated Use withEnhancedRecovery instead
 */
export const executeWithEnhancedRecovery = withEnhancedRecovery;