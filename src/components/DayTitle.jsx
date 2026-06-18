import React from 'react';
import '../styles/DayTitle.css';

export default function DayTitle({ workouts }) {
  // Derive tags from the muscle groups of exercises logged today, in order of first appearance
  const categories = [];
  for (const w of workouts) {
    const cat = w.muscleGroup;
    if (cat && cat !== 'Other' && !categories.includes(cat)) {
      categories.push(cat);
    }
  }

  if (categories.length === 0) return null;

  return (
    <div className="day-title">
      <span className="day-title__pills">
        {categories.map(cat => (
          <span key={cat} className="day-title__pill">{cat}</span>
        ))}
      </span>
    </div>
  );
}