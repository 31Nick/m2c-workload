import cron from 'node-cron';
import { db } from './db';

function truncateToHour(isoStr: string): string {
  const d = new Date(isoStr);
  d.setMinutes(0, 0, 0);
  return d.toISOString().replace('.000Z', 'Z').slice(0, 13) + ':00:00Z';
}

function truncateToDay(isoStr: string): string {
  return isoStr.slice(0, 10) + 'T00:00:00Z';
}

function truncateToMonth(isoStr: string): string {
  return isoStr.slice(0, 7) + '-01T00:00:00Z';
}

function truncateToYear(isoStr: string): string {
  return isoStr.slice(0, 4) + '-01-01T00:00:00Z';
}

export function rollupToHourly(sinceHoursAgo = 2): void {
  const cutoff = new Date(Date.now() - sinceHoursAgo * 60 * 60 * 1000).toISOString();
  const rows = db
    .prepare(
      `SELECT
         substr(timestamp, 1, 13) || ':00:00Z' AS hour_ts,
         metric_name,
         AVG(value)   AS avg_value,
         MIN(value)   AS min_value,
         MAX(value)   AS max_value,
         COUNT(*)     AS count
       FROM metrics_raw
       WHERE timestamp >= ?
       GROUP BY hour_ts, metric_name`
    )
    .all(cutoff) as {
    hour_ts: string;
    metric_name: string;
    avg_value: number;
    min_value: number;
    max_value: number;
    count: number;
  }[];

  const upsert = db.prepare(
    `INSERT INTO metrics_hourly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')
     ON CONFLICT(timestamp, metric_name)
     DO UPDATE SET
       avg_value = excluded.avg_value,
       min_value = excluded.min_value,
       max_value = excluded.max_value,
       count     = excluded.count`
  );

  const insertMany = db.transaction(
    (
      rows: {
        hour_ts: string;
        metric_name: string;
        avg_value: number;
        min_value: number;
        max_value: number;
        count: number;
      }[]
    ) => {
      for (const r of rows) {
        upsert.run(r.hour_ts, r.metric_name, r.avg_value, r.min_value, r.max_value, r.count);
      }
    }
  );
  insertMany(rows);
}

export function rollupToDaily(sinceHoursAgo = 48): void {
  const cutoff = new Date(Date.now() - sinceHoursAgo * 60 * 60 * 1000).toISOString();
  const rows = db
    .prepare(
      `SELECT
         substr(timestamp, 1, 10) || 'T00:00:00Z' AS day_ts,
         metric_name,
         AVG(avg_value * count) / NULLIF(SUM(count), 0) AS avg_value,
         MIN(min_value) AS min_value,
         MAX(max_value) AS max_value,
         SUM(count)     AS count
       FROM metrics_hourly
       WHERE timestamp >= ?
       GROUP BY day_ts, metric_name`
    )
    .all(cutoff) as {
    day_ts: string;
    metric_name: string;
    avg_value: number;
    min_value: number;
    max_value: number;
    count: number;
  }[];

  const upsert = db.prepare(
    `INSERT INTO metrics_daily (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')
     ON CONFLICT(timestamp, metric_name)
     DO UPDATE SET
       avg_value = excluded.avg_value,
       min_value = excluded.min_value,
       max_value = excluded.max_value,
       count     = excluded.count`
  );

  const insertMany = db.transaction(
    (
      rows: {
        day_ts: string;
        metric_name: string;
        avg_value: number;
        min_value: number;
        max_value: number;
        count: number;
      }[]
    ) => {
      for (const r of rows) {
        upsert.run(r.day_ts, r.metric_name, r.avg_value, r.min_value, r.max_value, r.count);
      }
    }
  );
  insertMany(rows);
}

