/**
 * @file SHA-256 must work where `globalThis.crypto` is absent
 *
 * The package declares support for Node.js >=18.18.0, and Node.js 18 does not
 * expose `globalThis.crypto` unless started with --experimental-global-webcrypto.
 * `tests/setup.ts` installs a polyfill, which hides that gap from every other
 * suite, so this one removes the global on purpose.
 */
import { sha256 } from '../../../src/util/crypto';

describe('sha256 without a global Web Crypto', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  });

  it('falls back to the Node implementation instead of throwing', async () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const digest = await sha256('correlation:abc:def');

    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same digest with and without the global', async () => {
    const withGlobal = await sha256('same-input');

    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const withoutGlobal = await sha256('same-input');

    expect(withoutGlobal).toBe(withGlobal);
  });
});
