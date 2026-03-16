import { LRUCache } from 'lru-cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
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

export function getCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCache<T>(key: string, value: T): void {
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
