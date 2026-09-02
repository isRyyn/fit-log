import React, { useState } from 'react';
import { useWorkoutStats } from '../hooks/useWorkoutStats.js';
import PersonalRecords from './PersonalRecords.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/WorkoutStats.css';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const VolumeTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { date, volume } = payload[0].payload;
  return (
    <div className="wt-tooltip">
      <span className="wt-tooltip__date">{formatDateFull(date)}</span>
      <span className="wt-tooltip__weight">{volume.toLocaleString()} kg</span>
    </div>
  );
};

function Heatmap({ allActiveDays, year, month }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="heatmap__cell heatmap__cell--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(
      <div key={d} className={`heatmap__cell ${allActiveDays.has(dateStr) ? 'heatmap__cell--active' : ''} ${dateStr === todayStr ? 'heatmap__cell--today' : ''}`} title={dateStr}>
        <span className="heatmap__day-num">{d}</span>
      </div>
    );
  }

  return (
    <div className="heatmap">
      <div className="heatmap__day-labels">
        {DAY_LABELS.map((l, i) => <span key={i} className="heatmap__day-label">{l}</span>)}
      </div>
      <div className="heatmap__grid">{cells}</div>
    </div>
  );
}

export default function WorkoutStats() {
  const { stats, loading } = useWorkoutStats();
  const [records, setRecords] = useState(false);
  const now = new Date();
  const [heatmapYear, setHeatmapYear] = useState(now.getFullYear());
  const [heatmapMonth, setHeatmapMonth] = useState(now.getMonth());

  const goToPrev = () => {
    if (heatmapMonth === 0) { setHeatmapMonth(11); setHeatmapYear(y => y - 1); }
    else setHeatmapMonth(m => m - 1);
  };

  const goToNext = () => {
    const isCurrentMonth = heatmapYear === now.getFullYear() && heatmapMonth === now.getMonth();
    if (isCurrentMonth) return;
    if (heatmapMonth === 11) { setHeatmapMonth(0); setHeatmapYear(y => y + 1); }
    else setHeatmapMonth(m => m + 1);
  };

  const isCurrentMonth = heatmapYear === now.getFullYear() && heatmapMonth === now.getMonth();

  if (loading) return <div className="workout-stats__loading">Loading stats…</div>;
  if (!stats) return null;

  const maxVolume = stats.volumeBySession.length
    ? Math.max(...stats.volumeBySession.map(v => v.volume))
    : 0;
  const yMax = Math.ceil(maxVolume / 1000) * 1000 + 500;

  return (
    <div className="workout-stats">

      {/* Personal Records */}
      <div className="workout-stats__section-label personal-records-label">
        <p>Personal Records</p>
        <div>
          {!records && <i className="fa-solid fa-circle-chevron-down" onClick={() => setRecords(true)}></i>}
          {records && <i className="fa-solid fa-circle-chevron-up" onClick={() => setRecords(false)}></i>}
        </div>
      </div>
      <div className={`pr-collapse ${records ? 'pr-collapse--open' : ''}`}>
        <PersonalRecords />
      </div>

      {/* Stat cards */}
      <p className="workout-stats__section-label" style={{ marginTop: 20 }}>This Month</p>
      <div className="workout-stats__grid">
        <div className="workout-stats__card">
          <span className="workout-stats__value">{stats.daysThisMonth}</span>
          <span className="workout-stats__label">Days this month</span>
        </div>
        <div className="workout-stats__card">
          <span className="workout-stats__value">{stats.daysOnBreak}</span>
          <span className="workout-stats__label">Days on break</span>
        </div>
        <div className="workout-stats__card">
          <span className="workout-stats__value">{stats.longestStreak}</span>
          <span className="workout-stats__label">Longest streak</span>
        </div>
        <div className="workout-stats__card">
          <span className="workout-stats__value">{stats.totalWorkouts}</span>
          <span className="workout-stats__label">Total logged</span>
        </div>
      </div>

      {/* Session breakdown */}
      {stats.titleSummary.length > 0 && (
        <div className="workout-stats__titles">
          <span className="workout-stats__top-muscle-label">Sessions this month</span>
          <div className="workout-stats__title-pills">
            {stats.titleSummary.map(([title, count]) => (
              <span key={title} className="workout-stats__title-pill">
                {title} <span className="workout-stats__title-count">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Volume trend chart */}
      {stats.volumeBySession.length >= 2 && (
        <>
          <p className="workout-stats__section-label" style={{ marginTop: 20 }}>Volume Trend</p>
          <div className="volume-chart">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.volumeBySession} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: 'var(--c-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fontSize: 11, fill: 'var(--c-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickCount={4}
                  tickFormatter={v => v >= 1000 ? `${v/1000}t` : v}
                />
                <Tooltip content={<VolumeTooltip />} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--c-accent)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--c-accent)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Heatmap with navigation */}
      <div className="heatmap__nav">
        <button className="heatmap__nav-btn" onClick={goToPrev}>‹</button>
        <span className="heatmap__nav-label">{MONTH_NAMES[heatmapMonth]} {heatmapYear}</span>
        <button className="heatmap__nav-btn" onClick={goToNext} disabled={isCurrentMonth}>›</button>
      </div>
      <Heatmap allActiveDays={stats.allActiveDays} year={heatmapYear} month={heatmapMonth} />

    </div>
  );
}