export function rollupToMonthly(): void {
  const rows = db
    .prepare(
      `SELECT
         substr(timestamp, 1, 7) || '-01T00:00:00Z' AS month_ts,
         metric_name,
         SUM(avg_value * count) / NULLIF(SUM(count), 0) AS avg_value,
         MIN(min_value) AS min_value,
         MAX(max_value) AS max_value,
         SUM(count)     AS count
       FROM metrics_daily
       GROUP BY month_ts, metric_name`
    )
    .all() as {
    month_ts: string;
    metric_name: string;
    avg_value: number;
    min_value: number;
    max_value: number;
    count: number;
  }[];

  const upsert = db.prepare(
    `INSERT INTO metrics_monthly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')
     ON CONFLICT(timestamp, metric_name)
     DO UPDATE SET
       avg_value = excluded.avg_value,
       min_value = excluded.min_value,
       max_value = excluded.max_value,
       count     = excluded.count`
  );

  const insertMany = db.transaction(
    (
      rows: {
        month_ts: string;
        metric_name: string;
        avg_value: number;
        min_value: number;
        max_value: number;
        count: number;
      }[]
    ) => {
      for (const r of rows) {
        upsert.run(r.month_ts, r.metric_name, r.avg_value, r.min_value, r.max_value, r.count);
      }
    }
  );
  insertMany(rows);
}

export function rollupToYearly(): void {
  const rows = db
    .prepare(
      `SELECT
         substr(timestamp, 1, 4) || '-01-01T00:00:00Z' AS year_ts,
         metric_name,
         SUM(avg_value * count) / NULLIF(SUM(count), 0) AS avg_value,
         MIN(min_value) AS min_value,
         MAX(max_value) AS max_value,
         SUM(count)     AS count
       FROM metrics_monthly
       GROUP BY year_ts, metric_name`
    )
    .all() as {
    year_ts: string;
    metric_name: string;
    avg_value: number;
    min_value: number;
    max_value: number;
    count: number;
  }[];

  const upsert = db.prepare(
    `INSERT INTO metrics_yearly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')
     ON CONFLICT(timestamp, metric_name)
     DO UPDATE SET
       avg_value = excluded.avg_value,
       min_value = excluded.min_value,
       max_value = excluded.max_value,
       count     = excluded.count`
  );

  const insertMany = db.transaction(
    (
      rows: {
        year_ts: string;
        metric_name: string;
        avg_value: number;
        min_value: number;
        max_value: number;
        count: number;
      }[]
    ) => {
      for (const r of rows) {
        upsert.run(r.year_ts, r.metric_name, r.avg_value, r.min_value, r.max_value, r.count);
      }
    }
  );
  insertMany(rows);
}

export function applyRetentionPolicies(): void {
  const now = Date.now();

  const raw7Days = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM metrics_raw WHERE timestamp < ?').run(raw7Days);

  const hourly90Days = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM metrics_hourly WHERE timestamp < ?').run(hourly90Days);

  const daily1Year = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM metrics_daily WHERE timestamp < ?').run(daily1Year);

  const monthly3Years = new Date(now - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM metrics_monthly WHERE timestamp < ?').run(monthly3Years);
  // metrics_yearly: retain indefinitely
}

export function setupAggregationJobs(): void {
  // Every 5 minutes: rollup to hourly for last 2 hours
  cron.schedule('*/5 * * * *', () => {
    try {
      rollupToHourly(2);
    } catch (err) {
      console.error('rollupToHourly error:', err);
    }
  });

  // Every hour: rollup to daily for last 48 hours
  cron.schedule('0 * * * *', () => {
    try {
      rollupToDaily(48);
    } catch (err) {
      console.error('rollupToDaily error:', err);
    }
  });

  // Every day at 1am: rollup to monthly and yearly
  cron.schedule('0 1 * * *', () => {
    try {
      rollupToMonthly();
      rollupToYearly();
    } catch (err) {
      console.error('rollupToMonthly/Yearly error:', err);
    }
  });

  // Every day at 2am: apply retention policies
  cron.schedule('0 2 * * *', () => {
    try {
      applyRetentionPolicies();
    } catch (err) {
      console.error('applyRetentionPolicies error:', err);
    }
  });

  console.log('Aggregation jobs scheduled.');
}

// Keep exported for backward compat / direct use
export { truncateToHour, truncateToDay, truncateToMonth, truncateToYear };
