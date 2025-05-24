/**
 * Account Helpers Utility Example
 * 
 * This example demonstrates how to use the account helper utilities from the Midaz SDK
 * to work with accounts, including classification, filtering, and identification.
 */

import { 
  categorizeAccounts, 
  groupAccountsByAsset, 
  isExternalAccount, 
  isSystemAccount 
} from '../src/util/account';

// Example 1: Identifying External Accounts
function externalAccountExample() {
  console.log('\n=== Identifying External Accounts Example ===');
  
  // Test various account IDs
  const accountIds = [
    'acc_12345',
    '@external/USD',
    'external_account_789',
    'user_account_456',
    'acc_external_789',
    null,
    undefined
  ];
  
  console.log('Checking if accounts are external:');
  accountIds.forEach(id => {
    console.log(`Account ID: ${id || 'null/undefined'} => External: ${isExternalAccount(id)}`);
  });
}

// Example 2: Identifying System Accounts
function systemAccountExample() {
  console.log('\n=== Identifying System Accounts Example ===');
  
  // Create sample accounts
  const accounts = [
    { id: 'acc_12345', name: 'User Wallet', type: 'wallet' },
    { id: '@external/USD', name: 'External USD Account', type: 'external' },
    { id: 'acc_67890', name: 'System Reserve', type: 'reserve' },
    { id: 'acc_45678', name: 'External BTC Gateway', type: 'gateway' },
    { id: 'acc_98765', name: 'User Savings', type: 'savings' }
  ];
  
  console.log('Checking if accounts are system accounts:');
  accounts.forEach(account => {
    console.log(`Account: ${account.name} (${account.id}) => System Account: ${isSystemAccount(account)}`);
  });
}

// Example 3: Categorizing Accounts
function categorizeAccountsExample() {
  console.log('\n=== Categorizing Accounts Example ===');
  
  // Create a list of sample accounts
  const accounts = [
    { id: 'acc_12345', name: 'User Wallet', type: 'wallet', assetCode: 'USD', balance: 1000 },
    { id: '@external/USD', name: 'External USD Account', type: 'external', assetCode: 'USD', balance: 0 },
    { id: 'acc_67890', name: 'User BTC Wallet', type: 'wallet', assetCode: 'BTC', balance: 0.5 },
    { id: 'acc_45678', name: 'External BTC Gateway', type: 'external', assetCode: 'BTC', balance: 0 },
    { id: 'acc_98765', name: 'User ETH Wallet', type: 'wallet', assetCode: 'ETH', balance: 2.0 },
    { id: 'acc_23456', name: 'System Reserve', type: 'reserve', assetCode: 'USD', balance: 10000 },
    { id: 'acc_34567', name: 'User USDC Wallet', type: 'wallet', assetCode: 'USDC', balance: 500 }
  ];
  
  // Categorize accounts
  const { regularAccounts, systemAccounts } = categorizeAccounts(accounts);
  
  console.log(`Total accounts: ${accounts.length}`);
  console.log(`Regular accounts: ${regularAccounts.length}`);
  console.log(`System accounts: ${systemAccounts.length}`);
  
  console.log('\nRegular Accounts:');
  regularAccounts.forEach(account => {
    console.log(`- ${account.name} (${account.id}): ${account.balance} ${account.assetCode}`);
  });
  
  console.log('\nSystem Accounts:');
  systemAccounts.forEach(account => {
    console.log(`- ${account.name} (${account.id}): ${account.balance} ${account.assetCode}`);
  });
}

