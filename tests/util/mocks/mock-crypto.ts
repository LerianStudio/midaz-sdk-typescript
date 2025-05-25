/**
 * Mock implementation of the crypto module for testing purposes
 */
export const mockCrypto = {
  /**
   * Creates a mock hash object with update and digest methods
   * @param _algorithm The hash algorithm to use (ignored in mock)
   * @returns Object with update and digest methods
   */
  createHash: (_algorithm: string) => {
    const hash = {
      /**
       * Mock update method that returns this for chaining
       * @param _data The data to hash (ignored in mock)
       * @returns this for method chaining
       */
      update: (_data: string) => {
        return hash;
      },
      /**
       * Mock digest method that returns a fixed hash value
       * @param _encoding The encoding to use (ignored in mock)
       * @returns Fixed mock hash value
       */
      digest: (_encoding?: string) => {
        return 'mock-idempotency-key';
      },
    };
    return hash;
  },
};

export default mockCrypto;
