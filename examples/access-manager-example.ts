/**
 * Access Manager Examples
 *
 * This example demonstrates different ways to use the Access Manager for authentication:
 * 1. Environment-based configuration
 * 2. Direct configuration with custom options
 * 3. Fallback authentication with API keys
 * 4. Error handling and token management
 */

import { MidazClient } from '../src/client';
import { AccessManagerConfig } from '../src/util/auth/access-manager';
import { ConfigService } from '../src/util/config';
import { ErrorCategory, isAuthenticationError, MidazError } from '../src/util/error';

/**
 * Example 1: Environment-based Access Manager Configuration
 *
 * This example shows how to configure the Access Manager using environment variables,
 * which is the recommended approach for production environments.
 */
async function environmentConfigExample() {
  console.log('\n=== Environment-based Configuration Example ===');

  // Set environment variables (in practice, these would be set externally)
  if (typeof process !== 'undefined' && process.env) {
    process.env.PLUGIN_AUTH_ENABLED = 'true';
    process.env.PLUGIN_AUTH_ADDRESS = 'http://localhost:4000/v1';
    process.env.MIDAZ_CLIENT_ID = '9670e0ca55a29a466d31';
    process.env.MIDAZ_CLIENT_SECRET = 'dd03f916cacf4a98c6a413d9c38ba102dce436a9';
    process.env.PLUGIN_AUTH_TOKEN_ENDPOINT = '/login/oauth/access_token';
    process.env.PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS = '60';
    process.env.PLUGIN_AUTH_GRANT_TYPE = 'client_credentials';
  }

  try {
    const client = new MidazClient({
      environment: 'production',
      accessManager: {
        enabled: true,
        address:
          (typeof process !== 'undefined' && process.env?.PLUGIN_AUTH_ADDRESS) ||
          'http://localhost:4000/v1',
        clientId:
          (typeof process !== 'undefined' && process.env?.MIDAZ_CLIENT_ID) ||
          '9670e0ca55a29a466d31',
        clientSecret:
          (typeof process !== 'undefined' && process.env?.MIDAZ_CLIENT_SECRET) ||
          'dd03f916cacf4a98c6a413d9c38ba102dce436a9',
      },
    });

    console.log('Client created with environment-based configuration');
    console.log('Access Manager enabled:', client.isUsingAccessManager());

    // Clean up
    await client.shutdown();
  } catch (error) {
    handleError('Environment config example failed:', error);
  }
}

/**
 * Example 2: Direct Access Manager Configuration
 *
 * This example demonstrates how to configure the Access Manager directly
 * with custom options and integration with ConfigService.
 */
async function directConfigExample() {
  console.log('\n=== Direct Configuration Example ===');

  try {
    // Configure global settings using ConfigService
    ConfigService.configure({
      apiUrls: {
        onboardingUrl: 'https://api.example.com/onboarding',
        transactionUrl: 'https://api.example.com/transaction',
      },
      observability: {
        enableTracing: true,
        serviceName: 'access-manager-example',
      },
    });

    // Create Access Manager configuration
    const accessManagerConfig: AccessManagerConfig = {
      enabled: true,
      address: 'http://localhost:4000/v1',
      clientId: '9670e0ca55a29a466d31',
      clientSecret: 'dd03f916cacf4a98c6a413d9c38ba102dce436a9',
      tokenEndpoint: '/login/oauth/access_token',
      refreshThresholdSeconds: 60,
    };

    const client = new MidazClient({
      environment: 'production',
      accessManager: accessManagerConfig,
    });

    console.log('Client created with direct configuration');
    console.log('Access Manager enabled:', client.isUsingAccessManager());

    // Clean up
    await client.shutdown();
  } catch (error) {
    handleError('Direct config example failed:', error);
  }
}

/**
 * Example 3: Fallback Authentication
 *
 * This example demonstrates how to implement fallback authentication using API keys
 * when the Access Manager is unavailable or fails. It shows:
 * 1. How to configure both Access Manager and API key fallback
 * 2. How the SDK automatically switches to API key when Access Manager fails
 * 3. Proper error handling for authentication failures
 */
