import React from 'react';
import { useWorkoutStats } from '../hooks/useWorkoutStats.js';
import PersonalRecords from './PersonalRecords.jsx';
import '../styles/WorkoutStats.css';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function Heatmap({ activeDays }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="heatmap__cell heatmap__cell--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today.toISOString().split('T')[0];
    const isActive = activeDays.has(dateStr);
    cells.push(
      <div 
        key={d} 
        className={`heatmap__cell ${isActive ? 'heatmap__cell--active' : ''} ${isToday ? 'heatmap__cell--today' : ''}`} 
        title={dateStr}
     >
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

  if (loading) return <div className="workout-stats__loading">Loading stats…</div>;
  if (!stats) return null;

  return (
    <div className="workout-stats">

      {/* Personal Records */}
      <p className="workout-stats__section-label">Personal Records</p>
      <PersonalRecords />

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

      {/* Session title breakdown */}
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

      {/* Heatmap */}
      <p className="workout-stats__section-label" style={{ marginTop: 20 }}>
        {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
      </p>
      <Heatmap activeDays={stats.activeDaysThisMonth} />
    </div>
  );
}