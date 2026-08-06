/**
 * @file Observable format of the correlation ID
 *
 * `corr_<base36 timestamp>_<8 lowercase hex>`. The suffix comes from a SHA-256
 * digest, so it is hex — not the alphanumeric charset of `generateRandomString`.
 * Two contexts created inside the same millisecond must still differ.
 */
import { CorrelationManager } from '../../../src/util/tracing/correlation';

const CORRELATION_ID = /^corr_([0-9a-z]+)_([0-9a-f]{8})$/;

afterEach(() => {
  CorrelationManager.destroy();
});

async function newCorrelationId(): Promise<string> {
  const context = await CorrelationManager.getInstance().createContext();
  return context.correlationId;
}

describe('correlation ID format', () => {
  it('is corr_<base36 timestamp>_<8 hex characters>', async () => {
    expect(await newCorrelationId()).toMatch(CORRELATION_ID);
  });

  it('carries a base36 timestamp close to now', async () => {
    const before = Date.now();
    const id = await newCorrelationId();
    const after = Date.now();

    const timestamp = parseInt(CORRELATION_ID.exec(id)![1], 36);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('ends in exactly 8 lowercase hex characters', async () => {
    const suffix = CORRELATION_ID.exec(await newCorrelationId())![2];

    expect(suffix).toHaveLength(8);
    expect(suffix).toMatch(/^[0-9a-f]{8}$/);
  });

  it('stays unique across ids minted in the same millisecond', async () => {
    const frozen = Date.now();
    const realNow = Date.now;
    Date.now = () => frozen;

    try {
      const ids = await Promise.all(Array.from({ length: 20 }, () => newCorrelationId()));

      const prefixes = new Set(ids.map((id) => id.split('_')[1]));
      expect(prefixes.size).toBe(1);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      Date.now = realNow;
    }
  });
});
