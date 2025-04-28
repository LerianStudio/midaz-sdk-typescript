/**
 * Midaz SDK - Financial Workflow Example (Fixed Version)
 * This is a simplified version of the workflow example that works with the current SDK
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
} from '../src';

/**
 * Main workflow function that demonstrates a complete financial system workflow
 * using the Midaz SDK. This function orchestrates the entire process from
 * organization creation to account balance display.
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
    console.log('\n[1/5] CREATING ORGANIZATION...');
    const organization = await setupOrganization(client);
    console.log(`✓ Organization "${organization.legalName}" created with ID: ${organization.id}`);

    // Create ledgers
    console.log('\n[2/5] CREATING LEDGERS...');
    const { operatingLedger } = await setupLedgers(client, organization.id);
    console.log(`✓ Created ledger: "${operatingLedger.name}"`);

    // Create assets
    console.log('\n[3/5] CREATING ASSETS...');
    const createdAssets = await setupAssets(
      client,
      organization.id,
      operatingLedger.id
    );
    console.log(`✓ Created ${createdAssets.length} assets`);

    // Create accounts
    console.log('\n[4/5] CREATING ACCOUNTS...');
    const createdAccounts = await setupAccounts(client, organization.id, createdAssets);
    console.log(`✓ Created ${createdAccounts.length} accounts across all assets`);

    // Create additional credit and debit transactions for each account
    console.log('\n[5/5] CREATING ADDITIONAL TRANSACTIONS...');
    const transactionPairsCount = await createAdditionalTransactions(
      client,
      organization.id,
      operatingLedger.id,
      createdAccounts
    );
    console.log(`✓ Created ${transactionPairsCount} transaction pairs`);

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

  return { operatingLedger };
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
  operatingLedgerId: string
): Promise<AccountInfo[]> {
  // Define asset configurations - simplified to 2 assets
  const assetConfigs = [
    { name: 'US Dollar', code: 'USD', type: 'currency', symbol: '$', decimalPlaces: 2 },
    { name: 'Euro', code: 'EUR', type: 'currency', symbol: '€', decimalPlaces: 2 },
  ];

  const createdAssets: AccountInfo[] = [];

  // Create assets in Operating Ledger
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
 * Creates additional credit and debit transactions for each account
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
    const assetAccounts = accountsByAsset[assetCode];
    
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
      const creditAmount = 25;
      const { creditTx, debitTx } = createCreditDebitPair(
        otherAccount.id,
        account.id,
        creditAmount,
        assetCode,
        `Transaction between ${otherAccount.name} and ${account.name}`,
        { createdBy: 'workflow-script' }
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
        console.error(`Error creating transaction pair: ${error}`);
      }
      
      // Add a delay between accounts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return successCount / 2; // Count pairs, not individual transactions
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
}

// Run the example
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});