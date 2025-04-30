/**
 */

/**
 * Balance represents an account balance in the Midaz system.
 *
 * A balance tracks the available and on-hold amounts for a specific account and asset.
 * Balances are used to determine the current state of funds in an account and
 * to enforce constraints on transactions.
 *
 * Balance Components:
 *   - Available: The amount that can be freely used in transactions
 *   - OnHold: The amount that is reserved but not yet settled (e.g., pending transactions)
 *   - Total: The sum of Available and OnHold amounts
 *
 * Balance Permissions:
 *   - AllowSending: Controls whether funds can be sent from the account
 *   - AllowReceiving: Controls whether funds can be received into the account
 *
 * @example
 * ```typescript
 * // Example of a complete Balance object
 * const accountBalance: Balance = {
 *   id: "bal_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   organizationId: "org_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   ledgerId: "ldg_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   accountId: "acc_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   alias: "operating-cash",
 *   assetCode: "USD",
 *   available: 10000,
 *   onHold: 500,
 *   scale: 100,
 *   version: 42,
 *   accountType: "ASSET",
 *   allowSending: true,
 *   allowReceiving: true,
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-16T09:45:00Z",
 *   metadata: {
 *     lastReconciled: "2023-09-16T09:00:00Z"
 *   }
 * };
 *
 * // The actual monetary value is calculated by dividing by the scale
 * const availableAmount = accountBalance.available / accountBalance.scale; // 100.00
 * const onHoldAmount = accountBalance.onHold / accountBalance.scale;       // 5.00
 * const totalAmount = (accountBalance.available + accountBalance.onHold) / accountBalance.scale; // 105.00
 * ```
 */
export interface Balance {
  /**
   * ID is the unique identifier for the balance
   * This is a system-generated UUID that uniquely identifies the balance
   * across the entire Midaz platform.
   */
  id: string;

  /**
   * OrganizationID is the ID of the organization that owns this balance
   * All balances must belong to an organization, which provides the
   * top-level ownership and access control.
   */
  organizationId: string;

  /**
   * LedgerID is the ID of the ledger that contains this balance
   * Balances are always associated with a specific ledger, which defines
   * the accounting boundaries and rules.
   */
  ledgerId: string;

  /**
   * AccountID is the ID of the account this balance belongs to
   * Each balance is associated with a specific account within the ledger.
   */
  accountId: string;

  /**
   * Alias is a human-friendly identifier for the account
   * This provides a more readable reference to the account than the ID.
   */
  alias: string;

  /**
   * AssetCode identifies the type of asset for this balance
   * Examples include currency codes like "USD", "EUR", or custom asset
   * codes for other types of assets.
   */
  assetCode: string;

  /**
   * Available is the amount available for use in the account
   * This represents funds that can be freely used in transactions.
   * The actual value is Available/Scale (e.g., 1000/100 = 10.00)
   */
  available: number;

  /**
   * OnHold is the amount that is reserved but not yet settled
   * This represents funds that are temporarily reserved for pending operations.
   * The actual value is OnHold/Scale (e.g., 500/100 = 5.00)
   */
  onHold: number;

  /**
   * Scale is the divisor to convert the integer amounts to decimal values
   * For example, a scale of 100 means the values are stored as cents,
   * and a scale of 1000 means the values are stored with three decimal places.
   */
  scale: number;

  /**
   * Version is the optimistic concurrency control version number
   * This is used to prevent conflicts when multiple processes attempt
   * to update the same balance simultaneously.
   */
  version: number;

  /**
   * AccountType defines the type of the account (e.g., "ASSET", "LIABILITY")
   * This indicates the accounting classification of the account.
   */
  accountType: string;

  /**
   * AllowSending indicates whether the account can send funds
   * If false, the account cannot be used as a source in transactions.
   */
  allowSending: boolean;

  /**
   * AllowReceiving indicates whether the account can receive funds
   * If false, the account cannot be used as a destination in transactions.
   */
  allowReceiving: boolean;

