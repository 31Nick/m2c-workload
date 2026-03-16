type StockHeroProps = {
  generatedAt: string;
  averageChangePercent: number;
};

export function StockHero({ generatedAt, averageChangePercent }: StockHeroProps) {
  const positive = averageChangePercent >= 0;

  return (
    <section className="hero-card">
      <div>
        <span className="eyebrow">Tech Stocks Broker Console</span>
        <h1>Tech stocks command center</h1>
        <p>
          Track the top ten tech names in a single premium dashboard with live snapshots,
          clear momentum signals, and historical price action.
        </p>
      </div>
      <div className="hero-stats">
        <div className="hero-badge">
          <span>Market breadth</span>
          <strong className={positive ? 'positive' : 'negative'}>
            {positive ? '+' : ''}
            {averageChangePercent.toFixed(2)}%
          </strong>
        </div>
        <div className="hero-meta">
          <span>Last refresh</span>
          <strong>{new Date(generatedAt).toLocaleString()}</strong>
        </div>
      </div>
    </section>
  );
}
