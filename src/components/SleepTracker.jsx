import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSleepLog } from '../hooks/useSleepLog.js';
import '../styles/WeightTracker.css';

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatSleep(hours, mins) {
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { date, hours, mins } = payload[0].payload;
  return (
    <div className="wt-tooltip">
      <span className="wt-tooltip__date">{formatDateFull(date)}</span>
      <span className="wt-tooltip__weight">{formatSleep(hours, mins)}</span>
    </div>
  );
};

export default function SleepTracker() {
  const { entries, loading, addEntry, removeEntry } = useSleepLog();
  const today = new Date().toISOString().split('T')[0];
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(mins) || 0;
    if (h === 0 && m === 0) { setError('Enter sleep duration.'); return; }
    if (h > 24 || m > 59) { setError('Invalid duration.'); return; }
    setError('');
    await addEntry(h, m, date);
    setHours(''); setMins(''); setDate(today);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await removeEntry(id);
    setDeleting(null);
  };

  const chartData = entries.slice(-30).map(e => ({
    ...e,
    totalHours: parseFloat((e.totalMins / 60).toFixed(2)),
  }));

  const latest = entries[entries.length - 1];
  const avg = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.totalMins, 0) / entries.length)
    : 0;

  return (
    <div className="wt">
      {/* Summary */}
      {latest && (
        <div className="wt__summary">
          <div className="wt__summary-card">
            <span className="wt__summary-value">{formatSleep(latest.hours, latest.mins)}</span>
            <span className="wt__summary-label">Last logged</span>
          </div>
          <div className="wt__summary-card">
            <span className="wt__summary-value">{formatSleep(Math.floor(avg / 60), avg % 60)}</span>
            <span className="wt__summary-label">Average</span>
          </div>
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
                domain={[0, 12]}
                tick={{ fontSize: 11, fill: 'var(--c-muted)' }}
                tickLine={false}
                axisLine={false}
                tickCount={5}
                tickFormatter={v => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="totalHours"
                stroke="#7c6aff"
                strokeWidth={2}
                dot={{ r: 3, fill: '#7c6aff', strokeWidth: 0 }}
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
            <span className="wt__add-label">Hours</span>
            <input
              className="wt__input-small"
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="Hr"
              min="0"
              max="24"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="wt__add-field">
            <span className="wt__add-label">Minutes</span>
            <input
              className="wt__input-small"
              type="number"
              value={mins}
              onChange={e => setMins(e.target.value)}
              placeholder="Min"
              min="0"
              max="59"
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

      {/* History */}
      {entries.length > 0 && (
        <div className="wt__list">
          {[...entries].reverse().slice(0, 10).map(entry => (
            <div key={entry.id} className="wt__entry">
              <span className="wt__entry-date">{formatDateFull(entry.date)}</span>
              <span className="wt__entry-weight">{formatSleep(entry.hours, entry.mins)}</span>
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
        <p className="wt__empty">No entries yet. Log your first sleep above.</p>
      )}
    </div>
  );
}