/**
 * Midaz SDK - Financial Workflow Example
 * 
 * This example demonstrates a complete financial workflow using the Midaz SDK,
 * including advanced features such as transaction pairs, batch processing,
 * and error recovery mechanisms.
 */

import {
  ConfigService,
  createAccountBuilder,
  createAssetBuilderWithType,
  createDepositTransaction,
  createLedgerBuilder,
  createOrganizationBuilder,
  createTransferTransaction,
  extractItems,
  formatAccountBalance,
  groupAccountsByAsset,
  logDetailedError,
  MidazClient,
  processError,
  // Transaction pairs utilities
  createTransactionPair,
  executeTransactionPair,
  // Transaction pattern utilities
  createCreditDebitPair,
  createUserTransfer,
  createMultiAccountTransfer,
  createRecurringPayment,
  // Enhanced error recovery utilities
  executeWithRetry,
  executeWithVerification,
  executeWithEnhancedRecovery,
  // Batch utilities
  createBatch,
  executeBatch,
  TransactionBatch,
} from '../src';

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
        enableTracing: false,
        enableMetrics: false,
        enableLogging: false,
        serviceName: 'midaz-workflow-example',
      },
    });
    
    // Initialize client using the centralized configuration
    const client = new MidazClient({
      apiKey: 'teste', // Auth is off, so no matter what is here
      apiVersion: 'v1', // Specify API version explicitly
    });

    // Create organization
    console.log('\n[1/8] CREATING ORGANIZATION...');
    const organization = await setupOrganization(client);
    console.log(`✓ Organization "${organization.legalName}" created with ID: ${organization.id}`);

    // Create ledgers
    console.log('\n[2/8] CREATING LEDGERS...');
    const { operatingLedger, investmentLedger } = await setupLedgers(client, organization.id);
    console.log(`✓ Created ledgers: "${operatingLedger.name}" and "${investmentLedger.name}"`);

    // Create assets
    console.log('\n[3/8] CREATING ASSETS...');
    const createdAssets = await setupAssets(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id
    );
    console.log(`✓ Created ${createdAssets.length} assets across ledgers`);

    // Create accounts
    console.log('\n[4/8] CREATING ACCOUNTS...');
    const createdAccounts = await setupAccounts(client, organization.id, createdAssets);
    console.log(`✓ Created ${createdAccounts.length} accounts across all assets`);

    // Create initial deposits using batch processing
    console.log('\n[5/8] CREATING INITIAL DEPOSITS WITH BATCH PROCESSING...');
    const depositCount = await createInitialDeposits(
      client,
      organization.id,
      createdAccounts
    );
    console.log(`✓ Created ${depositCount} initial deposits`);

    // Create transaction pairs (credit/debit pairs)
    console.log('\n[6/8] CREATING TRANSACTION PAIRS...');
    const transactionPairsCount = await createAdditionalTransactions(
      client,
      organization.id,
      operatingLedger.id,
      createdAccounts
    );
    console.log(`✓ Created ${transactionPairsCount} transaction pairs`);

    // Create complex transaction patterns
    console.log('\n[7/8] DEMONSTRATING ADVANCED TRANSACTION PATTERNS...');
    const patternCount = await demonstrateTransactionPatterns(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id,
      createdAccounts
    );
    console.log(`✓ Executed ${patternCount} advanced transaction patterns`);

    // Display balances with error recovery
    console.log('\n[8/8] DISPLAYING ACCOUNT BALANCES WITH ERROR RECOVERY...');
    await displayBalances(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id,
      createdAccounts
    );
    console.log('✓ Retrieved and displayed account balances');

    console.log('\n=== WORKFLOW COMPLETED SUCCESSFULLY ===');
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
 * Used to track created entities throughout the workflow
 */
interface AccountInfo {
  id: string;
  name: string;
  assetCode: string;
  ledgerId: string;
  ledgerName: string;
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
 * This demonstrates the batch processing capabilities of the SDK
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
        maxConcurrency: 3,
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
            // Use enhanced error recovery for better reliability
            const result = await executeWithEnhancedRecovery(
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
 * Demonstrates advanced transaction patterns
 * This showcases various transaction pattern utilities from the SDK
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
  
  const investmentUsdAccounts = accounts.filter(
    account => account.ledgerId === investmentLedgerId && account.assetCode === 'USD'
  );
  
  const operatingBtcAccounts = accounts.filter(
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
 * Displays account balances with enhanced error recovery
 */
async function displayBalances(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  accounts: AccountInfo[]
): Promise<void> {
  // Helper function to display balances for a specific ledger with error recovery
  async function displayLedgerBalances(ledgerId: string, ledgerName: string) {
    console.log(`  ${ledgerName} Ledger Balances:`);
    
    // Use enhanced error recovery for the balance retrieval
    const balances = await executeWithEnhancedRecovery(
      () => client.entities.balances.listBalances(organizationId, ledgerId),
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
    
    // Extract and process balances
    const balanceItems = extractItems(balances.result || { items: [] });
    
    // Group by asset for easier reading
    const balancesByAsset: Record<string, any[]> = {};
    
    for (const balance of balanceItems) {
      const assetCode = (balance as any).assetCode || 'Unknown';
      
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
            a.id === (balance as any).accountId && a.ledgerId === ledgerId
          );
          
          // Format and display the balance
          const formattedBalance = formatAccountBalance(balance);
          console.log(`      ${account ? account.name : balance.accountId}: ${formattedBalance.displayString}`);
        } catch (error) {
          // Fallback display if formatting fails
          console.log(`      ${(balance as any).accountId}: Available ${(balance as any).available || '0'}`);
        }
      }
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
 */
function handleError(error: any): void {
  // Get comprehensive error information
  const errorInfo = processError(error);

  // Log detailed error information for debugging
  logDetailedError(error, {
    source: 'workflow-example',
    timestamp: new Date().toISOString(),
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
}

// Run the example
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});