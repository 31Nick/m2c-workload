import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'metrics.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

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

export default db;
export { db };
