import { NextResponse } from 'next/server';
import { fetchStocks } from '@/lib/stockApi';

export async function GET() {
  try {
    const stocks = await fetchStocks();
    return NextResponse.json(stocks, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
