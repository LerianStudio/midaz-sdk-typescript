/**
 * Midaz SDK - Comprehensive Financial Workflow Example
 * 
 * This example demonstrates a complete end-to-end financial system workflow using the Midaz SDK.
 * It shows how to set up and manage all main components of a financial platform:
 * - Organizations, ledgers, assets, and accounts
 * - Transactions, deposits, transfers, and complex transaction patterns
 * - Error handling, recovery mechanisms, and data validation
 * - Batch processing for high-throughput operations
 * - Pagination for large datasets
 * - Observability with complete OpenTelemetry integration (tracing, metrics, logging)
 * 
 * The workflow steps through the entire lifecycle:
 * 1. Create organization structure
 * 2. Set up ledgers (operating and investment accounts)
 * 3. Define assets (currency types, values, properties)
 * 4. Create accounts for each asset
 * 5. Fund accounts with initial deposits (using batch processing)
 * 6. Perform transactions between accounts (using transaction pairs)
 * 7. Demonstrate advanced financial patterns (multi-account transfers, recurring payments)
 * 8. Display account balances with error recovery and pagination
 * 
 * Each section is well-documented with detailed comments to help understand the code.
 * This can be used as both a learning resource and a reference implementation.
 */

import {
  ConfigService,
  createAccountBuilder,
  createAssetBuilderWithType,
  // Batch utilities
  createBatch,
  // Transaction pattern utilities
  createCreditDebitPair,
  createDepositTransaction,
  createLedgerBuilder,
  createMultiAccountTransfer,
  createOrganizationBuilder,
  createRecurringPayment,
  createUserTransfer,
  executeBatch,
  executeTransactionPair,
  extractItems,
  formatAccountBalance,
  groupAccountsByAsset,
  logDetailedError,
  Logger,
  LogLevel,
  MidazClient,
  // Observability utilities
  Observability,
  processError,
  withEnhancedRecovery
} from '../src';

// Import pagination utilities directly from the module
import {
  createPaginator
} from '../src/util/data/pagination-abstraction';

/**
 * Main workflow function that demonstrates a complete financial system workflow
 * using the Midaz SDK. This function orchestrates the entire process from
 * organization creation to account balance display and advanced transaction patterns.
 */
