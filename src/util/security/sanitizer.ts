/**
 * Security utility for sanitizing sensitive data from logs and errors
 */

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /auth[_-]?token/i,
  /bearer/i,
  /password/i,
  /secret/i,
  /credential/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /client[_-]?secret/i,
  /authorization/i,
  /x-api-key/i,
];

// Fields that might contain PII
const PII_FIELDS = [
  'email',
  'phone',
  'ssn',
  'tax_id',
  'national_id',
  'passport',
  'driver_license',
  'bank_account',
  'card_number',
  'cvv',
  'pin',
];

// Resource IDs to partially mask
const ID_FIELDS = [
  'account_id',
  'accountId',
  'organization_id',
  'organizationId',
  'ledger_id',
  'ledgerId',
  'transaction_id',
  'transactionId',
  'user_id',
  'userId',
];

/**
 * Configuration for the sanitizer
 */
export interface SanitizerConfig {
  /**
   * Whether to redact sensitive fields
   * @default true
   */
  redactSensitive?: boolean;

  /**
   * Whether to mask PII fields
   * @default true
   */
  maskPII?: boolean;

  /**
   * Whether to partially mask resource IDs
   * @default true
   */
  maskResourceIds?: boolean;

  /**
   * Custom patterns to redact
   */
  customPatterns?: RegExp[];

  /**
   * Fields to always preserve (whitelist)
   */
  preserveFields?: string[];

  /**
   * Replacement string for redacted content
   * @default '[REDACTED]'
   */
  redactedText?: string;

  /**
   * Enable debug mode (logs what was sanitized)
   * @default false
   */
  debug?: boolean;
}

/**
 * Default sanitizer configuration
 */
const DEFAULT_CONFIG: Required<SanitizerConfig> = {
  redactSensitive: true,
  maskPII: true,
  maskResourceIds: true,
  customPatterns: [],
  preserveFields: [],
  redactedText: '[REDACTED]',
  debug: false,
};

/**
 * Sanitizes a value based on its type and field name
 */
export function sanitizeValue(value: any, fieldName?: string, config: SanitizerConfig = {}): any {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Check if field should be preserved
  if (fieldName && mergedConfig.preserveFields.includes(fieldName)) {
    return value;
  }

  // Handle different types
  if (typeof value === 'string') {
    return sanitizeString(value, fieldName, mergedConfig);
  } else if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeValue(item, fieldName ? `${fieldName}[${index}]` : undefined, config)
    );
  } else if (typeof value === 'object') {
    return sanitizeObject(value, mergedConfig);
  }

  // Return primitives as-is
  return value;
}

/**
 * Sanitizes a string value
 */
function sanitizeString(
  value: string,
  fieldName: string | undefined,
  config: Required<SanitizerConfig>
): string {
  // Check if field name matches sensitive patterns
  if (config.redactSensitive && fieldName) {
    const allPatterns = [...SENSITIVE_PATTERNS, ...config.customPatterns];
    if (allPatterns.some((pattern) => pattern.test(fieldName))) {
      if (config.debug) {
        console.debug(`Sanitizer: Redacted sensitive field '${fieldName}'`);
      }
      return config.redactedText;
    }
  }

  // Check for PII fields
  if (config.maskPII && fieldName && PII_FIELDS.includes(fieldName.toLowerCase())) {
    if (config.debug) {
      console.debug(`Sanitizer: Masked PII field '${fieldName}'`);
    }
    return maskString(value);
  }

  // Check for resource IDs
  if (config.maskResourceIds && fieldName && ID_FIELDS.includes(fieldName)) {
    if (config.debug) {
      console.debug(`Sanitizer: Partially masked ID field '${fieldName}'`);
    }
    return partialMask(value);
  }

  // Check if the value itself looks like sensitive data
  if (config.redactSensitive) {
    // Check for authorization headers
    if (value.toLowerCase().startsWith('bearer ') || value.toLowerCase().startsWith('basic ')) {
      return value.split(' ')[0] + ' ' + config.redactedText;
    }

    // Check for API key patterns
    if (/^[a-zA-Z0-9]{20,}$/.test(value) && value.length > 30) {
      return partialMask(value);
    }
  }

  return value;
}

/**
 * Sanitizes an object recursively
 */
function sanitizeObject(
  obj: Record<string, any>,
  config: Required<SanitizerConfig>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip functions and symbols
    if (typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }

    sanitized[key] = sanitizeValue(value, key, config);
  }

  return sanitized;
}

/**
 * Masks a string showing only first and last few characters
 */
