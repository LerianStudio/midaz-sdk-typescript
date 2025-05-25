/**
 * Config Utility Example
 *
 * This example demonstrates how to use the configuration utilities from the Midaz SDK
 * to manage and access configuration settings throughout your application.
 */

import { ConfigService } from '../src/util/config';

// Example 1: Basic Configuration Access
function basicConfigExample() {
  console.log('\n=== Basic Configuration Access Example ===');

  // Get the global configuration instance
  const config = ConfigService.getInstance();

  // Get observability configuration
  const observabilityConfig = config.getObservabilityConfig();
  console.log('Default Observability Configuration:');
  console.log(JSON.stringify(observabilityConfig, null, 2));

  // Get API URL configuration
  const apiUrlConfig = config.getApiUrlConfig();
  console.log('\nDefault API URL Configuration:');
  console.log(JSON.stringify(apiUrlConfig, null, 2));

  // Get HTTP client configuration
  const httpConfig = config.getHttpClientConfig();
  console.log('\nDefault HTTP Client Configuration:');
  console.log(JSON.stringify(httpConfig, null, 2));

  // Get retry policy configuration
  const retryConfig = config.getRetryPolicyConfig();
  console.log('\nDefault Retry Policy Configuration:');
  console.log(JSON.stringify(retryConfig, null, 2));
}

// Example 2: Configuration Overrides
function configOverrideExample() {
  console.log('\n=== Configuration Override Example ===');

  // Display original configuration
  const config = ConfigService.getInstance();
  console.log('Original API URL Configuration:');
  console.log(JSON.stringify(config.getApiUrlConfig(), null, 2));

  // Override configuration settings
  console.log('\nOverriding configuration...');
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'https://custom-api.example.com/onboarding',
      transactionUrl: 'https://custom-api.example.com/transactions',
      apiVersion: 'v2',
    },
  });

  // Display updated configuration
  console.log('\nUpdated API URL Configuration:');
  console.log(JSON.stringify(config.getApiUrlConfig(), null, 2));

  // Override only specific settings
  console.log('\nOverriding only the API version...');
  ConfigService.configure({
    apiUrls: {
      apiVersion: 'v3',
    },
  });

  // Display updated configuration
  console.log('\nUpdated API URL Configuration:');
  console.log(JSON.stringify(config.getApiUrlConfig(), null, 2));
}

// Example 3: Environment Variable Integration
function environmentVariableExample() {
  console.log('\n=== Environment Variable Integration Example ===');

  // Get the current configuration
  const config = ConfigService.getInstance();
  const originalHttpConfig = config.getHttpClientConfig();

  console.log('Original HTTP Configuration:');
  console.log(JSON.stringify(originalHttpConfig, null, 2));

  // Simulate setting environment variables
  console.log('\nSimulating environment variables...');
  process.env.MIDAZ_AUTH_TOKEN = 'test-auth-token-from-env';
  process.env.MIDAZ_HTTP_TIMEOUT = '60000';
  process.env.MIDAZ_HTTP_DEBUG = 'true';

  // Reset the config service to pick up new environment variables
  ConfigService.reset();

  // Get the updated configuration
  const updatedConfig = ConfigService.getInstance();
  const updatedHttpConfig = updatedConfig.getHttpClientConfig();

  console.log('\nUpdated HTTP Configuration with environment variables:');
  console.log(JSON.stringify(updatedHttpConfig, null, 2));

  // Clean up environment variables
  delete process.env.MIDAZ_AUTH_TOKEN;
  delete process.env.MIDAZ_HTTP_TIMEOUT;
  delete process.env.MIDAZ_HTTP_DEBUG;

  // Reset the config service again
  ConfigService.reset();
}

