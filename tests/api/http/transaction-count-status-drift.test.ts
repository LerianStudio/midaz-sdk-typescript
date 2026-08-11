import { COUNT_STATUS_SET } from '../../../src/api/http/http-transaction-api-client';
import { TransactionCountStatus } from '../../../src/models/transaction';

/**
 * The union spelled out a second time. Both this map and the client's are
 * `Record<TransactionCountStatus, true>`, so a member added to the union stops both
 * compiling, and a member the client carries alone shows up in the comparison below.
 */
const DECLARED: Record<TransactionCountStatus, true> = {
  CREATED: true,
  APPROVED: true,
  PENDING: true,
  CANCELED: true,
  NOTED: true,
};

describe('the transaction count statuses against their union', () => {
  it('carries every status the union declares, and no other', () => {
    expect(Object.keys(COUNT_STATUS_SET).sort()).toEqual(Object.keys(DECLARED).sort());
  });

  it('keys the statuses by name, so a free-standing array cannot stand in', () => {
    expect(Object.keys(COUNT_STATUS_SET).every((status) => /^[A-Z]+$/.test(status))).toBe(true);
  });
});
