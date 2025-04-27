/**
 * Midaz SDK - Financial Workflow Example
 *
 * This example demonstrates a complete financial workflow using the Midaz SDK:
 * 1. Creating organizations, ledgers, assets, and accounts
 * 2. Processing deposit and transfer transactions
 * 3. Retrieving and displaying entity details and balances
 * 4. Using error handling and recovery mechanisms
 *
 * The workflow simulates a typical financial application that manages multiple
 * ledgers (Operating and Investment) with various assets (USD, EUR, BTC) and
 * different account types (deposit, savings, loans).
 */

import {
  ConfigService,
  createAccountBuilder,
  createAssetBuilderWithType,
  createDepositTransaction,
  createErrorHandler,
  createLedgerBuilder,
  createOrganizationBuilder,
  createTransferTransaction,
  executeTransaction,
  extractItems,
  formatAccountBalance,
  groupAccountsByAsset,
  isExternalAccount,
  Ledger,
  logDetailedError,
  MidazClient,
  Organization,
  processError,
  withErrorRecovery,
} from '../src';

/**
 * Main workflow function that demonstrates a complete financial system workflow
 * using the Midaz SDK. This function orchestrates the entire process from
 * organization creation to account balance display.
 *
 * The workflow follows these steps:
 * 1. Create an organization (legal entity)
 * 2. Create operating and investment ledgers
 * 3. Create assets (USD, EUR, BTC) in both ledgers
 * 4. Create accounts for each asset with different types
 * 5. Process deposit transactions to fund accounts
 * 6. Process transfer transactions between accounts
 * 7. Update entity information (organization, ledgers, etc.)
 * 8. Retrieve and display entity details
 * 9. Set up additional entities (asset rates, portfolios, segments)
 * 10. Display account balances
 *
 * Each step uses error handling and recovery mechanisms to ensure robustness.
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
    console.log('\n[1/10] CREATING ORGANIZATION...');
    const organization = await setupOrganization(client);
    console.log(`✓ Organization "${organization.legalName}" created with ID: ${organization.id}`);

    // List all organizations to verify
    console.log('\n📊 ALL ORGANIZATIONS:');
    const organizations = await client.entities.organizations.listOrganizations();
    const orgItems = extractItems(organizations);

    console.log(`  Total: ${orgItems.length}`);
    orgItems.forEach((org: any, index: number) => {
      console.log(`  ${index + 1}. ${org.legalName} (${org.id})`);
    });

    // Create ledgers
    console.log('\n[2/10] CREATING LEDGERS...');
    const { operatingLedger, investmentLedger } = await setupLedgers(client, organization.id);
    console.log(`✓ Created 2 ledgers: "${operatingLedger.name}" and "${investmentLedger.name}"`);

    // List all ledgers to verify
    console.log('\n📊 ALL LEDGERS:');
    const ledgers = await client.entities.ledgers.listLedgers(organization.id);
    const ledgerItems = extractItems(ledgers);

    console.log(`  Total: ${ledgerItems.length}`);
    ledgerItems.forEach((ledger: any, index: number) => {
      console.log(`  ${index + 1}. ${ledger.name} (${ledger.id})`);
    });

    // Create assets
    console.log('\n[3/10] CREATING ASSETS...');
    const createdAssets = await setupAssets(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id
    );
    console.log(`✓ Created ${createdAssets.length} assets across both ledgers`);

    // List assets in each ledger to verify
    console.log('\n📊 ASSETS:');
    await listAssets(client, organization.id, operatingLedger.id, investmentLedger.id);

    // Create accounts
    console.log('\n[4/10] CREATING ACCOUNTS...');
    const _createdAccounts = await setupAccounts(client, organization.id, createdAssets);
    console.log(`✓ Created ${_createdAccounts.length} accounts across all assets`);

    // List accounts in each ledger to verify
    console.log('\n📊 ACCOUNTS:');
    await listAccounts(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id,
      _createdAccounts
    );

    // Create deposit transactions
    console.log('\n[5/10] CREATING DEPOSIT TRANSACTIONS...');
    // Group accounts by asset for better management
    const operatingDepositCount = await createTransactions(
      client,
      'deposit',
      organization.id,
      operatingLedger.id,
      _createdAccounts
    );

    const investmentDepositCount = await createTransactions(
      client,
      'deposit',
      organization.id,
      investmentLedger.id,
      _createdAccounts
    );
    console.log(
      `✓ Created ${
        operatingDepositCount + investmentDepositCount
      } deposit transactions across all ledgers`
    );

    // Create transfer transactions
    console.log('\n[6/10] CREATING INTER-ACCOUNT TRANSACTIONS...');
    const operatingTransferCount = await createTransactions(
      client,
      'transfer',
      organization.id,
      operatingLedger.id,
      _createdAccounts
    );

    const investmentTransferCount = await createTransactions(
      client,
      'transfer',
      organization.id,
      investmentLedger.id,
      _createdAccounts
    );
    console.log(
      `✓ Created ${
        operatingTransferCount + investmentTransferCount
      } inter-account transactions across all ledgers`
    );

    // List transactions in each ledger to verify
    console.log('\n📊 TRANSACTIONS:');
    await listTransactions(client, organization.id, operatingLedger.id, investmentLedger.id);

    // Update entities
    console.log('\n[7/10] UPDATING ENTITIES...');
    await updateEntities(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id,
      createdAssets,
      _createdAccounts
    );

    // Get entity details
    console.log('\n[8/10] GETTING ENTITY DETAILS...');
    await getEntityDetails(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id,
      createdAssets,
      _createdAccounts
    );
    console.log('✓ Retrieved entity details');

    // Setup and manage additional entities (asset rates, portfolios, segments)
    console.log('\n[9/10] SETTING UP ADDITIONAL ENTITIES...');
    await setupAdditionalEntities(
      client,
      organization.id,
      operatingLedger.id,
      investmentLedger.id,
      createdAssets,
      _createdAccounts
    );
    console.log('✓ Set up additional entities');

    // Display account balances
    console.log('\n[10/10] ACCOUNT BALANCES:');
    await displayBalances(client, organization.id, operatingLedger.id, investmentLedger.id);

    console.log('\n=== WORKFLOW COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n❌ WORKFLOW ERROR:');
    handleError(error);
  }
}

// -------------------------------------------------------------------------
// ENTITY SETUP FUNCTIONS
// -------------------------------------------------------------------------

/**
 * Creates an organization with required fields and metadata
 *
 * This function demonstrates:
 * - Using the organization creation helper functions
 * - Adding address information to an organization
 * - Adding metadata for additional organization properties
 *
 * @param client - The initialized Midaz client
 * @returns A Promise resolving to the created Organization
 */