async function main() {
  try {
    console.log('=== MIDAZ WORKFLOW EXAMPLE ===');

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
        enableTracing: true,
        enableMetrics: true,
        enableLogging: true,
        serviceName: 'midaz-workflow-example',
      },
    });
    
    // Set up observability and logging
    const logger = new Logger({
      minLevel: LogLevel.DEBUG,
      defaultModule: 'workflow',
      includeTimestamps: true,
    });
    
    // Initialize global observability
    // This sets up OpenTelemetry with tracing, metrics, and logging
    // The configuration is shared across the entire SDK
    Observability.configure({
      enableTracing: true,  // Enable distributed tracing
      enableMetrics: true,  // Enable metrics collection 
      enableLogging: true,  // Enable structured logging
      serviceName: 'midaz-workflow-example',
      // Disable console output for telemetry data while keeping the telemetry working
      // This is useful for examples and production environments where you don't want
      // to pollute the console but still want to send telemetry to backends
      consoleExporter: false 
    });
    
    // Log the start of our workflow - this demonstrates structured logging
    // The SDK supports rich context with every log message
    logger.info('Starting workflow example', { timestamp: new Date().toISOString() });
    
    // Initialize client using the centralized configuration
    const client = new MidazClient({
      apiKey: 'teste', // Auth is off, so no matter what is here
      apiVersion: 'v1', // Specify API version explicitly
    });

    // Create a workflow span to track the entire process
    // This span will be the parent for all child spans in the workflow
    // OpenTelemetry spans allow tracking detailed timing and context for operations
    const workflowSpan = Observability.startSpan('complete-workflow', {
      startTime: Date.now()
    });
    
    try {
      // STEP 1: CREATE ORGANIZATION
      // Organizations are the top-level entities that group ledgers, accounts, etc.
      console.log('\n[1/8] CREATING ORGANIZATION...');
      
      // Track the current step in the workflow span
      // This allows monitoring systems to see workflow progress
      workflowSpan.setAttribute('currentStep', 'create-organization');
      
      // Create a child span specifically for organization creation
      // This creates a hierarchical trace for detailed performance analysis
      const organizationSpan = Observability.startSpan('create-organization');
      
      // Call the helper function to create an organization with the SDK client
      // See the setupOrganization function below for implementation details
      const organization = await setupOrganization(client);
      console.log(`✓ Organization "${organization.legalName}" created with ID: ${organization.id}`);
      
      // Add important context to the span for later analysis
      organizationSpan.setAttribute('organizationId', organization.id);
      organizationSpan.setStatus('ok');
      organizationSpan.end();  // Always end spans when operations complete
      
      // Record a success metric for this step
      // Metrics can be used for dashboards, alerts, and performance tracking
      Observability.recordMetric('workflow.step.success', 1, { step: 'create-organization' });

      // STEP 2: CREATE LEDGERS
      // Ledgers organize financial records within an organization
      // We'll create two separate ledgers for different purposes:
      // 1. Operating ledger - for day-to-day transactions
      // 2. Investment ledger - for long-term investments
      console.log('\n[2/8] CREATING LEDGERS...');
      
      // Update the workflow span context
      workflowSpan.setAttribute('currentStep', 'create-ledgers');
      
      // Create a span specifically for ledger creation operations
      const ledgerSpan = Observability.startSpan('create-ledgers');
      
      // Create both ledgers in a single helper function
      // See the setupLedgers function below for implementation details 
      const { operatingLedger, investmentLedger } = await setupLedgers(client, organization.id);
      console.log(`✓ Created ledgers: "${operatingLedger.name}" and "${investmentLedger.name}"`);
      
      // Add ledger IDs to the span for context and correlation
      ledgerSpan.setAttribute('operatingLedgerId', operatingLedger.id);
      ledgerSpan.setAttribute('investmentLedgerId', investmentLedger.id);
      ledgerSpan.setStatus('ok');
      ledgerSpan.end();
      
      // Record metric for ledger creation success
      Observability.recordMetric('workflow.step.success', 1, { step: 'create-ledgers' });

      // Create assets
      console.log('\n[3/8] CREATING ASSETS...');
      workflowSpan.setAttribute('currentStep', 'create-assets');
      const assetSpan = Observability.startSpan('create-assets');
      
      const createdAssets = await setupAssets(
        client,
        organization.id,
        operatingLedger.id,
        investmentLedger.id
      );
      console.log(`✓ Created ${createdAssets.length} assets across ledgers`);
      
      assetSpan.setAttribute('assetCount', createdAssets.length);
      assetSpan.setStatus('ok');
      assetSpan.end();
      
      // Record success metric
      Observability.recordMetric('workflow.step.success', 1, { step: 'create-assets' });

      // Create accounts
      console.log('\n[4/8] CREATING ACCOUNTS...');
      workflowSpan.setAttribute('currentStep', 'create-accounts');
      const accountSpan = Observability.startSpan('create-accounts');
      
      const createdAccounts = await setupAccounts(client, organization.id, createdAssets);
      console.log(`✓ Created ${createdAccounts.length} accounts across all assets`);
      
      accountSpan.setAttribute('accountCount', createdAccounts.length);
      accountSpan.setStatus('ok');
      accountSpan.end();
      
      // Record success metric
      Observability.recordMetric('workflow.step.success', 1, { step: 'create-accounts' });

      // Create initial deposits using batch processing
      console.log('\n[5/8] CREATING INITIAL DEPOSITS WITH BATCH PROCESSING...');
      workflowSpan.setAttribute('currentStep', 'create-deposits');
      const depositSpan = Observability.startSpan('create-deposits');
      
      const depositCount = await createInitialDeposits(
        client,
        organization.id,
        createdAccounts
      );
      console.log(`✓ Created ${depositCount} initial deposits`);
      
      depositSpan.setAttribute('depositCount', depositCount);
      depositSpan.setStatus('ok');
      depositSpan.end();
      
      // Record success metric
      Observability.recordMetric('workflow.step.success', 1, { step: 'create-deposits' });

      // Create transaction pairs (credit/debit pairs)
      console.log('\n[6/8] CREATING TRANSACTION PAIRS...');
      workflowSpan.setAttribute('currentStep', 'create-transaction-pairs');
      const pairSpan = Observability.startSpan('create-transaction-pairs');
      
      const transactionPairsCount = await createAdditionalTransactions(
        client,
        organization.id,
        operatingLedger.id,
        createdAccounts
      );
      console.log(`✓ Created ${transactionPairsCount} transaction pairs`);
      
      pairSpan.setAttribute('transactionPairsCount', transactionPairsCount);
      pairSpan.setStatus('ok');
      pairSpan.end();
      
      // Record success metric
      Observability.recordMetric('workflow.step.success', 1, { step: 'create-transaction-pairs' });

      // Create complex transaction patterns
      console.log('\n[7/8] DEMONSTRATING ADVANCED TRANSACTION PATTERNS...');
      workflowSpan.setAttribute('currentStep', 'demonstrate-patterns');
      const patternSpan = Observability.startSpan('demonstrate-patterns');
      
      const patternCount = await demonstrateTransactionPatterns(
        client,
        organization.id,
        operatingLedger.id,
        investmentLedger.id,
        createdAccounts
      );
      console.log(`✓ Executed ${patternCount} advanced transaction patterns`);
      
      patternSpan.setAttribute('patternCount', patternCount);
      patternSpan.setStatus('ok');
      patternSpan.end();
      
      // Record success metric
      Observability.recordMetric('workflow.step.success', 1, { step: 'demonstrate-patterns' });

      // Display balances with error recovery and pagination
      console.log('\n[8/8] DISPLAYING ACCOUNT BALANCES WITH ERROR RECOVERY AND PAGINATION...');
      workflowSpan.setAttribute('currentStep', 'display-balances');
      const balanceSpan = Observability.startSpan('display-balances');
      
      await displayBalances(
        client,
        organization.id,
        operatingLedger.id,
        investmentLedger.id,
        createdAccounts
      );
      console.log('✓ Retrieved and displayed account balances');
      
      balanceSpan.setStatus('ok');
      balanceSpan.end();
      
      // Record success metric
      Observability.recordMetric('workflow.step.success', 1, { step: 'display-balances' });
      
      // Mark the overall workflow as successful
      workflowSpan.setStatus('ok');
      Observability.recordMetric('workflow.completed', 1, { success: 'true' });
      
      console.log('\n=== WORKFLOW COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      // Record the current step where the error occurred
      // Get the current step value directly instead of using getAttribute
      const currentStep = Object.prototype.hasOwnProperty.call(workflowSpan, '_attributes') ? 
        (workflowSpan as any)._attributes?.currentStep || 'unknown' : 'unknown';
      workflowSpan.setAttribute('failedStep', currentStep);
      workflowSpan.recordException(error);
      workflowSpan.setStatus('error', error instanceof Error ? error.message : String(error));
      
      // Record failure metric
      Observability.recordMetric('workflow.completed', 1, { success: 'false' });
      
      throw error;
    } finally {
      // Complete duration measurement and end span
      workflowSpan.setAttribute('endTime', Date.now());
      workflowSpan.end();
      
      // Ensure all telemetry is flushed
      await Observability.getInstance().shutdown();
    }
  } catch (error) {
    console.error('\n❌ WORKFLOW ERROR:');
    handleError(error);
  }
}

