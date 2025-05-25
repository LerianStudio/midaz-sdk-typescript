/**
 * Configuration validation for the Midaz SDK
 */

import { MidazConfig } from '../../client';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Configuration validator
 */
export class ConfigValidator {
  /**
   * Validates the complete configuration
   */
  static validate(config: MidazConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate API key
    if (!config.apiKey) {
      errors.push({
        field: 'apiKey',
        message: 'API key is required',
      });
    } else if (typeof config.apiKey !== 'string') {
      errors.push({
        field: 'apiKey',
        message: 'API key must be a string',
        value: config.apiKey,
      });
    } else if (config.apiKey.length < 10) {
      warnings.push({
        field: 'apiKey',
        message: 'API key seems too short',
        value: config.apiKey.length,
      });
    }

    // Validate base URLs
    if (!config.baseUrls || typeof config.baseUrls !== 'object') {
      errors.push({
        field: 'baseUrls',
        message: 'Base URLs configuration is required',
      });
    } else {
      // Validate onboarding URL
      if (config.baseUrls.onboarding) {
        const urlErrors = this.validateUrl(config.baseUrls.onboarding, 'baseUrls.onboarding');
        errors.push(...urlErrors.errors);
        warnings.push(...urlErrors.warnings);
      }

      // Validate transaction URL
      if (config.baseUrls.transaction) {
        const urlErrors = this.validateUrl(config.baseUrls.transaction, 'baseUrls.transaction');
        errors.push(...urlErrors.errors);
        warnings.push(...urlErrors.warnings);
      }

      // At least one URL must be provided
      if (!config.baseUrls.onboarding && !config.baseUrls.transaction) {
        errors.push({
          field: 'baseUrls',
          message: 'At least one base URL must be provided (onboarding or transaction)',
        });
      }
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number') {
        errors.push({
          field: 'timeout',
          message: 'Timeout must be a number',
          value: config.timeout,
        });
      } else if (config.timeout <= 0) {
        errors.push({
          field: 'timeout',
          message: 'Timeout must be positive',
          value: config.timeout,
        });
      } else if (config.timeout < 1000) {
        warnings.push({
          field: 'timeout',
          message: 'Timeout is very short (< 1 second)',
          value: config.timeout,
        });
      } else if (config.timeout > 300000) {
        warnings.push({
          field: 'timeout',
          message: 'Timeout is very long (> 5 minutes)',
          value: config.timeout,
        });
      }
    }

    // Validate retries
    if (config.retries !== undefined) {
      const retriesResult = this.validateRetries(config.retries);
      errors.push(...retriesResult.errors);
      warnings.push(...retriesResult.warnings);
    }

    // Validate cache (if it exists on the config)
    if ((config as any).cache !== undefined) {
      const cacheResult = this.validateCache((config as any).cache);
      errors.push(...cacheResult.errors);
      warnings.push(...cacheResult.warnings);
    }

    // Validate security
    if (config.security !== undefined) {
      const securityResult = this.validateSecurity(config.security);
      errors.push(...securityResult.errors);
      warnings.push(...securityResult.warnings);
    }

