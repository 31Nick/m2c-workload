import type { StockOverview } from '../types';

type StockGridProps = {
  stocks: StockOverview[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export function StockGrid({ stocks, selectedSymbol, onSelect }: StockGridProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Top 10 tech names</span>
          <h2>Momentum board</h2>
        </div>
      </div>
      <div className="stock-grid">
        {stocks.map((stock) => {
          const active = stock.symbol === selectedSymbol;
          const positive = stock.change_percent >= 0;
          return (
            <button
              key={stock.symbol}
              className={`stock-card ${active ? 'selected' : ''}`}
              onClick={() => onSelect(stock.symbol)}
              type="button"
            >
              <div className="stock-card-top">
                <div className="stock-logo">{stock.logo_text}</div>
                <div>
                  <strong>{stock.symbol}</strong>
                  <p>{stock.company_name}</p>
                </div>
              </div>
              <div className="stock-price">{formatCurrency(stock.current_price, stock.currency)}</div>
              <div className={`stock-change ${positive ? 'positive' : 'negative'}`}>
                {positive ? '+' : ''}
                {stock.change.toFixed(2)} ({positive ? '+' : ''}
                {stock.change_percent.toFixed(2)}%)
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