// -------------------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------------------

/**
 * Creates an organization with required fields and metadata
 * 
 * Organizations are the top-level entities in the Midaz financial system.
 * Each organization can have multiple ledgers, and each ledger can have
 * multiple assets and accounts. Organizations typically represent a company,
 * financial institution, or other entity operating a financial system.
 * 
 * This function demonstrates:
 * - Using the builder pattern to create complex objects
 * - Setting required fields (legal name, legal document ID, DBA name)
 * - Adding optional data like address and metadata
 * 
 * @param client - The Midaz SDK client instance 
 * @returns The created organization object from the API
 */
async function setupOrganization(client: MidazClient) {
  const organization = createOrganizationBuilder('Example Corporation', '123456789', 'Example Inc.')
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

  return await client.entities.organizations.createOrganization(organization);
}

/**
 * Creates operating and investment ledgers for the organization
 * 
 * Ledgers are the primary accounting structure within an organization.
 * Each ledger acts as a separate set of books, allowing clear separation 
 * between different types of financial activities.
 * 
 * This function creates two ledgers with different purposes:
 * 1. Operating Ledger - For day-to-day financial operations
 * 2. Investment Ledger - For long-term investments and portfolios
 * 
 * Ledgers can have different settings, compliance rules, and reporting
 * requirements, making this separation important for financial organizations.
 * 
 * @param client - The Midaz SDK client instance
 * @param organizationId - ID of the parent organization
 * @returns Object containing both created ledger entities
 */
async function setupLedgers(
  client: MidazClient,
  organizationId: string
) {
  const operatingLedger = await createLedger(
    client,
    organizationId,
    'Operating Ledger',
    'Main ledger for day-to-day operations'
  );
  
  const investmentLedger = await createLedger(
    client,
    organizationId,
    'Investment Ledger',
    'Ledger for long-term investments and portfolios'
  );

  return { operatingLedger, investmentLedger };
}

/**
 * Type definition for asset and account information
 * 
 * This interface is used to track created entities throughout the workflow.
 * It combines the necessary information about accounts and their assets
 * to simplify operations that need both pieces of information.
 * 
 * In a real application, you might store this information in a database
 * or retrieve it from the API as needed, but for this example we track
 * it in memory to demonstrate the workflow more clearly.
 */
interface AccountInfo {
  /** Unique identifier for the account */
  id: string;
  
  /** Display name of the account */
  name: string;
  
  /** Asset code (currency code) for the account (e.g., USD, EUR, BTC) */
  assetCode: string;
  
  /** ID of the ledger this account belongs to */
  ledgerId: string;
  
  /** Display name of the ledger (Operating or Investment) */
  ledgerName: string;
  
  /** Number of decimal places for this asset (e.g., 2 for USD, 8 for BTC) */
  decimalPlaces: number;
}

/**
 * Sets up assets in both operating and investment ledgers
 */