function maskString(value: string): string {
  if (value.length <= 4) {
    return '****';
  }
  if (value.length <= 8) {
    return value[0] + '***' + value[value.length - 1];
  }
  return value.substring(0, 2) + '***' + value.substring(value.length - 2);
}

/**
 * Partially masks a string (useful for IDs)
 */
function partialMask(value: string): string {
  if (value.length <= 8) {
    return value;
  }
  const visibleChars = Math.min(4, Math.floor(value.length / 4));
  return value.substring(0, visibleChars) + '...' + value.substring(value.length - visibleChars);
}

/**
 * Sanitizes error objects for safe logging
 */
export function sanitizeError(error: any, config: SanitizerConfig = {}): any {
  if (!error) return error;

  const sanitized: any = {};

  // Preserve error type and message (but sanitize message)
  if (error.name) sanitized.name = error.name;
  if (error.message) sanitized.message = sanitizeValue(error.message, 'message', config);

  // Sanitize stack trace to remove sensitive file paths
  if (error.stack && typeof error.stack === 'string') {
    sanitized.stack = error.stack
      .split('\n')
      .map((line: string) => line.replace(/\/[^/:]+\/src\//g, '/src/'))
      .join('\n');
  }

  // Sanitize additional properties
  const standardProps = ['name', 'message', 'stack'];
  for (const key of Object.keys(error)) {
    if (!standardProps.includes(key)) {
      sanitized[key] = sanitizeValue(error[key], key, config);
    }
  }

  return sanitized;
}

/**
 * Creates a sanitized logger wrapper
 */
export function createSanitizedLogger(logger: any, config: SanitizerConfig = {}): any {
  const methods = ['debug', 'info', 'warn', 'error', 'trace'];
  const sanitizedLogger: any = {};

  for (const method of methods) {
    if (typeof logger[method] === 'function') {
      sanitizedLogger[method] = (message: string, ...args: any[]) => {
        const sanitizedMessage = sanitizeValue(message, undefined, config);
        const sanitizedArgs = args.map((arg) => sanitizeValue(arg, undefined, config));
        logger[method](sanitizedMessage, ...sanitizedArgs);
      };
    }
  }

  // Preserve other properties
  for (const key of Object.keys(logger)) {
    if (!methods.includes(key)) {
      sanitizedLogger[key] = logger[key];
    }
  }

  return sanitizedLogger;
}

/**
 * Sanitizes HTTP headers
 */
export function sanitizeHeaders(
  headers: Record<string, string | string[]>,
  config: SanitizerConfig = {}
): Record<string, string | string[]> {
  const sanitized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Always redact authorization headers
    if (lowerKey === 'authorization' || lowerKey === 'x-api-key') {
      sanitized[key] = '[REDACTED]';
    } else if (lowerKey === 'cookie' || lowerKey === 'set-cookie') {
      // Partially mask cookies
      sanitized[key] = Array.isArray(value) ? value.map((v) => maskCookie(v)) : maskCookie(value);
    } else {
      sanitized[key] = sanitizeValue(value, key, config);
    }
  }

  return sanitized;
}

/**
 * Masks cookie values
 */
function maskCookie(cookie: string): string {
  return cookie.replace(/=([^;]+)/g, (match, value) => {
    return '=' + (value.length > 4 ? maskString(value) : '****');
  });
}

/**
 * Global sanitizer instance
 */
export class Sanitizer {
  private static instance: Sanitizer;
  private config: Required<SanitizerConfig>;

  private constructor(config: SanitizerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Gets the global sanitizer instance
   */
  static getInstance(config?: SanitizerConfig): Sanitizer {
    if (!Sanitizer.instance) {
      Sanitizer.instance = new Sanitizer(config);
    } else if (config) {
      Sanitizer.instance.updateConfig(config);
    }
    return Sanitizer.instance;
  }

  /**
   * Destroys the singleton instance to free memory
   */
  static destroy(): void {
    Sanitizer.instance = undefined as any;
  }

  /**
   * Updates the sanitizer configuration
   */
  updateConfig(config: Partial<SanitizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Sanitizes a value
   */
  sanitize(value: any, fieldName?: string): any {
    return sanitizeValue(value, fieldName, this.config);
  }

  /**
   * Sanitizes an error
   */
  sanitizeError(error: any): any {
    return sanitizeError(error, this.config);
  }

  /**
   * Sanitizes headers
   */
  sanitizeHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
    return sanitizeHeaders(headers, this.config);
  }

  /**
   * Creates a sanitized logger
   */
  createLogger(logger: any): any {
    return createSanitizedLogger(logger, this.config);
  }
}