  /**
   * CreatedAt is the timestamp when the balance was created
   * This is automatically set by the system and cannot be modified.
   */
  createdAt: string;

  /**
   * UpdatedAt is the timestamp when the balance was last updated
   * This is automatically updated by the system whenever the balance changes.
   */
  updatedAt: string;

  /**
   * DeletedAt is the timestamp when the balance was deleted, if applicable
   * This is set when a balance is soft-deleted, allowing for potential recovery.
   */
  deletedAt?: string;

  /**
   * Metadata contains additional custom data associated with the balance
   * This can include any arbitrary key-value pairs for application-specific
   * data that doesn't fit into the standard balance fields.
   */
  metadata?: Record<string, any>;
}

/**
 * UpdateBalanceInput represents input for updating a balance.
 *
 * This structure contains the fields that can be modified when updating an existing balance.
 * Only fields that are set will be updated; omitted fields will remain unchanged.
 *
 * @example
 * ```typescript
 * // Disable sending from an account
 * const updateInput: UpdateBalanceInput = {
 *   allowSending: false
 * };
 *
 * // Update both sending and receiving permissions
 * const fullUpdateInput: UpdateBalanceInput = {
 *   allowSending: true,
 *   allowReceiving: true
 * };
 * ```
 */
export interface UpdateBalanceInput {
  /**
   * AllowSending indicates whether to allow sending funds from the account
   * If not provided, the current value is preserved
   * Setting this to false will prevent the account from being used as a source in transactions
   */
  allowSending?: boolean;

  /**
   * AllowReceiving indicates whether to allow receiving funds to the account
   * If not provided, the current value is preserved
   * Setting this to false will prevent the account from being used as a destination in transactions
   */
  allowReceiving?: boolean;
}

/**
 * NewUpdateBalanceInput creates a new empty UpdateBalanceInput.
 *
 * This constructor initializes an empty update input that can be customized
 * using the With* methods. It's useful as a starting point for building
 * an update request.
 *
 * @returns A new UpdateBalanceInput object
 *
 * @example
 * ```typescript
 * // Create and customize a balance update
 * const updateInput = newUpdateBalanceInput();
 * const customizedUpdate = withAllowSending(
 *   withAllowReceiving(updateInput, true),
 *   false
 * );
 *
 * // The above creates an update that enables receiving but disables sending
 * ```
 */
export function newUpdateBalanceInput(): UpdateBalanceInput {
  return {};
}

/**
 * WithAllowSending sets whether sending is allowed.
 *
 * This controls whether funds can be sent from the account.
 * When set to false, the account cannot be used as a source in transactions.
 *
 * @returns The modified UpdateBalanceInput for chaining
 *
 * @example
 * ```typescript
 * // Disable sending from an account
 * const updateInput = newUpdateBalanceInput();
 * const sendingDisabled = withAllowSending(updateInput, false);
 *
 * // This can be used to temporarily freeze outgoing transactions
 * // while still allowing incoming transactions
 * ```
 */
export function withAllowSending(input: UpdateBalanceInput, allowed: boolean): UpdateBalanceInput {
  input.allowSending = allowed;
  return input;
}

/**
 * WithAllowReceiving sets whether receiving is allowed.
 *
 * This controls whether funds can be received into the account.
 * When set to false, the account cannot be used as a destination in transactions.
 *
 * @returns The modified UpdateBalanceInput for chaining
 *
 * @example
 * ```typescript
 * // Disable receiving to an account
 * const updateInput = newUpdateBalanceInput();
 * const receivingDisabled = withAllowReceiving(updateInput, false);
 *
 * // This can be used to temporarily prevent deposits
 * // while still allowing withdrawals
 * ```
 */
export function withAllowReceiving(
  input: UpdateBalanceInput,
  allowed: boolean
): UpdateBalanceInput {
  input.allowReceiving = allowed;
  return input;
}
