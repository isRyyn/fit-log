import React, { useState } from 'react';
import '../styles/WorkoutLog.css';
import '../styles/common.css';
import { HugeiconsIcon } from '@hugeicons/react';
import { EQ_COLOR } from '../constants/equipment';
import { calcExerciseVolume } from '../hooks/useWorkoutStats.js';

function formatDuration(mins, secs) {
  return `${String(mins ?? 0).padStart(2,'0')}:${String(secs ?? 0).padStart(2,'0')}`;
}

export default function WorkoutLog({ workouts, onDelete, onEdit, onReorder, loading }) {
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDeleteClick = (id) => setConfirmDelete(id);

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      setDeletingId(confirmDelete);
      try {
        await onDelete(confirmDelete);
      } finally {
        setDeletingId(null);
        setConfirmDelete(null);
      }
    }
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
      {workouts.map((w, idx) => {
        const eq = EQ_COLOR[w.equipment] || EQ_COLOR.Bodyweight;
        const deleting = deletingId === w.id;
        const isFirst = idx === 0;
        const isLast = idx === workouts.length - 1;
        const isDuration = w.sets?.[0]?.type === 'duration' || w.sets?.[0]?.mins !== undefined;
        const volume = calcExerciseVolume(w.sets || []);

        return (
          <div key={w.id} className={`workout-entry ${deleting ? 'workout-entry--deleting' : ''}`}>
            <div className="workout-entry__header">

              {/* Reorder arrows */}
              <div className="workout-entry__reorder">
                <button
                  className="workout-entry__reorder-btn"
                  onClick={() => onReorder(idx, idx - 1)}
                  disabled={isFirst}
                  title="Move up"
                >▲</button>
                <button
                  className="workout-entry__reorder-btn"
                  onClick={() => onReorder(idx, idx + 1)}
                  disabled={isLast}
                  title="Move down"
                >▼</button>
              </div>

              <div className="workout-entry__content">
                <div className="workout-entry__title-row">
                  <span className="workout-entry__exercise">{w.exercise}</span>
                  <span className="workout-entry__equipment" style={{ background: eq.bg, color: eq.color }}>
                    <HugeiconsIcon icon={eq.icon} size="15" />
                  </span>
                </div>
                {w.equipmentType && (
                  <p className="workout-entry__equipment-type">
                    <i className="fa-solid fa-paperclip"></i>
                    {w.equipmentType}
                  </p>
                )}
                <div className="workout-entry__sets" style={{ '--sets-margin': w.notes ? '6px' : 0 }}>
                  {w.sets.map((s, i) => (
                    <span key={s.setNumber ?? i} className={`workout-entry__set ${s.isDropSet ? 'workout-entry__set--drop' : ''}`}>
                      {isDuration
                        ? formatDuration(s.mins, s.secs)
                        : `${s.reps}×${s.weight ? `${s.weight}kg` : 'BW'}`}
                      {s.note && <em className="workout-entry__set-note">{s.note}</em>}
                    </span>
                  ))}
                </div>
                {volume > 0 && (
                  <p className="workout-entry__volume">
                    <i className="fa-solid fa-weight-hanging" style={{ marginRight: 5, opacity: 0.5 }}></i>
                    {Math.round(volume).toLocaleString()} kg
                  </p>
                )}
                {w.notes && (
                  <p className="workout-entry__notes">{w.notes}</p>
                )}
              </div>

              <div className="workout__actions">
                <button onClick={() => onEdit(w)} className="workout-entry__btn workout-entry__btn--edit" />
                <button onClick={() => handleDeleteClick(w.id)} disabled={deleting} className="workout-entry__btn workout-entry__btn--delete" />
              </div>
            </div>
          </div>
        );
      })}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Workout?</h3>
            <p className="modal-message">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="modal-btn modal-btn--confirm" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}