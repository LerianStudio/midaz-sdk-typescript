/**
 * Test setup file for the SDK
 * Polyfills crypto API for Node.js test environments
 */

// Polyfill crypto for Node.js environments
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');

  // @ts-expect-error - Adding crypto polyfill to globalThis
  globalThis.crypto = {
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        const hash = crypto.createHash(algorithm.replace('-', '').toLowerCase());
        hash.update(Buffer.from(data));
        return hash.digest();
      },
    },
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (array: Uint8Array) => {
      const bytes = crypto.randomBytes(array.length);
      array.set(bytes);
      return array;
    },
  };
}
