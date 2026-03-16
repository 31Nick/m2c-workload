import { StockQuote, StocksResponse } from '@/types/stock';
import { getMockStocks } from './mockData';

const COMPANIES: Record<string, { name: string; sector: string }> = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology' },
  MSFT: { name: 'Microsoft Corp.', sector: 'Technology' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Technology' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  META: { name: 'Meta Platforms Inc.', sector: 'Technology' },
  NVDA: { name: 'NVIDIA Corp.', sector: 'Technology' },
  TSLA: { name: 'Tesla Inc.', sector: 'Consumer Cyclical' },
  TSM: { name: 'Taiwan Semiconductor', sector: 'Technology' },
  AVGO: { name: 'Broadcom Inc.', sector: 'Technology' },
  ORCL: { name: 'Oracle Corp.', sector: 'Technology' },
  ASML: { name: 'ASML Holding N.V.', sector: 'Technology' },
  SAP: { name: 'SAP SE', sector: 'Technology' },
  NFLX: { name: 'Netflix Inc.', sector: 'Communication Services' },
  ADBE: { name: 'Adobe Inc.', sector: 'Technology' },
  CRM: { name: 'Salesforce Inc.', sector: 'Technology' },
  INTC: { name: 'Intel Corp.', sector: 'Technology' },
  AMD: { name: 'Advanced Micro Devices', sector: 'Technology' },
  QCOM: { name: 'Qualcomm Inc.', sector: 'Technology' },
  TXN: { name: 'Texas Instruments', sector: 'Technology' },
  IBM: { name: 'IBM Corp.', sector: 'Technology' },
};

const TICKERS = Object.keys(COMPANIES);

const SPARKLINE_VOLATILITY = 0.008; // ±0.8% random variation per step

function generateSparkline(price: number, previousClose: number): number[] {
  const points: number[] = [];
  let current = previousClose;
  for (let i = 0; i < 10; i++) {
    current = current + (price - previousClose) / 10 + current * SPARKLINE_VOLATILITY * (Math.random() * 2 - 1);
    points.push(Math.round(current * 100) / 100);
  }
  return points;
}

async function fetchFinnhubQuote(ticker: string, apiKey: string): Promise<{ c: number; pc: number; h: number; l: number; o: number; v: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchStocks(): Promise<StocksResponse> {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return { stocks: getMockStocks(), dataSource: 'simulated' };
  }

  try {
    const results = await Promise.all(
      TICKERS.map(async (ticker) => {
        const data = await fetchFinnhubQuote(ticker, apiKey);
        if (!data || !data.c) return null;

        const price = data.c;
        const previousClose = data.pc;
        const change = Math.round((price - previousClose) * 100) / 100;
        const changePercent = Math.round((change / previousClose) * 10000) / 100;
        const company = COMPANIES[ticker];

        return {
          ticker,
          name: company.name,
          sector: company.sector,
          price,
          previousClose,
          change,
          changePercent,
          high: data.h,
          low: data.l,
          open: data.o,
          volume: data.v,
          sparkline: generateSparkline(price, previousClose),
        } satisfies StockQuote;
      })
    );

    const valid = results.filter((r): r is StockQuote => r !== null);
    if (valid.length > 0) {
      return { stocks: valid, dataSource: 'live' };
    }
    return { stocks: getMockStocks(), dataSource: 'simulated' };
  } catch {
    return { stocks: getMockStocks(), dataSource: 'simulated' };
  }
}