async function fallbackAuthExample() {
  console.log('\n=== Fallback Authentication Example ===');

  try {
    // First, try with a failing Access Manager configuration
    console.log('Scenario 1: Access Manager fails, fallback to API key');
    const clientWithFallback = new MidazClient({
      environment: 'production',
      accessManager: {
        enabled: true,
        // Using an invalid address to simulate Access Manager failure
        address: 'https://invalid-auth-service.example.com',
        clientId: 'fallback-client-id',
        clientSecret: 'fallback-client-secret',
      },
      // Provide a fallback API key
      apiKey: 'valid-fallback-api-key',
    });

    try {
      // This call will fail with Access Manager but succeed with API key
      const result = await clientWithFallback.entities.organizations.listOrganizations();
      console.log('✓ API call succeeded using fallback API key');
      console.log('  Found', result.items.length, 'organizations');
    } catch (error) {
      if (isAuthenticationError(error)) {
        console.log('✗ Unexpected: Both Access Manager and API key failed');
      }
      throw error;
    }

    // Now try without a fallback API key
    console.log('\nScenario 2: Access Manager fails, no API key fallback');
    const clientNoFallback = new MidazClient({
      environment: 'production',
      accessManager: {
        enabled: true,
        address: 'https://invalid-auth-service.example.com',
        clientId: 'no-fallback-client-id',
        clientSecret: 'no-fallback-client-secret',
      },
      // No apiKey provided - should fail completely
    });

    try {
      // This call should fail since there's no fallback
      await clientNoFallback.entities.organizations.listOrganizations();
      console.log('✗ Unexpected: Call succeeded when it should have failed');
    } catch (error) {
      if (isAuthenticationError(error)) {
        console.log('✓ Expected: Authentication failed with no fallback available');
        console.log('  Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          category: error instanceof MidazError ? error.category : 'N/A',
          code: error instanceof MidazError ? error.code : 'N/A',
        });
      } else {
        throw error;
      }
    }

    // Clean up
    await clientWithFallback.shutdown();
    await clientNoFallback.shutdown();
  } catch (error) {
    handleError('Fallback auth example failed:', error);
  }
}

/**
 * Example 4: Error Handling and Token Management
 *
 * This example demonstrates proper error handling and token management
 * with the Access Manager.
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');

  try {
    const client = new MidazClient({
      environment: 'production',
      accessManager: {
        enabled: true,
        address: 'http://localhost:4000/v1',
        clientId: '9670e0ca55a29a466d31',
        clientSecret: 'dd03f916cacf4a98c6a413d9c38ba102dce436a9',
        tokenEndpoint: '/login/oauth/access_token',
        refreshThresholdSeconds: 60,
      },
    });

    try {
      // Make multiple API calls to demonstrate token management
      console.log('Making first API call...');
      const result1 = await client.entities.organizations.listOrganizations();
      console.log('First call succeeded:', result1.items.length, 'organizations found');

      // Wait for token to approach refresh threshold
      console.log('Waiting for token refresh threshold...');
      await new Promise((resolve) => setTimeout(resolve, 30000));

      console.log('Making second API call...');
      const result2 = await client.entities.organizations.listOrganizations();
      console.log('Second call succeeded:', result2.items.length, 'organizations found');
      console.log('Token was automatically refreshed');
    } catch (error) {
      if (error instanceof MidazError && error.category === ErrorCategory.AUTHENTICATION) {
        console.log('Authentication error:', error.message);
        console.log('Error code:', error.code);
        console.log('Request ID:', error.requestId);
      }
      throw error;
    }

    // Clean up
    await client.shutdown();
  } catch (error) {
    handleError('Error handling example failed:', error);
  }
}

/**
 * Helper function to handle errors consistently across examples
 */
function handleError(context: string, error: unknown) {
  console.error(context);
  if (error instanceof MidazError) {
    console.error('- Message:', error.message);
    console.error('- Category:', error.category);
    console.error('- Code:', error.code);
    if (error.requestId) console.error('- Request ID:', error.requestId);
  } else if (error instanceof Error) {
    console.error('- Message:', error.message);
  } else {
    console.error('- Unknown error:', error);
  }
}

/**
 * Main function that runs all examples
 */
async function main() {
  try {
    console.log('=== ACCESS MANAGER EXAMPLES ===');

    // Run examples
    await environmentConfigExample();
    await directConfigExample();
    await fallbackAuthExample();
    await errorHandlingExample();

    console.log('\n=== ALL EXAMPLES COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n❌ ERROR RUNNING EXAMPLES:');
    console.error(error);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}
