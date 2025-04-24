/**
 * Midaz SDK - Client Configuration Examples
 *
 * This example demonstrates different approaches to configuring the Midaz SDK client:
 * 1. Using the client configuration builder pattern
 * 2. Using factory functions for common configurations
 * 3. Using the ConfigService for centralized configuration management
 */

import {
  // Client and configuration
  ConfigService,
  createClientConfigBuilder,
  createLocalConfig,
  createSandboxConfig,
  MidazClient
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
  const _sandboxClient = new MidazClient(
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
 * Example 3: Using the ConfigService for global configuration
 */
async function configServiceBasicExample() {
  console.log('\n=== EXAMPLE 3: CONFIG SERVICE BASICS ===');
  
  // Reset any previous configurations
  ConfigService.reset();
  
  // Configure global settings using ConfigService
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'https://api.example.com/v1/onboarding',
      transactionUrl: 'https://api.example.com/v1/transaction',
    },
    observability: {
      enableTracing: true,
      enableMetrics: true,
      serviceName: 'config-service-example',
    },
    retryPolicy: {
      maxRetries: 3,
      initialDelay: 200,
      maxDelay: 2000,
    },
    httpClient: {
      timeout: 5000,
      debug: true,
    },
  });
  
  // Create client with minimal configuration - it will use the global config
  const _client = new MidazClient({
    apiKey: 'your-api-key',
  });
  
  console.log('Client created with ConfigService');
  
  // Get the current configuration
  const configService = ConfigService.getInstance();
  const apiUrlConfig = configService.getApiUrlConfig();
  const observabilityConfig = configService.getObservabilityConfig();
  
  console.log('API URLs from ConfigService:', apiUrlConfig);
  console.log('Observability settings from ConfigService:', {
    serviceName: observabilityConfig.serviceName,
    enableTracing: observabilityConfig.enableTracing,
    enableMetrics: observabilityConfig.enableMetrics,
  });
}

/**
 * Example 4: Complete ConfigService example with all configuration options
 */
async function configServiceCompleteExample() {
  console.log('\n=== EXAMPLE 4: COMPLETE CONFIG SERVICE EXAMPLE ===');
  
  // Reset any previous configurations
  ConfigService.reset();
  
  // Configure the SDK using the ConfigService with comprehensive settings
  ConfigService.configure({
    // Set observability configuration
    observability: {
      enableTracing: true,
      enableMetrics: true,
      serviceName: 'my-example-service',
    },
    
    // Set API URLs
    apiUrls: {
      onboardingUrl: 'https://custom-onboarding-api.example.com/v1',
      transactionUrl: 'https://custom-transaction-api.example.com/v1',
    },
    
    // Set retry policy
    retryPolicy: {
      maxRetries: 5,
      initialDelay: 200,
      maxDelay: 2000,
      retryableStatusCodes: [429, 500, 503],
    },
    
    // Set HTTP client configuration
    httpClient: {
      timeout: 10000,
      debug: true,
      maxSockets: 20,
    },
  });
  
  // Create a client - configuration will be applied automatically
  const _client = new MidazClient({
    apiKey: 'your-api-key',
  });
  
  console.log('Client created with comprehensive configuration');
  
  // Get and display the complete configuration
  const configService = ConfigService.getInstance();
  const observabilityConfig = configService.getObservabilityConfig();
  const apiUrlConfig = configService.getApiUrlConfig();
  const retryPolicyConfig = configService.getRetryPolicyConfig();
  const httpClientConfig = configService.getHttpClientConfig();
  
  console.log('Current configuration:');
  console.log('Observability:', {
    serviceName: observabilityConfig.serviceName,
    enableTracing: observabilityConfig.enableTracing,
    enableMetrics: observabilityConfig.enableMetrics,
  });
  console.log('API URLs:', apiUrlConfig);
  console.log('Retry Policy:', {
    maxRetries: retryPolicyConfig.maxRetries,
    initialDelay: retryPolicyConfig.initialDelay,
    maxDelay: retryPolicyConfig.maxDelay,
  });
  console.log('HTTP Client:', {
    timeout: httpClientConfig.timeout,
    debug: httpClientConfig.debug,
    maxSockets: httpClientConfig.maxSockets,
  });
}

/**
 * Example 5: Configuring for different environments with ConfigService
 */
async function configureEnvironmentsExample() {
  console.log('\n=== EXAMPLE 5: ENVIRONMENT-SPECIFIC CONFIGURATIONS ===');
  
  // Reset previous configuration
  ConfigService.reset();
  
  // Configure for development environment
  console.log('Configuring for development environment');
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'http://localhost:3000/v1',
      transactionUrl: 'http://localhost:3001/v1',
    },
    observability: {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      serviceName: 'midaz-dev',
    },
    httpClient: {
      debug: true,
    },
  });
  
  const _devClient = new MidazClient({
    apiKey: 'dev-api-key',
  });
  
  // Reset and configure for production environment
  console.log('\nConfiguring for production environment');
  ConfigService.reset();
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'https://api.midaz.io/v1/onboarding',
      transactionUrl: 'https://api.midaz.io/v1/transaction',
    },
    observability: {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: false,
      serviceName: 'midaz-prod',
    },
    httpClient: {
      debug: false,
      timeout: 60000,
    },
  });
  
  const _prodClient = new MidazClient({
    apiKey: 'prod-api-key',
  });
  
  console.log('Clients created for both environments');
}

/**
 * Example 6: Accessing specific configuration values
 */
async function accessConfigValuesExample() {
  console.log('\n=== EXAMPLE 6: ACCESSING SPECIFIC CONFIG VALUES ===');
  
  // Reset previous configuration
  ConfigService.reset();
  
  // Get the current configuration service instance
  const configService = ConfigService.getInstance();
  
  // Get specific configuration values
  const serviceName = configService.getObservabilityConfig().serviceName;
  const apiUrl = configService.getApiUrlConfig().onboardingUrl;
  const maxRetries = configService.getRetryPolicyConfig().maxRetries;
  const timeout = configService.getHttpClientConfig().timeout;
  
  console.log('Service Name:', serviceName);
  console.log('API URL:', apiUrl);
  console.log('Max Retries:', maxRetries);
  console.log('HTTP Timeout:', timeout);
}

/**
 * Main function that runs all examples
 */
async function main() {
  try {
    console.log('=== MIDAZ CLIENT CONFIGURATION EXAMPLES ===');

    // Traditional configuration approaches
    console.log('\n--- Traditional Configuration Options ---');
    await builderExample();
    await factoryExample();
    
    // ConfigService-based configuration approaches
    console.log('\n--- ConfigService Configuration Options ---');
    await configServiceBasicExample();
    await configServiceCompleteExample();
    await configureEnvironmentsExample();
    await accessConfigValuesExample();

    console.log('\n=== ALL EXAMPLES COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n❌ ERROR RUNNING EXAMPLES:');
    console.error(error);
  }
}

// Run the examples
main();
