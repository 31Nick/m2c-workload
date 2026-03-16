import { StockQuote } from '@/types/stock';

interface BaseStock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  marketCap: number;
}

const BASE_STOCKS: BaseStock[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 185.20, previousClose: 183.50, high: 186.40, low: 184.10, open: 183.80, volume: 52_400_000, marketCap: 2_850_000_000_000 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', price: 415.80, previousClose: 412.60, high: 417.20, low: 413.50, open: 413.00, volume: 21_300_000, marketCap: 3_090_000_000_000 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 175.40, previousClose: 177.20, high: 176.80, low: 174.30, open: 177.00, volume: 18_700_000, marketCap: 2_190_000_000_000 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', price: 195.60, previousClose: 192.40, high: 196.90, low: 193.20, open: 192.80, volume: 31_500_000, marketCap: 2_040_000_000_000 },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', price: 525.30, previousClose: 518.70, high: 527.80, low: 520.10, open: 519.20, volume: 14_200_000, marketCap: 1_340_000_000_000 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', price: 875.40, previousClose: 860.20, high: 882.50, low: 866.30, open: 861.00, volume: 42_800_000, marketCap: 2_160_000_000_000 },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', price: 245.80, previousClose: 251.30, high: 249.70, low: 243.10, open: 251.00, volume: 88_600_000, marketCap: 782_000_000_000 },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Technology', price: 155.20, previousClose: 152.80, high: 156.40, low: 153.70, open: 153.10, volume: 9_400_000, marketCap: 804_000_000_000 },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', price: 1502.50, previousClose: 1487.30, high: 1510.80, low: 1490.20, open: 1488.00, volume: 3_100_000, marketCap: 698_000_000_000 },
  { ticker: 'ORCL', name: 'Oracle Corp.', sector: 'Technology', price: 135.70, previousClose: 133.90, high: 136.80, low: 134.40, open: 134.20, volume: 12_800_000, marketCap: 372_000_000_000 },
  { ticker: 'ASML', name: 'ASML Holding N.V.', sector: 'Technology', price: 930.20, previousClose: 942.60, high: 935.50, low: 926.10, open: 942.00, volume: 1_200_000, marketCap: 366_000_000_000 },
  { ticker: 'SAP', name: 'SAP SE', sector: 'Technology', price: 210.40, previousClose: 207.80, high: 211.90, low: 208.60, open: 208.10, volume: 4_600_000, marketCap: 243_000_000_000 },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', price: 650.80, previousClose: 643.20, high: 654.30, low: 645.10, open: 644.00, volume: 5_800_000, marketCap: 282_000_000_000 },
  { ticker: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', price: 550.60, previousClose: 557.40, high: 553.20, low: 548.30, open: 557.00, volume: 3_400_000, marketCap: 250_000_000_000 },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', price: 295.40, previousClose: 291.80, high: 297.10, low: 293.20, open: 292.10, volume: 6_200_000, marketCap: 286_000_000_000 },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Technology', price: 45.30, previousClose: 46.80, high: 46.10, low: 44.90, open: 46.70, volume: 43_200_000, marketCap: 191_000_000_000 },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', price: 175.60, previousClose: 171.40, high: 177.20, low: 173.80, open: 171.80, volume: 38_700_000, marketCap: 284_000_000_000 },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology', price: 165.80, previousClose: 163.20, high: 167.40, low: 164.30, open: 163.50, volume: 11_400_000, marketCap: 184_000_000_000 },
  { ticker: 'TXN', name: 'Texas Instruments', sector: 'Technology', price: 215.30, previousClose: 213.70, high: 216.80, low: 213.90, open: 214.00, volume: 7_300_000, marketCap: 196_000_000_000 },
  { ticker: 'IBM', name: 'IBM Corp.', sector: 'Technology', price: 195.40, previousClose: 193.60, high: 196.70, low: 194.10, open: 193.80, volume: 5_100_000, marketCap: 177_000_000_000 },
];

function randomVariation(value: number, maxPercent = 0.005): number {
  const delta = value * maxPercent * (Math.random() * 2 - 1);
  return Math.round((value + delta) * 100) / 100;
}

function generateSparkline(basePrice: number, previousClose: number): number[] {
  const points: number[] = [];
  let current = previousClose;
  for (let i = 0; i < 10; i++) {
    current = current + (basePrice - previousClose) / 10 + (current * 0.008 * (Math.random() * 2 - 1));
    points.push(Math.round(current * 100) / 100);
  }
  return points;
}

export function getMockStocks(): StockQuote[] {
  return BASE_STOCKS.map((stock) => {
    const price = randomVariation(stock.price);
    const previousClose = stock.previousClose;
    const change = Math.round((price - previousClose) * 100) / 100;
    const changePercent = Math.round((change / previousClose) * 10000) / 100;

    return {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      price,
      previousClose,
      change,
      changePercent,
      high: randomVariation(stock.high),
      low: randomVariation(stock.low),
      open: stock.open,
      volume: stock.volume,
      marketCap: stock.marketCap,
      sparkline: generateSparkline(price, previousClose),
    };
  });
}
