/**
 * Complete Workflow Example for midaz-sdk-typescript
 * 
 * This example demonstrates a complete workflow using the Midaz TypeScript SDK, including:
 * - Creating organizations
 * - Creating ledgers  
 * - Creating assets
 * - Creating account types
 * - Creating operation routes
 * - Creating transaction routes
 * - Creating accounts with account types
 * - Performing transactions with routes
 * - Creating segments and portfolios
 * - Listing accounts
 * - Testing GET methods
 * - Testing LIST methods with pagination
 * - Updating and retrieving organizations
 * - Cleanup (deleting resources)
 * 
 * IMPORTANT: This example requires a running Midaz server and does NOT run in mock mode.
 * To start the server locally, run the following command from the project root:
 *     make up
 * 
 * Make sure the Midaz Stack is running --default is localhost
 */

import { config } from 'dotenv';
import { MidazClient, createClientConfigBuilder } from '../src/index';

// Load environment variables
config();

console.log('🔧 Loading configuration from environment...');

// Auto-detect authentication method from environment (matches Go SDK behavior)
const pluginAuthEnabled = process?.env?.PLUGIN_AUTH_ENABLED?.toLowerCase() === 'true';

console.log('🔌 Connecting to Midaz APIs:');
console.log(`   - Onboarding API: ${process?.env?.MIDAZ_ONBOARDING_URL || 'http://localhost:3000'}/v1`);
console.log(`   - Transaction API: ${process?.env?.MIDAZ_TRANSACTION_URL || 'http://localhost:3001'}/v1`);
console.log(`   - Environment: local`);
console.log(`   - Debug mode: ${process?.env?.MIDAZ_DEBUG || 'false'}`);

// Display authentication method being used (like Go SDK)
if (pluginAuthEnabled) {
  console.log(`🔐 Authentication: Plugin Auth`);
  console.log(`   - Auth Service: ${process?.env?.PLUGIN_AUTH_ADDRESS || process?.env?.PLUGIN_AUTH_HOST || 'http://localhost:4000'}`);
  console.log(`   - Client ID: ${process?.env?.MIDAZ_CLIENT_ID ? '***' + process?.env?.MIDAZ_CLIENT_ID.slice(-4) : 'not set'}`);
} else {
  console.log(`🔐 Authentication: Plugin Auth (Default)`);
  console.log(`   - Using pluginAccessManager for authentication`);
}
console.log();

console.log('🔑 Initializing SDK client...');

// Configure client using pluginAccessManager
const clientConfig = createClientConfigBuilder('')
  .withAccessManager({
    enabled: pluginAuthEnabled,
    address: process?.env?.PLUGIN_AUTH_ADDRESS || process?.env?.PLUGIN_AUTH_HOST || '',
    clientId: process?.env?.MIDAZ_CLIENT_ID || '',
    clientSecret: process?.env?.MIDAZ_CLIENT_SECRET || '',
    tokenEndpoint: process?.env?.PLUGIN_AUTH_TOKEN_ENDPOINT || '/v1/login/oauth/access_token',
    refreshThresholdSeconds: process?.env?.PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS ? 
      parseInt(process?.env?.PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS, 10) : 300
  })
  .withBaseUrls({
    onboarding: process?.env?.MIDAZ_ONBOARDING_URL || 'http://localhost:3000',
    transaction: process?.env?.MIDAZ_TRANSACTION_URL || 'http://localhost:3001'
  })
  .withTimeout(30000);

const client = new MidazClient(clientConfig);
console.log('✅ SDK client initialized successfully\n');
console.log('🚀 Starting complete workflow...\n');

