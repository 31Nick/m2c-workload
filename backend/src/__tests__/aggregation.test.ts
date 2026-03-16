import Database from 'better-sqlite3';
import path from 'path';

// Override DB_PATH before importing db module
process.env.DB_PATH = ':memory:';

// We need to create an in-memory db for tests
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

// Create the in-memory DB and replace the module's db instance
let testDb: Database.Database;

// We mock the db module to use our test DB
jest.mock('../db', () => {
  testDb = createTestDb();
  return { db: testDb, default: testDb };
});

import { rollupToHourly, applyRetentionPolicies } from '../aggregation';

describe('rollupToHourly', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM metrics_raw; DELETE FROM metrics_hourly;');
  });

  it('aggregates raw data into hourly buckets', () => {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    // Insert 3 raw data points within the current hour
    const insert = testDb.prepare(
      'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
    );
    insert.run(new Date(hourStart.getTime() + 5 * 60000).toISOString(), 'cpu_usage', 10, '{}');
    insert.run(new Date(hourStart.getTime() + 10 * 60000).toISOString(), 'cpu_usage', 20, '{}');
    insert.run(new Date(hourStart.getTime() + 15 * 60000).toISOString(), 'cpu_usage', 30, '{}');

    rollupToHourly(2);

    const rows = testDb
      .prepare('SELECT * FROM metrics_hourly WHERE metric_name = ?')
      .all('cpu_usage') as { avg_value: number; min_value: number; max_value: number; count: number }[];

    expect(rows.length).toBe(1);
    expect(rows[0].avg_value).toBeCloseTo(20, 1);
    expect(rows[0].min_value).toBe(10);
    expect(rows[0].max_value).toBe(30);
    expect(rows[0].count).toBe(3);
  });

  it('handles multiple metrics independently', () => {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const insert = testDb.prepare(
      'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
    );
    insert.run(new Date(hourStart.getTime() + 5 * 60000).toISOString(), 'cpu_usage', 50, '{}');
    insert.run(new Date(hourStart.getTime() + 5 * 60000).toISOString(), 'memory_usage', 75, '{}');

    rollupToHourly(2);

    const cpu = testDb.prepare('SELECT * FROM metrics_hourly WHERE metric_name = ?').get('cpu_usage') as { avg_value: number } | undefined;
    const mem = testDb.prepare('SELECT * FROM metrics_hourly WHERE metric_name = ?').get('memory_usage') as { avg_value: number } | undefined;

    expect(cpu?.avg_value).toBeCloseTo(50, 1);
    expect(mem?.avg_value).toBeCloseTo(75, 1);
  });

  it('upserts on duplicate timestamp+metric_name', () => {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const insert = testDb.prepare(
      'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
    );
    insert.run(new Date(hourStart.getTime() + 5 * 60000).toISOString(), 'cpu_usage', 40, '{}');
    rollupToHourly(2);

    // Add another raw point and rollup again
    insert.run(new Date(hourStart.getTime() + 10 * 60000).toISOString(), 'cpu_usage', 60, '{}');
    rollupToHourly(2);

    const rows = testDb.prepare('SELECT * FROM metrics_hourly WHERE metric_name = ?').all('cpu_usage');
    expect(rows.length).toBe(1); // Should still be 1 row due to upsert
  });
});

describe('applyRetentionPolicies', () => {
  beforeEach(() => {
    testDb.exec(
      'DELETE FROM metrics_raw; DELETE FROM metrics_hourly; DELETE FROM metrics_daily; DELETE FROM metrics_monthly; DELETE FROM metrics_yearly;'
    );
  });

  it('deletes raw data older than 7 days', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const insert = testDb.prepare(
      'INSERT INTO metrics_raw (timestamp, metric_name, value, tags) VALUES (?, ?, ?, ?)'
    );
    insert.run(old, 'cpu_usage', 10, '{}');
    insert.run(recent, 'cpu_usage', 20, '{}');

    applyRetentionPolicies();

    const rows = testDb.prepare('SELECT * FROM metrics_raw').all();
    expect(rows.length).toBe(1);
    expect((rows[0] as { timestamp: string }).timestamp).toBe(recent);
  });

  it('deletes hourly data older than 90 days', () => {
    const old = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const insert = testDb.prepare(
      'INSERT INTO metrics_hourly (timestamp, metric_name, avg_value, min_value, max_value, count, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insert.run(old, 'cpu_usage', 50, 10, 90, 12, '{}');
    insert.run(recent, 'cpu_usage', 50, 10, 90, 12, '{}');

    applyRetentionPolicies();

    const rows = testDb.prepare('SELECT * FROM metrics_hourly').all();
    expect(rows.length).toBe(1);
  });

  it('deletes daily data older than 1 year', () => {
    const old = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const insert = testDb.prepare(
      'INSERT INTO metrics_daily (timestamp, metric_name, avg_value, min_value, max_value, count, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insert.run(old, 'cpu_usage', 50, 10, 90, 24, '{}');
    insert.run(recent, 'cpu_usage', 50, 10, 90, 24, '{}');

    applyRetentionPolicies();

    const rows = testDb.prepare('SELECT * FROM metrics_daily').all();
    expect(rows.length).toBe(1);
  });

  it('preserves yearly data regardless of age', () => {
    const veryOld = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    testDb
      .prepare(
        'INSERT INTO metrics_yearly (timestamp, metric_name, avg_value, min_value, max_value, count, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(veryOld, 'cpu_usage', 50, 10, 90, 365, '{}');

    applyRetentionPolicies();

    const rows = testDb.prepare('SELECT * FROM metrics_yearly').all();
    expect(rows.length).toBe(1);
  });
});