    // Validate observability
    if (config.observability !== undefined) {
      const observabilityResult = this.validateObservability(config.observability);
      errors.push(...observabilityResult.errors);
      warnings.push(...observabilityResult.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates a URL
   */
  private static validateUrl(url: string, field: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof url !== 'string') {
      errors.push({
        field,
        message: 'URL must be a string',
        value: url,
      });
      return { valid: false, errors, warnings };
    }

    try {
      const parsed = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push({
          field,
          message: 'URL must use HTTP or HTTPS protocol',
          value: url,
        });
      }

      // Warn about HTTP in production
      if (
        parsed.protocol === 'http:' &&
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'production'
      ) {
        warnings.push({
          field,
          message: 'Using HTTP in production is not recommended',
          value: url,
        });
      }

      // Check for localhost in production
      if (
        parsed.hostname === 'localhost' &&
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'production'
      ) {
        warnings.push({
          field,
          message: 'Using localhost in production',
          value: url,
        });
      }
    } catch (error) {
      errors.push({
        field,
        message: 'Invalid URL format',
        value: url,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates retry configuration
   */
  private static validateRetries(retries: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof retries === 'number') {
      if (retries < 0) {
        errors.push({
          field: 'retries',
          message: 'Retries must be non-negative',
          value: retries,
        });
      } else if (retries > 10) {
        warnings.push({
          field: 'retries',
          message: 'High number of retries may cause long delays',
          value: retries,
        });
      }
    } else if (typeof retries === 'object') {
      // Validate retry object
      if (retries.maxRetries !== undefined) {
        if (typeof retries.maxRetries !== 'number' || retries.maxRetries < 0) {
          errors.push({
            field: 'retries.maxRetries',
            message: 'Max retries must be a non-negative number',
            value: retries.maxRetries,
          });
        }
      }

      if (retries.initialDelay !== undefined) {
        if (typeof retries.initialDelay !== 'number' || retries.initialDelay < 0) {
          errors.push({
            field: 'retries.initialDelay',
            message: 'Initial delay must be a non-negative number',
            value: retries.initialDelay,
          });
        }
      }

      if (retries.maxDelay !== undefined) {
        if (typeof retries.maxDelay !== 'number' || retries.maxDelay < 0) {
          errors.push({
            field: 'retries.maxDelay',
            message: 'Max delay must be a non-negative number',
            value: retries.maxDelay,
          });
        }
      }

      if (retries.backoffFactor !== undefined) {
        if (typeof retries.backoffFactor !== 'number' || retries.backoffFactor < 1) {
          errors.push({
            field: 'retries.backoffFactor',
            message: 'Backoff factor must be >= 1',
            value: retries.backoffFactor,
          });
        }
      }
    } else {
      errors.push({
        field: 'retries',
        message: 'Retries must be a number or configuration object',
        value: retries,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates cache configuration
   */
  private static validateCache(cache: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof cache !== 'object') {
      errors.push({
        field: 'cache',
        message: 'Cache must be a configuration object',
        value: cache,
      });
      return { valid: false, errors, warnings };
    }

    if (cache.ttl !== undefined) {
      if (typeof cache.ttl !== 'number' || cache.ttl <= 0) {
        errors.push({
          field: 'cache.ttl',
          message: 'Cache TTL must be a positive number',
          value: cache.ttl,
        });
      } else if (cache.ttl < 1000) {
        warnings.push({
          field: 'cache.ttl',
          message: 'Cache TTL is very short (< 1 second)',
          value: cache.ttl,
        });
      }
    }

    if (cache.maxSize !== undefined) {
      if (typeof cache.maxSize !== 'number' || cache.maxSize <= 0) {
        errors.push({
          field: 'cache.maxSize',
          message: 'Cache max size must be a positive number',
          value: cache.maxSize,
        });
      } else if (cache.maxSize > 10000) {
        warnings.push({
          field: 'cache.maxSize',
          message: 'Large cache size may consume significant memory',
          value: cache.maxSize,
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates security configuration
   */
  private static validateSecurity(security: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof security !== 'object') {
      errors.push({
        field: 'security',
        message: 'Security must be a configuration object',
        value: security,
      });
      return { valid: false, errors, warnings };
    }

    // Validate HTTPS enforcement
    if (security.enforceHttps === true && security.allowInsecureHttp === true) {
      errors.push({
        field: 'security',
        message: 'Cannot enforce HTTPS and allow insecure HTTP at the same time',
      });
    }

    // Validate circuit breaker
    if (security.circuitBreaker !== undefined) {
      const cbResult = this.validateCircuitBreaker(security.circuitBreaker);
      errors.push(...cbResult.errors);
      warnings.push(...cbResult.warnings);
    }

    // Validate connection pool
    if (security.connectionPool !== undefined) {
      const poolResult = this.validateConnectionPool(security.connectionPool);
      errors.push(...poolResult.errors);
      warnings.push(...poolResult.warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates circuit breaker configuration
   */
  private static validateCircuitBreaker(cb: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof cb !== 'object') {
      errors.push({
        field: 'security.circuitBreaker',
        message: 'Circuit breaker must be a configuration object',
        value: cb,
      });
      return { valid: false, errors, warnings };
    }

    const fields = ['failureThreshold', 'successThreshold', 'timeout', 'rollingWindow'];
    for (const field of fields) {
      if (cb[field] !== undefined) {
        if (typeof cb[field] !== 'number' || cb[field] <= 0) {
          errors.push({
            field: `security.circuitBreaker.${field}`,
            message: `${field} must be a positive number`,
            value: cb[field],
          });
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates connection pool configuration
   */
  private static validateConnectionPool(pool: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof pool !== 'object') {
      errors.push({
        field: 'security.connectionPool',
        message: 'Connection pool must be a configuration object',
        value: pool,
      });
      return { valid: false, errors, warnings };
    }

    const fields = [
      'maxConnectionsPerHost',
      'maxTotalConnections',
      'connectionTimeout',
      'requestTimeout',
    ];
    for (const field of fields) {
      if (pool[field] !== undefined) {
        if (typeof pool[field] !== 'number' || pool[field] <= 0) {
          errors.push({
            field: `security.connectionPool.${field}`,
            message: `${field} must be a positive number`,
            value: pool[field],
          });
        }
      }
    }

    if (pool.maxConnectionsPerHost > pool.maxTotalConnections) {
      errors.push({
        field: 'security.connectionPool',
        message: 'maxConnectionsPerHost cannot exceed maxTotalConnections',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates observability configuration
   */
  private static validateObservability(obs: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (typeof obs !== 'object') {
      errors.push({
        field: 'observability',
        message: 'Observability must be a configuration object',
        value: obs,
      });
      return { valid: false, errors, warnings };
    }

    // Additional observability validation can be added here

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Formats validation errors for display
   */
  static formatErrors(result: ValidationResult): string {
    const lines: string[] = [];

    if (result.errors.length > 0) {
      lines.push('Configuration Errors:');
      for (const error of result.errors) {
        lines.push(`  - ${error.field}: ${error.message}`);
        if (error.value !== undefined) {
          lines.push(`    Value: ${JSON.stringify(error.value)}`);
        }
      }
    }

    if (result.warnings.length > 0) {
      if (lines.length > 0) lines.push('');
      lines.push('Configuration Warnings:');
      for (const warning of result.warnings) {
        lines.push(`  - ${warning.field}: ${warning.message}`);
        if (warning.value !== undefined) {
          lines.push(`    Value: ${JSON.stringify(warning.value)}`);
        }
      }
    }

    return lines.join('\n');
  }
}