async function setupAssets(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string
): Promise<AccountInfo[]> {
  // Define asset configurations for all supported asset types
  const assetConfigs = [
    { name: 'US Dollar', code: 'USD', type: 'currency', symbol: '$', decimalPlaces: 2 },
    { name: 'Euro', code: 'EUR', type: 'currency', symbol: '€', decimalPlaces: 2 },
    { name: 'Bitcoin', code: 'BTC', type: 'crypto', symbol: '₿', decimalPlaces: 8 },
  ];

  const createdAssets: AccountInfo[] = [];

  // Create assets in Operating Ledger (all assets)
  for (const assetConfig of assetConfigs) {
    const asset = await createAsset(
      client,
      organizationId,
      operatingLedgerId,
      assetConfig.name,
      assetConfig.code,
      assetConfig.type,
      assetConfig.symbol,
      assetConfig.decimalPlaces
    );

    createdAssets.push({
      id: asset.id,
      assetCode: assetConfig.code,
      ledgerId: operatingLedgerId,
      name: assetConfig.name,
      ledgerName: 'Operating',
      decimalPlaces: assetConfig.decimalPlaces,
    });
  }
  
  // Create only USD and BTC in the Investment Ledger
  const investmentAssetConfigs = assetConfigs.filter(asset => 
    asset.code === 'USD' || asset.code === 'BTC'
  );
  
  for (const assetConfig of investmentAssetConfigs) {
    const asset = await createAsset(
      client,
      organizationId,
      investmentLedgerId,
      assetConfig.name,
      assetConfig.code,
      assetConfig.type,
      assetConfig.symbol,
      assetConfig.decimalPlaces
    );

    createdAssets.push({
      id: asset.id,
      assetCode: assetConfig.code,
      ledgerId: investmentLedgerId,
      name: assetConfig.name,
      ledgerName: 'Investment',
      decimalPlaces: assetConfig.decimalPlaces,
    });
  }

  return createdAssets;
}

/**
 * Sets up accounts for each asset across both ledgers
 */
async function setupAccounts(
  client: MidazClient,
  organizationId: string,
  createdAssets: AccountInfo[]
): Promise<AccountInfo[]> {
  // Account types
  const accountTypes = ['deposit', 'savings'];

  const createdAccounts: AccountInfo[] = [];

  // Create accounts for each asset - simplified to create fewer accounts
  for (const asset of createdAssets) {
    // Create 2 accounts per asset
    for (let i = 1; i <= 2; i++) {
      const accountType = accountTypes[i % accountTypes.length] as 'deposit' | 'savings';
      const accountName = `${asset.name} ${accountType} Account ${i}`;

      const account = await createAccount(
        client,
        organizationId,
        asset.ledgerId,
        accountName,
        asset.assetCode,
        accountType,
        `Account for ${asset.assetCode} in ${asset.ledgerName} Ledger`
      );

      createdAccounts.push({
        id: account.id,
        name: accountName,
        assetCode: asset.assetCode,
        ledgerId: asset.ledgerId,
        ledgerName: asset.ledgerName,
        decimalPlaces: asset.decimalPlaces,
      });
    }
  }

  return createdAccounts;
}

/**
 * Creates initial deposits for accounts using batch processing
 * 
 * This function demonstrates several advanced SDK capabilities:
 * 
 * 1. Batch processing - Multiple operations grouped and executed concurrently
 *    This is essential for high-volume financial systems to maintain performance
 * 
 * 2. Enhanced error recovery - Operations with automatic retries and verification
 *    The withEnhancedRecovery utility adds resilience to API operations
 * 
 * 3. Data organization - Account grouping by ledger and asset for processing
 *    Shows how to handle complex data structures in financial applications
 * 
 * 4. Transaction creation patterns - Using the deposit transaction builder
 *    Demonstrates how to use transaction builders for common financial operations
 * 
 * @param client - The Midaz SDK client instance
 * @param organizationId - The ID of the organization to operate on
 * @param accounts - List of account information objects
 * @returns The number of successful deposit transactions created
 */
