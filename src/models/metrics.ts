/**
 * Metrics model and related types
 *
 * Provides aggregated counts of different resource types within the system
 * for reporting system usage and statistics.
 */

/**
 * Metrics count represents the count metrics for various entities in the Midaz system
 */
export interface MetricsCount {
  /** Total number of organizations in the system */
  organizationsCount: number;

  /** Total number of ledgers in the system */
  ledgersCount: number;

  /** Total number of assets in the system */
  assetsCount: number;

  /** Total number of segments in the system */
  segmentsCount: number;

  /** Total number of portfolios in the system */
  portfoliosCount: number;

  /** Total number of accounts in the system */
  accountsCount: number;

  /** Total number of transactions in the system */
  transactionsCount: number;

  /** Total number of operations in the system */
  operationsCount: number;
}

/**
 * Extended metrics with additional system information
 */
export interface SystemMetrics extends MetricsCount {
  /** Total number of account types in the system */
  accountTypesCount?: number;

  /** Total number of operation routes in the system */
  operationRoutesCount?: number;

  /** Total number of transaction routes in the system */
  transactionRoutesCount?: number;

  /** Total number of queues in the system */
  queuesCount?: number;

  /** Average processing time for transactions (in milliseconds) */
  averageTransactionProcessingTime?: number;

  /** Peak transactions per second */
  peakTransactionsPerSecond?: number;

  /** Current system load percentage */
  systemLoadPercentage?: number;
}

/**
 * Metrics aggregation by time period
 */
export interface TimeBasedMetrics {
  /** Metrics for the current day */
  daily?: MetricsCount;

  /** Metrics for the current week */
  weekly?: MetricsCount;

  /** Metrics for the current month */
  monthly?: MetricsCount;

  /** Metrics for the current year */
  yearly?: MetricsCount;
}

/**
 * Organization-specific metrics
 */
export interface OrganizationMetrics extends MetricsCount {
  /** Organization ID these metrics belong to */
  organizationId: string;

  /** Organization name */
  organizationName?: string;

  /** Metrics broken down by time periods */
  timeBased?: TimeBasedMetrics;
}

/**
 * Ledger-specific metrics
 */
export interface LedgerMetrics {
  /** Ledger ID these metrics belong to */
  ledgerId: string;

  /** Ledger name */
  ledgerName?: string;

  /** Number of accounts in this ledger */
  accountsCount: number;

  /** Number of transactions in this ledger */
  transactionsCount: number;

  /** Number of operations in this ledger */
  operationsCount: number;

  /** Total value of transactions in this ledger */
  totalTransactionValue?: number;

  /** Currency for the total transaction value */
  currency?: string;
}

/**
 * Performance metrics for system monitoring
 */
export interface PerformanceMetrics {
  /** Average response time for API calls (in milliseconds) */
  averageResponseTime: number;

  /** Number of API calls per second */
  requestsPerSecond: number;

  /** Error rate percentage */
  errorRate: number;

  /** System uptime percentage */
  uptime: number;

  /** Memory usage percentage */
  memoryUsage: number;

  /** CPU usage percentage */
  cpuUsage: number;
}

/**
 * Comprehensive system dashboard metrics
 */
export interface DashboardMetrics {
  /** Overall system metrics */
  system: SystemMetrics;

  /** Performance metrics */
  performance: PerformanceMetrics;

  /** Metrics by organization */
  organizations: OrganizationMetrics[];

  /** Top performing ledgers */
  topLedgers: LedgerMetrics[];

  /** Timestamp when metrics were collected */
  collectedAt: string;
}

/**
 * Utility class for metrics operations
 */
export class MetricsUtils {
  /**
   * Check if all count values in MetricsCount are zero
   */
  static isEmpty(metrics: MetricsCount): boolean {
    return (
      metrics.organizationsCount === 0 &&
      metrics.ledgersCount === 0 &&
      metrics.assetsCount === 0 &&
      metrics.segmentsCount === 0 &&
      metrics.portfoliosCount === 0 &&
      metrics.accountsCount === 0 &&
      metrics.transactionsCount === 0 &&
      metrics.operationsCount === 0
    );
  }

  /**
   * Calculate total entities count
   */
  static getTotalEntitiesCount(metrics: MetricsCount): number {
    return (
      metrics.organizationsCount +
      metrics.ledgersCount +
      metrics.assetsCount +
      metrics.segmentsCount +
      metrics.portfoliosCount +
      metrics.accountsCount +
      metrics.transactionsCount +
      metrics.operationsCount
    );
  }

  /**
   * Compare two MetricsCount objects and return the difference
   */
  static calculateDifference(current: MetricsCount, previous: MetricsCount): MetricsCount {
    return {
      organizationsCount: current.organizationsCount - previous.organizationsCount,
      ledgersCount: current.ledgersCount - previous.ledgersCount,
      assetsCount: current.assetsCount - previous.assetsCount,
      segmentsCount: current.segmentsCount - previous.segmentsCount,
      portfoliosCount: current.portfoliosCount - previous.portfoliosCount,
      accountsCount: current.accountsCount - previous.accountsCount,
      transactionsCount: current.transactionsCount - previous.transactionsCount,
      operationsCount: current.operationsCount - previous.operationsCount,
    };
  }

  /**
   * Calculate growth rate between two metrics
   */
  static calculateGrowthRate(
    current: MetricsCount,
    previous: MetricsCount
  ): Partial<Record<keyof MetricsCount, number>> {
    const growthRate: Partial<Record<keyof MetricsCount, number>> = {};

    (Object.keys(current) as Array<keyof MetricsCount>).forEach((key) => {
      const currentValue = current[key];
      const previousValue = previous[key];

      if (previousValue > 0) {
        growthRate[key] = ((currentValue - previousValue) / previousValue) * 100;
      } else if (currentValue > 0) {
        growthRate[key] = 100; // 100% growth from 0
      } else {
        growthRate[key] = 0;
      }
    });

    return growthRate;
  }

  /**
   * Get the most active entity type based on counts
   */
  static getMostActiveEntityType(metrics: MetricsCount): keyof MetricsCount | null {
    let maxCount = 0;
    let maxType: keyof MetricsCount | null = null;

    (Object.entries(metrics) as Array<[keyof MetricsCount, number]>).forEach(([key, value]) => {
      if (value > maxCount) {
        maxCount = value;
        maxType = key;
      }
    });

    return maxType;
  }
}
