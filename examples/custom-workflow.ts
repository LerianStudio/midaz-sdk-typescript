/**
 * Midaz SDK - Custom Financial Workflow Example
 *
 * This example demonstrates how to use the utility modules of the Midaz SDK:
 * 1. Validation utilities for input data validation
 * 2. Error handling utilities for robust error management
 * 3. Caching utilities for performance optimization
 * 4. Concurrency utilities for parallel processing
 * 5. Observability for monitoring and tracing
 */

import {
  // Core entity types
  MidazClient,
  StatusCode,

  // Transaction builders
  createDepositTransaction,
  createTransferTransaction,

  // Data utilities
  extractItems,
  formatAccountBalance,
  groupAccountsByAsset,
  isExternalAccount,

  // Builder factories
  createOrganizationBuilder,
  createLedgerBuilder,
  createAssetBuilderWithType,
  createAccountBuilder,

  // Error handling utilities
  createErrorHandler,
  executeTransaction,
  processError,
  logDetailedError,
  withErrorRecovery,
  
  // Configuration
  ConfigService,
} from '../src';

// Import utility modules directly for demonstration
import { Cache } from '../src/util/cache';
import { workerPool } from '../src/util/concurrency';
import { Observability } from '../src/util/observability/observability';
import {
  validate,
  validateNotEmpty,
  validateRequired,
  combineValidationResults,
} from '../src/util/validation';
import { RetryPolicy } from '../src/util/network/retry-policy';

// Custom interfaces for our workflow
interface AssetConfig {
  name: string;
  code: string;
  type: string;
  symbol: string;
  decimalPlaces: number;
}

interface AssetInfo {
  id: string;
  assetCode: string;
  name: string;
  decimalPlaces: number;
}

interface AccountTask {
  assetCode: string;
  accountType: 'deposit' | 'savings' | 'loans' | 'marketplace' | 'creditCard' | 'external';
  name: string;
  assetId: string;
  decimalPlaces: number;
}

interface AccountInfo {
  id: string;
  name: string;
  assetCode: string;
  accountType: string;
  decimalPlaces: number;
}

/**
 * Main workflow function demonstrating various SDK utilities
 */
