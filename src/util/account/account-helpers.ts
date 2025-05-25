/**
 */

/**
 * Checks if an account ID belongs to an external account
 *
 * External accounts typically have an '@external' prefix or contain the word 'external'
 * These accounts represent sources or sinks of funds outside the ledger system.
 *
 * @returns True if the account ID indicates an external account
 *
 * @example
 * ```typescript
 * const isExternal = isExternalAccount('@external/USD');
 * console.log(isExternal); // true
 *
 * const isRegular = isExternalAccount('acc_12345');
 * console.log(isRegular); // false
 * ```
 */
export function isExternalAccount(accountId: string | null | undefined): boolean {
  if (!accountId) return false;
  return accountId.includes('@external') || accountId.includes('external');
}

/**
 * Checks if an account is a system account
 *
 * System accounts include external accounts and accounts that are designated
 * for special system purposes rather than regular user accounts.
 *
 * @returns True if the account is a system account
 *
 * @example
 * ```typescript
 * const isSystem = isSystemAccount({
 *   id: '@external/USD',
 *   name: 'External USD Account'
 * });
 * console.log(isSystem); // true
 * ```
 */
export function isSystemAccount(account: any): boolean {
  if (!account) return false;

  return (
    account.id?.startsWith('@') ||
    account.id?.includes('external') ||
    account.name?.includes('External') ||
    account.name?.includes('System') ||
    account.type === 'external'
  );
}

/**
 * Categorizes a list of accounts into regular and system accounts
 *
 * This function separates accounts into two categories:
 * 1. Regular accounts: Normal user accounts for tracking assets and liabilities
 * 2. System accounts: Special accounts used by the system (external accounts, etc.)
 *
 * @returns Object containing arrays of regular and system accounts
 *
 * @example
 * ```typescript
 * const { regularAccounts, systemAccounts } = categorizeAccounts(accountList);
 * console.log(`Regular accounts: ${regularAccounts.length}`);
 * console.log(`System accounts: ${systemAccounts.length}`);
 * ```
 */
export function categorizeAccounts<T extends { id?: string; name?: string; type?: string }>(
  accounts: T[]
): { regularAccounts: T[]; systemAccounts: T[] } {
  const regularAccounts: T[] = [];
  const systemAccounts: T[] = [];

  for (const account of accounts) {
    if (isSystemAccount(account)) {
      systemAccounts.push(account);
    } else {
      regularAccounts.push(account);
    }
  }

  return { regularAccounts, systemAccounts };
}

/**
 * Groups a list of accounts by asset code
 *
 * This is useful for organizing accounts by the type of asset they hold,
 * making it easier to display related accounts together or perform asset-specific
 * operations.
 *
 * @returns Object mapping asset codes to arrays of accounts
 *
 * @example
 * ```typescript
 * // Group all accounts by asset
 * const accountsByAsset = groupAccountsByAsset(accountList);
 *
 * // Count accounts per asset
 * Object.entries(accountsByAsset).forEach(([assetCode, accounts]) => {
 *   console.log(`${assetCode}: ${accounts.length} accounts`);
 * });
 *
 * // Filter to only accounts from a specific ledger
 * const ledgerAccounts = groupAccountsByAsset(accountList, {
 *   ledgerId: 'ldg_12345'
 * });
 * ```
 */
export function groupAccountsByAsset<T extends { assetCode?: string; ledgerId?: string }>(
  accounts: T[],
  options?: {
    ledgerId?: string;
  }
): Record<string, T[]> {
  return accounts.reduce((acc: Record<string, T[]>, account) => {
    // Skip accounts that don't match the ledger filter
    if (options?.ledgerId && account.ledgerId !== options.ledgerId) {
      return acc;
    }

    // Skip accounts without an asset code
    if (!account.assetCode) {
      return acc;
    }

    // Initialize array for this asset code if needed
    if (!acc[account.assetCode]) {
      acc[account.assetCode] = [];
    }

    // Add the account to its asset group
    acc[account.assetCode].push(account);
    return acc;
  }, {} as Record<string, T[]>);
}
