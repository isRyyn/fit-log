import React, { useState } from 'react';
import { CHEST_EXERCISES, BACK_EXERCISES, CORE_EXERCISES, LEG_EXERCISES, TRICEP_EXERCISES, BICEP_EXERCISES, BODYWEIGHT_EXERCISES, SHOULDER_EXERCISES } from '../constants/exercises';
import '../styles/WorkoutForm.css';

const EXERCISES = {
  Bodyweight: BODYWEIGHT_EXERCISES,
  Chest: CHEST_EXERCISES,
  Triceps: TRICEP_EXERCISES,
  Back: BACK_EXERCISES,
  Biceps: BICEP_EXERCISES,
  Legs: LEG_EXERCISES,
  Shoulders: SHOULDER_EXERCISES, 
  Core: CORE_EXERCISES,
};
const EQUIPMENT = ['Barbell','Dumbbell','Machine','Bodyweight','Cable'];
const muscleFor = (ex) => { for (const [g,list] of Object.entries(EXERCISES)) if (list.includes(ex)) return g; return 'Other'; };

function Counter({ value, min, max, onChange }) {
  return (
    <div className="counter">
      <button onClick={() => onChange(Math.max(min, value-1))} className="counter__btn">−</button>
      <span className="counter__value">{value}</span>
      <button onClick={() => onChange(Math.min(max, value+1))} className="counter__btn">+</button>
    </div>
  );
}

export default function WorkoutForm({ date, onAdd, editingWorkout, onUpdate }) {
    
  const [exercise, setExercise] = useState(editingWorkout?.exercise || '');
  const [equipment, setEquipment] = useState(editingWorkout?.equipment || '');
  const [equipmentType, setEquipmentType] = useState(editingWorkout?.equipmentType || '');
  const [reps, setReps] = useState(editingWorkout?.reps || 10);
  const [sets, setSets] = useState(Array.isArray(editingWorkout?.sets) ? editingWorkout.sets.length : 1);
  const [weight, setWeight] = useState(editingWorkout?.weight?.toString() || '');
  const [notes, setNotes] = useState(editingWorkout?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!exercise) { setError('Select an exercise.'); return; }
    if (!equipment) { setError('Select equipment.'); return; }
    if (equipment !== 'Bodyweight' && !weight) { setError('Enter weight for non-bodyweight exercises.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const body = { date, exercise, muscleGroup: muscleFor(exercise), equipment, equipmentType, sets, reps, weight: weight ? parseFloat(weight) : null, unit:'kg', notes };
      if (editingWorkout) {
        await onUpdate(editingWorkout.id, body);
      } else {
        await onAdd(body);
        setExercise(''); setEquipment(''); setEquipmentType(''); setReps(10); setSets(3); setWeight(''); setNotes('');
      }
    } catch(e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="workout-form">
      <p className="workout-form__title">{editingWorkout ? 'Edit exercise' : 'Log exercise'}</p>

      {/* Exercise */}
      <div className="form-field">
        <label className="form-field__label">① Exercise</label>
        <select value={exercise} onChange={e => {
          setExercise(e.target.value);
          // Auto-select Bodyweight equipment if a bodyweight exercise is selected
          if (BODYWEIGHT_EXERCISES.includes(e.target.value)) {
            setEquipment('Bodyweight');
          } else {
            setEquipment(''); // Clear equipment selection for non-bodyweight exercises
          }
        }}>
          <option value="">— Select an exercise —</option>
          {Object.entries(EXERCISES).map(([g,list]) => (
            <optgroup key={g} label={g}>{list.map(ex => <option key={ex}>{ex}</option>)}</optgroup>
          ))}
        </select>
      </div>

      {/* Equipment */}
      <div className="form-field">
        <label className="form-field__label">② Equipment</label>
        <div className="form-field__equipment-group">
          {EQUIPMENT.map(eq => (
            <button
              key={eq}
              onClick={() => {
                setEquipment(eq);
                // Clear weight when selecting Bodyweight; leave as-is otherwise
                if (eq === 'Bodyweight') setWeight('');
              }}
              className={`form-field__equipment-btn ${equipment === eq ? 'form-field__equipment-btn--active' : ''}`}>
              {eq}
            </button>
          ))}
        </div>
        <input type="text" value={equipmentType} onChange={e => setEquipmentType(e.target.value)} placeholder="e.g., EZ bar, Smith machine (optional)" maxLength={100} style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)', fontSize: '14px' }} />
      </div>

      {/* Sets & Reps */}
      <div className="form-field">
        <label className="form-field__label">③ Sets &amp; Reps</label>
        <div className="form-field__row">
          <div>
            <div className="counter__label">Sets</div>
            <Counter value={sets} min={1} max={10} onChange={setSets} />
          </div>
          <div>
            <div className="counter__label">Reps/set</div>
            <Counter value={reps} min={1} max={100} onChange={setReps} />
          </div>
          <div className="form-field__input-wrapper">
            <div className="counter__label">Weight kg</div>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder={equipment === 'Bodyweight' ? 'optional' : 'e.g. 20'}
              min="0"
              step="2.5"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="form-field">
        <label className="form-field__label">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" maxLength={500} />
      </div>

      {error && <p className="form-field__error">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="workout-form__submit">
        {submitting ? 'Saving...' : (editingWorkout ? '✎ Update' : '+ Log exercise')}
      </button>
    </div>
  );
}