async function createInitialDeposits(
  client: MidazClient,
  organizationId: string,
  accounts: AccountInfo[]
): Promise<number> {
  let successCount = 0;
  
  // Group accounts by ledger and asset for more organized processing
  const accountsByLedger: Record<string, Record<string, AccountInfo[]>> = {};
  
  for (const account of accounts) {
    if (!accountsByLedger[account.ledgerId]) {
      accountsByLedger[account.ledgerId] = {};
    }
    
    if (!accountsByLedger[account.ledgerId][account.assetCode]) {
      accountsByLedger[account.ledgerId][account.assetCode] = [];
    }
    
    accountsByLedger[account.ledgerId][account.assetCode].push(account);
  }
  
  // Process deposits by ledger and asset using batch processing
  for (const ledgerId in accountsByLedger) {
    for (const assetCode in accountsByLedger[ledgerId]) {
      const ledgerAssetAccounts = accountsByLedger[ledgerId][assetCode];
      
      console.log(`  Processing ${ledgerAssetAccounts.length} ${assetCode} accounts in ledger ${ledgerId}...`);
      
      // Create a batch for processing deposits
      const batch = createBatch({
        concurrency: 3,
        delayBetweenTransactions: 50,
      });
      
      // Add deposit transactions to the batch
      for (const account of ledgerAssetAccounts) {
        // Create deposit transaction (from external account to user account)
        const depositAmount = account.assetCode === 'BTC' ? 0.5 : 1000; // Different amounts based on asset
        const depositTx = createDepositTransaction(
          `external/${account.assetCode}`,
          account.id,
          depositAmount,
          account.assetCode,
          account.decimalPlaces,
          `Initial deposit to ${account.name}`,
          { 
            batchId: `initial-deposits-${Date.now()}`,
            createdBy: 'workflow-script'
          }
        );
        
        // Add the transaction to the batch - we use a closure to capture the context
        batch.add(async () => {
          try {
            // Use enhanced error recovery wrapped around pagination
            const result = await withEnhancedRecovery(
              () => client.entities.transactions.createTransaction(
                organizationId, 
                ledgerId, 
                depositTx
              ),
              {
                maxRetries: 2,
                fallbackAttempts: 1,
                verifyOperation: async () => {
                  // Verify the transaction was created (this is a simplified check)
                  const transactions = await client.entities.transactions.listTransactions(
                    organizationId, 
                    ledgerId,
                    { limit: 100 }
                  );
                  
                  const items = extractItems(transactions);
                  // Check if there's a transaction with matching description
                  return items.some((tx: any) => 
                    tx.description === depositTx.description
                  );
                }
              }
            );
            
            return result;
          } catch (error) {
            console.error(`  Error creating deposit for ${account.id}: ${error}`);
            throw error;
          }
        });
      }
      
      // Execute the batch
      const results = await executeBatch(batch);
      
      // Count successful transactions
      for (const result of results) {
        if (result.status === 'success' || result.status === 'duplicate') {
          successCount++;
        }
      }
    }
  }
  
  return successCount;
}

/**
 * Creates additional credit and debit transactions for each account
 * This demonstrates the transaction pair utilities
 */
