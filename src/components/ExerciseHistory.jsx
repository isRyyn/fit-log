import React from 'react';
import { useExerciseHistory } from '../hooks/useExerciseHistory.js';
import '../styles/ExerciseHistory.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SessionCard({ session, highlight }) {
  return (
    <div className={`eh-card ${highlight ? 'eh-card--highlight' : ''}`}>
      <div className="eh-card__header">
        <span className="eh-card__date">{formatDate(session.date)}</span>
        {highlight && <span className="eh-card__badge">Last session</span>}
        {session.equipmentType && <span className="eh-card__equipment">{session.equipmentType}</span>}
      </div>
      <div className="eh-card__sets">
        {session.sets.map((s, i) => (
          <span key={i} className="eh-card__set">
            {s.reps}×{s.weight ? `${s.weight}kg` : 'BW'}
            {s.note && <em className="eh-card__set-note">{s.note}</em>}
          </span>
        ))}
      </div>
      {session.notes && <p className="eh-card__notes">{session.notes}</p>}
    </div>
  );
}

export default function ExerciseHistory({ exerciseName, onBack }) {
  const { history, loading } = useExerciseHistory(exerciseName);

  return (
    <div className="eh">
      <div className="eh__header">
        <button className="eh__back" onClick={onBack}>← Back</button>
        <span className="eh__title">{exerciseName}</span>
      </div>

      {loading && <p className="eh__empty">Loading…</p>}

      {!loading && history.length === 0 && (
        <p className="eh__empty">No history found for this exercise.</p>
      )}

      {!loading && history.length > 0 && (
        <div className="eh__list">
          {history.map((session, idx) => (
            <SessionCard key={session.id} session={session} highlight={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
}