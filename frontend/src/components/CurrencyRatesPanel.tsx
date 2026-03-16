import type { CurrencyExchangeRate } from '../types';

type CurrencyRatesPanelProps = {
  rates: CurrencyExchangeRate[];
  loading: boolean;
};

const rateFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

export function CurrencyRatesPanel({ rates, loading }: CurrencyRatesPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Global markets</span>
          <h2>Currency exchange rates</h2>
        </div>
      </div>
      {loading ? (
        <div className="empty-state" style={{ minHeight: 'unset', padding: '24px 0' }}>
          Loading rates…
        </div>
      ) : rates.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 'unset', padding: '24px 0' }}>
          No rate data available.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Rate</th>
                <th>Change %</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => {
                const positive = r.change_percent >= 0;
                const pair = `${r.base_currency}/${r.target_currency}`;
                const updated = new Date(r.last_updated).toLocaleTimeString('en-US', { timeZoneName: 'short' });
                return (
                  <tr key={pair}>
                    <td>
                      <strong>{pair}</strong>
                    </td>
                    <td>{rateFormatter.format(r.rate)}</td>
                    <td className={positive ? 'positive' : 'negative'}>
                      {positive ? '+' : ''}
                      {r.change_percent.toFixed(2)}%
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
