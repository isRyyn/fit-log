import React, { useState, useMemo, useRef } from 'react';
import Select from 'react-select';
import { CHEST_EXERCISES, BACK_EXERCISES, CORE_EXERCISES, LEG_EXERCISES, TRICEP_EXERCISES, BICEP_EXERCISES, BODYWEIGHT_EXERCISES, SHOULDER_EXERCISES, FOREARM_EXERCISES, CARDIO_EXERCISES } from '../constants/exercises';
import '../styles/WorkoutForm.css';
import '../styles/common.css';

const EXERCISES = {
  Bodyweight: BODYWEIGHT_EXERCISES,
  Chest: CHEST_EXERCISES,
  Triceps: TRICEP_EXERCISES,
  Back: BACK_EXERCISES,
  Biceps: BICEP_EXERCISES,
  Legs: LEG_EXERCISES,
  Shoulders: SHOULDER_EXERCISES, 
  Core: CORE_EXERCISES,
	Forearm: FOREARM_EXERCISES,
	Cardio: CARDIO_EXERCISES
}

const EQUIPMENT = ['Barbell','Dumbbell','Machine','Cable'];
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
  const [setsList, setSetsList] = useState(
    editingWorkout && Array.isArray(editingWorkout.sets) 
      ? editingWorkout.sets.map(s => ({ reps: s.reps, weight: s.weight?.toString() || '', unit: s.unit || 'kg', note: s.note || '' }))
      : []
  );
  const [currentReps, setCurrentReps] = useState(12);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentSetNote, setCurrentSetNote] = useState('');
  const [notes, setNotes] = useState(editingWorkout?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
	const weightRef = useRef(null);

	const exerciseOptions = useMemo(
  () =>
    Object.entries(EXERCISES).map(([group, exercises]) => ({
      label: group,
      options: exercises.map(exercise => ({
        value: exercise,
        label: exercise
      }))
    })),
  []
);

  const handleSubmit = async () => {
    if (!exercise) { setError('Select an exercise.'); return; }
    if (!equipment) { setError('Select equipment.'); return; }
    if (setsList.length === 0) { setError('Add at least one set.'); return; }
    if (!isExerciseBodyweight && setsList.some(s => !s.weight)) { setError('Enter weight for all sets (non-bodyweight).'); return; }
    setError('');
    setSubmitting(true);
    try {
      const body = { 
        date, 
        exercise, 
        muscleGroup: muscleFor(exercise), 
        equipment, 
        equipmentType, 
        sets: setsList.map(s => ({ ...s, weight: s.weight ? parseFloat(s.weight) : null })),
        unit: 'kg', 
        notes 
    };
      if (editingWorkout) {
        await onUpdate(editingWorkout.id, body);
      } else {
        await onAdd(body);
        setExercise(''); setEquipment(''); setEquipmentType(''); setCurrentReps(12); setCurrentWeight(''); setCurrentSetNote(''); setSetsList([]); setNotes('');
      }
    } catch(e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

	const isExerciseBodyweight = exercise && (EXERCISES.Bodyweight.includes(exercise) || EXERCISES.Core.includes(exercise) || EXERCISES.Cardio.includes(exercise));

  const addSet = () => {
    if (!isExerciseBodyweight && !currentWeight) { 
      setError('Enter weight before adding a set.'); 
      return; 
    }
    setError('');
    setSetsList([...setsList, { reps: currentReps, weight: currentWeight, unit: 'kg', note: currentSetNote }]);
    setCurrentWeight('');
    setCurrentReps(12);
    setCurrentSetNote('');
  };

  const removeSet = (index) => {
    setSetsList(setsList.filter((_, i) => i !== index));
  };

  const updateSet = (index, field, value) => {
    const updatedList = [...setsList];
    updatedList[index][field] = value;
    setSetsList(updatedList);
  };

  return (
    <div className="workout-form">
      <p className="workout-form__title">{editingWorkout ? 'Edit exercise' : 'Log exercise'}</p>

      {/* Exercise */}
      <div className="form-field">
        <label className="form-field__label">① Exercise</label>
        <Select
					options={exerciseOptions}
					value={
							exercise
							? { value: exercise, label: exercise }
							: null
					}
					placeholder="Select an exercise..."
					isSearchable
					className="exercise-select"
  				classNamePrefix="exercise"
					onChange={(selectedOption) => {
							const selectedExercise = selectedOption?.value || '';

							setExercise(selectedExercise);

							if (BODYWEIGHT_EXERCISES.includes(selectedExercise) || CORE_EXERCISES.includes(selectedExercise) || CARDIO_EXERCISES.includes(selectedExercise)) {
								setEquipment('Bodyweight');
							} else {
								setEquipment('Barbell');
								weightRef.current?.focus();
							}	
					}}
        />
      </div>

      {/* Equipment */}
      <div className="form-field">
        <label className="form-field__label">② Equipment or Grip Used</label>
        {!isExerciseBodyweight && <div className="form-field__equipment-group">
          {EQUIPMENT.map(eq => (
            <button
              key={eq}
              onClick={() => {
                setEquipment(eq);
								// Clear weight when selecting Bodyweight; leave as-is otherwise
                if (eq === 'Bodyweight') setCurrentWeight('');
              }}
              className={`form-field__equipment-btn ${equipment === eq ? 'form-field__equipment-btn--active' : ''}`}>
              {eq}
            </button>
          ))}
        </div>}
        <input type="text" value={equipmentType} onChange={e => setEquipmentType(e.target.value)} placeholder="Attachment/Grip (e.g., EZ bar, V bar)" maxLength={100} style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)', fontSize: '14px' }} />
      </div>

      {/* Add Set */}
      <div className="form-field">
        <label className="form-field__label">③ Add Set</label>
        <div className="form-field__row">
          <div>
            <div className="counter__label">Reps</div>
            <Counter value={currentReps} min={1} max={100} onChange={setCurrentReps} />
          </div>
          <div className="form-field__input-wrapper">
            <div className="counter__label">Weight kg</div>
            <input
						ref={weightRef}
              type="number"
              value={currentWeight}
              onChange={e => setCurrentWeight(e.target.value)}
              placeholder="e.g. 20"
              min="0"
              step="2.5"
              className="workout-form__weight-input"
            />
          </div>
          <div>
            <button onClick={addSet} className="workout-form__add-set">+</button>
          </div>
        </div>
        <input
          type="text"
          value={currentSetNote}
          onChange={e => setCurrentSetNote(e.target.value)}
					placeholder="Additional note"
          maxLength={80}
          className="workout-form__set-note-input"
        />
      </div>

      {/* Sets List */}
      {setsList.length > 0 && (
        <div className="form-field">
          <label className="form-field__label">Sets ({setsList.length})</label>
          <div className="sets-list">
            {setsList.map((set, idx) => (
              <div key={idx} className="sets-list__edit-inline">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <div className="counter__label" style={{ fontSize: '11px' }}>Reps</div>
                        <Counter value={set.reps} min={1} max={100} onChange={(val) => updateSet(idx, 'reps', val)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="counter__label" style={{ fontSize: '11px' }}>Weight</div>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={e => updateSet(idx, 'weight', e.target.value)}
                          placeholder={isExerciseBodyweight ? 'optional' : 'e.g. 20'}
                          min="0"
                          step="2.5"
                          disabled={isExerciseBodyweight}
                          className="workout-form__weight-input"
                        />
                      </div>
                    </div>
                    {set.note && <input
                      type="text"
                      value={set.note || ''}
                      onChange={e => updateSet(idx, 'note', e.target.value)}
                      maxLength={80}
                      className="workout-form__set-note-input"
                    />}
                  </div>
                  <button onClick={() => removeSet(idx)} className="sets-list__remove" title="Remove set">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="form-field">
        <label className="form-field__label">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" maxLength={500} />
      </div>

      {error && <p className="form-field__error">{error}</p>}

      <div className="workout__actions">
        <button onClick={handleSubmit} disabled={submitting} className="workout-form__submit">
         {submitting ? 'Saving...' : (editingWorkout ? '✎ Update' : '+ Log exercise')}
        </button>
      </div> 
    </div>
  );
}