// Example 4: Grouping Accounts by Asset
function groupAccountsByAssetExample() {
  console.log('\n=== Grouping Accounts by Asset Example ===');
  
  // Create a list of sample accounts across multiple ledgers
  const accounts = [
    { id: 'acc_12345', name: 'User USD Wallet', type: 'wallet', assetCode: 'USD', ledgerId: 'ldg_1', balance: 1000 },
    { id: 'acc_67890', name: 'User BTC Wallet', type: 'wallet', assetCode: 'BTC', ledgerId: 'ldg_1', balance: 0.5 },
    { id: 'acc_98765', name: 'User ETH Wallet', type: 'wallet', assetCode: 'ETH', ledgerId: 'ldg_1', balance: 2.0 },
    { id: 'acc_23456', name: 'System USD Reserve', type: 'reserve', assetCode: 'USD', ledgerId: 'ldg_1', balance: 10000 },
    { id: 'acc_34567', name: 'User USDC Wallet', type: 'wallet', assetCode: 'USDC', ledgerId: 'ldg_1', balance: 500 },
    { id: 'acc_45678', name: 'User USD Wallet', type: 'wallet', assetCode: 'USD', ledgerId: 'ldg_2', balance: 2000 },
    { id: 'acc_56789', name: 'User BTC Wallet', type: 'wallet', assetCode: 'BTC', ledgerId: 'ldg_2', balance: 1.0 },
    { id: '@external/USD', name: 'External USD Account', type: 'external', assetCode: 'USD', ledgerId: 'ldg_1', balance: 0 }
  ];
  
  // Group all accounts by asset
  const accountsByAsset = groupAccountsByAsset(accounts);
  
  console.log('All accounts grouped by asset:');
  Object.entries(accountsByAsset).forEach(([assetCode, accounts]) => {
    console.log(`\n${assetCode} (${accounts.length} accounts):`);
    accounts.forEach(account => {
      console.log(`- ${account.name} (${account.id}): ${account.balance} ${account.assetCode} (Ledger: ${account.ledgerId})`);
    });
  });
  
  // Group accounts from a specific ledger
  console.log('\nFiltering accounts by ledger (ldg_1):');
  const ledger1Accounts = groupAccountsByAsset(accounts, { ledgerId: 'ldg_1' });
  
  Object.entries(ledger1Accounts).forEach(([assetCode, accounts]) => {
    console.log(`\n${assetCode} (${accounts.length} accounts):`);
    accounts.forEach(account => {
      console.log(`- ${account.name} (${account.id}): ${account.balance} ${account.assetCode}`);
    });
  });
}

// Example 5: Practical Application - Account Dashboard
function accountDashboardExample() {
  console.log('\n=== Practical Application - Account Dashboard Example ===');
  
  // Sample user accounts data
  const allAccounts = [
    { id: 'acc_12345', name: 'Primary USD Wallet', type: 'wallet', assetCode: 'USD', balance: 1250.75, ledgerId: 'ldg_1' },
    { id: 'acc_67890', name: 'BTC Trading Account', type: 'trading', assetCode: 'BTC', balance: 0.75, ledgerId: 'ldg_1' },
    { id: 'acc_98765', name: 'ETH Savings', type: 'savings', assetCode: 'ETH', balance: 4.25, ledgerId: 'ldg_1' },
    { id: 'acc_23456', name: 'USDC Earnings', type: 'earnings', assetCode: 'USDC', balance: 850.50, ledgerId: 'ldg_1' },
    { id: '@external/USD', name: 'External USD Gateway', type: 'external', assetCode: 'USD', balance: 0, ledgerId: 'ldg_1' },
    { id: '@external/BTC', name: 'External BTC Gateway', type: 'external', assetCode: 'BTC', balance: 0, ledgerId: 'ldg_1' },
    { id: 'acc_34567', name: 'System USD Reserve', type: 'reserve', assetCode: 'USD', balance: 50000, ledgerId: 'ldg_1' },
    { id: 'acc_45678', name: 'System BTC Reserve', type: 'reserve', assetCode: 'BTC', balance: 10, ledgerId: 'ldg_1' }
  ];
  
  // Step 1: Separate user accounts from system accounts
  const { regularAccounts, systemAccounts } = categorizeAccounts(allAccounts);
  
  // Step 2: Group user accounts by asset for the dashboard
  const userAccountsByAsset = groupAccountsByAsset(regularAccounts);
  
  // Step 3: Calculate total balance per asset
  const assetTotals: Record<string, number> = {};
  
  Object.entries(userAccountsByAsset).forEach(([assetCode, accounts]) => {
    assetTotals[assetCode] = accounts.reduce((sum, account) => sum + account.balance, 0);
  });
  
  // Display the dashboard
  console.log('=== USER ACCOUNT DASHBOARD ===');
  console.log(`Total user accounts: ${regularAccounts.length}`);
  console.log(`System accounts (hidden from user): ${systemAccounts.length}`);
  
  console.log('\nAssets Summary:');
  Object.entries(assetTotals).forEach(([assetCode, total]) => {
    console.log(`${assetCode}: ${total} (${userAccountsByAsset[assetCode].length} accounts)`);
  });
  
  console.log('\nAccount Details by Asset:');
  Object.entries(userAccountsByAsset).forEach(([assetCode, accounts]) => {
    console.log(`\n${assetCode} Accounts:`);
    accounts.forEach(account => {
      console.log(`- ${account.name}: ${account.balance} ${account.assetCode} (Type: ${account.type})`);
    });
  });
  
  // Identify external accounts for deposit/withdrawal options
  const externalAccounts = systemAccounts.filter(account => isExternalAccount(account.id));
  
  console.log('\nAvailable External Accounts for Deposits/Withdrawals:');
  externalAccounts.forEach(account => {
    console.log(`- ${account.name} (${account.assetCode})`);
  });
}

// Run the examples
function runExamples() {
  try {
    externalAccountExample();
    systemAccountExample();
    categorizeAccountsExample();
    groupAccountsByAssetExample();
    accountDashboardExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}
