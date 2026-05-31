import React from 'react';
import '../styles/StatsBar.css';

function Stat({ label, value, accent }) {
  return (
    <div className="stat">
      <div className={`stat__value ${accent ? 'stat__value--accent' : 'stat__value--default'}`}>{value ?? 0}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export default function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      <Stat label="Exercises" value={stats?.exerciseCount} />
      <Stat label="Sets" value={stats?.totalSets} />
    </div>
  );
}
