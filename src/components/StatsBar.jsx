import React from 'react';
import { calcExerciseVolume } from '../hooks/useWorkoutStats.js';
import '../styles/StatsBar.css';

function Stat({ label, value, accent }) {
  return (
    <div className="stat">
      <div className={`stat__value ${accent ? 'stat__value--accent' : 'stat__value--default'}`}>{value ?? 0}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function formatVolume(kg) {
  if (!kg) return '0';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}`;
}

export default function StatsBar({ stats, workouts }) {
  const totalVolume = workouts
    ? workouts.reduce((sum, w) => sum + calcExerciseVolume(w.sets || []), 0)
    : 0;

  return (
    <div className="stats-bar">
      <Stat label="Exercises" value={stats?.exerciseCount} />
      <Stat label="Sets" value={stats?.totalSets} />
      <Stat label="Volume (kg)" value={formatVolume(Math.round(totalVolume))} accent={totalVolume > 0} />
    </div>
  );
}