/**
 * HTTP Client - Re-exports the universal HTTP client wrapper
 * This provides backward compatibility while using a pure TypeScript implementation
 */

export * from './http-client-wrapper';
export { HttpClient as default } from './http-client-wrapper';
