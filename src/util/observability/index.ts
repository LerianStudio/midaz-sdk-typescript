/**
 * @file Observability utilities barrel file
 * @description Re-exports all observability-related utilities
 */

// Export from observability.ts
export * from './observability';

// Export from observability-otel.ts with renamed Logger
export {
  Tracer,
  OTelSpan,
  Meter,
  Counter,
  Histogram,
  Logger as OTelLogger,
  OpenTelemetryProvider,
} from './observability-otel';

// Export from logger.ts
export { LogLevel, LogEntry, LogHandler, LoggerOptions, Logger, createFileLogger } from './logger';
