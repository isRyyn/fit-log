import React, { useState } from 'react';
import '../styles/WorkoutForm.css';

const EXERCISES = {
  Chest:     ['Bench Press','Incline Bench Press','Chest Fly','Push Up','Cable Crossover'],
  Back:      ['Deadlift','Bent-over Row','Lat Pulldown','Cable Row','Pull Up','Face Pull'],
  Shoulders: ['Overhead Press','Lateral Raise','Front Raise','Arnold Press'],
  Arms:      ['Bicep Curl','Hammer Curl','Tricep Pushdown','Skull Crusher','Preacher Curl'],
  Legs:      ['Squat','Leg Press','Romanian Deadlift','Leg Curl','Leg Extension','Calf Raise','Bulgarian Split Squat'],
  Core:      ['Plank','Crunch','Cable Crunch','Hanging Leg Raise','Ab Wheel'],
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
    console.log('here', editingWorkout);
    
  const [exercise, setExercise] = useState(editingWorkout?.exercise || '');
  const [equipment, setEquipment] = useState(editingWorkout?.equipment || '');
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
      const body = { date, exercise, muscleGroup: muscleFor(exercise), equipment, sets, reps, weight: weight ? parseFloat(weight) : null, unit:'kg', notes };
      if (editingWorkout) {
        await onUpdate(editingWorkout.id, body);
      } else {
        await onAdd(body);
        setExercise(''); setEquipment(''); setReps(10); setSets(3); setWeight(''); setNotes('');
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
        <select value={exercise} onChange={e => setExercise(e.target.value)}>
          <option value="">— select —</option>
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
            <button key={eq} onClick={() => setEquipment(eq)} className={`form-field__equipment-btn ${equipment === eq ? 'form-field__equipment-btn--active' : ''}`}>
              {eq}
            </button>
          ))}
        </div>
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
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="optional" min="0" step="2.5" />
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
