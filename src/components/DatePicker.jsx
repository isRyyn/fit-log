import React from 'react';
import '../styles/DatePicker.css';

const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shift = (d, n) => { 
  const [year, month, day] = d.split('-').map(Number);
  const dt = new Date(year, month - 1, day);
  dt.setDate(dt.getDate() + n);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const dy = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
};
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
};

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
