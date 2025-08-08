/**
 * Integration tests for MidazClient
 * These tests connect to a real Midaz instance running on localhost
 */

import { MidazClient } from '../../src/client';
import { MidazError } from '../../src/util/error/error-types';

// Skip integration tests by default unless MIDAZ_INTEGRATION_TESTS=true
const shouldRunIntegrationTests = process.env.MIDAZ_INTEGRATION_TESTS === 'true';
const describeIntegration = shouldRunIntegrationTests ? describe : describe.skip;

describeIntegration('MidazClient Integration Tests', () => {
  let client: MidazClient;
  let organizationId: string;
  let ledgerId: string;
  let assetId: string;
  let accountId: string;
  let portfolioId: string;

  const onboardingBaseURL = process.env.MIDAZ_ONBOARDING_URL || 'http://localhost:3000';
  const transactionBaseURL = process.env.MIDAZ_TRANSACTION_URL || 'http://localhost:3001';
  const authServerUrl = process.env.PLUGIN_AUTH_ADDRESS || 'http://localhost:8080';
  const clientId = process.env.MIDAZ_CLIENT_ID || 'test-client-id';
  const clientSecret = process.env.MIDAZ_CLIENT_SECRET || 'test-client-secret';

  beforeAll(async () => {
    // Create client for real Midaz instance with AccessManager authentication
    client = new MidazClient({
      baseUrls: {
        onboarding: onboardingBaseURL,
        transaction: transactionBaseURL,
      },
      accessManager: {
        enabled: true,
        address: authServerUrl,
        clientId: clientId,
        clientSecret: clientSecret,
        tokenEndpoint: '/api/login/oauth/access_token',
        refreshThresholdSeconds: 300, // 5 minutes
      },
      security: {
        enforceHttps: false, // Allow HTTP for local testing
        allowInsecureHttp: true,
      },
    });

    // Create test organization for integration tests
    try {
      const org = await client.entities.organizations.createOrganization({
        legalName: `Integration Test Org ${Date.now()}`,
        legalDocument: `${Date.now()}`,
        doingBusinessAs: 'Integration Test',
      });
      organizationId = org.id;

      // Create test ledger
      const ledger = await client.entities.ledgers.createLedger(organizationId, {
        name: 'Integration Test Ledger',
        status: {
          code: 'ACTIVE',
          description: 'Active for testing'
        }
      });
      ledgerId = ledger.id;

      // Create test asset
      const asset = await client.entities.assets.createAsset(organizationId, ledgerId, {
        name: 'Integration Test USD',
        type: 'currency',
        code: 'USD',
        status: {
          code: 'ACTIVE',
          description: 'Active for testing'
        },
        scale: 2
      });
      assetId = asset.id;

      // Create test portfolio
      const portfolio = await client.entities.portfolios.createPortfolio(organizationId, ledgerId, {
        name: 'Integration Test Portfolio',
        status: {
          code: 'ACTIVE',
          description: 'Active for testing'
        }
      });
      portfolioId = portfolio.id;
    } catch (error) {
      console.warn('Failed to set up integration test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (organizationId && client) {
        // Note: In a real scenario, you might want to clean up accounts, assets, etc.
        // For now, we'll just clean up the organization which should cascade delete
        await client.entities.organizations.deleteOrganization(organizationId).catch(() => {
          // Ignore cleanup errors
        });
      }
    } catch (error) {
      console.warn('Failed to clean up integration test data:', error);
    } finally {
      await client?.destroy();
    }
  });

  describe('Organizations API', () => {
    test('should list organizations', async () => {
      const orgs = await client.entities.organizations.listOrganizations();

      expect(orgs).toBeDefined();
      expect(orgs.items).toBeDefined();
      expect(Array.isArray(orgs.items)).toBe(true);
      expect(orgs.items.length).toBeGreaterThan(0);
      
      // Verify our test organization is included
      const testOrg = orgs.items.find(org => org.id === organizationId);
      expect(testOrg).toBeDefined();
      expect(testOrg?.legalName).toContain('Integration Test Org');
    });

    test('should get organization by ID', async () => {
      const org = await client.entities.organizations.getOrganization(organizationId);

      expect(org).toBeDefined();
      expect(org.id).toBe(organizationId);
      expect(org.legalName).toContain('Integration Test Org');
      expect(org.doingBusinessAs).toBe('Integration Test');
    });

    test('should update organization', async () => {
      const updatedOrg = await client.entities.organizations.updateOrganization(organizationId, {
        doingBusinessAs: 'Updated Integration Test',
        metadata: { updated: true }
      });

      expect(updatedOrg).toBeDefined();
      expect(updatedOrg.id).toBe(organizationId);
      expect(updatedOrg.doingBusinessAs).toBe('Updated Integration Test');
      expect(updatedOrg.metadata?.updated).toBe(true);
    });
  });

  describe('Ledgers API', () => {
    test('should list ledgers', async () => {
      const ledgers = await client.entities.ledgers.listLedgers(organizationId);

      expect(ledgers).toBeDefined();
      expect(ledgers.items).toBeDefined();
      expect(Array.isArray(ledgers.items)).toBe(true);
      expect(ledgers.items.length).toBeGreaterThan(0);
      
      // Verify our test ledger is included
      const testLedger = ledgers.items.find(ledger => ledger.id === ledgerId);
      expect(testLedger).toBeDefined();
      expect(testLedger?.name).toBe('Integration Test Ledger');
    });

    test('should get ledger by ID', async () => {
      const ledger = await client.entities.ledgers.getLedger(organizationId, ledgerId);

      expect(ledger).toBeDefined();
      expect(ledger.id).toBe(ledgerId);
      expect(ledger.name).toBe('Integration Test Ledger');
      expect(ledger.organizationId).toBe(organizationId);
    });
  });

  describe('Assets API', () => {
    test('should list assets', async () => {
      const assets = await client.entities.assets.listAssets(organizationId, ledgerId);

      expect(assets).toBeDefined();
      expect(assets.items).toBeDefined();
      expect(Array.isArray(assets.items)).toBe(true);
      expect(assets.items.length).toBeGreaterThan(0);
      
      // Verify our test asset is included
      const testAsset = assets.items.find(asset => asset.id === assetId);
      expect(testAsset).toBeDefined();
      expect(testAsset?.name).toBe('Integration Test USD');
      expect(testAsset?.code).toBe('USD');
    });

    test('should get asset by ID', async () => {
      const asset = await client.entities.assets.getAsset(organizationId, ledgerId, assetId);

      expect(asset).toBeDefined();
      expect(asset.id).toBe(assetId);
      expect(asset.name).toBe('Integration Test USD');
      expect(asset.code).toBe('USD');
      expect(asset.scale).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors for non-existent organization', async () => {
      await expect(
        client.entities.organizations.getOrganization('non-existent-org-id')
      ).rejects.toThrow();
    });

    test('should handle 404 errors for non-existent ledger', async () => {
      await expect(
        client.entities.ledgers.getLedger(organizationId, 'non-existent-ledger-id')
      ).rejects.toThrow();
    });

  });

  describe('Portfolios API', () => {
    test('should list portfolios', async () => {
      const portfolios = await client.entities.portfolios.listPortfolios(organizationId, ledgerId);

      expect(portfolios).toBeDefined();
      expect(portfolios.items).toBeDefined();
      expect(Array.isArray(portfolios.items)).toBe(true);
      expect(portfolios.items.length).toBeGreaterThan(0);
      
      // Verify our test portfolio is included
      const testPortfolio = portfolios.items.find(portfolio => portfolio.id === portfolioId);
      expect(testPortfolio).toBeDefined();
      expect(testPortfolio?.name).toBe('Integration Test Portfolio');
    });

    test('should get portfolio by ID', async () => {
      const portfolio = await client.entities.portfolios.getPortfolio(organizationId, ledgerId, portfolioId);

      expect(portfolio).toBeDefined();
      expect(portfolio.id).toBe(portfolioId);
      expect(portfolio.name).toBe('Integration Test Portfolio');
      expect(portfolio.organizationId).toBe(organizationId);
      expect(portfolio.ledgerId).toBe(ledgerId);
    });
  });

  describe('Account Integration', () => {
    test('should create and manage accounts', async () => {
      // Create a test account
      const account = await client.entities.accounts.createAccount(organizationId, ledgerId, {
        name: 'Integration Test Account',
        alias: 'test-account',
        type: 'deposit',
        assetCode: 'USD',
        portfolioId: portfolioId,
      });

      expect(account).toBeDefined();
      expect(account.name).toBe('Integration Test Account');
      expect(account.type).toBe('deposit');
      expect(account.assetCode).toBe('USD');
      accountId = account.id;

      // List accounts to verify it was created
      const accounts = await client.entities.accounts.listAccounts(organizationId, ledgerId);
      expect(accounts).toBeDefined();
      expect(accounts.items).toBeDefined();
      
      const testAccount = accounts.items.find(acc => acc.id === accountId);
      expect(testAccount).toBeDefined();
      expect(testAccount?.name).toBe('Integration Test Account');

      // Clean up - delete the test account
      await client.entities.accounts.deleteAccount(organizationId, ledgerId, accountId);
    }, 10000); // Increase timeout for this test
  });

  describe('Client Configuration', () => {
    test('should handle different timeout configurations', async () => {
      const fastClient = new MidazClient({
        baseUrls: {
          onboarding: onboardingBaseURL,
          transaction: transactionBaseURL,
        },
        apiKey: apiKey,
        timeout: 5000, // 5 second timeout
        security: {
          enforceHttps: false,
          allowInsecureHttp: true,
        },
      });

      // Should complete within timeout
      const orgs = await fastClient.entities.organizations.listOrganizations();
      expect(orgs).toBeDefined();
      
      await fastClient.destroy();
    });

    test('should handle retry configurations', async () => {
      const retryClient = new MidazClient({
        baseUrls: {
          onboarding: onboardingBaseURL,
          transaction: transactionBaseURL,
        },
        apiKey: apiKey,
        retries: {
          maxRetries: 2,
          initialDelay: 100,
        },
        security: {
          enforceHttps: false,
          allowInsecureHttp: true,
        },
      });

      // Should work normally with retry config
      const orgs = await retryClient.entities.organizations.listOrganizations();
      expect(orgs).toBeDefined();
      
      await retryClient.destroy();
    });
  });
});
