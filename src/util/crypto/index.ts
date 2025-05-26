/**
 * Cross-platform cryptography utilities
 * Provides a unified interface for cryptographic operations
 * that works in browsers, Node.js, and other JavaScript environments
 */

/**
 * Convert a string to a Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert a Uint8Array to a hex string
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a SHA-256 hash of the input string
 * Works in all modern JavaScript environments
 */
export async function sha256(input: string): Promise<string> {
  const msgBuffer = stringToUint8Array(input);

  // Try Web Crypto API (available in browsers and modern Node.js)
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
    return uint8ArrayToHex(new Uint8Array(hashBuffer));
  }

  // Fallback for older environments - use a pure JS implementation
  // For production, you might want to include a lightweight SHA-256 library
  throw new Error(
    'SHA-256 hashing not available in this environment. Please use a modern browser or Node.js 15+'
  );
}

/**
 * Generate a random UUID v4
 * Works in all modern JavaScript environments
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers and Node.js 16+)
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  // Fallback UUID v4 implementation
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate random bytes
 * @param length Number of random bytes to generate
 */
export function getRandomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);

  // Use crypto.getRandomValues if available
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    globalThis.crypto.getRandomValues(buffer);
    return buffer;
  }

  // Fallback to Math.random (less secure, but works everywhere)
  for (let i = 0; i < length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }

  return buffer;
}

/**
 * Generate a random string of specified length
 * @param length Length of the random string
 * @param charset Character set to use (default: alphanumeric)
 */
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  const randomBytes = getRandomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % charset.length];
  }

  return result;
}

/**
 * Create an idempotency key
 * @param components Parts to include in the key
 */
export async function createIdempotencyKey(...components: string[]): Promise<string> {
  const combined = components.join(':');
  const timestamp = Date.now().toString();
  const random = generateRandomString(8);

  const fullKey = `${combined}:${timestamp}:${random}`;
  return sha256(fullKey);
}
