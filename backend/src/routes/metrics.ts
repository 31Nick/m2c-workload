import { Router, Request, Response } from 'express';
import { db } from '../db';
import { buildCacheKey, getCache, setCache, clearCacheByMetric } from '../cache';

const router = Router();

type Granularity = '5min' | 'hourly' | 'daily' | 'monthly' | 'yearly';

interface MetricRow {
  timestamp: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count: number;
}

interface RawRow {
  timestamp: string;
  value: number;
}

const tableMap: Record<Granularity, string> = {
  '5min': 'metrics_raw',
  hourly: 'metrics_hourly',
  daily: 'metrics_daily',
  monthly: 'metrics_monthly',
  yearly: 'metrics_yearly',
};

// GET /api/metrics/names
router.get('/names', (_req: Request, res: Response) => {
  try {
    const rows = db
      .prepare(
        `SELECT DISTINCT metric_name FROM (
           SELECT metric_name FROM metrics_raw
           UNION SELECT metric_name FROM metrics_hourly
           UNION SELECT metric_name FROM metrics_daily
           UNION SELECT metric_name FROM metrics_monthly
           UNION SELECT metric_name FROM metrics_yearly
         ) ORDER BY metric_name`
      )
      .all() as { metric_name: string }[];

    res.json({ names: rows.map((r) => r.metric_name) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metric names' });
  }
});

// GET /api/metrics
router.get('/', (req: Request, res: Response) => {
  const { metric_name, granularity = 'daily', start, end } = req.query as Record<string, string>;

  if (!metric_name) {
    res.status(400).json({ error: 'metric_name is required' });
    return;
  }

  const gran = granularity as Granularity;
  if (!tableMap[gran]) {
    res.status(400).json({ error: `Invalid granularity. Must be one of: ${Object.keys(tableMap).join(', ')}` });
    return;
  }

  const startTs = start || new Date(0).toISOString();
  const endTs = end || new Date().toISOString();
  const cacheKey = buildCacheKey(gran, metric_name, startTs, endTs);

  const cached = getCache(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    let data: { timestamp: string; value: number; min: number; max: number; count: number }[];

    if (gran === '5min') {
      const rows = db
        .prepare(
          `SELECT timestamp, value, value AS min_value, value AS max_value, 1 AS count
           FROM metrics_raw
           WHERE metric_name = ? AND timestamp >= ? AND timestamp <= ?
           ORDER BY timestamp ASC`
        )
        .all(metric_name, startTs, endTs) as (RawRow & { min_value: number; max_value: number; count: number })[];

      data = rows.map((r) => ({
        timestamp: r.timestamp,
        value: r.value,
        min: r.min_value,
        max: r.max_value,
        count: r.count,
      }));
    } else {
      // table is validated against the hardcoded tableMap whitelist above — safe to interpolate
      const table = tableMap[gran];
      const rows = db
        .prepare(
          `SELECT timestamp, avg_value, min_value, max_value, count
           FROM ${table}
           WHERE metric_name = ? AND timestamp >= ? AND timestamp <= ?
           ORDER BY timestamp ASC`
        )
        .all(metric_name, startTs, endTs) as MetricRow[];

      data = rows.map((r) => ({
        timestamp: r.timestamp,
        value: r.avg_value,
        min: r.min_value,
        max: r.max_value,
        count: r.count,
      }));
    }

    const result = {
      data,
      metric_name,
      granularity: gran,
      start: startTs,
      end: endTs,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/metrics/ingest
router.post('/ingest', (req: Request, res: Response) => {
  const { metric_name, value, timestamp, tags } = req.body as {
    metric_name?: string;
    value?: number;
    timestamp?: string;
    tags?: Record<string, unknown>;
  };

  if (!metric_name || value === undefined) {
    res.status(400).json({ error: 'metric_name and value are required' });
    return;
  }

  try {
    const ts = timestamp || new Date().toISOString();
    const tagsStr = tags ? JSON.stringify(tags) : '{}';

    db.prepare(
      'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
    ).run(ts, metric_name, value, tagsStr);

    clearCacheByMetric(metric_name);
    res.status(201).json({ success: true, timestamp: ts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ingest metric' });
  }
});

// POST /api/metrics/ingest/batch
router.post('/ingest/batch', (req: Request, res: Response) => {
  const { metrics } = req.body as {
    metrics?: { metric_name: string; value: number; timestamp?: string; tags?: Record<string, unknown> }[];
  };

  if (!Array.isArray(metrics) || metrics.length === 0) {
    res.status(400).json({ error: 'metrics array is required and must not be empty' });
    return;
  }

  try {
    const insert = db.prepare(
      'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
    );

    const insertBatch = db.transaction(
      (items: { metric_name: string; value: number; timestamp?: string; tags?: Record<string, unknown> }[]) => {
        const affectedMetrics = new Set<string>();
        for (const item of items) {
          if (!item.metric_name || item.value === undefined) continue;
          const ts = item.timestamp || new Date().toISOString();
          const tagsStr = item.tags ? JSON.stringify(item.tags) : '{}';
          insert.run(ts, item.metric_name, item.value, tagsStr);
          affectedMetrics.add(item.metric_name);
        }
        return affectedMetrics;
      }
    );

    const affected = insertBatch(metrics);
    for (const name of affected) {
      clearCacheByMetric(name);
    }

    res.status(201).json({ success: true, count: metrics.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ingest batch metrics' });
  }
});

export default router;
