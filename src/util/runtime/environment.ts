/**
 * Runtime environment detection and compatibility layer
 * This module provides a unified way to access environment variables
 * across different JavaScript runtimes (Node.js, browsers, Deno, etc.)
 */

/**
 * Runtime environment types
 */
export type RuntimeEnvironment = 'node' | 'browser' | 'deno' | 'worker' | 'unknown';

/**
 * Environment variable provider interface
 */
export interface EnvironmentProvider {
  get(key: string): string | undefined;
  getAll(): Record<string, string | undefined>;
}

/**
 * Browser-based environment provider (uses global config)
 */
class BrowserEnvironmentProvider implements EnvironmentProvider {
  private config: Record<string, string | undefined> = {};

  constructor(initialConfig?: Record<string, string | undefined>) {
    this.config = initialConfig || {};

    // Check for global config object
    if (typeof window !== 'undefined' && (window as any).MIDAZ_CONFIG) {
      this.config = { ...this.config, ...(window as any).MIDAZ_CONFIG };
    }
  }

  get(key: string): string | undefined {
    return this.config[key];
  }

  getAll(): Record<string, string | undefined> {
    return { ...this.config };
  }

  set(key: string, value: string | undefined): void {
    this.config[key] = value;
  }

  setAll(config: Record<string, string | undefined>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Node.js environment provider
 */
class NodeEnvironmentProvider implements EnvironmentProvider {
  get(key: string): string | undefined {
    // Use globalThis to avoid direct process reference
    const nodeProcess = (globalThis as any).process;
    return nodeProcess?.env?.[key];
  }

  getAll(): Record<string, string | undefined> {
    const nodeProcess = (globalThis as any).process;
    return nodeProcess?.env || {};
  }
}

/**
 * Deno environment provider
 */
class DenoEnvironmentProvider implements EnvironmentProvider {
  get(key: string): string | undefined {
    try {
      return (globalThis as any).Deno?.env?.get(key);
    } catch {
      return undefined;
    }
  }

  getAll(): Record<string, string | undefined> {
    try {
      return (globalThis as any).Deno?.env?.toObject() || {};
    } catch {
      return {};
    }
  }
}

/**
 * Detect the current runtime environment
 */
export function detectEnvironment(): RuntimeEnvironment {
  // Check for Deno
  if (typeof (globalThis as any).Deno !== 'undefined') {
    return 'deno';
  }

  // Check for Node.js
  if (
    typeof (globalThis as any).process !== 'undefined' &&
    (globalThis as any).process.versions?.node
  ) {
    return 'node';
  }

  // Check for browser
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return 'browser';
  }

  // Check for web worker
  if (typeof self !== 'undefined' && typeof (self as any).importScripts === 'function') {
    return 'worker';
  }

  return 'unknown';
}

/**
 * Create an environment provider based on the current runtime
 */
export function createEnvironmentProvider(
  customProvider?: EnvironmentProvider,
  initialConfig?: Record<string, string | undefined>
): EnvironmentProvider {
  if (customProvider) {
    return customProvider;
  }

  const runtime = detectEnvironment();

  switch (runtime) {
    case 'node':
      return new NodeEnvironmentProvider();
    case 'deno':
      return new DenoEnvironmentProvider();
    case 'browser':
    case 'worker':
    default:
      return new BrowserEnvironmentProvider(initialConfig);
  }
}

/**
 * Global environment provider instance
 */
let globalProvider: EnvironmentProvider | undefined;

/**
 * Get the global environment provider
 */
export function getEnvironmentProvider(): EnvironmentProvider {
  if (!globalProvider) {
    globalProvider = createEnvironmentProvider();
  }
  return globalProvider;
}

/**
 * Set a custom environment provider
 */
export function setEnvironmentProvider(provider: EnvironmentProvider): void {
  globalProvider = provider;
}

/**
 * Convenience function to get an environment variable
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  return getEnvironmentProvider().get(key) || defaultValue;
}

/**
 * Convenience function to set environment variables (browser/worker only)
 */
export function setEnv(key: string, value: string | undefined): void {
  const provider = getEnvironmentProvider();
  if (provider instanceof BrowserEnvironmentProvider) {
    provider.set(key, value);
  }
}

/**
 * Set multiple environment variables (browser/worker only)
 */
export function setEnvConfig(config: Record<string, string | undefined>): void {
  const provider = getEnvironmentProvider();
  if (provider instanceof BrowserEnvironmentProvider) {
    provider.setAll(config);
  }
}
