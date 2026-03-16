import React from 'react';
import type { GranularityType } from '../api';

interface Props {
  current: GranularityType;
  onChange: (g: GranularityType) => void;
  disabledLevels?: GranularityType[];
}

const GRANULARITIES: { key: GranularityType; label: string }[] = [
  { key: '5min', label: '5-Min' },
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const GranularityControls: React.FC<Props> = ({ current, onChange, disabledLevels = [] }) => {
  return (
    <div className="granularity-controls">
      {GRANULARITIES.map(({ key, label }) => (
        <button
          key={key}
          className={`gran-btn${current === key ? ' active' : ''}${disabledLevels.includes(key) ? ' disabled' : ''}`}
          onClick={() => !disabledLevels.includes(key) && onChange(key)}
          disabled={disabledLevels.includes(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default GranularityControls;
