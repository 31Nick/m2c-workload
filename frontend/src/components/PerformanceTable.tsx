import type { StockOverview } from '../types';

type PerformanceTableProps = {
  stocks: StockOverview[];
};

const currencyFormatter = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const compactFormatter = (value: number | null) => {
  if (value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
};

export function PerformanceTable({ stocks }: PerformanceTableProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Screening view</span>
          <h2>Performance table</h2>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th>Price</th>
              <th>Change %</th>
              <th>Market cap</th>
              <th>Volume</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const positive = stock.change_percent >= 0;
              return (
                <tr key={stock.symbol}>
                  <td>{stock.symbol}</td>
                  <td>{stock.company_name}</td>
                  <td>{currencyFormatter(stock.current_price, stock.currency)}</td>
                  <td className={positive ? 'positive' : 'negative'}>
                    {positive ? '+' : ''}
                    {stock.change_percent.toFixed(2)}%
                  </td>
                  <td>{compactFormatter(stock.market_cap)}</td>
                  <td>{compactFormatter(stock.volume)}</td>
                  <td>{stock.exchange ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
