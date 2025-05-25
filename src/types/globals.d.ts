/**
 * Global type declarations for browser/Node.js compatibility
 */

declare global {
  const process:
    | {
        env?: {
          NODE_ENV?: string;
          [key: string]: string | undefined;
        };
        memoryUsage?: () => {
          rss: number;
          heapTotal: number;
          heapUsed: number;
          external: number;
          arrayBuffers: number;
        };
        exit?: (code?: number) => never;
      }
    | undefined;

  const window: (Window & typeof globalThis) | undefined;
  const self: (Window & typeof globalThis) | undefined;
}

export {};
