import Database from 'better-sqlite3';
import request from 'supertest';

// Use in-memory DB for tests
process.env.DB_PATH = ':memory:';

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_raw (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL NOT NULL,
      tags TEXT DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_raw_ts_name ON metrics_raw (timestamp, metric_name);

    CREATE TABLE IF NOT EXISTS metrics_hourly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      avg_value REAL NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      count INTEGER NOT NULL,
      tags TEXT DEFAULT '{}'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_ts_name ON metrics_hourly (timestamp, metric_name);

    CREATE TABLE IF NOT EXISTS metrics_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      avg_value REAL NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      count INTEGER NOT NULL,
      tags TEXT DEFAULT '{}'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_ts_name ON metrics_daily (timestamp, metric_name);

    CREATE TABLE IF NOT EXISTS metrics_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      avg_value REAL NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      count INTEGER NOT NULL,
      tags TEXT DEFAULT '{}'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_ts_name ON metrics_monthly (timestamp, metric_name);

    CREATE TABLE IF NOT EXISTS metrics_yearly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      avg_value REAL NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      count INTEGER NOT NULL,
      tags TEXT DEFAULT '{}'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_yearly_ts_name ON metrics_yearly (timestamp, metric_name);
  `);
  return db;
}

let testDb: Database.Database;

jest.mock('../db', () => {
  testDb = createTestDb();
  return { db: testDb, default: testDb };
});

// Import app after mocking db
import app from '../index';

function seedTestData(db: Database.Database) {
  const now = new Date();

  // Raw data
  const insertRaw = db.prepare(
    'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
  );
  insertRaw.run(new Date(now.getTime() - 10 * 60000).toISOString(), 'cpu_usage', 55.5, '{}');
  insertRaw.run(new Date(now.getTime() - 5 * 60000).toISOString(), 'cpu_usage', 60.0, '{}');
  insertRaw.run(new Date(now.getTime() - 3 * 60000).toISOString(), 'memory_usage', 70.0, '{}');

  // Hourly data
  const insertHourly = db.prepare(
    `INSERT INTO metrics_hourly (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')`
  );
  const hourTs = new Date(now);
  hourTs.setMinutes(0, 0, 0);
  insertHourly.run(hourTs.toISOString().slice(0, 13) + ':00:00Z', 'cpu_usage', 57.75, 55.5, 60.0, 2);

  // Daily data
  const insertDaily = db.prepare(
    `INSERT INTO metrics_daily (timestamp, metric_name, avg_value, min_value, max_value, count, tags)
     VALUES (?, ?, ?, ?, ?, ?, '{}')`
  );
  const dayTs = now.toISOString().slice(0, 10) + 'T00:00:00Z';
  insertDaily.run(dayTs, 'cpu_usage', 55.0, 20.0, 90.0, 288);
  insertDaily.run(dayTs, 'memory_usage', 65.0, 40.0, 85.0, 288);
}

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/metrics/names', () => {
  beforeEach(() => {
    testDb.exec(
      'DELETE FROM metrics_raw; DELETE FROM metrics_hourly; DELETE FROM metrics_daily; DELETE FROM metrics_monthly; DELETE FROM metrics_yearly;'
    );
    seedTestData(testDb);
  });

  it('returns distinct metric names', async () => {
    const res = await request(app).get('/api/metrics/names');
    expect(res.status).toBe(200);
    expect(res.body.names).toEqual(expect.arrayContaining(['cpu_usage', 'memory_usage']));
  });

  it('returns empty array when no data', async () => {
    testDb.exec(
      'DELETE FROM metrics_raw; DELETE FROM metrics_hourly; DELETE FROM metrics_daily; DELETE FROM metrics_monthly; DELETE FROM metrics_yearly;'
    );
    const res = await request(app).get('/api/metrics/names');
    expect(res.status).toBe(200);
    expect(res.body.names).toEqual([]);
  });
});

