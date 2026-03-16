import { db } from './db';

const METRIC_NAMES = [
  'cpu_usage',
  'memory_usage',
  'request_rate',
  'error_rate',
  'response_time',
];

interface MetricConfig {
  base: number;
  amplitude: number;
  noise: number;
  min: number;
  max: number;
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  cpu_usage:     { base: 50,  amplitude: 30, noise: 5,   min: 0,   max: 100  },
  memory_usage:  { base: 60,  amplitude: 20, noise: 3,   min: 0,   max: 100  },
  request_rate:  { base: 500, amplitude: 300, noise: 50,  min: 0,   max: 1000 },
  error_rate:    { base: 5,   amplitude: 4,  noise: 0.5, min: 0,   max: 10   },
  response_time: { base: 200, amplitude: 150, noise: 20,  min: 0,   max: 500  },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function generateValue(metric: string, ts: Date): number {
  const cfg = METRIC_CONFIGS[metric];
  const hourOfDay = ts.getUTCHours();
  const dayOfWeek = ts.getUTCDay();
  // Business hours peak pattern (sin wave peaking around noon)
  const dayCycle = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI);
  // Weekday vs weekend factor
  const weekFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1.0;
  const noise = (Math.random() - 0.5) * 2 * cfg.noise;
  const value = cfg.base + cfg.amplitude * dayCycle * weekFactor + noise;
  return clamp(value, cfg.min, cfg.max);
}

function generateAggRow(metric: string, timestamps: Date[]) {
  const values = timestamps.map((ts) => generateValue(metric, ts));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { avg_value: avg, min_value: min, max_value: max, count: values.length };
}

function seed() {
  console.log('Seeding database...');
  const now = new Date();

  // ─── 1. Raw data: past 7 days @ 5-minute intervals ───────────────────────
  console.log('Inserting raw data (7 days @ 5min)...');
  const insertRaw = db.prepare(
    'INSERT OR REPLACE INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
  );
  const rawTx = db.transaction(() => {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let cur = new Date(cutoff);
    cur.setSeconds(0, 0);
    const intervalMs = 5 * 60 * 1000;
    while (cur <= now) {
      for (const name of METRIC_NAMES) {
        insertRaw.run(cur.toISOString(), name, generateValue(name, cur), '{}');
      }
      cur = new Date(cur.getTime() + intervalMs);
    }
  });
  rawTx();

  // ─── 2. Hourly data: past 90 days ────────────────────────────────────────
  console.log('Inserting hourly data (90 days)...');
  const insertHourly = db.prepare(
    `INSERT OR REPLACE INTO metrics_hourly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')`
  );
  const hourlyTx = db.transaction(() => {
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    let cur = new Date(cutoff);
    cur.setMinutes(0, 0, 0);
    const intervalMs = 60 * 60 * 1000;
    while (cur <= now) {
      // Generate 12 samples (every 5 min) for the hour
      const samples: Date[] = [];
      for (let i = 0; i < 12; i++) {
        samples.push(new Date(cur.getTime() + i * 5 * 60 * 1000));
      }
      const ts = cur.toISOString().slice(0, 13) + ':00:00Z';
      for (const name of METRIC_NAMES) {
        const agg = generateAggRow(name, samples);
        insertHourly.run(ts, name, agg.avg_value, agg.min_value, agg.max_value, agg.count);
      }
      cur = new Date(cur.getTime() + intervalMs);
    }
  });
  hourlyTx();

  // ─── 3. Daily data: past 1 year ──────────────────────────────────────────
  console.log('Inserting daily data (1 year)...');
  const insertDaily = db.prepare(
    `INSERT OR REPLACE INTO metrics_daily (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')`
  );
  const dailyTx = db.transaction(() => {
    const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    let cur = new Date(cutoff);
    cur.setHours(0, 0, 0, 0);
    const intervalMs = 24 * 60 * 60 * 1000;
    while (cur <= now) {
      // 24 hourly samples per day
      const samples: Date[] = [];
      for (let i = 0; i < 24; i++) {
        samples.push(new Date(cur.getTime() + i * 60 * 60 * 1000));
      }
      const ts = cur.toISOString().slice(0, 10) + 'T00:00:00Z';
      for (const name of METRIC_NAMES) {
        const agg = generateAggRow(name, samples);
        insertDaily.run(ts, name, agg.avg_value, agg.min_value, agg.max_value, agg.count);
      }
      cur = new Date(cur.getTime() + intervalMs);
    }
  });
  dailyTx();

  // ─── 4. Monthly data: past 2 years ───────────────────────────────────────
  console.log('Inserting monthly data (2 years)...');
  const insertMonthly = db.prepare(
    `INSERT OR REPLACE INTO metrics_monthly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')`
  );
  const monthlyTx = db.transaction(() => {
    const startYear = now.getUTCFullYear() - 2;
    let cur = new Date(Date.UTC(startYear, now.getUTCMonth(), 1));
    while (cur <= now) {
      // 30 daily samples per month
      const samples: Date[] = [];
      for (let i = 0; i < 30; i++) {
        samples.push(new Date(cur.getTime() + i * 24 * 60 * 60 * 1000));
      }
      const ts = cur.toISOString().slice(0, 7) + '-01T00:00:00Z';
      for (const name of METRIC_NAMES) {
        const agg = generateAggRow(name, samples);
        insertMonthly.run(ts, name, agg.avg_value, agg.min_value, agg.max_value, agg.count);
      }
      // Advance one month
      const nextMonth = new Date(cur);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      cur = nextMonth;
    }
  });
  monthlyTx();

  // ─── 5. Yearly data: past 5 years ────────────────────────────────────────
  console.log('Inserting yearly data (5 years)...');
  const insertYearly = db.prepare(
    `INSERT OR REPLACE INTO metrics_yearly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')`
  );
  const yearlyTx = db.transaction(() => {
    for (let y = now.getUTCFullYear() - 5; y <= now.getUTCFullYear(); y++) {
      const yearStart = new Date(Date.UTC(y, 0, 1));
      // 365 daily samples per year
      const samples: Date[] = [];
      for (let i = 0; i < 365; i++) {
        samples.push(new Date(yearStart.getTime() + i * 24 * 60 * 60 * 1000));
      }
      const ts = `${y}-01-01T00:00:00Z`;
      for (const name of METRIC_NAMES) {
        const agg = generateAggRow(name, samples);
        insertYearly.run(ts, name, agg.avg_value, agg.min_value, agg.max_value, agg.count);
      }
    }
  });
  yearlyTx();

  console.log('Seeding complete!');
}

seed();
