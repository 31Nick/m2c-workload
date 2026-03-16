import { LRUCache } from 'lru-cache';

interface CachedMetricsResult {
  data: { timestamp: string; value: number; min: number; max: number; count: number }[];
  metric_name: string;
  granularity: string;
  start: string;
  end: string;
}

const cache = new LRUCache<string, CachedMetricsResult>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
});

export function buildCacheKey(
  granularity: string,
  metricName: string,
  start: string,
  end: string
): string {
  return `${granularity}:${metricName}:${start}:${end}`;
}

export function getCache(key: string): CachedMetricsResult | undefined {
  return cache.get(key);
}

export function setCache(key: string, value: CachedMetricsResult): void {
  cache.set(key, value);
}

export function clearCache(): void {
  cache.clear();
}

export function clearCacheByMetric(metricName: string): void {
  for (const key of cache.keys()) {
    if (key.includes(`:${metricName}:`)) {
      cache.delete(key);
    }
  }
}
