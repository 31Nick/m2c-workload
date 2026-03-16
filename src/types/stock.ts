export interface Company {
  ticker: string;
  name: string;
  sector: string;
}

export interface StockQuote {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  marketCap?: number;
  sparkline: number[]; // 10 data points for mini chart
}

export interface StocksResponse {
  stocks: StockQuote[];
  dataSource: 'live' | 'simulated';
}

export type SortField = 'name' | 'price' | 'change' | 'changePercent' | 'volume';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'cards' | 'table';
