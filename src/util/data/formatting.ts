/**
 */

/**
 * Formats a balance amount with proper decimal places based on the asset's scale
 *
 * Converts an integer amount and scale to a properly formatted decimal string.
 * For example, an amount of 1000 with a scale of 100 would be formatted as "10.00".
 *
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
  } catch (_) {
    // Fallback in case of any errors
    return options?.currency ? `0.00 ${options.currency}` : '0.00';
  }
}

/** Matches a plain decimal amount, with an optional sign and no exponent */
const DECIMAL_AMOUNT = /^[+-]?\d+(?:\.\d+)?$/;

/** Stands in for an amount that could not be read as a number */
const UNREADABLE_AMOUNT = 'Unknown';

/**
 * The balance shape {@link formatAccountBalance} reads.
 *
 * The ledger sends `available` and `onHold` as already-scaled decimal strings and sends
 * no `scale`, so a balance read from the API carries no `scale` at all. Callers holding a
 * scaled-integer shape instead — an operation amount, for example — supply `scale` and the
 * amounts are divided by it.
 */
export interface FormattableAccountBalance {
  /** Identifier of the account, optionally as `<id>/<assetCode>` */
  accountId?: string;

  /** Asset code of the balance; derived from `accountId` when absent */
  assetCode?: string;

  /** Amount free to use, decimal unless `scale` is supplied */
  available?: string | number;

  /** Amount reserved but unsettled, decimal unless `scale` is supplied */
  onHold?: string | number;

  /** Divisor that turns the amounts into decimals; absent for a ledger balance */
  scale?: string | number;
}

/**
 * Renders a decimal amount without ever changing its value
 *
 * @returns The amount grouped for the locale, or unchanged when a double cannot hold it
 */
function formatDecimalAmount(amount: string, locale?: string): string {
  if (!DECIMAL_AMOUNT.test(amount)) {
    return Number(amount).toLocaleString(locale);
  }

  const point = amount.indexOf('.');
  const fractionDigits = point === -1 ? 0 : amount.length - point - 1;

  if (fractionDigits > 20) {
    return amount;
  }

  const asNumber = Number(amount);
  const significant = (value: string): string =>
    value
      .replace('.', '')
      .replace(/^[+-]/, '')
      .replace(/^0+(?=\d)/, '');

  if (significant(asNumber.toFixed(fractionDigits)) !== significant(amount)) {
    return amount;
  }

  return asNumber.toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Formats one monetary field of a balance
 *
 * @returns The formatted amount, or `Unknown` when the input is not a number
 */
function formatAccountAmount(
  amount: string | number | undefined,
  scale: string | number | undefined,
  locale?: string
): string {
  const scaled = scale !== undefined && scale !== null;

  if (amount === undefined || amount === null) {
    return scaled ? formatBalanceSafely(0, scale, { locale }) : '0';
  }

  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      return UNREADABLE_AMOUNT;
    }

    return scaled
      ? formatBalanceSafely(amount, scale, { locale })
      : formatDecimalAmount(String(amount), locale);
  }

  const trimmed = amount.trim().replace(/^\+/, '');

  if (!DECIMAL_AMOUNT.test(trimmed)) {
    return UNREADABLE_AMOUNT;
  }

  return scaled
    ? formatBalanceSafely(trimmed, scale, { locale })
    : formatDecimalAmount(trimmed, locale);
}

/**
 * Formats an account balance for display with asset code, available and on-hold amounts
 *
 * A balance read from the ledger carries no `scale`, and its amounts are already decimal;
 * they are shown as sent. Supplying `scale` switches to the scaled-integer reading and the
 * amounts are divided by it. An amount that is not a number is reported as `Unknown` rather
 * than rendered as some other number.
 *
 * @returns Formatted balance object with display properties
 *
 * @example
 * ```typescript
 * // A balance as the ledger sends it: decimal amounts, no scale
 * const fromLedger = formatAccountBalance(
 *   {
 *     accountId: "019fda19-97cd-7b29-b90a-c962df8bbdc7",
 *     available: "110.50",
 *     onHold: "0.00",
 *     assetCode: "BRL"
 *   },
 *   { accountType: "Savings" }
 * );
 * console.log(fromLedger.displayString);
 * // "BRL (Savings 019fda19-97cd-7b29-b90a-c962df8bbdc7): Available 110.50, On Hold 0.00"
 *
 * // A scaled-integer shape, which is divided by the scale it carries
 * const scaled = formatAccountBalance(
 *   { accountId: "acc_123", available: 10050, onHold: 500, assetCode: "USD", scale: 100 },
 *   { accountType: "Savings" }
 * );
 * console.log(scaled.displayString);
 * // "USD (Savings acc_123): Available 100.50, On Hold 5.00"
 * ```
 */
export function formatAccountBalance(
  balance: FormattableAccountBalance | null | undefined,
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

    const scale = hasScale ? balance.scale : undefined;

    const availableFormatted = formatAccountAmount(
      hasAvailable ? balance.available : undefined,
      scale,
      options?.locale
    );

    const onHoldFormatted = formatAccountAmount(
      hasOnHold ? balance.onHold : undefined,
      scale,
      options?.locale
    );

    // Extract asset code from accountId if not present
    let assetCode = balance.assetCode;
    if (
      !assetCode &&
      balance.accountId &&
      balance.accountId.includes &&
      balance.accountId.includes('/')
    ) {
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
