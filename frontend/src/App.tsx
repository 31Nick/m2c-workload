import { useState, useEffect, useCallback } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import {
  fetchMetricNames,
  fetchMetrics,
} from './api';
import type { GranularityType, MetricDataPoint, MetricsResponse } from './api';
import MetricsChart from './components/MetricsChart';
import GranularityControls from './components/GranularityControls';
import DateRangePicker from './components/DateRangePicker';
import StatsPanel from './components/StatsPanel';
import './App.css';

const FMT = "yyyy-MM-dd'T'HH:mm";

interface DrillDownEntry {
  label: string;
  granularity: GranularityType;
  start: string;
  end: string;
}

const DRILL_ORDER: GranularityType[] = ['yearly', 'monthly', 'daily', 'hourly', '5min'];

function nextGranularity(current: GranularityType): GranularityType | null {
  const idx = DRILL_ORDER.indexOf(current);
  return idx >= 0 && idx < DRILL_ORDER.length - 1 ? DRILL_ORDER[idx + 1] : null;
}

function drillLabel(point: MetricDataPoint, granularity: GranularityType): string {
  try {
    const date = parseISO(point.timestamp);
    switch (granularity) {
      case 'yearly': return format(date, 'yyyy');
      case 'monthly': return format(date, 'MMMM yyyy');
      case 'daily': return format(date, 'EEE, MMM d yyyy');
      case 'hourly': return format(date, 'MMM d, HH:mm');
      case '5min': return format(date, 'HH:mm');
    }
  } catch {
    return point.timestamp;
  }
}

function drillRange(point: MetricDataPoint, granularity: GranularityType): { start: string; end: string } {
  const date = parseISO(point.timestamp);
  switch (granularity) {
    case 'yearly': {
      const y = date.getFullYear();
      return {
        start: format(new Date(y, 0, 1), FMT),
        end: format(new Date(y, 11, 31, 23, 59), FMT),
      };
    }
    case 'monthly': {
      const y = date.getFullYear();
      const m = date.getMonth();
      const lastDay = new Date(y, m + 1, 0);
      return {
        start: format(new Date(y, m, 1), FMT),
        end: format(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59), FMT),
      };
    }
    case 'daily': {
      return {
        start: format(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0), FMT),
        end: format(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59), FMT),
      };
    }
    case 'hourly': {
      return {
        start: format(new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0), FMT),
        end: format(new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 59), FMT),
      };
    }
    default: {
      return {
        start: point.timestamp,
        end: point.timestamp,
      };
    }
  }
}

function App() {
  const now = new Date();
  const defaultEnd = format(now, FMT);
  const defaultStart = format(subDays(now, 30), FMT);

  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('cpu_usage');
  const [granularity, setGranularity] = useState<GranularityType>('daily');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [response, setResponse] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<DrillDownEntry[]>([]);

  useEffect(() => {
    fetchMetricNames()
      .then(names => {
        setMetricNames(names);
        if (names.length > 0 && !names.includes('cpu_usage')) {
          setSelectedMetric(names[0]);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load metric names';
        setError(msg);
      });
  }, []);

  const loadData = useCallback(
    async (metric: string, gran: GranularityType, s: string, e: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMetrics({ metric, granularity: gran, start: s, end: e });
        setData(res.data);
        setResponse(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(msg);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(selectedMetric, granularity, start, end);
  }, [selectedMetric, granularity, start, end, loadData]);

  const handleDataPointClick = (point: MetricDataPoint) => {
    const next = nextGranularity(granularity);
    if (!next) return;

    const entry: DrillDownEntry = {
      label: drillLabel(point, granularity),
      granularity,
      start,
      end,
    };

    const range = drillRange(point, granularity);
    setBreadcrumb(prev => [...prev, entry]);
    setGranularity(next);
    setStart(range.start);
    setEnd(range.end);
  };

  const handleBack = () => {
    const prev = breadcrumb[breadcrumb.length - 1];
    if (!prev) return;
    setBreadcrumb(bc => bc.slice(0, -1));
    setGranularity(prev.granularity);
    setStart(prev.start);
    setEnd(prev.end);
  };

  const handleBreadcrumbClick = (index: number) => {
    const entry = breadcrumb[index];
    setBreadcrumb(bc => bc.slice(0, index));
    setGranularity(entry.granularity);
    setStart(entry.start);
    setEnd(entry.end);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">Workload Monitor</h1>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Metric</label>
          <select
            className="metric-select"
            value={selectedMetric}
            onChange={e => {
              setSelectedMetric(e.target.value);
              setBreadcrumb([]);
            }}
          >
            {metricNames.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
            {metricNames.length === 0 && (
              <option value="cpu_usage">cpu_usage</option>
            )}
          </select>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Granularity</label>
          <GranularityControls
            current={granularity}
            onChange={g => { setGranularity(g); setBreadcrumb([]); }}
          />
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Date Range</label>
          <DateRangePicker
            start={start}
            end={end}
            onStartChange={s => { setStart(s); setBreadcrumb([]); }}
            onEndChange={e => { setEnd(e); setBreadcrumb([]); }}
          />
        </div>
      </aside>

      <main className="main">
        {breadcrumb.length > 0 && (
          <div className="breadcrumb">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <nav className="breadcrumb-nav">
              <span
                className="breadcrumb-root"
                onClick={() => { setBreadcrumb([]); setGranularity('daily'); setStart(defaultStart); setEnd(defaultEnd); }}
              >
                All time
              </span>
              {breadcrumb.map((entry, i) => (
                <span key={i}>
                  <span className="breadcrumb-sep"> › </span>
                  <span
                    className="breadcrumb-item"
                    onClick={() => handleBreadcrumbClick(i)}
                  >
                    {entry.label}
                  </span>
                </span>
              ))}
              <span className="breadcrumb-sep"> › </span>
              <span className="breadcrumb-current">
                {granularity.toUpperCase()}
              </span>
            </nav>
          </div>
        )}

        <div className="card chart-card">
          <div className="chart-header">
            <h2 className="chart-title">{selectedMetric}</h2>
            <span className="chart-subtitle">{granularity} · {start.split('T')[0]} → {end.split('T')[0]}</span>
          </div>
          <MetricsChart
            data={data}
            granularity={granularity}
            loading={loading}
            error={error}
            onDataPointClick={handleDataPointClick}
          />
        </div>

        <StatsPanel data={data} previousPeriod={response?.previousPeriod} />
      </main>
    </div>
  );
}

export default App;
