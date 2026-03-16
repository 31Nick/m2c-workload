import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

export type GranularityType = '5min' | 'hourly' | 'daily' | 'monthly' | 'yearly';

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  min?: number;
  max?: number;
  avg?: number;
  count?: number;
}

export interface MetricsResponse {
  metric_name: string;
  granularity: GranularityType;
  data: MetricDataPoint[];
  previousPeriod?: {
    min: number;
    max: number;
    avg: number;
    count: number;
  };
}

export interface IngestPayload {
  metric_name: string;
  value: number;
  timestamp?: string;
  tags?: Record<string, unknown>;
}

export async function fetchMetricNames(): Promise<string[]> {
  const res = await axios.get<{ names: string[] }>(`${BASE_URL}/api/metrics/names`);
  return res.data.names;
}

export async function fetchMetrics(params: {
  metric: string;
  granularity: GranularityType;
  start?: string;
  end?: string;
}): Promise<MetricsResponse> {
  const res = await axios.get<MetricsResponse>(`${BASE_URL}/api/metrics`, {
    params: {
      metric_name: params.metric,
      granularity: params.granularity,
      start: params.start,
      end: params.end,
    },
  });
  return res.data;
}

export async function ingestMetric(data: IngestPayload): Promise<void> {
  await axios.post(`${BASE_URL}/api/metrics/ingest`, data);
}
