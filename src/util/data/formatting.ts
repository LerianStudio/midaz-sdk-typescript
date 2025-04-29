/**
 * @file Formatting utilities for the Midaz SDK
 * @description Provides utilities for formatting financial values, dates, balances, and other data types
 */

/**
 * Formats a balance amount with proper decimal places based on the asset's scale
 *
 * Converts an integer amount and scale to a properly formatted decimal string.
 * For example, an amount of 1000 with a scale of 100 would be formatted as "10.00".
 *
 * @param amount - The integer amount to format
 * @param scale - The scale factor (e.g., 100 for 2 decimal places, 1000 for 3 decimal places)
 * @param options - Optional formatting options
 * @returns Formatted balance string with proper decimal places
 *
 * @example
 * ```typescript
 * // Format a USD amount (scale 100)
 * const formattedUsd = formatBalance(1050, 100);
 * console.log(formattedUsd); // "10.50"
 *
 * // Format a BTC amount (scale 100000000)
 * const formattedBtc = formatBalance(123456789, 100000000);
 * console.log(formattedBtc); // "1.23456789"
 *
 * // Format with currency symbol and locale
 * const formattedEur = formatBalance(2050, 100, {
 *   locale: 'de-DE',
 *   currency: 'EUR'
 * });
 * console.log(formattedEur); // "20,50 €"
 * ```
 */
export function formatBalance(
  amount: number,
  scale: number,
  options?: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const decimalValue = amount / scale;

  // Determine the number of decimal places from the scale if not specified
  const decimalPlaces =
    options?.minimumFractionDigits ??
    options?.maximumFractionDigits ??
    Math.max(0, Math.log10(scale));

  if (options?.currency) {
    // Format as currency if currency code is provided
    return decimalValue.toLocaleString(options.locale, {
      style: 'currency',
      currency: options.currency,
      minimumFractionDigits: options?.minimumFractionDigits ?? decimalPlaces,
      maximumFractionDigits: options?.maximumFractionDigits ?? decimalPlaces,
    });
  } else {
    // Format as a regular number
    return decimalValue.toLocaleString(options?.locale, {
      minimumFractionDigits: options?.minimumFractionDigits ?? decimalPlaces,
      maximumFractionDigits: options?.maximumFractionDigits ?? decimalPlaces,
    });
  }
}

/**
 * Calculates the decimal places from a scale factor
 *
 * @param scale - The scale factor (e.g., 100 for 2 decimal places)
 * @returns The number of decimal places
 *
 * @example
 * ```typescript
 * const decimalPlaces = getDecimalPlacesFromScale(100);
 * console.log(decimalPlaces); // 2
 *
 * const btcDecimals = getDecimalPlacesFromScale(100000000);
 * console.log(btcDecimals); // 8
 * ```
 */
export function getDecimalPlacesFromScale(scale: number): number {
  return Math.max(0, Math.log10(scale));
}

/**
 * Formats an amount as a human-readable string with asset code
 *
 * @param amount - The integer amount to format
 * @param scale - The scale factor
 * @param assetCode - The asset code (e.g., "USD", "BTC")
 * @param options - Optional formatting options
 * @returns Formatted amount with asset code
 *
 * @example
 * ```typescript
 * // Format a USD amount
 * const formattedAmount = formatAmountWithAsset(1050, 100, "USD");
 * console.log(formattedAmount); // "10.50 USD"
 *
 * // Format with symbol position
 * const formattedWithSymbol = formatAmountWithAsset(1050, 100, "USD", {
 *   symbolPosition: "before"
 * });
 * console.log(formattedWithSymbol); // "USD 10.50"
 * ```
 */