async function runCompleteWorkflow() {
  console.log('🚀 STARTING COMPLETE WORKFLOW');
  console.log('==================================================\n');

  try {
    // Generate unique names for this workflow
    const orgName = 'Example Corp ' + Math.random().toString(36).substring(7);
    const ledgerName = 'Main Ledger ' + Math.random().toString(36).substring(7);
    const assetCode = 'USD';

    // STEP 1: Organization Creation
    console.log('🏢 STEP 1: ORGANIZATION CREATION');
    console.log('==================================================\n');
    
    console.log('Creating organization...');
    const organization = await client.entities.organizations.createOrganization({
      legalName: orgName,
      doingBusinessAs: orgName,
      legalDocument: '12345678901234',
      address: {
        line1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      },
      status: {
        code: 'ACTIVE'
      } as any
    });
    console.log(`✅ Organization created: ${organization.legalName}`);
    console.log(`   ID: ${organization.id}`);
    console.log(`   Created: ${organization.createdAt}\n`);
    
    const orgId = organization.id;

    // STEP 2: Ledger Creation
    console.log('📒 STEP 2: LEDGER CREATION');
    console.log('==================================================\n');
    
    console.log('Creating ledger...');
    const ledger = await client.entities.ledgers.createLedger(orgId, {
      name: ledgerName,
      status: {
        code: 'ACTIVE'
      } as any
    });
    console.log(`✅ Ledger created: ${ledger.name}`);
    console.log(`   ID: ${ledger.id}`);
    console.log(`   Created: ${ledger.createdAt}\n`);
    
    const ledgerId = ledger.id;

    // STEP 3: Asset Creation
    console.log('🏦 STEP 3: ASSET CREATION');
    console.log('==================================================');
    
    console.log('Creating USD asset...');
    const asset = await client.entities.assets.createAsset(orgId, ledgerId, {
      name: 'US Dollar',
      type: 'currency',
      code: assetCode,
      status: {
        code: 'ACTIVE'
      } as any
    });
    console.log(`✅ USD asset created: ${asset.name}`);
    console.log(`   ID: ${asset.id}`);
    console.log(`   Code: ${asset.code}`);
    console.log(`   Created: ${asset.createdAt}\n`);

    // STEP 3.5: Organization Update
    console.log('🔄 STEP 3.5: ORGANIZATION UPDATE');
    console.log('==================================================\n');
    
    console.log('Updating organization...');
    const updatedOrg = await client.entities.organizations.updateOrganization(orgId, {
      legalName: orgName,
      doingBusinessAs: orgName + ' - Updated',
      metadata: {
        industry: 'Technology',
        lastUpdatedAt: new Date().toISOString(),
        size: 'Medium'
      }
    });
    console.log(`✅ Organization updated: ${updatedOrg.legalName}`);
    console.log(`   ID: ${updatedOrg.id}`);
    console.log(`   Updated: ${updatedOrg.updatedAt}`);
    console.log(`   Metadata: ${JSON.stringify(updatedOrg.metadata)}\n`);

    // STEP 4: Account Type Creation
    console.log('📋 STEP 4: ACCOUNT TYPE CREATION');
    console.log('==================================================\n');
    
    console.log('Creating account type...');
    const accountType = await client.entities.accountTypes.createAccountType(orgId, ledgerId, {
      name: 'Cash Account',
      description: 'Account type for liquid assets held in cash or cash equivalents.',
      keyValue: 'CASH'
    });
    console.log(`✅ Account type created: ${accountType.name}`);
    console.log(`   ID: ${accountType.id}`);
    console.log(`   Description: ${accountType.description}`);
    console.log(`   KeyValue: ${accountType.keyValue}`);
    console.log(`   Created: ${accountType.createdAt}\n`);
    
    const accountTypeId = accountType.id;

    // STEP 4.5: Operation Route Creation 
    console.log('🛤️ STEP 4.5: OPERATION ROUTE CREATION');
    console.log('==================================================\n');
    
    console.log('Creating source operation route...');
    const sourceOperationRoute = await client.entities.operationRoutes.createOperationRoute(orgId, ledgerId, {
      title: 'Source Operation Route',
      description: 'Operation route for source transactions',
      operationType: 'source',
      account: {
        ruleType: 'account_type',
        validIf: [accountTypeId]
      },
      metadata: {
        category: 'source',
        priority: 'high'
      }
    });
    console.log(`✅ Source operation route created: ${sourceOperationRoute.title}`);
    console.log(`   ID: ${sourceOperationRoute.id}`);
    console.log(`   Type: ${sourceOperationRoute.operationType}`);
    console.log(`   Created: ${sourceOperationRoute.createdAt}\n`);

    console.log('Creating destination operation route...');
    const destinationOperationRoute = await client.entities.operationRoutes.createOperationRoute(orgId, ledgerId, {
      title: 'Destination Operation Route',
      description: 'Operation route for destination transactions',
      operationType: 'destination',
      account: {
        ruleType: 'account_type', 
        validIf: [accountTypeId]
      },
      metadata: {
        category: 'destination',
        priority: 'high'
      }
    });
    console.log(`✅ Destination operation route created: ${destinationOperationRoute.title}`);
    console.log(`   ID: ${destinationOperationRoute.id}`);
    console.log(`   Type: ${destinationOperationRoute.operationType}`);
    console.log(`   Created: ${destinationOperationRoute.createdAt}\n`);

    // STEP 4.6: Transaction Route Creation
    console.log('🚏 STEP 4.6: TRANSACTION ROUTE CREATION');
    console.log('==================================================\n');
    
    console.log('Creating transaction route...');
    const transactionRoute = await client.entities.transactionRoutes.createTransactionRoute(orgId, ledgerId, {
      title: 'Standard Transaction Route',
      description: 'Route for standard transactions using operation routes',
      operationRoutes: [sourceOperationRoute.id, destinationOperationRoute.id],
      metadata: {
        category: 'standard',
        flow: 'payment'
      }
    });
    console.log(`✅ Transaction route created: ${transactionRoute.title}`);
    console.log(`   ID: ${transactionRoute.id}`);
    console.log(`   Operation Routes: ${transactionRoute.operationRoutes?.join(', ')}`);
    console.log(`   Created: ${transactionRoute.createdAt}\n`);

    // Update Account Type
    console.log('📝 Updating Account Type...');
    const updatedAccountType = await client.entities.accountTypes.updateAccountType(orgId, ledgerId, accountTypeId, {
      name: 'Premium Business Account - Updated',
      description: 'Updated premium business account type with new enhanced features'
    });
    console.log(`✅ Account type updated: ${updatedAccountType.name}`);
    console.log(`   ID: ${updatedAccountType.id}`);
    console.log(`   Description: ${updatedAccountType.description}`);
    console.log(`   Updated: ${updatedAccountType.updatedAt}\n`);

    // Get Account Type
    console.log('🔍 Retrieving Account Type...');
    const retrievedAccountType = await client.entities.accountTypes.getAccountType(orgId, ledgerId, accountTypeId);
    console.log(`✅ Account type retrieved: ${retrievedAccountType.name}`);
    console.log(`   ID: ${retrievedAccountType.id}`);
    console.log(`   Description: ${retrievedAccountType.description}`);
    console.log(`   Created: ${retrievedAccountType.createdAt}`);
    console.log(`   Updated: ${retrievedAccountType.updatedAt}\n`);

    // List Account Types
    console.log('📄 Listing Account Types...');
    const accountTypes = await client.entities.accountTypes.listAccountTypes(orgId, ledgerId);
    console.log(`✅ Found ${accountTypes.items.length} account types:`);
    accountTypes.items.forEach((type: any, index: number) => {
      console.log(`   ${index + 1}. ${type.name} (ID: ${type.id})`);
      console.log(`      Description: ${type.description}`);
      console.log(`      Created: ${type.createdAt}`);
    });
    console.log();

    // STEP 5: Account Creation with Account Type
    console.log('📂 STEP 5: ACCOUNT CREATION WITH ACCOUNT TYPE');
    console.log('==================================================\n');
    
    console.log('Creating customer account with account type...');
    const customerAccount = await client.entities.accounts.createAccount(orgId, ledgerId, {
      name: 'Customer Account',
      type: 'liability' as any,
      assetCode: assetCode,
      metadata: {
        purpose: 'main',
        account_type_id: accountTypeId,
        category: 'business'
      }
    } as any);
    console.log(`✅ Customer account created: ${customerAccount.name}`);
    console.log(`   ID: ${customerAccount.id}`);
    console.log(`   Type: ${customerAccount.type}`);
    console.log(`   Asset: ${customerAccount.assetCode}`);
    console.log(`   Account Type ID: ${(customerAccount as any).metadata?.account_type_id}`);
    console.log(`   Alias: ${(customerAccount as any).alias}`);
    console.log(`   Created: ${customerAccount.createdAt}\n`);

    console.log('Creating merchant account with account type...');
    const merchantAccount = await client.entities.accounts.createAccount(orgId, ledgerId, {
      name: 'Merchant Account',
      type: 'revenue' as any,
      assetCode: assetCode,
      metadata: {
        purpose: 'main',
        account_type_id: accountTypeId,
        category: 'business'
      }
    } as any);
    console.log(`✅ Merchant account created: ${merchantAccount.name}`);
    console.log(`   ID: ${merchantAccount.id}`);
    console.log(`   Type: ${merchantAccount.type}`);
    console.log(`   Asset: ${merchantAccount.assetCode}`);
    console.log(`   Account Type ID: ${(merchantAccount as any).metadata?.account_type_id}`);
    console.log(`   Created: ${merchantAccount.createdAt}\n`);

    console.log('Creating dummy account 1...');
    const dummy1Account = await client.entities.accounts.createAccount(orgId, ledgerId, {
      name: 'Dummy Account 1',
      type: 'liability' as any,
      assetCode: assetCode,
      metadata: {
        purpose: 'dummy',
        account_type_id: accountTypeId,
        category: 'test'
      }
    } as any);
    console.log(`✅ Dummy account 1 created: ${dummy1Account.name}`);
    console.log(`   ID: ${dummy1Account.id}`);
    console.log(`   Type: ${dummy1Account.type}`);
    console.log(`   Asset: ${dummy1Account.assetCode}`);
    console.log(`   Created: ${dummy1Account.createdAt}\n`);

    console.log('Creating dummy account 2...');
    const dummy2Account = await client.entities.accounts.createAccount(orgId, ledgerId, {
      name: 'Dummy Account 2',
      type: 'revenue' as any,
      assetCode: assetCode,
      metadata: {
        purpose: 'dummy',
        account_type_id: accountTypeId,
        category: 'test'
      }
    } as any);
    console.log(`✅ Dummy account 2 created: ${dummy2Account.name}`);
    console.log(`   ID: ${dummy2Account.id}`);
    console.log(`   Type: ${dummy2Account.type}`);
    console.log(`   Asset: ${dummy2Account.assetCode}`);
    console.log(`   Created: ${dummy2Account.createdAt}\n`);

    // STEP 6: Transaction Execution with Routes
    console.log('💸 STEP 6: TRANSACTION EXECUTION WITH ROUTES');
    console.log('==================================================\n');
    
    const amount = '1000.00';
    const externalAccountID = '@external/USD';

    console.log('Creating transaction using transaction routes and operation routes...');
    
    const transactionInput = {
      chartOfAccountsGroupName: 'FUNDING',
      description: 'Initial deposit from external account using routes',
      route: transactionRoute.id,
      metadata: {
        source: 'typescript-sdk-example',
        type: 'deposit',
        useRoutes: true,
        transactionRouteID: transactionRoute.id,
        transactionRouteTitle: transactionRoute.title
      },
      send: {
        asset: assetCode,
        value: amount,
        source: {
          from: [{
            account: externalAccountID,
            route: sourceOperationRoute.id,
            amount: {
              asset: assetCode,
              value: amount
            },
            description: 'Debit Operation - External deposit',
            metadata: {
              operation: 'funding',
              type: 'external'
            }
          }]
        },
        distribute: {
          to: [{
            account: customerAccount.alias || customerAccount.id,
            route: destinationOperationRoute.id,
            amount: {
              asset: assetCode,
              value: amount
            },
            description: 'Credit Operation - Customer account',
            metadata: {
              operation: 'funding',
              type: 'account'
            }
          }]
        }
      }
    };
    
    
    try {
      const transaction = await client.entities.transactions.createTransaction(orgId, ledgerId, transactionInput);
      
      console.log(`✅ Transaction created: ${transaction.id}`);
      console.log(`   Description: ${transaction.description}`);
      console.log(`   Amount: ${transaction.amount} ${transaction.assetCode}`);
      console.log(`   Route: ${transaction.route}`);
      console.log(`   Status: ${transaction.status?.code}`);
      console.log(`   Created: ${transaction.createdAt}`);
      console.log(`   Source: ${transaction.source?.join(', ')}`);
      console.log(`   Destination: ${transaction.destination?.join(', ')}\n`);

      // Create a second transaction - Payment between accounts using routes
      console.log('Creating payment transaction using routes...');
      const paymentTransaction = await client.entities.transactions.createTransaction(orgId, ledgerId, {
        chartOfAccountsGroupName: 'TRANSFER',
        description: 'Payment for services using routes',
        route: transactionRoute.id,
        metadata: {
          source: 'typescript-sdk-example',
          type: 'transfer',
          useRoutes: true,
          purpose: 'service_payment'
        },
        send: {
          asset: assetCode,
          value: '250.00',
          source: {
            from: [{
              account: customerAccount.alias || customerAccount.id,
              route: sourceOperationRoute.id,
              amount: {
                asset: assetCode,
                value: '250.00'
              },
              description: 'Debit Operation - Customer payment',
              metadata: {
                operation: 'transfer',
                type: 'payment'
              }
            }]
          },
          distribute: {
            to: [{
              account: merchantAccount.alias || merchantAccount.id,
              route: destinationOperationRoute.id,
              amount: {
                asset: assetCode,
                value: '250.00'
              },
              description: 'Credit Operation - Merchant account',
              metadata: {
                operation: 'transfer',
                type: 'receipt'
              }
            }]
          }
        }
      });

      console.log(`✅ Payment transaction created: ${paymentTransaction.id}`);
      console.log(`   Description: ${paymentTransaction.description}`);
      console.log(`   Amount: ${paymentTransaction.amount} ${paymentTransaction.assetCode}`);
      console.log(`   Route: ${paymentTransaction.route}`);
      console.log(`   Status: ${paymentTransaction.status?.code}`);
      console.log(`   Created: ${paymentTransaction.createdAt}\n`);

    } catch (error) {
      console.log(`⚠️ Transaction creation failed: ${(error as any).message}`);
      console.log('🐛 Full error details:');
      console.log(JSON.stringify(error, null, 2));
      if ((error as any).response) {
        console.log('🐛 API Response Details:');
        console.log(JSON.stringify((error as any).response, null, 2));
      }
      console.log('\n🔍 Debugging transaction creation issue...\n');
    }

    // STEP 7: Portfolio Creation
    console.log('📁 STEP 7: PORTFOLIO CREATION');
    console.log('==================================================\n');

    console.log('Creating portfolio...');
    const portfolio = await client.entities.portfolios.createPortfolio(orgId, ledgerId, {
      name: 'Main Portfolio',
      entityId: customerAccount.id,
      status: {
        code: 'ACTIVE'
      } as any
    } as any);
    console.log(`✅ Portfolio created: ${portfolio.name}`);
    console.log(`   ID: ${portfolio.id}`);
    console.log(`   Created: ${portfolio.createdAt}\n`);

    // STEP 8: Segment Creation
    console.log('🔍 STEP 8: SEGMENT CREATION');
    console.log('==================================================\n');

    const segments = [
      { name: 'North America Region', metadata: { region: 'NA', countries: 'USA,Canada,Mexico' } },
      { name: 'Europe Region', metadata: { region: 'EU', countries: 'UK,France,Germany,Italy' } },
      { name: 'Asia Pacific Region', metadata: { region: 'APAC', countries: 'Japan,China,Australia,India' } }
    ];

    console.log('Creating segments...');
    const createdSegments = [];
    for (const segmentData of segments) {
      const segment = await client.entities.segments.createSegment(orgId, ledgerId, {
        name: segmentData.name,
        status: {
          code: 'ACTIVE'
        } as any,
        metadata: segmentData.metadata as Record<string, any>
      });
      createdSegments.push(segment);
      console.log(`✅ Segment created: ${segment.name}`);
      console.log(`   ID: ${segment.id}`);
      console.log(`   Region: ${segment.metadata?.region || 'N/A'}`);
      console.log(`   Countries: ${segment.metadata?.countries || 'N/A'}`);
      console.log(`   Created: ${segment.createdAt}`);
    }
    console.log('\n✅ All segments created successfully\n');

    // STEP 9: Organization Retrieval
    console.log('🔍 STEP 9: ORGANIZATION RETRIEVAL');
    console.log('==================================================\n');

    console.log('Retrieving organization...');
    const retrievedOrg = await client.entities.organizations.getOrganization(orgId);
    console.log(`✅ Organization retrieved: ${retrievedOrg.legalName}`);
    console.log(`   ID: ${retrievedOrg.id}`);
    console.log(`   Created: ${retrievedOrg.createdAt}`);
    console.log(`   Updated: ${retrievedOrg.updatedAt}`);
    console.log(`   Metadata: ${JSON.stringify(retrievedOrg.metadata)}\n`);

    // STEP 10: Account Listing
    console.log('📋 STEP 10: ACCOUNT LISTING');
    console.log('==================================================\n');
    
    console.log('Listing all accounts...');
    const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);
    console.log(`✅ Found ${accounts.items.length} accounts:`);
    accounts.items.forEach((account: any, index: number) => {
      console.log(`   ${index + 1}. ${account.name} (ID: ${account.id}, Type: ${account.type})`);
    });
    console.log();

    // STEP 11: Testing GET Methods
    console.log('🔍 STEP 11: TESTING GET METHODS');
    console.log('==================================================\n');

    console.log('Testing GetOrganization...');
    const getOrg = await client.entities.organizations.getOrganization(orgId);
    console.log(`✅ Got organization: ${getOrg.legalName} (ID: ${getOrg.id})\n`);

    console.log('Testing GetLedger...');
    const getLedger = await client.entities.ledgers.getLedger(orgId, ledgerId);
    console.log(`✅ Got ledger: ${getLedger.name} (ID: ${getLedger.id})\n`);

    console.log('Testing GetAccount...');
    const getAccount = await client.entities.accounts.getAccount(orgId, ledgerId, customerAccount.id);
    console.log(`✅ Got account: ${getAccount.name} (ID: ${getAccount.id}, Type: ${getAccount.type})\n`);

    console.log('Testing GetPortfolio...');
    const getPortfolio = await client.entities.portfolios.getPortfolio(orgId, ledgerId, portfolio.id);
    console.log(`✅ Got portfolio: ${getPortfolio.name} (ID: ${getPortfolio.id})\n`);

    console.log('✅ All Get methods tested successfully\n');

    // STEP 12: Testing LIST Methods
    console.log('📋 STEP 12: TESTING LIST METHODS WITH PAGINATION');
    console.log('==================================================\n');

    console.log('🔍 Testing ListOrganizations with pagination...');
    const orgs = await client.entities.organizations.listOrganizations({ limit: 10 });
    console.log(`✅ Found ${orgs.items.length} organizations (page 1)`);
    orgs.items.slice(0, 5).forEach((org: any, index: number) => {
      console.log(`   ${index + 1}. ${org.legalName} (ID: ${org.id})`);
    });
    console.log();

    console.log('🔍 Testing ListLedgers with filtering...');
    const ledgers = await client.entities.ledgers.listLedgers(orgId);
    console.log(`✅ Found ${ledgers.items.length} ledgers`);
    ledgers.items.forEach((ledger: any, index: number) => {
      console.log(`   ${index + 1}. ${ledger.name} (ID: ${ledger.id})`);
    });
    console.log();

    console.log('🔍 Testing ListAccounts with pagination and filtering...');
    const accountsList = await client.entities.accounts.listAccounts(orgId, ledgerId);
    console.log(`✅ Found ${accountsList.items.length} accounts`);
    accountsList.items.forEach((account: any, index: number) => {
      console.log(`   ${index + 1}. ${account.name} (ID: ${account.id}, Type: ${account.type})`);
    });
    console.log();

    console.log('🔍 Testing ListPortfolios...');
    const portfolios = await client.entities.portfolios.listPortfolios(orgId, ledgerId);
    console.log(`✅ Found ${portfolios.items.length} portfolios`);
    portfolios.items.forEach((portfolio: any, index: number) => {
      console.log(`   ${index + 1}. ${portfolio.name} (ID: ${portfolio.id})`);
    });
    console.log();

    console.log('🔍 Testing ListSegments...');
    const segmentsList = await client.entities.segments.listSegments(orgId, ledgerId);
    console.log(`✅ Found ${segmentsList.items.length} segments`);
    segmentsList.items.forEach((segment: any, index: number) => {
      console.log(`   ${index + 1}. ${segment.name} (ID: ${segment.id})`);
    });
    console.log();

    console.log('✅ All List methods tested successfully with pagination\n');

    // STEP 13: DELETE Operations and Cleanup
    console.log('🗑️ STEP 13: DELETE OPERATIONS AND CLEANUP');
    console.log('==================================================\n');

    console.log('Cleaning up created resources...');
    
    try {
      console.log('Deleting transaction route...');
      await client.entities.transactionRoutes.deleteTransactionRoute(orgId, ledgerId, transactionRoute.id);
      console.log('✅ Transaction route deleted successfully');
    } catch (error) {
      console.log(`⚠️ Transaction route deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting operation routes...');
      await client.entities.operationRoutes.deleteOperationRoute(orgId, ledgerId, sourceOperationRoute.id);
      await client.entities.operationRoutes.deleteOperationRoute(orgId, ledgerId, destinationOperationRoute.id);
      console.log('✅ Operation routes deleted successfully');
    } catch (error) {
      console.log(`⚠️ Operation route deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting portfolio...');
      await client.entities.portfolios.deletePortfolio(orgId, ledgerId, portfolio.id);
      console.log('✅ Portfolio deleted successfully');
    } catch (error) {
      console.log(`⚠️ Portfolio deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting segments...');
      for (const segment of createdSegments) {
        await client.entities.segments.deleteSegment(orgId, ledgerId, segment.id);
      }
      console.log('✅ All segments deleted successfully');
    } catch (error) {
      console.log(`⚠️ Segment deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting accounts...');
      await client.entities.accounts.deleteAccount(orgId, ledgerId, customerAccount.id);
      await client.entities.accounts.deleteAccount(orgId, ledgerId, merchantAccount.id);
      await client.entities.accounts.deleteAccount(orgId, ledgerId, dummy1Account.id);
      await client.entities.accounts.deleteAccount(orgId, ledgerId, dummy2Account.id);
      console.log('✅ All accounts deleted successfully');
    } catch (error) {
      console.log(`⚠️ Account deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting account type...');
      await client.entities.accountTypes.deleteAccountType(orgId, ledgerId, accountTypeId);
      console.log('✅ Account type deleted successfully');
    } catch (error) {
      console.log(`⚠️ Account type deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting asset...');
      await client.entities.assets.deleteAsset(orgId, ledgerId, asset.id);
      console.log('✅ Asset deleted successfully');
    } catch (error) {
      console.log(`⚠️ Asset deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting ledger...');
      await client.entities.ledgers.deleteLedger(orgId, ledgerId);
      console.log('✅ Ledger deleted successfully');
    } catch (error) {
      console.log(`⚠️ Ledger deletion failed: ${(error as any).message}`);
    }

    try {
      console.log('Deleting organization...');
      await client.entities.organizations.deleteOrganization(orgId);
      console.log('✅ Organization deleted successfully');
    } catch (error) {
      console.log(`⚠️ Organization deletion failed: ${(error as any).message}`);
    }

    console.log('\n✅ Cleanup completed\n');

    console.log('✅ COMPLETE WORKFLOW FINISHED SUCCESSFULLY');
    console.log('==================================================\n');
    
    console.log('🎉 Workflow completed successfully!');
    
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
}

// Run the complete workflow
runCompleteWorkflow()
  .then(() => {
    console.log('✅ Example completed successfully');
    process?.exit?.(0);
  })
  .catch((error) => {
    console.error('❌ Example failed:', error);
    process?.exit?.(1);
  });