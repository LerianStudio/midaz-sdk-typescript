/**
 * Metrics Model Tests
 */

import {
  MetricsCount,
  SystemMetrics,
  TimeBasedMetrics,
  OrganizationMetrics,
  LedgerMetrics,
  PerformanceMetrics,
  DashboardMetrics,
  MetricsUtils,
} from '../../src/models/metrics';

describe('Metrics Models', () => {
  describe('MetricsCount', () => {
    it('should define basic metrics count', () => {
      const metrics: MetricsCount = {
        organizationsCount: 5,
        ledgersCount: 15,
        assetsCount: 25,
        segmentsCount: 8,
        portfoliosCount: 12,
        accountsCount: 150,
        transactionsCount: 1200,
        operationsCount: 2400,
      };

      expect(metrics.organizationsCount).toBe(5);
      expect(metrics.transactionsCount).toBe(1200);
      expect(metrics.operationsCount).toBe(2400);
    });
  });

  describe('SystemMetrics', () => {
    it('should extend MetricsCount with additional fields', () => {
      const systemMetrics: SystemMetrics = {
        organizationsCount: 10,
        ledgersCount: 20,
        assetsCount: 30,
        segmentsCount: 15,
        portfoliosCount: 25,
        accountsCount: 200,
        transactionsCount: 1500,
        operationsCount: 3000,
        accountTypesCount: 8,
        operationRoutesCount: 12,
        transactionRoutesCount: 6,
        queuesCount: 4,
        averageTransactionProcessingTime: 150.5,
        peakTransactionsPerSecond: 50,
        systemLoadPercentage: 75.2,
      };

      expect(systemMetrics.accountTypesCount).toBe(8);
      expect(systemMetrics.operationRoutesCount).toBe(12);
      expect(systemMetrics.averageTransactionProcessingTime).toBe(150.5);
      expect(systemMetrics.systemLoadPercentage).toBe(75.2);
    });
  });

  describe('OrganizationMetrics', () => {
    it('should define organization-specific metrics', () => {
      const timeBased: TimeBasedMetrics = {
        daily: {
          organizationsCount: 0,
          ledgersCount: 1,
          assetsCount: 2,
          segmentsCount: 1,
          portfoliosCount: 3,
          accountsCount: 15,
          transactionsCount: 45,
          operationsCount: 90,
        },
        weekly: {
          organizationsCount: 0,
          ledgersCount: 2,
          assetsCount: 5,
          segmentsCount: 2,
          portfoliosCount: 8,
          accountsCount: 50,
          transactionsCount: 200,
          operationsCount: 400,
        },
      };

      const orgMetrics: OrganizationMetrics = {
        organizationId: 'org_123',
        organizationName: 'Test Organization',
        organizationsCount: 1,
        ledgersCount: 5,
        assetsCount: 10,
        segmentsCount: 3,
        portfoliosCount: 12,
        accountsCount: 100,
        transactionsCount: 500,
        operationsCount: 1000,
        timeBased,
      };

      expect(orgMetrics.organizationId).toBe('org_123');
      expect(orgMetrics.organizationName).toBe('Test Organization');
      expect(orgMetrics.timeBased?.daily?.transactionsCount).toBe(45);
      expect(orgMetrics.timeBased?.weekly?.transactionsCount).toBe(200);
    });
  });

  describe('LedgerMetrics', () => {
    it('should define ledger-specific metrics', () => {
      const ledgerMetrics: LedgerMetrics = {
        ledgerId: 'ledger_456',
        ledgerName: 'Main Ledger',
        accountsCount: 75,
        transactionsCount: 300,
        operationsCount: 600,
        totalTransactionValue: 1500000.50,
        currency: 'USD',
      };

      expect(ledgerMetrics.ledgerId).toBe('ledger_456');
      expect(ledgerMetrics.ledgerName).toBe('Main Ledger');
      expect(ledgerMetrics.totalTransactionValue).toBe(1500000.50);
      expect(ledgerMetrics.currency).toBe('USD');
    });
  });

  describe('PerformanceMetrics', () => {
    it('should define performance metrics', () => {
      const performance: PerformanceMetrics = {
        averageResponseTime: 25.5,
        requestsPerSecond: 100.2,
        errorRate: 0.5,
        uptime: 99.9,
        memoryUsage: 65.5,
        cpuUsage: 45.2,
      };

      expect(performance.averageResponseTime).toBe(25.5);
      expect(performance.requestsPerSecond).toBe(100.2);
      expect(performance.errorRate).toBe(0.5);
      expect(performance.uptime).toBe(99.9);
    });
  });

  describe('DashboardMetrics', () => {
    it('should define comprehensive dashboard metrics', () => {
      const system: SystemMetrics = {
        organizationsCount: 10,
        ledgersCount: 25,
        assetsCount: 50,
        segmentsCount: 15,
        portfoliosCount: 30,
        accountsCount: 500,
        transactionsCount: 2000,
        operationsCount: 4000,
        accountTypesCount: 12,
      };

      const performance: PerformanceMetrics = {
        averageResponseTime: 30.0,
        requestsPerSecond: 150.0,
        errorRate: 0.2,
        uptime: 99.95,
        memoryUsage: 70.0,
        cpuUsage: 40.0,
      };

      const dashboard: DashboardMetrics = {
        system,
        performance,
        organizations: [],
        topLedgers: [],
        collectedAt: '2023-12-01T12:00:00Z',
      };

      expect(dashboard.system.organizationsCount).toBe(10);
      expect(dashboard.performance.uptime).toBe(99.95);
      expect(dashboard.collectedAt).toBe('2023-12-01T12:00:00Z');
    });
  });

  describe('MetricsUtils', () => {
    const emptyMetrics: MetricsCount = {
      organizationsCount: 0,
      ledgersCount: 0,
      assetsCount: 0,
      segmentsCount: 0,
      portfoliosCount: 0,
      accountsCount: 0,
      transactionsCount: 0,
      operationsCount: 0,
    };

    const sampleMetrics: MetricsCount = {
      organizationsCount: 5,
      ledgersCount: 10,
      assetsCount: 15,
      segmentsCount: 8,
      portfoliosCount: 12,
      accountsCount: 100,
      transactionsCount: 500,
      operationsCount: 1000,
    };

    describe('isEmpty', () => {
      it('should return true for empty metrics', () => {
        expect(MetricsUtils.isEmpty(emptyMetrics)).toBe(true);
      });

      it('should return false for non-empty metrics', () => {
        expect(MetricsUtils.isEmpty(sampleMetrics)).toBe(false);
      });

      it('should return false if only one field is non-zero', () => {
        const metrics = { ...emptyMetrics, transactionsCount: 1 };
        expect(MetricsUtils.isEmpty(metrics)).toBe(false);
      });
    });

    describe('getTotalEntitiesCount', () => {
      it('should return 0 for empty metrics', () => {
        expect(MetricsUtils.getTotalEntitiesCount(emptyMetrics)).toBe(0);
      });

      it('should calculate total count correctly', () => {
        const expected = 5 + 10 + 15 + 8 + 12 + 100 + 500 + 1000;
        expect(MetricsUtils.getTotalEntitiesCount(sampleMetrics)).toBe(expected);
      });
    });

    describe('calculateDifference', () => {
      it('should calculate positive difference', () => {
        const current: MetricsCount = {
          organizationsCount: 10,
          ledgersCount: 20,
          assetsCount: 30,
          segmentsCount: 15,
          portfoliosCount: 25,
          accountsCount: 200,
          transactionsCount: 1000,
          operationsCount: 2000,
        };

        const previous = sampleMetrics;
        const difference = MetricsUtils.calculateDifference(current, previous);

        expect(difference.organizationsCount).toBe(5); // 10 - 5
        expect(difference.transactionsCount).toBe(500); // 1000 - 500
        expect(difference.operationsCount).toBe(1000); // 2000 - 1000
      });

      it('should calculate negative difference', () => {
        const current = sampleMetrics;
        const previous: MetricsCount = {
          organizationsCount: 10,
          ledgersCount: 15,
          assetsCount: 20,
          segmentsCount: 10,
          portfoliosCount: 15,
          accountsCount: 150,
          transactionsCount: 800,
          operationsCount: 1500,
        };

        const difference = MetricsUtils.calculateDifference(current, previous);

        expect(difference.organizationsCount).toBe(-5); // 5 - 10
        expect(difference.transactionsCount).toBe(-300); // 500 - 800
        expect(difference.operationsCount).toBe(-500); // 1000 - 1500
      });
    });

    describe('calculateGrowthRate', () => {
      it('should calculate growth rate correctly', () => {
        const current: MetricsCount = {
          organizationsCount: 10,
          ledgersCount: 15,
          assetsCount: 20,
          segmentsCount: 12,
          portfoliosCount: 18,
          accountsCount: 200,
          transactionsCount: 1000,
          operationsCount: 2000,
        };

        const previous = sampleMetrics;
        const growthRate = MetricsUtils.calculateGrowthRate(current, previous);

        expect(growthRate.organizationsCount).toBe(100); // (10-5)/5 * 100 = 100%
        expect(growthRate.transactionsCount).toBe(100); // (1000-500)/500 * 100 = 100%
        expect(growthRate.operationsCount).toBe(100); // (2000-1000)/1000 * 100 = 100%
      });

      it('should handle zero previous values', () => {
        const current = sampleMetrics;
        const previous = emptyMetrics;
        const growthRate = MetricsUtils.calculateGrowthRate(current, previous);

        expect(growthRate.organizationsCount).toBe(100);
        expect(growthRate.transactionsCount).toBe(100);
        expect(growthRate.operationsCount).toBe(100);
      });

      it('should handle zero current and previous values', () => {
        const growthRate = MetricsUtils.calculateGrowthRate(emptyMetrics, emptyMetrics);

        expect(growthRate.organizationsCount).toBe(0);
        expect(growthRate.transactionsCount).toBe(0);
        expect(growthRate.operationsCount).toBe(0);
      });
    });

    describe('getMostActiveEntityType', () => {
      it('should return the entity type with highest count', () => {
        const mostActive = MetricsUtils.getMostActiveEntityType(sampleMetrics);
        expect(mostActive).toBe('operationsCount');
      });

      it('should return null for empty metrics', () => {
        const mostActive = MetricsUtils.getMostActiveEntityType(emptyMetrics);
        expect(mostActive).toBeNull();
      });

      it('should return first entity type in case of tie', () => {
        const tiedMetrics: MetricsCount = {
          organizationsCount: 100,
          ledgersCount: 100,
          assetsCount: 50,
          segmentsCount: 50,
          portfoliosCount: 25,
          accountsCount: 25,
          transactionsCount: 10,
          operationsCount: 10,
        };

        const mostActive = MetricsUtils.getMostActiveEntityType(tiedMetrics);
        expect(mostActive).toBe('organizationsCount');
      });
    });
  });
});