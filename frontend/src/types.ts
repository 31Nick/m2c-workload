export type StockOverview = {
  symbol: string;
  company_name: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number | null;
  day_low: number | null;
  market_cap: number | null;
  volume: number | null;
  currency: string;
  exchange: string | null;
  logo_text: string;
};

export type MarketSummary = {
  average_change_percent: number;
  advancers: number;
  decliners: number;
  total_market_cap: number;
  total_volume: number;
};

export type DashboardResponse = {
  generated_at: string;
  market_summary: MarketSummary;
  stocks: StockOverview[];
};

export type HistoryPoint = {
  date: string;
  close: number;
};

export type StockHistory = {
  symbol: string;
  company_name: string;
  points: HistoryPoint[];
};