async function setupOrganization(client: MidazClient): Promise<Organization> {
  console.log('Creating organization with Midaz SDK...');

  // Use the new method chaining builder pattern
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
 * This function demonstrates:
 * - Creating multiple ledgers for different purposes
 * - Using the ledger creation helper functions
 * - Adding descriptive metadata to ledgers
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @returns A Promise resolving to an object containing both created ledgers
 */
async function setupLedgers(
  client: MidazClient,
  organizationId: string
): Promise<{ operatingLedger: Ledger; investmentLedger: Ledger }> {
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
    'Ledger for tracking investments'
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
 *
 * This function demonstrates:
 * - Creating different types of assets (currency, crypto)
 * - Adding assets to multiple ledgers
 * - Using asset creation helper functions
 * - Adding metadata with asset-specific properties
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @returns A Promise resolving to an array of created assets
 */
async function setupAssets(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string
): Promise<AccountInfo[]> {
  // Define asset configurations - simplified to 3 assets
  const assetConfigs = [
    { name: 'US Dollar', code: 'USD', type: 'currency', symbol: '$', decimalPlaces: 2 },
    { name: 'Euro', code: 'EUR', type: 'currency', symbol: '€', decimalPlaces: 2 },
    { name: 'Bitcoin', code: 'BTC', type: 'crypto', symbol: '₿', decimalPlaces: 8 },
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

  // Create assets in Investment Ledger - only USD and BTC for simplicity
  for (const assetConfig of assetConfigs.filter((a) => a.code === 'USD' || a.code === 'BTC')) {
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
 *
 * This function demonstrates:
 * - Creating multiple account types (deposit, savings, loans)
 * - Associating accounts with specific assets
 * - Using account creation helper functions
 * - Adding descriptive metadata to accounts
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param createdAssets - Array of assets to create accounts for
 * @returns A Promise resolving to an array of created accounts
 */
async function setupAccounts(
  client: MidazClient,
  organizationId: string,
  createdAssets: AccountInfo[]
): Promise<AccountInfo[]> {
  // Account types
  const accountTypes = ['deposit', 'savings', 'loans'];

  const createdAccounts: AccountInfo[] = [];

  // Create accounts for each asset - simplified to create fewer accounts
  for (const asset of createdAssets) {
    // Create 3 accounts per asset
    for (let i = 1; i <= 3; i++) {
      const accountType = accountTypes[i % accountTypes.length] as 'deposit' | 'savings' | 'loans';
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

// -------------------------------------------------------------------------
// TRANSACTION FUNCTIONS
// -------------------------------------------------------------------------

/**
 * Creates deposit and transfer transactions for accounts in a ledger
 *
 * This function demonstrates:
 * - Creating both deposit and transfer transactions
 * - Using transaction builder helper functions
 * - Using the executeTransaction utility for enhanced error handling
 * - Grouping accounts by asset for efficient transaction processing
 *
 * @param client - The initialized Midaz client
 * @param transactionType - Type of transaction to create ('deposit' or 'transfer')
 * @param organizationId - The ID of the parent organization
 * @param ledgerId - The ID of the ledger to create transactions in
 * @param accounts - Array of accounts to use for transactions
 * @returns A Promise resolving to the number of successful transactions
 */
async function createTransactions(
  client: MidazClient,
  transactionType: 'deposit' | 'transfer',
  organizationId: string,
  ledgerId: string,
  accounts: AccountInfo[]
): Promise<number> {
  let successCount = 0;
  const _duplicateCount = 0;

  // Use SDK helper to group accounts by asset code with ledger filter
  const accountsByAsset = groupAccountsByAsset(accounts, { ledgerId });

  for (const assetCode in accountsByAsset) {
    const assetAccounts = accountsByAsset[assetCode];

    if (transactionType === 'deposit') {
      // Create deposit transactions for each account
      for (const account of assetAccounts) {
        // Use a larger deposit amount to ensure accounts have sufficient funds
        const depositAmount = 1000;

        // Use transaction builder for deposit with correct external account pattern
        const depositTx = createDepositTransaction(
          `external/${account.assetCode}`,
          account.id,
          depositAmount,
          account.assetCode,
          0,
          `Deposit into ${account.name}`,
          { createdBy: 'workflow-script' }
        );

        // Execute transaction with automatic error handling
        const { status } = await executeTransaction(
          () => client.entities.transactions.createTransaction(organizationId, ledgerId, depositTx),
          {
            maxRetries: 2,
          }
        );

        if (status === 'success' || status === 'duplicate') {
          successCount++;
        }

        // Add a small delay to ensure transactions are processed
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } else if (transactionType === 'transfer') {
      // Create transfer transactions between pairs of accounts in the same asset group
      if (assetAccounts.length < 2) {
        console.log(`Skipping transfers for ${assetCode}: Need at least 2 accounts`);
        continue;
      }

      // Shuffling the accounts to get different transfer pairs each time
      const shuffledAccounts = [...assetAccounts].sort(() => Math.random() - 0.5);
      const accountsToUse = shuffledAccounts.slice(0, Math.min(4, shuffledAccounts.length));

      // Create pairs for transfers
      for (let i = 0; i < accountsToUse.length - 1; i += 2) {
        const sourceAccount = accountsToUse[i];
        const destinationAccount = accountsToUse[i + 1];

        // Use a small transfer amount to avoid insufficient funds errors
        const transferAmount = 10;

        // Use transaction builder for transfer
        const transferTx = createTransferTransaction(
          sourceAccount.id,
          destinationAccount.id,
          transferAmount,
          sourceAccount.assetCode,
          0,
          `Transfer from ${sourceAccount.name} to ${destinationAccount.name}`,
          { createdBy: 'workflow-script' }
        );

        // Execute transaction with automatic error handling
        const { status } = await executeTransaction(
          () =>
            client.entities.transactions.createTransaction(organizationId, ledgerId, transferTx),
          {
            maxRetries: 1,
          }
        );

        if (status === 'success' || status === 'duplicate') {
          successCount++;
        }

        // Add a small delay between transfers
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  return successCount;
}

/**
 * Creates a ledger for the specified organization
 */
async function createLedger(
  client: MidazClient,
  organizationId: string,
  name: string,
  description: string
): Promise<Ledger> {
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
): Promise<any> {
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
): Promise<any> {
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

// -------------------------------------------------------------------------
// DISPLAY AND LISTING FUNCTIONS
// -------------------------------------------------------------------------

/**
 * Lists assets in both ledgers
 *
 * This function demonstrates:
 * - Retrieving and displaying assets from multiple ledgers
 * - Using the extractItems utility for pagination handling
 * - Implementing error handling for each ledger separately
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @returns A Promise that resolves when assets are listed
 */
async function listAssets(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string
): Promise<void> {
  // Helper function to list assets for a single ledger
  async function listLedgerAssets(ledgerId: string, ledgerName: string): Promise<void> {
    try {
      const assetsList = await client.entities.assets.listAssets(organizationId, ledgerId);

      const assetItems = extractItems(assetsList);

      console.log(`  ${ledgerName} Ledger: ${assetItems.length} assets`);
      assetItems.forEach((asset: any) => {
        console.log(`    * ${asset.name} (${asset.code})`);
      });
    } catch (error: any) {
      console.error(`  ❌ Error listing ${ledgerName.toLowerCase()} assets: ${error.message}`);
    }
  }

  // List assets for each ledger
  await listLedgerAssets(operatingLedgerId, 'Operating');
  await listLedgerAssets(investmentLedgerId, 'Investment');
}

/**
 * Lists accounts in both ledgers with enhanced error handling
 *
 * This function demonstrates:
 * - Retrieving and displaying accounts from multiple ledgers
 * - Creating reusable error handlers with createErrorHandler
 * - Using withErrorRecovery for automatic retries
 * - Categorizing accounts by type (regular vs. system)
 * - Grouping accounts by asset code
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @param createdAccounts - Array of accounts created in the workflow
 * @returns A Promise that resolves when accounts are listed
 */
async function listAccounts(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  createdAccounts: AccountInfo[]
): Promise<void> {
  // Set up standard error handler for account listing operations
  const handleAccountsError = createErrorHandler({
    logErrors: true,
    rethrow: false,
    formatMessage: (errorInfo) => `Error listing accounts: ${errorInfo.userMessage}`,
    defaultReturnValue: { items: [] },
  });

  // Helper function to display accounts for a single ledger
  async function listLedgerAccounts(ledgerId: string, ledgerName: string): Promise<void> {
    try {
      // Use withErrorRecovery to automatically retry on network errors
      const accountsList = await withErrorRecovery(
        () => client.entities.accounts.listAccounts(organizationId, ledgerId),
        {
          maxRetries: 2,
          onRetry: (error, attempt) => {
            console.log(
              `Retrying account listing for ${ledgerName} Ledger (attempt ${attempt})...`
            );
          },
        }
      ).catch(handleAccountsError);

      const accountItems = extractItems(accountsList);

      // Manual categorization for type safety
      const regularAccounts: any[] = [];
      const systemAccounts: any[] = [];

      for (const account of accountItems) {
        const accountObj = account as any;
        if (
          accountObj.id &&
          (accountObj.id.startsWith('@') ||
            accountObj.id.startsWith('external/') ||
            accountObj.id.includes('/external/') ||
            (accountObj.name &&
              (accountObj.name.includes('External') || accountObj.name.includes('System'))))
        ) {
          systemAccounts.push(accountObj);
        } else {
          regularAccounts.push(accountObj);
        }
      }

      // Filter and manually group created accounts by asset
      const ledgerAccounts = createdAccounts.filter((a) => a.ledgerId === ledgerId);
      const accountsByAssetCode: Record<string, number> = {};

      for (const account of ledgerAccounts) {
        if (account.assetCode) {
          if (!accountsByAssetCode[account.assetCode]) {
            accountsByAssetCode[account.assetCode] = 0;
          }
          accountsByAssetCode[account.assetCode]++;
        }
      }

      // Calculate the total number of accounts we created
      const totalAccounts = ledgerAccounts.length;

      console.log(`  ${ledgerName} Ledger: ${accountItems.length} accounts total`);
      console.log(`    Regular accounts: ${regularAccounts.length}`);
      console.log(`    System accounts: ${systemAccounts.length}`);
      console.log('    By Asset (regular accounts):');

      Object.entries(accountsByAssetCode).forEach(([asset, count]) => {
        console.log(`      * ${asset}: ${count} accounts`);
      });

      // Display all regular accounts
      console.log('    Regular Accounts:');
      if (regularAccounts.length === 0) {
        console.log('      No regular accounts found');
      } else {
        regularAccounts.forEach((account) => {
          console.log(
            `      * ${account.name} (${account.id}) - Asset: ${
              account.assetCode || 'Unknown'
            }, Type: ${account.type || 'Unknown'}`
          );
        });
      }

      // Display all system accounts
      console.log('    System Accounts:');
      if (systemAccounts.length === 0) {
        console.log('      No system accounts found');
      } else {
        systemAccounts.forEach((account) => {
          console.log(
            `      * ${account.name || 'Unnamed'} (${account.id}) - Asset: ${
              account.assetCode || 'Unknown'
            }, Type: ${account.type || 'Unknown'}`
          );
        });
      }

      // Verify that our count matches what we created
      if (regularAccounts.length !== totalAccounts) {
        console.log(
          `    Note: API reports ${regularAccounts.length} regular accounts, our tracking shows ${totalAccounts}`
        );
      }
    } catch (error: any) {
      // This catch block should rarely be reached since we're using handleAccountsError
      // But we include it as a fallback
      const errorInfo = processError(error);
      console.error(
        `  ❌ Error listing ${ledgerName.toLowerCase()} accounts: ${errorInfo.userMessage}`
      );
    }
  }

  // List accounts for each ledger
  await listLedgerAccounts(operatingLedgerId, 'Operating');
  await listLedgerAccounts(investmentLedgerId, 'Investment');
}

/**
 * Lists transactions in both ledgers
 *
 * This function demonstrates:
 * - Retrieving and displaying transactions from multiple ledgers
 * - Limiting the number of transactions displayed for readability
 * - Implementing error handling for each ledger separately
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @returns A Promise that resolves when transactions are listed
 */
async function listTransactions(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string
): Promise<void> {
  // Helper function to list transactions for a single ledger
  async function listLedgerTransactions(ledgerId: string, ledgerName: string): Promise<void> {
    try {
      const transactionsList = await client.entities.transactions.listTransactions(
        organizationId,
        ledgerId
      );

      const transactionItems = extractItems(transactionsList);

      console.log(`  ${ledgerName} Ledger (latest 5 of ${transactionItems.length} total):`);
      transactionItems.slice(0, 5).forEach((tx: any) => {
        console.log(`    * ${tx.id} - ${tx.description || 'No description'}`);
      });
    } catch (error: any) {
      console.error(
        `  ❌ Error listing ${ledgerName.toLowerCase()} transactions: ${error.message}`
      );
    }
  }

  // List transactions for each ledger
  await listLedgerTransactions(operatingLedgerId, 'Operating');
  await listLedgerTransactions(investmentLedgerId, 'Investment');
}

/**
 * Displays account balances for both ledgers
 *
 * This function demonstrates:
 * - Retrieving and displaying account balances
 * - Handling different account types (regular, external)
 * - Using balance formatting utilities
 * - Implementing robust error handling
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @returns A Promise that resolves when balances are displayed
 */
async function displayBalances(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string
): Promise<void> {
  // Get list of common asset codes used in our workflow
  const assetCodes = ['USD', 'EUR', 'BTC'];

  // Helper function to fetch and display balances for a single ledger
  async function displayLedgerBalances(ledgerId: string, ledgerName: string): Promise<void> {
    try {
      console.log(`  ${ledgerName} Ledger:`);

      // Fetch regular balances
      const balances = await client.entities.balances.listBalances(organizationId, ledgerId);

      const balanceItems = extractItems(balances);

      // Create separate arrays for regular and system accounts
      const regularAccounts: any[] = [];
      const systemAccounts: any[] = [];

      // Manual categorization due to typing issues
      for (const balance of balanceItems) {
        const balanceObj = balance as any;
        if (isExternalAccount(balanceObj.accountId)) {
          systemAccounts.push(balanceObj);
        } else {
          regularAccounts.push(balanceObj);
        }
      }

      // Display regular accounts
      console.log('    Regular Accounts:');
      if (regularAccounts.length === 0) {
        console.log('      No regular accounts found');
      } else {
        regularAccounts.forEach((balance) => {
          const formattedBalance = formatAccountBalance(balance);
          console.log(`      * ${formattedBalance.displayString}`);
        });
      }

      // Fetch and display external accounts
      console.log('    External Accounts (Source of Funds):');
      const externalBalances = [...systemAccounts];

      // Try to fetch external accounts directly by their IDs
      for (const assetCode of assetCodes) {
        try {
          // Try both patterns for external accounts
          const externalAccountIdPatterns = [`external/${assetCode}`, `@external/${assetCode}`];

          for (const externalAccountId of externalAccountIdPatterns) {
            try {
              const accountBalances = await client.entities.balances.listAccountBalances(
                organizationId,
                ledgerId,
                externalAccountId
              );

              externalBalances.push(...extractItems(accountBalances));
              break; // If successful, no need to try other patterns
            } catch (error) {
              // Try next pattern
              continue;
            }
          }
        } catch (error) {
          // Continue silently - some asset codes might not have external accounts
        }
      }

      // Manual deduplication due to typing issues
      const uniqueExternalBalances: any[] = [];
      const accountIdMap = new Map<string, boolean>();

      for (const balance of externalBalances) {
        if (balance.accountId && !accountIdMap.has(balance.accountId)) {
          accountIdMap.set(balance.accountId, true);
          uniqueExternalBalances.push(balance);
        }
      }

      if (uniqueExternalBalances.length === 0) {
        console.log('      No external accounts found');
        console.log('      Note: External accounts may exist but have restricted API access');
      } else {
        uniqueExternalBalances.forEach((balance) => {
          const formattedBalance = formatAccountBalance(balance, {
            accountType: 'External Account',
          });
          console.log(`      * ${formattedBalance.displayString}`);
        });
      }
    } catch (error: any) {
      const errorInfo = processError(error);
      console.error(
        `  ❌ Error fetching ${ledgerName.toLowerCase()} balances: ${errorInfo.userMessage}`
      );
    }
  }

  try {
    // Display balances for each ledger
    await displayLedgerBalances(operatingLedgerId, 'Operating');
    await displayLedgerBalances(investmentLedgerId, 'Investment');

    // Add debug info about system accounts for troubleshooting
    console.log(
      '\n  Note: If external accounts are not displayed, they may require special API privileges or differ from standard @external/ASSET format'
    );
  } catch (error: any) {
    const errorInfo = processError(error);
    console.error(`  ❌ Error fetching balances: ${errorInfo.userMessage}`);
  }
}

/**
 * Retrieves and displays entity details (organization, ledgers, assets, accounts)
 *
 * This function demonstrates:
 * - Retrieving detailed information for different entity types
 * - Fetching account balances for specific accounts
 * - Retrieving transaction details
 * - Implementing error handling for each retrieval operation
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @param createdAssets - Array of assets created in the workflow
 * @param createdAccounts - Array of accounts created in the workflow
 * @returns A Promise that resolves when entity details are retrieved and displayed
 */
async function getEntityDetails(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  createdAssets: AccountInfo[],
  createdAccounts: AccountInfo[]
): Promise<void> {
  // Get organization details
  try {
    const organization = await client.entities.organizations.getOrganization(organizationId);
    console.log(`  Organization: ${organization.legalName} (${organization.id})`);
  } catch (error: any) {
    console.error(`  ❌ Error getting organization details: ${error.message}`);
  }

  // Get ledger details
  try {
    const operatingLedger = await client.entities.ledgers.getLedger(
      organizationId,
      operatingLedgerId
    );
    console.log(`  Operating Ledger: ${operatingLedger.name} (${operatingLedger.id})`);
  } catch (error: any) {
    console.error(`  ❌ Error getting ledger details: ${error.message}`);
  }

  // Get asset details - just one for simplicity
  if (createdAssets.length > 0) {
    try {
      const asset = createdAssets[0];
      const assetDetails = await client.entities.assets.getAsset(
        organizationId,
        asset.ledgerId,
        asset.id
      );
      console.log(
        `  Asset: ${assetDetails.name} (${assetDetails.code}) in ${asset.ledgerName} Ledger`
      );
    } catch (error: any) {
      console.error(`  ❌ Error getting asset details: ${error.message}`);
    }
  }

  // Get account details - just one for simplicity
  if (createdAccounts.length > 0) {
    try {
      const account = createdAccounts[0];
      const accountDetails = await client.entities.accounts.getAccount(
        organizationId,
        account.ledgerId,
        account.id
      );
      console.log(
        `  Account: ${accountDetails.name} (${accountDetails.id}) in ${account.ledgerName} Ledger`
      );

      // Get account balance
      try {
        const accountBalances = await client.entities.balances.listAccountBalances(
          organizationId,
          account.ledgerId,
          account.id
        );

        const balanceItems = extractItems(accountBalances);

        if (balanceItems.length > 0) {
          // Use the SDK's balance formatting utility
          const formattedBalance = formatAccountBalance(balanceItems[0]);
          console.log(
            `    Balance: Available ${formattedBalance.available}, On Hold ${formattedBalance.onHold}`
          );
        } else {
          console.log(`    No balance information available`);
        }
      } catch (error: any) {
        console.error(`    ❌ Error getting account balance: ${error.message}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error getting account details: ${error.message}`);
    }
  }

  // Get transaction details if possible
  try {
    // List transactions for the operating ledger with limit 1
    const operatingTransactions = await client.entities.transactions.listTransactions(
      organizationId,
      operatingLedgerId,
      { limit: 1 }
    );

    const transactionItems = extractItems(operatingTransactions);

    if (transactionItems.length > 0) {
      const transaction = transactionItems[0] as any;
      console.log(
        `  Transaction: ${transaction.id} - ${transaction.description || 'No description'}`
      );
    }
  } catch (error: any) {
    console.error(`  ❌ Error getting transaction details: ${error.message}`);
  }
}

/**
 * Setup and manage additional entities (asset rates, portfolios, segments)
 */
async function setupAdditionalEntities(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  createdAssets: AccountInfo[],
  _createdAccounts: AccountInfo[]
): Promise<void> {
  console.log('  Creating asset rates...');
  // Find USD and EUR assets to create an exchange rate between them
  const usdAsset = createdAssets.find(
    (asset) => asset.assetCode === 'USD' && asset.ledgerId === operatingLedgerId
  );
  const eurAsset = createdAssets.find(
    (asset) => asset.assetCode === 'EUR' && asset.ledgerId === operatingLedgerId
  );

  if (usdAsset && eurAsset) {
    // Create exchange rate from USD to EUR
    const rateData = await client.entities.assetRates.createOrUpdateAssetRate(
      organizationId,
      operatingLedgerId,
      {
        fromAsset: 'USD',
        toAsset: 'EUR',
        rate: 0.92,
        effectiveAt: new Date().toISOString(),
        expirationAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      }
    );
    console.log(`    Created exchange rate: 1 USD = ${rateData.rate || '0.92'} EUR`);
  }

  console.log('  Creating a portfolio...');
  const portfolio = await client.entities.portfolios.createPortfolio(
    organizationId,
    operatingLedgerId,
    {
      name: 'Treasury Portfolio',
      entityId: 'entity_treasury',
      metadata: {
        description: 'Portfolio for treasury activities',
        createdBy: 'workflow-script',
      },
    }
  );
  console.log(`    Created portfolio: ${portfolio.name} (${portfolio.id})`);

  console.log('  Creating a segment...');
  const segment = await client.entities.segments.createSegment(organizationId, operatingLedgerId, {
    name: 'Retail Segment',
    metadata: {
      description: 'Segment for retail clients',
      createdBy: 'workflow-script',
    },
  });
  console.log(`    Created segment: ${segment.name} (${segment.id})`);
}

/**
 * Handles errors from the Midaz API with enhanced error information
 *
 * This function demonstrates:
 * - Using the getEnhancedErrorInfo utility for detailed error analysis
 * - Logging detailed error information for debugging purposes
 * - Displaying user-friendly error messages with recovery recommendations
 * - Adding contextual information to error logs
 *
 * @param error - The error object to handle
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

  // Show additional context for transaction errors
  if (errorInfo.transactionErrorType) {
    console.error(`  Transaction Error Type: ${errorInfo.transactionErrorType}`);
  }
}

/**
 * Updates entities (organization, ledgers, assets, accounts)
 *
 * This function demonstrates:
 * - Updating different entity types with the SDK
 * - Adding and modifying metadata for entities
 * - Using the SDK's update methods for different entity types
 *
 * @param client - The initialized Midaz client
 * @param organizationId - The ID of the parent organization
 * @param operatingLedgerId - The ID of the operating ledger
 * @param investmentLedgerId - The ID of the investment ledger
 * @param createdAssets - Array of assets created in the workflow
 * @param createdAccounts - Array of accounts created in the workflow
 * @returns A Promise that resolves when updates are complete
 */
async function updateEntities(
  client: MidazClient,
  organizationId: string,
  operatingLedgerId: string,
  investmentLedgerId: string,
  createdAssets: AccountInfo[],
  createdAccounts: AccountInfo[]
): Promise<void> {
  // Update organization
  const updatedOrganization = await client.entities.organizations.updateOrganization(
    organizationId,
    {
      legalName: 'Example Corporation',
      metadata: {
        industry: 'Technology',
        employeeCount: 300, // Updated from 250
        yearFounded: 2023,
        website: 'https://example-updated.com',
      },
    }
  );
  console.log(`  Updated organization: ${updatedOrganization.legalName}`);

  // Update ledgers - just one for simplicity
  const updatedOperatingLedger = await client.entities.ledgers.updateLedger(
    organizationId,
    operatingLedgerId,
    {
      name: 'Operating Ledger',
      metadata: {
        description: 'Updated operating ledger metadata',
        lastUpdated: new Date().toISOString(),
      },
    }
  );
  console.log(`  Updated operating ledger: ${updatedOperatingLedger.name}`);

  // Update assets - just one for simplicity
  if (createdAssets.length > 0) {
    const asset = createdAssets[0];
    const updatedAsset = await client.entities.assets.updateAsset(
      organizationId,
      asset.ledgerId,
      asset.id,
      {
        name: `${asset.name} (Updated)`,
        metadata: {
          symbol: asset.assetCode,
          decimalPlaces: asset.decimalPlaces,
          lastUpdated: new Date().toISOString(),
        },
      }
    );
    console.log(`  Updated asset: ${updatedAsset.name}`);
  }

  // Update accounts - just one for simplicity
  if (createdAccounts.length > 0) {
    const account = createdAccounts[0];
    const updatedAccount = await client.entities.accounts.updateAccount(
      organizationId,
      account.ledgerId,
      account.id,
      {
        name: `${account.name} (Updated)`,
        metadata: {
          createdBy: 'workflow-example',
          lastUpdated: new Date().toISOString(),
        },
      }
    );
    console.log(`  Updated account: ${updatedAccount.name}`);
  }
}

// Run the example
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