async function main() {
  try {
    console.log('=== MIDAZ CUSTOM WORKFLOW EXAMPLE ===');

    // Configure with ConfigService for local development settings
    ConfigService.configure({
      apiUrls: {
        onboardingUrl: 'http://localhost:3000', // Base URL without version
        transactionUrl: 'http://localhost:3001', // Base URL without version
      },
      httpClient: {
        debug: false,
      },
      observability: {
        serviceName: 'custom-workflow-example',
        enableTracing: true,
        enableMetrics: true,
      },
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 200,
        maxDelay: 2000,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      },
    });
    
    // Initialize client using the centralized configuration
    const client = new MidazClient({
      apiKey: 'test-key',
      apiVersion: 'v1', // Specify API version explicitly
    });

    // Set up custom cache for the workflow
    const workflowCache = new Cache({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
      useLRU: true,
    });

    // Set up custom observability for the workflow
    const workflowObservability = new Observability({
      serviceName: 'workflow-demo',
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
    });

    // Create a span for the entire workflow
    const workflowSpan = workflowObservability.startSpan('custom-workflow');
    workflowSpan.setAttribute('startTime', Date.now());

    try {
      // STEP 1: Create an organization
      workflowSpan.setAttribute('currentStep', 'create-organization');
      console.log('\n[1] CREATING ORGANIZATION...');

      // Use the method chaining builder pattern with validation utilities
      const orgWithMetadata = createOrganizationBuilder(
        'Demo Corporation',
        '123456789',
        'Demo Inc.'
      )
        .withAddress({
          line1: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'US',
        })
        .withMetadata({
          industry: 'Technology',
          employeeCount: 250,
        })
        .build();

      // Validate organization input with custom validation
      try {
        // Combine multiple validations
        const validationResults = combineValidationResults([
          validateRequired(orgWithMetadata, 'organization'),
          validateNotEmpty(orgWithMetadata.legalName, 'legalName'),
          validateNotEmpty(orgWithMetadata.doingBusinessAs, 'doingBusinessAs'),
        ]);

        // Throw if validation fails
        validate(orgWithMetadata, () => validationResults);
      } catch (error) {
        workflowSpan.recordException(error as Error);
        console.error('Organization validation failed:', error);
        throw error;
      }

      // Create organization directly
      const organization = await client.entities.organizations.createOrganization(orgWithMetadata);

      // Cache the organization for later use
      workflowCache.set('organization', organization);
      console.log(`✓ Organization "${organization.legalName}" created with ID: ${organization.id}`);

      // STEP 2: Create a ledger
      workflowSpan.setAttribute('currentStep', 'create-ledger');
      console.log('\n[2] CREATING LEDGER...');

      const ledgerInput = createLedgerBuilder('Main Ledger')
        .withMetadata({
          description: 'Primary ledger for all transactions',
          category: 'operational',
        })
        .build();

      // Fix: Remove status field to avoid format issues
      delete (ledgerInput as any).status;

      const ledger = await client.entities.ledgers.createLedger(organization.id, ledgerInput);

      // Cache the ledger
      workflowCache.set('ledger', ledger);
      console.log(`✓ Ledger "${ledger.name}" created with ID: ${ledger.id}`);

      // STEP 3: Create assets using concurrency utilities
      workflowSpan.setAttribute('currentStep', 'create-assets');
      console.log('\n[3] CREATING ASSETS...');

      const assetConfigs: AssetConfig[] = [
        { name: 'US Dollar', code: 'USD', type: 'currency', symbol: '$', decimalPlaces: 2 },
        { name: 'Euro', code: 'EUR', type: 'currency', symbol: '€', decimalPlaces: 2 },
        { name: 'Bitcoin', code: 'BTC', type: 'crypto', symbol: '₿', decimalPlaces: 8 },
      ];

      // Use concurrency utilities to create assets in parallel
      const createdAssets = await workerPool(
        assetConfigs,
        async (assetConfig: AssetConfig, index: number): Promise<AssetInfo> => {
          const assetSpan = workflowObservability.startSpan('create-asset');
          assetSpan.setAttribute('assetCode', assetConfig.code);

          try {
            const assetInput = createAssetBuilderWithType(
              assetConfig.name,
              assetConfig.code,
              assetConfig.type
            )
              .withMetadata({
                symbol: assetConfig.symbol,
                decimalPlaces: assetConfig.decimalPlaces,
              })
              .build();

            const asset = await client.entities.assets.createAsset(
              organization.id,
              ledger.id,
              assetInput
            );

            assetSpan.setStatus('ok');
            return {
              id: asset.id,
              assetCode: assetConfig.code,
              name: assetConfig.name,
              decimalPlaces: assetConfig.decimalPlaces,
            };
          } catch (error) {
            assetSpan.recordException(error as Error);
            assetSpan.setStatus('error', (error as Error).message);
            throw error;
          } finally {
            assetSpan.end();
          }
        },
        {
          concurrency: 2, // Create 2 assets at a time
          preserveOrder: true, // Keep the order of results
        }
      );

      // Cache the assets
      workflowCache.set('assets', createdAssets);
      console.log(`✓ Created ${createdAssets.length} assets`);

      // STEP 4: Create accounts for each asset
      workflowSpan.setAttribute('currentStep', 'create-accounts');
      console.log('\n[4] CREATING ACCOUNTS...');

      const accountTypes = ['deposit', 'savings', 'loans'];
      const accountCreationTasks: AccountTask[] = [];

      // Prepare account creation tasks
      for (const asset of createdAssets) {
        for (let i = 0; i < accountTypes.length; i++) {
          const accountType = accountTypes[i] as 'deposit' | 'savings' | 'loans';
          accountCreationTasks.push({
            assetCode: asset.assetCode,
            accountType,
            name: `${asset.name} ${accountType} Account`,
            assetId: asset.id,
            decimalPlaces: asset.decimalPlaces,
          });
        }
      }

      // Create accounts using worker pool for controlled concurrency
      const createdAccounts = await workerPool(
        accountCreationTasks,
        async (accountTask: AccountTask, index: number): Promise<AccountInfo> => {
          const accountSpan = workflowObservability.startSpan('create-account');
          accountSpan.setAttribute('assetCode', accountTask.assetCode);
          accountSpan.setAttribute('accountType', accountTask.accountType);

          try {
            const accountInput = createAccountBuilder(
              accountTask.name,
              accountTask.assetCode,
              accountTask.accountType
            )
              .withMetadata({
                description: `Account for ${accountTask.assetCode}`,
                category: accountTask.accountType,
              })
              .build();

            // Remove status field to avoid format issues
            delete (accountInput as any).status;

            const account = await client.entities.accounts.createAccount(
              organization.id,
              ledger.id,
              accountInput
            );

            accountSpan.setStatus('ok');
            return {
              id: account.id || `missing-id-${Date.now()}`,
              name: account.name,
              assetCode: accountTask.assetCode,
              accountType: accountTask.accountType,
              decimalPlaces: accountTask.decimalPlaces,
            };
          } catch (error) {
            accountSpan.recordException(error as Error);
            accountSpan.setStatus('error', (error as Error).message);
            throw error;
          } finally {
            accountSpan.end();
          }
        },
        {
          concurrency: 3, // Create 3 accounts at a time
          preserveOrder: true,
        }
      );

      // Cache the accounts
      workflowCache.set('accounts', createdAccounts);
      console.log(`✓ Created ${createdAccounts.length} accounts`);

      // STEP 5: Fund accounts with deposit transactions
      workflowSpan.setAttribute('currentStep', 'create-deposits');
      console.log('\n[5] FUNDING ACCOUNTS WITH DEPOSITS...');

      // Group accounts by asset code
      const accountsByAsset = groupAccountsByAsset(createdAccounts);
      let depositCount = 0;

      for (const assetCode in accountsByAsset) {
        const accounts = accountsByAsset[assetCode];

        for (const account of accounts) {
          // Skip accounts without IDs (should not happen with our fix above)
          if (!account.id || account.id.startsWith('missing-id')) {
            console.warn(`Skipping deposit for account without valid ID: ${account.name}`);
            continue;
          }

          const depositAmount = 100000; // Represents 1000.00 with scale 2

          // Create deposit transaction with correct external account pattern
          const depositTx = createDepositTransaction(
            `external/${assetCode}`,
            account.id,
            depositAmount,
            assetCode,
            2,
            `Initial funding for ${account.name}`,
            { createdBy: 'custom-workflow' }
          );

          // Remove potentially problematic fields
          delete (depositTx as any).status;

          // Verify required fields are present in transaction operations
          const hasValidOperations =
            depositTx.operations &&
            depositTx.operations.length === 2 &&
            depositTx.operations[0].accountId &&
            depositTx.operations[1].accountId;

          if (!hasValidOperations) {
            console.warn(`Skipping deposit with invalid operations for ${account.name}`);
            continue;
          }

          // Execute transaction directly
          const result = await client.entities.transactions.createTransaction(
            organization.id,
            ledger.id,
            depositTx
          );

          depositCount++;
        }
      }

      console.log(`✓ Created ${depositCount} deposit transactions`);

      // STEP 6: Create transfers between accounts
      workflowSpan.setAttribute('currentStep', 'create-transfers');
      console.log('\n[6] CREATING TRANSFERS BETWEEN ACCOUNTS...');

      let transferCount = 0;
      const MAX_TRANSFERS = 100;

      // We'll use smaller amounts for transfers to allow more transactions
      for (const assetCode in accountsByAsset) {
        const accounts = accountsByAsset[assetCode];

        // Need at least 2 accounts to transfer between
        if (accounts.length < 2) continue;

        // Skip accounts without IDs
        const validAccounts = accounts.filter((acc) => acc.id && !acc.id.startsWith('missing-id'));
        if (validAccounts.length < 2) continue;

        // Keep track of estimated account balances to avoid overdrafts
        const accountBalances: Record<string, number> = {};
        validAccounts.forEach((acc) => {
          // Start with initial deposit of 1000 units
          accountBalances[acc.id] = 1000;
        });

        // Calculate smaller transfer amount based on asset type
        const baseTransferAmount =
          assetCode === 'BTC'
            ? 0.01 // 0.01 BTC
            : 10; // 10 units (USD/EUR)

        const transferAmount = baseTransferAmount;

        // Create multiple transfers between each pair of accounts
        for (let t = 0; t < MAX_TRANSFERS && transferCount < MAX_TRANSFERS; t++) {
          // Alternate between account pairs in a round-robin fashion
          for (let i = 0; i < validAccounts.length && transferCount < MAX_TRANSFERS; i++) {
            // Get source and destination accounts in a circular pattern
            const sourceIndex = i;
            const destIndex = (i + 1) % validAccounts.length;

            const sourceAccount = validAccounts[sourceIndex];
            const destinationAccount = validAccounts[destIndex];

            // Skip if insufficient funds (based on our tracking)
            if (accountBalances[sourceAccount.id] < transferAmount) {
              continue;
            }

            const transferTx = createTransferTransaction(
              sourceAccount.id,
              destinationAccount.id,
              transferAmount,
              assetCode,
              2,
              `Transfer #${transferCount + 1} from ${sourceAccount.name} to ${
                destinationAccount.name
              }`,
              { createdBy: 'custom-workflow' }
            );

            // Remove potentially problematic fields
            delete (transferTx as any).status;

            // Verify required fields are present in transaction operations
            const hasValidOperations =
              transferTx.operations &&
              transferTx.operations.length === 2 &&
              transferTx.operations[0].accountId &&
              transferTx.operations[1].accountId;

            if (!hasValidOperations) {
              console.warn(
                `Skipping transfer with invalid operations from ${sourceAccount.name} to ${destinationAccount.name}`
              );
              continue;
            }

            // Execute transaction directly
            const result = await client.entities.transactions.createTransaction(
              organization.id,
              ledger.id,
              transferTx
            );

            // Update our estimated account balances
            accountBalances[sourceAccount.id] -= transferAmount;
            accountBalances[destinationAccount.id] += transferAmount;

            transferCount++;

            // Show progress every 10 transfers
            if (transferCount % 10 === 0) {
              console.log(`  Progress: ${transferCount}/${MAX_TRANSFERS} transfers created...`);
            }
          }
        }
      }

      console.log(`✓ Created ${transferCount} transfer transactions`);

      // STEP 7: Display account balances
      workflowSpan.setAttribute('currentStep', 'display-balances');
      console.log('\n[7] ACCOUNT BALANCES:');

      // Fetch all balances directly
      const balances = await client.entities.balances.listBalances(organization.id, ledger.id);

      const balanceItems = extractItems(balances);

      // Try to fetch external accounts directly by their IDs
      const assetCodes = Object.keys(accountsByAsset);

      for (const assetCode of assetCodes) {
        try {
          // Try both patterns for external accounts
          const externalAccountIdPatterns = [`external/${assetCode}`, `@external/${assetCode}`];

          for (const externalAccountId of externalAccountIdPatterns) {
            try {
              const accountBalances = await client.entities.balances.listAccountBalances(
                organization.id,
                ledger.id,
                externalAccountId
              );

              const items = extractItems(accountBalances);
              if (items && items.length > 0) {
                balanceItems.push(...items);
                console.log(`  Found external account with ID: ${externalAccountId}`);
                break; // If successful, no need to try other patterns
              }
            } catch (error) {
              // Try next pattern
              continue;
            }
          }
        } catch (error) {
          // Continue silently - some asset codes might not have external accounts
        }
      }

      // Use the SDK's categorization helper (manually implemented due to typing issues)
      const regularAccounts: any[] = [];
      const systemAccounts: any[] = [];

      for (const balance of balanceItems) {
        const balanceObj = balance as any;
        if (
          balanceObj.accountId &&
          (balanceObj.accountId.startsWith('@external/') ||
            balanceObj.accountId.startsWith('external/') ||
            balanceObj.accountId.includes('/external/'))
        ) {
          systemAccounts.push(balanceObj);
        } else {
          regularAccounts.push(balanceObj);
        }
      }

      // Display regular account balances
      console.log('  Regular Accounts:');
      if (regularAccounts.length === 0) {
        console.log('    No regular accounts found');
      } else {
        for (const balance of regularAccounts) {
          const formattedBalance = formatAccountBalance(balance);
          console.log(`    * ${formattedBalance.displayString}`);
        }
      }

      // Display system account balances
      console.log('  System Accounts:');
      if (systemAccounts.length === 0) {
        console.log('    No system accounts found');
      } else {
        for (const balance of systemAccounts) {
          const formattedBalance = formatAccountBalance(balance, {
            accountType: 'External Account',
          });
          console.log(`    * ${formattedBalance.displayString}`);
        }
      }

      workflowSpan.setStatus('ok');
      console.log('\n=== WORKFLOW COMPLETED SUCCESSFULLY ===');
    } finally {
      // Record workflow end time
      workflowSpan.setAttribute('endTime', Date.now());
      workflowSpan.end();
    }
  } catch (error) {
    console.error('\n❌ WORKFLOW ERROR:');
    // Use enhanced error handling
    const errorInfo = processError(error);

    // Log detailed error with context
    logDetailedError(error, {
      source: 'custom-workflow',
      timestamp: new Date().toISOString(),
    });

    console.error(`Error: ${errorInfo.userMessage}`);

    if (errorInfo.recoveryRecommendation) {
      console.error(`Recommendation: ${errorInfo.recoveryRecommendation}`);
    }

    process.exit(1);
  }
}

// Run the workflow
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
