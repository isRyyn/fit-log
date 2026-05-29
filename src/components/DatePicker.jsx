import React from 'react';
import '../styles/DatePicker.css';

const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shift = (d, n) => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
const todayStr = () => new Date().toISOString().split('T')[0];

export default function DatePicker({ date, onChange }) {
  const isToday = date === todayStr();
  return (
    <div className="date-picker">
      <button onClick={() => onChange(shift(date, -1))} className="date-picker__nav-btn">‹</button>
      <div className="date-picker__input-wrapper">
        <input type="date" value={date} onChange={e => onChange(e.target.value)} className="date-picker__input" />
        <p className="date-picker__label">{fmt(date)}</p>
      </div>
      <button onClick={() => onChange(shift(date, 1))} disabled={isToday} className="date-picker__nav-btn">›</button>
      {!isToday && (
        <button onClick={() => onChange(todayStr())} className="date-picker__today-btn">
          Today
        </button>
      )}
    </div>
  );
}
