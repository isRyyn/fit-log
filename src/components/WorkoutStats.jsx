import React, { useState } from 'react';
import { useWorkoutStats } from '../hooks/useWorkoutStats.js';
import PersonalRecords from './PersonalRecords.jsx';
import '../styles/WorkoutStats.css';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

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
  const [ records, setRecords ] = useState(false);
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

  return (
    <div className="workout-stats">

      {/* Personal Records */}
      <p className="workout-stats__section-label personal-records-label">
        Personal Records
        {!records && <i className="fa-solid fa-eye" onClick={() => setRecords(true)}></i>}
        {records && <i className="fa-solid fa-eye-slash" onClick={() => setRecords(false)}></i>}
        </p>
      {records && <PersonalRecords />}

      {/* Stat cards */}
      <p className="workout-stats__section-label" style={{ marginTop: 20 }}>This Month</p>
      <div className="workout-stats__grid">
        <div className="workout-stats__card">
          <span className="workout-stats__value">{stats.daysThisMonth}</span>
          <span className="workout-stats__label">Days this month</span>
        </div>
        <div className="workout-stats__card">
          <span className="workout-stats__value">{stats.currentStreak}</span>
          <span className="workout-stats__label">Current streak</span>
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