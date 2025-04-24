/**
 * Midaz SDK - Client Configuration Examples
 *
 * This example demonstrates how to use the client configuration builder
 * to create different configurations for the Midaz client.
 */

import {
  // Client and configuration
  MidazClient,
  createClientConfigBuilder,
  createSandboxConfig,
  createLocalConfig,

  // Entity types
  Organization,
} from '../src';

/**
 * Example 1: Using the builder pattern for configuration
 */
async function builderExample() {
  console.log('\n=== EXAMPLE 1: BUILDER PATTERN ===');

  // Create client with a configuration builder
  const client = new MidazClient(
    createClientConfigBuilder('your-api-key')
      .withEnvironment('sandbox')
      .withTimeout(5000)
      .withRetryPolicy({
        maxRetries: 3,
        initialDelay: 200,
      })
      .withObservability({
        enableTracing: true,
        serviceName: 'example-service',
      })
  );

  console.log('Client created with builder pattern');
  console.log('SDK Version:', client.getVersion());

  // Now you can use the client
  try {
    // Fetch organizations (this will fail with a fake API key, which is expected)
    console.log('Fetching organizations...');
    const organizations = await client.entities.organizations.listOrganizations();
    console.log(`Found ${organizations.items.length} organizations`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Expected error occurred:', errorMessage);
  }
}

/**
 * Example 2: Using factory functions for common configurations
 */
async function factoryExample() {
  console.log('\n=== EXAMPLE 2: FACTORY FUNCTIONS ===');

  // Create a client with sandbox configuration
  const sandboxClient = new MidazClient(
    createSandboxConfig('your-sandbox-key').withObservability({
      enableMetrics: true,
    })
  );

  console.log('Sandbox client created with factory function');

  // Create a client with local development configuration
  const localClient = new MidazClient(createLocalConfig('test-key', 3000));

  console.log('Local client created with factory function');
  // Get config details
  const config = localClient.getConfig();
  console.log('Local client base URLs:', config.baseUrls);
}

/**
 * Main function that runs all examples
 */
async function main() {
  try {
    console.log('=== MIDAZ CLIENT CONFIGURATION EXAMPLES ===');

    await builderExample();
    await factoryExample();

    console.log('\n=== ALL EXAMPLES COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n❌ ERROR RUNNING EXAMPLES:');
    console.error(error);
  }
}

// Run the examples
main();
