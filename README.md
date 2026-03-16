# m2c-workload

Time-based workload monitoring with drill-down granularity (5-minute → hourly → daily → monthly → yearly) and 1+ year historical views.

## Architecture

```
m2c-workload/
├── backend/   # Node.js + Express + SQLite API
└── frontend/  # React + TypeScript + Recharts UI
```

### Data Model

Five time-series tables with automatic rollup and retention policies:

| Granularity | Table             | Retention |
|-------------|-------------------|-----------|
| 5-min (raw) | `metrics_raw`     | 7 days    |
| Hourly      | `metrics_hourly`  | 90 days   |
| Daily       | `metrics_daily`   | 1 year    |
| Monthly     | `metrics_monthly` | 3 years   |
| Yearly      | `metrics_yearly`  | Forever   |

## Quick Start

### Backend

```bash
cd backend
npm install
npm run seed    # Populate with 2 years of demo data
npm start       # Starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:5173
```

## API

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/health`                   | Health check                         |
| GET    | `/api/metrics/names`        | List all metric names                |
| GET    | `/api/metrics`              | Query metrics (see params below)     |
| POST   | `/api/metrics/ingest`       | Ingest a single data point           |
| POST   | `/api/metrics/ingest/batch` | Ingest multiple data points          |

### Query Parameters for `GET /api/metrics`

| Param         | Required | Default  | Description                                       |
|---------------|----------|----------|---------------------------------------------------|
| `metric_name` | Yes      | —        | Metric to query (e.g. `cpu_usage`)                |
| `granularity` | No       | `daily`  | One of: `5min`, `hourly`, `daily`, `monthly`, `yearly` |
| `start`       | No       | epoch    | ISO 8601 start timestamp                          |
| `end`         | No       | now      | ISO 8601 end timestamp                            |

### Ingest Payload

```json
{
  "metric_name": "cpu_usage",
  "value": 42.5,
  "timestamp": "2024-06-01T12:00:00.000Z",
  "tags": { "host": "web-01" }
}
```

## Features

- **Multi-granularity time-series**: 5-min, hourly, daily, monthly, yearly views
- **Drill-down navigation**: Click any chart point to zoom into finer granularity with breadcrumb trail
- **Automatic rollups**: Scheduled jobs aggregate raw → hourly → daily → monthly → yearly
- **Retention policies**: Fine-grained data auto-expires; long-term aggregates persist 1+ years
- **LRU cache**: Frequently-accessed aggregates cached in memory (5-min TTL, 500-item LRU)
- **Pre-seeded demo data**: 5 metrics × 2 years of sinusoidal mock data

## Seeded Metrics

- `cpu_usage` (0–100 %)
- `memory_usage` (0–100 %)
- `request_rate` (0–1000 req/s)
- `error_rate` (0–10 %)
- `response_time` (0–500 ms)

## Testing

```bash
cd backend && npm test   # 25 unit tests (aggregation + API routes)
```
