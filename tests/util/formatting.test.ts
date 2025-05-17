/**
 * @file Tests for formatting utilities
 */
import {
  formatAmountWithAsset,
  formatBalance,
  getDecimalPlacesFromScale,
} from '../../src/util/data/formatting';

describe('Formatting Utilities', () => {
  let locale: string;

  beforeEach(() => {
    locale = 'en-US';
  });

  // Test 1: formatBalance function
  describe('formatBalance', () => {
    it('should format balance with 2 decimal places', () => {
      const result = formatBalance(1050, 100, { locale });
      expect(result).toBe('10.50');
    });

    it('should format balance with 8 decimal places', () => {
      const result = formatBalance(123456789, 100000000, { locale });
      expect(result).toBe('1.23456789');
    });

    it('should format balance with currency symbol', () => {
      // Note: This test is locale-dependent, so we'll check for expected patterns
      const result = formatBalance(2050, 100, { currency: 'USD', locale });
      expect(result).toContain('20.50');
      expect(result).toContain('$');
    });

    it('should respect minimum fraction digits', () => {
      const result = formatBalance(10, 100, { minimumFractionDigits: 2, locale });
      expect(result).toBe('0.10');
    });

    it('should respect maximum fraction digits', () => {
      const result = formatBalance(12345, 10000, { maximumFractionDigits: 2, locale });
      expect(result).toBe('1.23');
    });

    it('should handle zero amounts', () => {
      const result = formatBalance(0, 100, { locale });
      expect(result).toBe('0.00');
    });

    it('should handle negative amounts', () => {
      const result = formatBalance(-1050, 100, { locale });
      expect(result).toBe('-10.50');
    });
  });

  // Test 2: getDecimalPlacesFromScale function
  describe('getDecimalPlacesFromScale', () => {
    it('should calculate decimal places for scale 1', () => {
      const result = getDecimalPlacesFromScale(1);
      expect(result).toBe(0);
    });

    it('should calculate decimal places for scale 10', () => {
      const result = getDecimalPlacesFromScale(10);
      expect(result).toBe(1);
    });

    it('should calculate decimal places for scale 100', () => {
      const result = getDecimalPlacesFromScale(100);
      expect(result).toBe(2);
    });

    it('should calculate decimal places for scale 1000', () => {
      const result = getDecimalPlacesFromScale(1000);
      expect(result).toBe(3);
    });

    it('should calculate decimal places for scale 100000000', () => {
      const result = getDecimalPlacesFromScale(100000000);
      expect(result).toBe(8);
    });

    it('should handle non-power-of-10 scales', () => {
      const result = getDecimalPlacesFromScale(250);
      expect(result).toBeCloseTo(2.398, 3);
    });
  });

  // Test 3: formatAmountWithAsset function
  describe('formatAmountWithAsset', () => {
    it('should format amount with asset code after by default', () => {
      const result = formatAmountWithAsset(1050, 100, 'USD', { locale });
      expect(result).toBe('10.50 USD');
    });

    it('should format amount with asset code before when specified', () => {
      const result = formatAmountWithAsset(1050, 100, 'USD', { locale, symbolPosition: 'before' });
      expect(result).toBe('USD 10.50');
    });

    it('should respect minimum fraction digits', () => {
      const result = formatAmountWithAsset(10, 100, 'BTC', { locale, minimumFractionDigits: 2 });
      expect(result).toBe('0.10 BTC');
    });

    it('should respect maximum fraction digits', () => {
      const result = formatAmountWithAsset(12345, 10000, 'ETH', {
        locale,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('1.23 ETH');
    });

    it('should handle zero amounts', () => {
      const result = formatAmountWithAsset(0, 100, 'USD', { locale });
      expect(result).toBe('0.00 USD');
    });

    it('should handle negative amounts', () => {
      const result = formatAmountWithAsset(-1050, 100, 'EUR', { locale });
      expect(result).toBe('-10.50 EUR');
    });
  });
});