async function createAdditionalTransactions(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  accounts: AccountInfo[]
): Promise<number> {
  // Group accounts by asset
  const accountsByAsset = groupAccountsByAsset(accounts);
  
  let successCount = 0;
  
  // Create transactions by asset
  for (const assetCode in accountsByAsset) {
    const assetAccounts = accountsByAsset[assetCode].filter(
      account => account.ledgerId === ledgerId
    );
    
    if (assetAccounts.length < 2) {
      console.log(`  Skipping ${assetCode}: Need at least 2 accounts`);
      continue;
    }
    
    console.log(`  Creating transaction pairs for ${assetAccounts.length} ${assetCode} accounts...`);
    
    // Create transaction pairs for each account
    for (const account of assetAccounts) {
      // Find another account with the same asset for transfers
      const otherAccounts = assetAccounts.filter(a => a.id !== account.id);
      
      if (otherAccounts.length === 0) {
        console.log(`  Skipping account ${account.id}: No other accounts with same asset`);
        continue;
      }
      
      // Choose a random other account for transfers
      const otherAccount = otherAccounts[Math.floor(Math.random() * otherAccounts.length)];
      
      // Create a credit/debit pair using the SDK utility
      const creditAmount = assetCode === 'BTC' ? 0.05 : 25;
      const { creditTx, debitTx } = createCreditDebitPair(
        otherAccount.id,
        account.id,
        creditAmount,
        assetCode,
        `Transaction between ${otherAccount.name} and ${account.name}`,
        { 
          pairId: `pair-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdBy: 'workflow-script' 
        }
      );
      
      // Execute both transactions as a pair with error recovery
      try {
        const results = await executeTransactionPair(
          async () => client.entities.transactions.createTransaction(organizationId, ledgerId, creditTx),
          async () => client.entities.transactions.createTransaction(organizationId, ledgerId, debitTx),
          { 
            maxRetries: 2,
            delayBetweenTransactions: 50 
          }
        );
        
        if (results.creditStatus === 'success' || results.creditStatus === 'duplicate') {
          successCount++;
        }
        
        if (results.debitStatus === 'success' || results.debitStatus === 'duplicate') {
          successCount++;
        }
      } catch (error) {
        console.error(`  Error creating transaction pair: ${error}`);
      }
      
      // Add a delay between accounts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return successCount / 2; // Count pairs, not individual transactions
}

/**
 * Demonstrates advanced transaction patterns and financial workflows
 * 
 * This function showcases three advanced financial transaction patterns:
 * 
 * 1. User Transfers - Direct transfers between two accounts
 *    These represent standard user-initiated transfers in financial applications
 * 
 * 2. Multi-Account Transfers - Chain of transfers across multiple accounts
 *    These represent complex settlement flows or multi-step financial processes
 *    Often used for clearing, settlement, or distributing funds across systems
 * 
 * 3. Recurring Payments - Subscription-style repeating transactions
 *    These represent subscription payments, loan repayments, or scheduled transfers
 * 
 * Each pattern demonstrates how the SDK's transaction utilities can be composed
 * to build sophisticated financial workflows with proper error handling and metadata.
 * 
 * @param client - The Midaz SDK client instance
 * @param organizationId - The ID of the organization to operate on
 * @param operatingLedgerId - Ledger for day-to-day operations
 * @param investmentLedgerId - Ledger for investment operations
 * @param accounts - List of account information objects
 * @returns The number of successful transaction patterns executed
 */
async function demonstrateTransactionPatterns(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  accounts: AccountInfo[]
): Promise<number> {
  let successCount = 0;
  
  // Filter accounts by ledger and asset
  const operatingUsdAccounts = accounts.filter(
    account => account.ledgerId === operatingLedgerId && account.assetCode === 'USD'
  );
  
  const _investmentUsdAccounts = accounts.filter(
    account => account.ledgerId === investmentLedgerId && account.assetCode === 'USD'
  );
  
  const _operatingBtcAccounts = accounts.filter(
    account => account.ledgerId === operatingLedgerId && account.assetCode === 'BTC'
  );
  
  // 1. Create a user transfer between accounts
  if (operatingUsdAccounts.length >= 2) {
    console.log('  1. Creating a user transfer between USD accounts...');
    
    const sourceAccount = operatingUsdAccounts[0];
    const destinationAccount = operatingUsdAccounts[1];
    
    try {
      const result = await createUserTransfer(
        sourceAccount.id,
        destinationAccount.id,
        50, // $50 transfer
        'USD',
        {
          client,
          organizationId,
          ledgerId: operatingLedgerId,
          metadata: {
            transferType: 'user-initiated',
            purpose: 'demonstration',
          },
          description: `Demo transfer from ${sourceAccount.name} to ${destinationAccount.name}`
        }
      );
      
      if (result.status === 'success' || result.status === 'duplicate') {
        console.log(`    ✓ User transfer created successfully`);
        successCount++;
      }
    } catch (error) {
      console.error(`    ✗ Error creating user transfer: ${error}`);
    }
  }
  
  // 2. Create a multi-account transfer (chain of transfers)
  if (operatingUsdAccounts.length >= 3) {
    console.log('  2. Creating a multi-account transfer (chain of transfers)...');
    
    // Select 3 accounts for the chain
    const accountChain = operatingUsdAccounts.slice(0, 3).map(acc => acc.id);
    
    try {
      const result = await createMultiAccountTransfer(
        accountChain,
        30, // $30 through the chain
        'USD',
        {
          client,
          organizationId,
          ledgerId: operatingLedgerId,
          metadata: {
            transferType: 'chain',
            purpose: 'settlement',
          },
          description: 'Multi-account chain transfer demonstration'
        }
      );
      
      if (typeof result === 'object' && result.batchId) {
        console.log(`    ✓ Multi-account transfer created successfully: ${accountChain.length - 1} transfers`);
        successCount += accountChain.length - 1; // Count the number of transfers in the chain
      }
    } catch (error) {
      console.error(`    ✗ Error creating multi-account transfer: ${error}`);
    }
  }
  
  // 3. Create a recurring payment (subscription)
  if (operatingUsdAccounts.length >= 2) {
    console.log('  3. Creating a recurring payment (subscription)...');
    
    const payer = operatingUsdAccounts[0];
    const payee = operatingUsdAccounts[1];
    
    try {
      const result = await createRecurringPayment(
        payer.id,
        payee.id,
        9.99, // $9.99 subscription fee
        'USD',
        'subscription-monthly',
        {
          client,
          organizationId,
          ledgerId: operatingLedgerId,
          metadata: {
            frequency: 'monthly',
            paymentNumber: 1,
            subscriptionName: 'Premium Service',
            nextPaymentDate: new Date(Date.now() + 30*24*60*60*1000).toISOString()
          },
          description: 'Monthly subscription payment'
        }
      );
      
      if (result.status === 'success' || result.status === 'duplicate') {
        console.log(`    ✓ Recurring payment created successfully`);
        successCount++;
      }
    } catch (error) {
      console.error(`    ✗ Error creating recurring payment: ${error}`);
    }
  }
  
  return successCount;
}

/**
 * Displays account balances with enhanced error recovery and pagination
 * 
 * This function demonstrates several advanced data handling techniques:
 * 
 * 1. Pagination - Handling large datasets by processing them in pages
 *    The SDK provides built-in pagination utilities that handle cursors and limits
 * 
 * 2. Enhanced Error Recovery - Resilient data fetching with automatic retries
 *    withEnhancedRecovery adds verification and fallback strategies
 * 
 * 3. Balance Formatting - Presenting financial data in user-friendly formats
 *    Converting raw balance values to properly formatted currency strings
 * 
 * 4. Data Organization - Grouping balances by asset for easier processing
 *    Shows how to organize financial data for presentation or analysis
 * 
 * 5. Complete Observability Integration - Traces, metrics, and logging
 *    Each operation is fully instrumented for monitoring and debugging
 * 
 * This demonstrates a production-ready approach to handling balance queries
 * with proper error handling, monitoring, and user-friendly output.
 * 
 * @param client - The Midaz SDK client instance
 * @param organizationId - The ID of the organization to operate on
 * @param operatingLedgerId - ID of the operating ledger
 * @param investmentLedgerId - ID of the investment ledger
 * @param accounts - List of account information objects for lookup
 */
async function displayBalances(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  accounts: AccountInfo[]
): Promise<void> {
  // Helper function to display balances for a specific ledger with error recovery and pagination
  async function displayLedgerBalances(ledgerId: string, ledgerName: string) {
    console.log(`  ${ledgerName} Ledger Balances:`);
    const logger = new Logger({ 
      minLevel: LogLevel.DEBUG, 
      defaultModule: 'balance-display' 
    });
    
    // Create a span for balance loading operation
    const span = Observability.startSpan('fetch-balances', {
      ledgerId,
      ledgerName,
      organizationId
    });
    
    try {
      logger.info(`Fetching balances for ledger ${ledgerName}`, { ledgerId });
      
      // Use pagination to handle potentially large numbers of balances
      const paginator = createPaginator<any>({
        fetchPage: (options) => client.entities.balances.listBalances(
          organizationId, 
          ledgerId, 
          options
        ),
        maxItems: 1000, // Limit total number of items
        maxPages: 50,   // Limit number of pages
        spanAttributes: {
          ledgerId,
          ledgerName
        }
      });
      
      // Collect all balances across pages
      const allBalances: any[] = [];
      let pageCount = 0;
      
      // Use enhanced error recovery wrapped around pagination
      await withEnhancedRecovery(
        async () => {
          await paginator.forEachPage(async (balances) => {
            pageCount++;
            logger.info(`Processing balance page ${pageCount}`, { 
              itemCount: balances.length 
            });
            allBalances.push(...balances);
            
            // Record metrics for each page received
            Observability.recordMetric('balances.fetched', balances.length, {
              ledgerId,
              ledgerName
            });
          });
          return allBalances;
        },
        {
          maxRetries: 3,
          usePolledVerification: true,
          verifyOperation: async () => {
            try {
              // Try a simple check to verify API is responsive
              await client.entities.ledgers.getLedger(organizationId, ledgerId);
              return true;
            } catch {
              return false;
            }
          }
        }
      );
      
      // Mark span as successful
      span.setStatus('ok');
      const paginationState = paginator.getPaginationState();
      span.setAttribute('balanceCount', allBalances.length);
      span.setAttribute('pageCount', pageCount);
      span.setAttribute('lastFetchTimestamp', paginationState.lastFetchTimestamp || 0);
      
      logger.info(`Retrieved ${allBalances.length} balances in ${pageCount} pages`, {
        ledgerId,
        ledgerName,
        paginationState
      });
      
      // Group by asset for easier reading
      const balancesByAsset: Record<string, any[]> = {};
      
      for (const balance of allBalances) {
        const assetCode = balance.assetCode || 'Unknown';
        
        if (!balancesByAsset[assetCode]) {
          balancesByAsset[assetCode] = [];
        }
        
        balancesByAsset[assetCode].push(balance);
      }
      
      // Display balances by asset
      for (const assetCode in balancesByAsset) {
        console.log(`    ${assetCode} Accounts:`);
        
        for (const balance of balancesByAsset[assetCode]) {
          try {
            // Find account info for this balance
            const account = accounts.find(a => 
              a.id === balance.accountId && a.ledgerId === ledgerId
            );
            
            // Format and display the balance
            const formattedBalance = formatAccountBalance(balance);
            console.log(`      ${account ? account.name : balance.accountId}: ${formattedBalance.displayString}`);
          } catch (error) {
            // Fallback display if formatting fails
            console.log(`      ${balance.accountId}: Available ${balance.available || '0'}`);
            logger.warn('Failed to format balance', { error, accountId: balance.accountId });
          }
        }
      }
    } catch (error) {
      // Record error in the span
      span.recordException(error);
      span.setStatus('error', error instanceof Error ? error.message : String(error));
      logger.error('Failed to retrieve balances', { error, ledgerId });
      throw error;
    } finally {
      // Always end the span
      span.end();
    }
  }
  
  // Display balances for both ledgers
  await displayLedgerBalances(operatingLedgerId, 'Operating');
  await displayLedgerBalances(investmentLedgerId, 'Investment');
}

/**
 * Creates a ledger for the specified organization
 */
async function createLedger(
  client: MidazClient,
  organizationId: string,
  name: string,
  description: string
) {
  // Use the new method chaining builder pattern
  const ledgerInput = createLedgerBuilder(name)
    .withMetadata({
      description: description,
    })
    .build();

  // Remove status field to avoid format issues
  delete (ledgerInput as any).status;

  return await client.entities.ledgers.createLedger(organizationId, ledgerInput);
}

/**
 * Creates an asset in the specified ledger
 */
async function createAsset(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  name: string,
  code: string,
  type: string,
  symbol: string,
  decimalPlaces: number
) {
  // Create metadata based on asset type
  const metadata: any = {
    symbol: symbol,
    decimalPlaces: decimalPlaces,
  };

  if (type === 'currency') {
    metadata.isoCode = code;
  } else if (type === 'crypto') {
    metadata.network = 'mainnet';
  }

  // Use the new method chaining builder pattern with type
  const assetInput = createAssetBuilderWithType(name, code, type).withMetadata(metadata).build();

  // Remove status to avoid errors
  delete (assetInput as any).status;

  return await client.entities.assets.createAsset(organizationId, ledgerId, assetInput);
}

/**
 * Creates an account in the specified ledger
 */
async function createAccount(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  name: string,
  assetCode: string,
  accountType: 'deposit' | 'savings' | 'loans' | 'marketplace' | 'creditCard' | 'external',
  description: string
) {
  // Use the new method chaining builder pattern
  const accountInput = createAccountBuilder(name, assetCode, accountType)
    .withMetadata({
      description: description,
      createdBy: 'workflow-example',
    })
    .build();

  // Remove status to avoid errors
  delete (accountInput as any).status;

  return await client.entities.accounts.createAccount(organizationId, ledgerId, accountInput);
}

/**
 * Handles errors from the Midaz API with enhanced error information
 * 
 * This function demonstrates comprehensive error handling with observability:
 * 
 * 1. Error Processing - Extracts detailed information from any error type
 *    - Status codes, error types, detailed messages, recovery options
 *    - Converts generic errors to structured error information
 * 
 * 2. Error Tracing - Creates spans to track errors in distributed systems
 *    - Records exceptions with full context
 *    - Sets error status and attributes for monitoring systems
 * 
 * 3. Structured Logging - Records errors in a consistent, structured format
 *    - Includes timestamp, error details, and context
 *    - Uses proper log levels for error severity
 * 
 * 4. Error Metrics - Records error occurrences for dashboards and alerts
 *    - Tags metrics with error type and status code
 *    - Enables tracking error rates and patterns
 * 
 * 5. User-Friendly Output - Shows actionable information to end users
 *    - Provides recovery recommendations when available
 *    - Lists attempted recovery steps for transparency
 * 
 * This demonstrates production-quality error handling that balances
 * user experience, developer debugging, and system monitoring needs.
 * 
 * @param error - The error to handle (can be any type)
 */
function handleError(error: any): void {
  // Create logger for error handling
  const logger = new Logger({
    minLevel: LogLevel.ERROR,
    defaultModule: 'error-handler'
  });
  
  // Create error span
  const span = Observability.startSpan('error-handling', {
    timestamp: new Date().toISOString(),
    source: 'workflow-example'
  });
  
  try {
    // Get comprehensive error information
    const errorInfo = processError(error);
    
    // Add error details to the span
    span.setAttribute('errorType', errorInfo.type || 'unknown');
    span.setAttribute('statusCode', errorInfo.statusCode?.toString() || 'none');
    span.setAttribute('retryable', errorInfo.isRetryable?.toString() || 'false');
    
    // Record exception in observability
    span.recordException(error);
    span.setStatus('error', error instanceof Error ? error.message : String(error));
    
    // Log detailed error information for debugging
    logDetailedError(error, {
      source: 'workflow-example',
      timestamp: new Date().toISOString(),
    });
    
    // Log through observability system
    logger.error('Workflow error occurred', {
      error: errorInfo,
      message: errorInfo.userMessage,
      timestamp: new Date().toISOString()
    });
    
    // Record error metric
    Observability.recordMetric('workflow.error', 1, {
      errorType: errorInfo.type || 'unknown',
      statusCode: errorInfo.statusCode?.toString() || 'none'
    });

    // Display user-friendly error information
    console.error(`  Error: ${errorInfo.userMessage}`);

    // Show recovery recommendation if available
    if (errorInfo.recoveryRecommendation) {
      console.error(`  Recommendation: ${errorInfo.recoveryRecommendation}`);
    }
    
    // Show recovery steps if available (enhanced error recovery)
    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      console.error('  Recovery steps attempted:');
      errorInfo.recoverySteps.forEach((step, index) => {
        console.error(`    ${index + 1}. ${step}`);
      });
    }
  } finally {
    // Always end the span
    span.end();
  }
}

// Run the example workflow with global error handling and cleanup
// This is the entry point that starts the entire process
main().catch((error) => {
  // Handle any unhandled errors that bubble up from the workflow
  console.error('Unhandled error:', error);
  
  // Create a dedicated logger for top-level errors
  // This ensures even catastrophic failures are properly logged
  const logger = new Logger({ 
    minLevel: LogLevel.ERROR,
    defaultModule: 'main-error-handler'
  });
  
  // Log the error with full context
  logger.error('Unhandled error in main workflow', { error });
  
  // Record a fatal error metric 
  // This can trigger alerts in monitoring systems
  Observability.recordMetric('workflow.fatal_error', 1, {
    errorMessage: error.message || 'Unknown error'
  });
  
  // Ensure all telemetry is flushed before exiting
  // This prevents losing error data in case of crash
  Observability.getInstance().shutdown()
    .finally(() => {
      // Exit with non-zero code to indicate failure
      // This is important for CI/CD systems and orchestration tools
      process.exit(1);
    });
});