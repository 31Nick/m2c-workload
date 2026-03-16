import React from 'react';
import { subDays, subYears, format } from 'date-fns';

interface Props {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

const DateRangePicker: React.FC<Props> = ({ start, end, onStartChange, onEndChange }) => {
  const now = new Date();

  const setPreset = (days: number | null) => {
    const endDate = now;
    const startDate = days === null ? new Date(2000, 0, 1) : subDays(now, days);
    onStartChange(fmt(startDate));
    onEndChange(fmt(endDate));
  };

  const setLastYear = () => {
    onStartChange(fmt(subYears(now, 1)));
    onEndChange(fmt(now));
  };

  return (
    <div className="date-range-picker">
      <div className="quick-select">
        <button onClick={() => setPreset(1)}>Last 24h</button>
        <button onClick={() => setPreset(7)}>Last 7 days</button>
        <button onClick={() => setPreset(30)}>Last 30 days</button>
        <button onClick={setLastYear}>Last 1 year</button>
        <button onClick={() => setPreset(null)}>All time</button>
      </div>
      <div className="date-inputs">
        <label>
          <span>Start</span>
          <input type="datetime-local" value={start} onChange={e => onStartChange(e.target.value)} />
        </label>
        <label>
          <span>End</span>
          <input type="datetime-local" value={end} onChange={e => onEndChange(e.target.value)} />
        </label>
      </div>
    </div>
  );
};

export default DateRangePicker;