describe('GET /api/metrics', () => {
  beforeEach(() => {
    testDb.exec(
      'DELETE FROM metrics_raw; DELETE FROM metrics_hourly; DELETE FROM metrics_daily; DELETE FROM metrics_monthly; DELETE FROM metrics_yearly;'
    );
    seedTestData(testDb);
  });

  it('returns 400 if metric_name is missing', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid granularity', async () => {
    const res = await request(app).get('/api/metrics?metric_name=cpu_usage&granularity=invalid');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns daily data by default', async () => {
    const res = await request(app).get('/api/metrics?metric_name=cpu_usage');
    expect(res.status).toBe(200);
    expect(res.body.granularity).toBe('daily');
    expect(res.body.metric_name).toBe('cpu_usage');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('returns 5min granularity data from raw table', async () => {
    const res = await request(app).get('/api/metrics?metric_name=cpu_usage&granularity=5min');
    expect(res.status).toBe(200);
    expect(res.body.granularity).toBe('5min');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('returns hourly data', async () => {
    const res = await request(app).get('/api/metrics?metric_name=cpu_usage&granularity=hourly');
    expect(res.status).toBe(200);
    expect(res.body.granularity).toBe('hourly');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('respects start and end query params', async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const end = now.toISOString();
    const res = await request(app).get(
      `/api/metrics?metric_name=cpu_usage&granularity=daily&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    expect(res.status).toBe(200);
    expect(res.body.start).toBe(start);
    expect(res.body.end).toBe(end);
  });

  it('each data point has expected shape', async () => {
    const res = await request(app).get('/api/metrics?metric_name=cpu_usage&granularity=daily');
    expect(res.status).toBe(200);
    const point = res.body.data[0];
    expect(point).toHaveProperty('timestamp');
    expect(point).toHaveProperty('value');
    expect(point).toHaveProperty('min');
    expect(point).toHaveProperty('max');
    expect(point).toHaveProperty('count');
  });
});

describe('POST /api/metrics/ingest', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM metrics_raw;');
  });

  it('ingests a single metric', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest')
      .send({ metric_name: 'cpu_usage', value: 42.5 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.timestamp).toBeDefined();
  });

  it('uses provided timestamp', async () => {
    const ts = '2024-01-15T12:00:00.000Z';
    const res = await request(app)
      .post('/api/metrics/ingest')
      .send({ metric_name: 'cpu_usage', value: 42.5, timestamp: ts });
    expect(res.status).toBe(201);
    expect(res.body.timestamp).toBe(ts);
  });

  it('returns 400 if metric_name is missing', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest')
      .send({ value: 42.5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 if value is missing', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest')
      .send({ metric_name: 'cpu_usage' });
    expect(res.status).toBe(400);
  });

  it('accepts optional tags', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest')
      .send({ metric_name: 'cpu_usage', value: 55, tags: { host: 'server1' } });
    expect(res.status).toBe(201);
    const row = testDb.prepare('SELECT tags FROM metrics_raw ORDER BY id DESC LIMIT 1').get() as { tags: string };
    expect(JSON.parse(row.tags)).toEqual({ host: 'server1' });
  });
});

describe('POST /api/metrics/ingest/batch', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM metrics_raw;');
  });

  it('ingests multiple metrics at once', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest/batch')
      .send({
        metrics: [
          { metric_name: 'cpu_usage', value: 50 },
          { metric_name: 'memory_usage', value: 70 },
          { metric_name: 'error_rate', value: 2.5 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(3);

    const rows = testDb.prepare('SELECT * FROM metrics_raw').all();
    expect(rows.length).toBe(3);
  });

  it('returns 400 if metrics array is missing', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest/batch')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 if metrics is empty array', async () => {
    const res = await request(app)
      .post('/api/metrics/ingest/batch')
      .send({ metrics: [] });
    expect(res.status).toBe(400);
  });
});
