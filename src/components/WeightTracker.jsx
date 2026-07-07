import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useWeightLog } from '../hooks/useWeightLog.js';
import '../styles/WeightTracker.css';

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { date, weight } = payload[0].payload;
  return (
    <div className="wt-tooltip">
      <span className="wt-tooltip__date">{formatDateFull(date)}</span>
      <span className="wt-tooltip__weight">{weight} kg</span>
    </div>
  );
};

export default function WeightTracker() {
  const { entries, loading, addEntry, removeEntry } = useWeightLog();
  const today = new Date().toISOString().split('T')[0];
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async () => {
    if (!weight || isNaN(parseFloat(weight))) { setError('Enter a valid weight.'); return; }
    if (!date) { setError('Pick a date.'); return; }
    setError('');
    await addEntry(weight, date);
    setWeight('');
    setDate(today);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await removeEntry(id);
    setDeleting(null);
  };

  // Chart data — last 30 entries max
  const chartData = entries.slice(-30);

  // Stats
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const change = latest && first && entries.length > 1
    ? (latest.weight - first.weight).toFixed(1)
    : null;

  const minWeight = chartData.length ? Math.min(...chartData.map(e => e.weight)) : 0;
  const maxWeight = chartData.length ? Math.max(...chartData.map(e => e.weight)) : 0;
  const yMin = Math.floor(minWeight - 2);
  const yMax = Math.ceil(maxWeight + 2);

  return (
    <div className="wt">

      {/* Summary row */}
      {latest && (
        <div className="wt__summary">
          <div className="wt__summary-card">
            <span className="wt__summary-value">{latest.weight}</span>
            <span className="wt__summary-label">Current (kg)</span>
          </div>
          {change !== null && (
            <div className="wt__summary-card">
              <span className={`wt__summary-value ${parseFloat(change) < 0 ? 'wt__summary-value--down' : parseFloat(change) > 0 ? 'wt__summary-value--up' : ''}`}>
                {parseFloat(change) > 0 ? '+' : ''}{change}
              </span>
              <span className="wt__summary-label">Total change (kg)</span>
            </div>
          )}
          <div className="wt__summary-card">
            <span className="wt__summary-value">{entries.length}</span>
            <span className="wt__summary-label">Entries</span>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="wt__chart">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: 'var(--c-muted)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 11, fill: 'var(--c-muted)' }}
                tickLine={false}
                axisLine={false}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--c-accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--c-accent)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add entry */}
      <div className="wt__add">
        <div className="wt__add-fields">
          <div className="wt__add-field">
            <span className="wt__add-label">Weight (kg)</span>
            <input
              className="wt__input"
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 74.5"
              min="0"
              step="0.1"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="wt__add-field">
            <span className="wt__add-label">Date</span>
            <input
              className="wt__input wt__input--date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <button className="wt__add-btn" onClick={handleAdd}>+</button>
        </div>
        {error && <p className="wt__error">{error}</p>}
      </div>

      {/* History list */}
      {entries.length > 0 && (
        <div className="wt__list">
          {[...entries].reverse().slice(0, 10).map(entry => (
            <div key={entry.id} className="wt__entry">
              <span className="wt__entry-date">{formatDateFull(entry.date)}</span>
              <span className="wt__entry-weight">{entry.weight} kg</span>
              <button
                className="wt__entry-delete"
                onClick={() => handleDelete(entry.id)}
                disabled={deleting === entry.id}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="wt__empty">No entries yet. Log your first weight above.</p>
      )}
    </div>
  );
}