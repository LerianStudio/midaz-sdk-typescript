/**
 */

import { createTransactionVerification, withEnhancedRecovery } from './enhanced-error-recovery';
import { executeTransaction } from './error-handler';

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