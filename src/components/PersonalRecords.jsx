import React, { useState } from 'react';
import { usePersonalRecords, PR_EXERCISES } from '../hooks/usePersonalRecords.js';
import '../styles/PersonalRecords.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function PRRow({ exercise, record, onSave, onClear }) {
  const today = new Date().toISOString().split('T')[0];
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [date, setDate] = useState(today);

  const startEdit = () => {
    setWeight(record?.weight?.toString() || '');
    setReps(record?.reps?.toString() || '');
    setDate(record?.date || today);
    setEditing(true);
  };

  const commit = async () => {
    if (!weight || !reps) return;
    await onSave(exercise, weight, reps, date);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  return (
    <div className="pr-row">
      <div className="pr-row__exercise">{exercise}</div>

      {editing ? (
        <div className="pr-row__edit">
          <div className="pr-row__edit-fields">
            <div className="pr-row__edit-field">
              <span className="pr-row__edit-label">kg</span>
              <input
                className="pr-row__input"
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 70"
                min="0"
                step="2.5"
                autoFocus
              />
            </div>
            <span className="pr-row__edit-sep">×</span>
            <div className="pr-row__edit-field">
              <span className="pr-row__edit-label">reps</span>
              <input
                className="pr-row__input"
                type="number"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder="e.g. 5"
                min="1"
              />
            </div>
            <div className="pr-row__edit-field">
              <span className="pr-row__edit-label">date</span>
              <input
                className="pr-row__input pr-row__input--date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="pr-row__edit-actions">
            <button className="pr-row__btn pr-row__btn--save" onClick={commit}>Save</button>
            <button className="pr-row__btn pr-row__btn--cancel" onClick={cancel}>Cancel</button>
            {record && <button className="pr-row__btn pr-row__btn--clear" onClick={() => { onClear(exercise); cancel(); }}>Clear</button>}
          </div>
        </div>
      ) : (
        <button className="pr-row__value" onClick={startEdit}>
          {record
            ? <>
                <span className="pr-row__weight">{record.weight}kg × {record.reps}</span>
                <span className="pr-row__date">Updated {formatDate(record.date)}</span>
              </>
            : <span className="pr-row__empty">— tap to set</span>
          }
        </button>
      )}
    </div>
  );
}

export default function PersonalRecords() {
  const { records, loading, saveRecord, clearRecord } = usePersonalRecords();

  if (loading) return <div className="pr__loading">Loading records…</div>;

  return (
    <div className="pr">
      {PR_EXERCISES.map(ex => (
        <PRRow
          key={ex}
          exercise={ex}
          record={records[ex] || null}
          onSave={saveRecord}
          onClear={clearRecord}
        />
      ))}
    </div>
  );
}