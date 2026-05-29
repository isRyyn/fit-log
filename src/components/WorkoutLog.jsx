import React, { useState } from 'react';
import '../styles/WorkoutLog.css';

const EQ_COLOR = {
  Barbell:    { bg:'rgba(55,138,221,0.12)', color:'#78b8f0' },
  Dumbbell:   { bg:'rgba(29,158,117,0.12)', color:'#5dcaa5' },
  Machine:    { bg:'rgba(186,117,23,0.12)',  color:'#efb840' },
  Bodyweight: { bg:'rgba(212,83,126,0.12)', color:'#ed93b1' },
  Cable:      { bg:'rgba(127,119,221,0.12)',color:'#afa9ec' },
  Other:      { bg:'rgba(136,135,128,0.12)',color:'#888880' },
};

export default function WorkoutLog({ workouts, onDelete, onEdit, loading }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); }
  };

  if (loading) return <div className="workout-log__loading">Loading…</div>;

  if (!workouts.length) return (
    <div className="workout-log__empty">
      <div className="workout-log__empty-icon">○</div>
      <p className="workout-log__empty-text">No exercises logged yet.</p>
    </div>
  );

  return (
    <div className="workout-log">
      {workouts.map(w => {
        const eq = EQ_COLOR[w.equipment] || EQ_COLOR.Other;
        const deleting = deletingId === w.id;
        return (
          <div key={w.id} className={`workout-entry ${deleting ? 'workout-entry--deleting' : ''}`}>
            <div className="workout-entry__header">
              <div className="workout-entry__content">
                <div className="workout-entry__title-row">
                  <span className="workout-entry__exercise">{w.exercise}</span>
                  <span className="workout-entry__equipment" style={{ background: eq.bg, color: eq.color }}>{w.equipment}</span>
                  <span className="workout-entry__muscle-group">{w.muscleGroup}</span>
                </div>
                <div className="workout-entry__sets" style={{ '--sets-margin': w.notes ? '6px' : 0 }}>
                  {w.sets.map(s => (
                    <span key={s.setNumber} className="workout-entry__set">
                      {s.reps}×{s.weight ? `${s.weight}kg` : 'BW'}
                    </span>
                  ))}
                </div>
                {w.notes && <p className="workout-entry__notes">{w.notes}</p>}
                {w.totalVolume > 0 && <p className="workout-entry__stats">{w.sets.length} sets · {w.totalReps} reps · {w.totalVolume} kg total</p>}
              </div>
              <div className="workout-entry__actions">
                <button onClick={() => onEdit(w)} className="workout-entry__btn workout-entry__btn--edit" />
                <button onClick={() => handleDelete(w.id)} disabled={deleting} className="workout-entry__btn workout-entry__btn--delete" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