export function formatAmountWithAsset(
  amount: number,
  scale: number,
  assetCode: string,
  options?: {
    locale?: string;
    symbolPosition?: 'before' | 'after';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const formattedAmount = formatBalance(amount, scale, {
    locale: options?.locale,
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  });

  return options?.symbolPosition === 'before'
    ? `${assetCode} ${formattedAmount}`
    : `${formattedAmount} ${assetCode}`;
}

/**
 * Safely formats a balance amount with error handling and default values
 *
 * This is an enhanced version of formatBalance that handles various input types
 * and edge cases, making it safer for use in UIs and reports.
 *
 * @param value - The value to format (can be string, number, or undefined)
 * @param scale - The scale factor (can be string, number, or undefined)
 * @param options - Optional formatting options
 * @returns Formatted balance string with proper decimal places
 *
 * @example
 * ```typescript
 * // Safe formatting with different input types
 * const formatted1 = formatBalanceSafely(1050, 100);
 * console.log(formatted1); // "10.50"
 *
 * const formatted2 = formatBalanceSafely("1050", "100");
 * console.log(formatted2); // "10.50"
 *
 * // Handles invalid inputs
 * const formatted3 = formatBalanceSafely(NaN, 100);
 * console.log(formatted3); // "0.00"
 *
 * const formatted4 = formatBalanceSafely(null, undefined);
 * console.log(formatted4); // "0.00"
 * ```
 */
export function formatBalanceSafely(
  value: string | number | undefined | null,
  scale: string | number | undefined | null,
  options?: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  try {
    // Handle null or undefined values
    if (value === null || value === undefined) {
      value = 0;
    }

    if (scale === null || scale === undefined) {
      scale = 1;
    }

    // Convert strings to numbers
    let numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    const numScale = typeof scale === 'string' ? parseFloat(scale) : Number(scale);

    // Handle invalid values
    if (isNaN(numValue) || !isFinite(numValue)) {
      numValue = 0;
    }

    // Use the SDK's formatBalance with proper scaling
    return formatBalance(numValue, Math.max(1, numScale || 1), options);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // Fallback in case of any errors
    return options?.currency ? `0.00 ${options.currency}` : '0.00';
  }
}

/**
 * Formats an account balance for display with asset code, available and on-hold amounts
 *
 * @param balance - The balance object to format
 * @param options - Optional formatting options
 * @returns Formatted balance object with display properties
 *
 * @example
 * ```typescript
 * // Format an account balance for display
 * const formattedBalance = formatAccountBalance(
 *   {
 *     accountId: "acc_123",
 *     available: 10050,
 *     onHold: 500,
 *     assetCode: "USD",
 *     scale: 100
 *   },
 *   { accountType: "Savings" }
 * );
 * console.log(formattedBalance.displayString);
 * // "USD (Savings acc_123): Available 100.50, On Hold 5.00"
 * ```
 */
export function formatAccountBalance(
  balance: any,
  options?: {
    accountType?: string;
    locale?: string;
  }
): {
  assetCode: string;
  accountId: string;
  accountType: string;
  available: string;
  onHold: string;
  displayString: string;
} {
  // Safety check for undefined or null balance
  if (!balance) {
    return {
      assetCode: 'Unknown',
      accountId: 'Unknown',
      accountType: options?.accountType || 'Account',
      available: '0.00',
      onHold: '0.00',
      displayString: 'Unknown (Account Unknown): Unable to display balance',
    };
  }

  const accountType = options?.accountType || 'Account';

  try {
    // Use hasOwnProperty to check if properties exist
    const hasAvailable = Object.prototype.hasOwnProperty.call(balance, 'available');
    const hasScale = Object.prototype.hasOwnProperty.call(balance, 'scale');
    const hasOnHold = Object.prototype.hasOwnProperty.call(balance, 'onHold');
    
    const availableFormatted = formatBalanceSafely(
      hasAvailable ? balance.available : 0, 
      hasScale ? balance.scale : 100, 
      { locale: options?.locale }
    );

    const onHoldFormatted = formatBalanceSafely(
      hasOnHold ? balance.onHold : 0, 
      hasScale ? balance.scale : 100, 
      { locale: options?.locale }
    );

    // Extract asset code from accountId if not present
    let assetCode = balance.assetCode;
    if (!assetCode && balance.accountId && balance.accountId.includes && balance.accountId.includes('/')) {
      const parts = balance.accountId.split('/');
      if (parts.length > 1) {
        assetCode = parts[1];
      }
    }

    const result = {
      assetCode: assetCode || 'Unknown',
      accountId: balance.accountId || 'Unknown',
      accountType,
      available: availableFormatted,
      onHold: onHoldFormatted,
      displayString: `${assetCode || 'Unknown'} (${accountType} ${
        balance.accountId || 'Unknown'
      }): Available ${availableFormatted}, On Hold ${onHoldFormatted}`,
    };

    return result;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // Return a fallback format if something goes wrong
    let accountId = 'Unknown';
    let assetCodeFromId = 'Unknown';
    
    try {
      accountId = balance.accountId || 'Unknown';
      if (accountId && accountId.includes && accountId.includes('/')) {
        const parts = accountId.split('/');
        if (parts.length > 1) {
          assetCodeFromId = parts[1];
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ignore errors in error handler
    }
    
    return {
      assetCode: assetCodeFromId,
      accountId: accountId,
      accountType,
      available: '0.00',
      onHold: '0.00',
      displayString: `${assetCodeFromId} (${accountType} ${accountId}): Unable to display balance`,
    };
  }
}