// Example 4: Configuration for Different Environments
function environmentConfigExample() {
  console.log('\n=== Configuration for Different Environments Example ===');

  // Development environment configuration
  console.log('Setting up Development environment configuration...');
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'http://localhost:3000',
      transactionUrl: 'http://localhost:3001',
      apiVersion: 'v1',
    },
    httpClient: {
      timeout: 10000,
      debug: true,
    },
    observability: {
      enableTracing: true,
      enableLogging: true,
      serviceName: 'midaz-dev',
    },
  });

  const devConfig = ConfigService.getInstance();
  console.log('\nDevelopment Environment Configuration:');
  console.log('API URLs:', JSON.stringify(devConfig.getApiUrlConfig(), null, 2));
  console.log('HTTP Client:', JSON.stringify(devConfig.getHttpClientConfig(), null, 2));
  console.log('Observability:', JSON.stringify(devConfig.getObservabilityConfig(), null, 2));

  // Reset for staging environment
  ConfigService.reset();

  // Staging environment configuration
  console.log('\nSetting up Staging environment configuration...');
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'https://staging-api.example.com/onboarding',
      transactionUrl: 'https://staging-api.example.com/transactions',
      apiVersion: 'v1',
    },
    httpClient: {
      timeout: 30000,
      debug: false,
    },
    observability: {
      enableTracing: true,
      enableLogging: true,
      serviceName: 'midaz-staging',
    },
  });

  const stagingConfig = ConfigService.getInstance();
  console.log('\nStaging Environment Configuration:');
  console.log('API URLs:', JSON.stringify(stagingConfig.getApiUrlConfig(), null, 2));
  console.log('HTTP Client:', JSON.stringify(stagingConfig.getHttpClientConfig(), null, 2));
  console.log('Observability:', JSON.stringify(stagingConfig.getObservabilityConfig(), null, 2));

  // Reset for production environment
  ConfigService.reset();

  // Production environment configuration
  console.log('\nSetting up Production environment configuration...');
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'https://api.example.com/onboarding',
      transactionUrl: 'https://api.example.com/transactions',
      apiVersion: 'v1',
    },
    httpClient: {
      timeout: 60000,
      debug: false,
    },
    observability: {
      enableTracing: true,
      enableLogging: true,
      serviceName: 'midaz-prod',
      collectorEndpoint: 'https://otel-collector.example.com',
    },
    retryPolicy: {
      maxRetries: 5,
      initialDelay: 200,
      maxDelay: 2000,
    },
  });

  const prodConfig = ConfigService.getInstance();
  console.log('\nProduction Environment Configuration:');
  console.log('API URLs:', JSON.stringify(prodConfig.getApiUrlConfig(), null, 2));
  console.log('HTTP Client:', JSON.stringify(prodConfig.getHttpClientConfig(), null, 2));
  console.log('Observability:', JSON.stringify(prodConfig.getObservabilityConfig(), null, 2));
  console.log('Retry Policy:', JSON.stringify(prodConfig.getRetryPolicyConfig(), null, 2));
}

// Example 5: Using Configuration in Application Components
function configInComponentsExample() {
  console.log('\n=== Using Configuration in Application Components Example ===');

  // Set up a base configuration
  ConfigService.configure({
    apiUrls: {
      onboardingUrl: 'https://api.example.com/onboarding',
      transactionUrl: 'https://api.example.com/transactions',
      apiVersion: 'v1',
    },
    httpClient: {
      apiKey: 'test-api-key',
    },
  });

  // Simulate an API client that uses the configuration
  class ApiClient {
    private config = ConfigService.getInstance();

    constructor(private serviceName: 'onboarding' | 'transaction') {}

    getBaseUrl(): string {
      const apiConfig = this.config.getApiUrlConfig();
      return this.serviceName === 'onboarding' ? apiConfig.onboardingUrl : apiConfig.transactionUrl;
    }

    getApiVersion(): string {
      return this.config.getApiUrlConfig().apiVersion;
    }

    getApiKey(): string | undefined {
      return this.config.getHttpClientConfig().apiKey;
    }

    getFullUrl(endpoint: string): string {
      return `${this.getBaseUrl()}/${this.getApiVersion()}/${endpoint}`;
    }

    async makeRequest(endpoint: string): Promise<void> {
      const url = this.getFullUrl(endpoint);
      const apiKey = this.getApiKey();

      console.log(`Making request to: ${url}`);
      console.log(`Using API key: ${apiKey}`);

      // In a real implementation, this would make an actual HTTP request
      // For this example, we're just simulating the request
      console.log('Request successful');
    }
  }

  // Create clients for different services
  const onboardingClient = new ApiClient('onboarding');
  const transactionClient = new ApiClient('transaction');

  // Use the clients to make requests
  console.log('\nOnboarding Client:');
  console.log('Base URL:', onboardingClient.getBaseUrl());
  console.log('API Version:', onboardingClient.getApiVersion());
  console.log('Full URL for "users" endpoint:', onboardingClient.getFullUrl('users'));

  console.log('\nTransaction Client:');
  console.log('Base URL:', transactionClient.getBaseUrl());
  console.log('API Version:', transactionClient.getApiVersion());
  console.log('Full URL for "payments" endpoint:', transactionClient.getFullUrl('payments'));

  // Simulate making requests
  console.log('\nSimulating requests:');
  onboardingClient.makeRequest('users');
  transactionClient.makeRequest('payments');

  // Update the configuration and see how it affects the clients
  console.log('\nUpdating configuration...');
  ConfigService.configure({
    apiUrls: {
      apiVersion: 'v2',
    },
    httpClient: {
      apiKey: 'updated-api-key',
    },
  });

  // Check the updated URLs and make requests again
  console.log('\nAfter configuration update:');
  console.log('Onboarding Full URL:', onboardingClient.getFullUrl('users'));
  console.log('Transaction Full URL:', transactionClient.getFullUrl('payments'));

  console.log('\nSimulating requests with updated configuration:');
  onboardingClient.makeRequest('users');
  transactionClient.makeRequest('payments');
}

// Run the examples
function runExamples() {
  try {
    basicConfigExample();
    configOverrideExample();
    environmentVariableExample();
    environmentConfigExample();
    configInComponentsExample();
  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    // Reset the configuration service to default state
    ConfigService.reset();
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}
