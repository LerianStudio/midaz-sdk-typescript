/**
 * @file What `formatAccountBalance` shows for a balance the ledger actually sent
 *
 * The ledger serialises `available` and `onHold` as already-scaled decimal strings
 * and sends no `scale`. A formatter that defaults the missing scale to 100 divides
 * a value that was never in cents, so R$110.50 reaches the customer as R$1.11.
 */
import { formatAccountBalance } from '../../src/util/data/formatting';

const LEDGER_BALANCE = {
  accountId: 'acc_1',
  available: '110.5',
  onHold: '0',
  assetCode: 'BRL',
};

describe('formatAccountBalance without a scale', () => {
  it('shows the amount the ledger sent, undivided', () => {
    const formatted = formatAccountBalance(LEDGER_BALANCE, { locale: 'en-US' });

    expect(formatted.available).toBe('110.5');
    expect(formatted.onHold).toBe('0');
    expect(formatted.displayString).toBe('BRL (Account acc_1): Available 110.5, On Hold 0');
  });

  it('keeps the trailing zeros the ledger wrote', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: '110.50', onHold: '0.00' },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('110.50');
    expect(formatted.onHold).toBe('0.00');
  });

  it('groups thousands in the caller locale', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: '1234567.89' },
      { locale: 'de-DE' }
    );

    expect(formatted.available).toBe('1.234.567,89');
  });

  it('keeps every digit of a value a double cannot hold', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: '9007199254740993' },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('9007199254740993');
  });

  it('reads a negative amount as written', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: '-50.00' },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('-50.00');
  });

  it('accepts an amount already given as a number', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: 110.5, onHold: 0 },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('110.5');
    expect(formatted.onHold).toBe('0');
  });

  it('treats an absent amount as zero', () => {
    const formatted = formatAccountBalance(
      { accountId: 'acc_1', assetCode: 'BRL' },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('0');
    expect(formatted.onHold).toBe('0');
  });
});

describe('formatAccountBalance with a scale', () => {
  it('still divides the scaled integer the caller supplied', () => {
    const formatted = formatAccountBalance(
      { accountId: 'acc_1', available: 11050, onHold: 500, assetCode: 'BRL', scale: 100 },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('110.50');
    expect(formatted.onHold).toBe('5.00');
    expect(formatted.displayString).toBe('BRL (Account acc_1): Available 110.50, On Hold 5.00');
  });

  it('honours a scale that is not a hundred', () => {
    const formatted = formatAccountBalance(
      { accountId: 'acc_1', available: 123456789, assetCode: 'BTC', scale: 100000000 },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('1.23456789');
  });
});

describe('formatAccountBalance given an amount it cannot read', () => {
  it('says so rather than inventing a number', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: 'abc' },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('Unknown');
    expect(formatted.displayString).toBe('BRL (Account acc_1): Available Unknown, On Hold 0');
  });

  it('does not let one unreadable amount hide the other', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, onHold: 'not a number' },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('110.5');
    expect(formatted.onHold).toBe('Unknown');
  });

  it('refuses NaN supplied as a number', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: Number.NaN },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('Unknown');
  });

  it('refuses an unreadable amount even when a scale is supplied', () => {
    const formatted = formatAccountBalance(
      { ...LEDGER_BALANCE, available: 'abc', scale: 100 },
      { locale: 'en-US' }
    );

    expect(formatted.available).toBe('Unknown');
  });
});
