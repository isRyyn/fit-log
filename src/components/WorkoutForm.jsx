import React, { useState, useMemo, useRef } from 'react';
import Select from 'react-select';
import { CHEST_EXERCISES, BACK_EXERCISES, CORE_EXERCISES, LEG_EXERCISES, TRICEP_EXERCISES, BICEP_EXERCISES, BODYWEIGHT_EXERCISES, SHOULDER_EXERCISES, FOREARM_EXERCISES, CARDIO_EXERCISES } from '../constants/exercises';
import { useExerciseHistory } from '../hooks/useExerciseHistory.js';
import { EQ_COLOR } from '../constants/equipment.js';
import '../styles/WorkoutForm.css';
import '../styles/ExerciseHistory.css';
import '../styles/common.css';
import { HugeiconsIcon } from '@hugeicons/react';

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

// Exercises that use duration (min:sec) instead of reps + weight
const DURATION_EXERCISES = [
	'Walking', 'Running', 'Cycling',
	'L-Sit', 'Plank',
	'Deadhang'
];

const EQUIPMENT = ['Barbell','Dumbbell','Machine','Cable'];
const muscleFor = (ex) => { for (const [g,list] of Object.entries(EXERCISES)) if (list.includes(ex)) return g; return 'Other'; };

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(mins, secs) {
  return `${String(mins ?? 0).padStart(2,'0')}:${String(secs ?? 0).padStart(2,'0')}`;
}

function LastSession({ exercise, onViewAll, onRepeat }) {
  const { history, loading } = useExerciseHistory(exercise);
  if (loading) return <div className="eh-inline"><span className="eh-inline__label">Loading last session…</span></div>;
  if (!history.length) return null;
  const last = history[0];
  const isDuration = last.sets?.[0]?.type === 'duration' || last.sets?.[0]?.mins !== undefined;
  const eq = EQ_COLOR[last.equipment] || EQ_COLOR.Bodyweight;

  return (
    <div className="eh-inline">
      <div className="eh-inline__header">
        <span className="eh-inline__label">Last session</span>
        <span className="eh-inline__date">{formatDate(last.date)}</span>
      </div>
      <div className="eh-inline__sets">
        {last.sets.map((s, i) => (
          <span key={i} className={s.isDropSet ? 'eh-inline__set drop-set-highlight' : 'eh-inline__set'}>
            {isDuration
              ? formatDuration(s.mins, s.secs)
              : `${s.reps}×${s.weight ? `${s.weight}kg` : 'BW'}`}
            {s.note && <em className="eh-inline__set-note">{s.note}</em>}
            <span className="eh-card__icon" style={{ background: eq.bg, color: eq.color }}>
                <HugeiconsIcon icon={eq.icon} size="15" />
            </span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <button className="eh-inline__view-all" onClick={onViewAll}>View full history →</button>
        <button className="eh-inline__view-all" onClick={() => onRepeat(last.sets)}>↩ Repeat last session</button>
      </div>
    </div>
  );
}

function Counter({ value, min, max, onChange }) {
  return (
    <div className="counter">
      <button onClick={() => onChange(Math.max(min, value-1))} className="counter__btn">−</button>
      <input type="number" className="counter__value" value={value} onChange={(e) => onChange(parseInt(e.target.value))} />
      <button onClick={() => onChange(Math.min(max, value+1))} className="counter__btn">+</button>
    </div>
  );
}

function DurationInput({ mins, secs, onMinsChange, onSecsChange }) {
  return (
    <div className="duration-input">
      <div className="duration-input__field">
        <div className="counter__label">Min</div>
        <Counter value={mins} min={0} max={99} onChange={onMinsChange} />
      </div>
      <span className="duration-input__sep">:</span>
      <div className="duration-input__field">
        <div className="counter__label">Sec</div>
        <Counter value={secs} min={0} max={59} onChange={onSecsChange} />
      </div>
    </div>
  );
}

export default function WorkoutForm({ date, onAdd, editingWorkout, onUpdate, onViewHistory }) {
  const [exercise, setExercise] = useState(editingWorkout?.exercise || '');
  const [equipment, setEquipment] = useState(editingWorkout?.equipment || '');
  const [equipmentType, setEquipmentType] = useState(editingWorkout?.equipmentType || '');
  const [setsList, setSetsList] = useState(
    editingWorkout && Array.isArray(editingWorkout.sets)
      ? editingWorkout.sets.map(s => s.type === 'duration' || s.mins !== undefined
          ? { mins: s.mins ?? 0, secs: s.secs ?? 0, note: s.note || '', type: 'duration', isDropSet: s.isDropSet || false }
          : { reps: s.reps, weight: s.weight?.toString() || '', unit: s.unit || 'kg', note: s.note || '', type: 'reps', isDropSet: s.isDropSet || false })
      : []
  );
  const [currentReps, setCurrentReps] = useState(12);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentMins, setCurrentMins] = useState(1);
  const [currentSecs, setCurrentSecs] = useState(0);
  const [currentSetNote, setCurrentSetNote] = useState('');
  const [isDropMode, setIsDropMode] = useState(false);
  const [notes, setNotes] = useState(editingWorkout?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const weightRef = useRef(null);

  const isDurationExercise = DURATION_EXERCISES.includes(exercise);
  const isExerciseBodyweight = !isDurationExercise && exercise &&
    (EXERCISES.Bodyweight.includes(exercise) || EXERCISES.Core.includes(exercise) || EXERCISES.Cardio.includes(exercise));

  const exerciseOptions = useMemo(
    () => Object.entries(EXERCISES).map(([group, exercises]) => ({
      label: group,
      options: exercises.map(exercise => ({ value: exercise, label: exercise }))
    })),
    []
  );

  const handleSubmit = async () => {
    if (!exercise) { setError('Select an exercise.'); return; }
    if (!equipment) { setError('Select equipment.'); return; }
    if (setsList.length === 0) { setError('Add at least one set.'); return; }
    if (!isDurationExercise && !isExerciseBodyweight && setsList.some(s => !s.weight)) {
      setError('Enter weight for all sets (non-bodyweight).'); return;
    }
    setError('');
    setSubmitting(true);
    try {
      const body = {
        date, exercise, muscleGroup: muscleFor(exercise), equipment, equipmentType,
        sets: setsList.map(s => s.type === 'duration'
          ? { mins: s.mins, secs: s.secs, note: s.note, type: 'duration' }
          : { ...s, weight: s.weight ? parseFloat(s.weight) : null }
        ),
        unit: 'kg', notes
      };
      if (editingWorkout) {
        await onUpdate(editingWorkout.id, body);
      } else {
        await onAdd(body);
        setExercise(''); setEquipment(''); setEquipmentType('');
        setCurrentReps(12); setCurrentWeight('');
        setCurrentMins(1); setCurrentSecs(0);
        setCurrentSetNote(''); setIsDropMode(false); setSetsList([]); setNotes('');
      }
    } catch(e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const addSet = () => {
    if (isDurationExercise) {
      if (currentMins === 0 && currentSecs === 0) { setError('Enter a duration greater than 0.'); return; }
      setError('');
      setSetsList([...setsList, { mins: currentMins, secs: currentSecs, note: currentSetNote, type: 'duration', isDropSet: isDropMode }]);
      setCurrentMins(1); setCurrentSecs(0); setCurrentSetNote('');
    } else {
      if (!isExerciseBodyweight && !currentWeight) { setError('Enter weight before adding a set.'); return; }
      setError('');
      setSetsList([...setsList, { reps: currentReps, weight: currentWeight, unit: 'kg', note: currentSetNote, type: 'reps', isDropSet: isDropMode }]);
      setCurrentWeight(''); setCurrentReps(12); setCurrentSetNote('');
    }
  };

  const removeSet = (index) => setSetsList(setsList.filter((_, i) => i !== index));

  const updateSet = (index, field, value) => {
    const updatedList = [...setsList];
    updatedList[index][field] = value;
    setSetsList(updatedList);
  };

  const handleRepeat = (sets) => {
    setSetsList(sets.map(s => s.type === 'duration' || s.mins !== undefined
      ? { mins: s.mins ?? 0, secs: s.secs ?? 0, note: s.note || '', type: 'duration', isDropSet: s.isDropSet || false }
      : { reps: s.reps, weight: s.weight?.toString() || '', unit: s.unit || 'kg', note: s.note || '', type: 'reps', isDropSet: s.isDropSet || false }
    ));
  };

  return (
    <div className="workout-form">
      <p className="workout-form__title">{editingWorkout ? 'Edit exercise' : 'Log exercise'}</p>

      {/* Exercise */}
      <div className="form-field">
        <label className="form-field__label">① Exercise</label>
        <Select
          options={exerciseOptions}
          value={exercise ? { value: exercise, label: exercise } : null}
          placeholder="Select an exercise..."
          isSearchable
          className="exercise-select"
          classNamePrefix="exercise"
          onChange={(selectedOption) => {
            const selectedExercise = selectedOption?.value || '';
            setExercise(selectedExercise);
            setSetsList([]);
            if (DURATION_EXERCISES.includes(selectedExercise) ||
                BODYWEIGHT_EXERCISES.includes(selectedExercise) ||
                CORE_EXERCISES.includes(selectedExercise) ||
                CARDIO_EXERCISES.includes(selectedExercise)) {
              setEquipment('Bodyweight');
            } else {
              setEquipment('Barbell');
              weightRef.current?.focus();
            }
          }}
        />
        {exercise && !editingWorkout && (
          <LastSession exercise={exercise} onViewAll={() => onViewHistory(exercise)} onRepeat={handleRepeat} />
        )}
      </div>

      {/* Equipment */}
      <div className="form-field">
        <label className="form-field__label">② Equipment or Grip Used</label>
        {!isExerciseBodyweight && !isDurationExercise && (
          <div className="form-field__equipment-group">
            {EQUIPMENT.map(eq => (
              <button key={eq} onClick={() => { setEquipment(eq); if (eq === 'Bodyweight') setCurrentWeight(''); }}
                className={`form-field__equipment-btn ${equipment === eq ? 'form-field__equipment-btn--active' : ''}`}>
                {eq}
              </button>
            ))}
          </div>
        )}
        <input type="text" value={equipmentType} onChange={e => setEquipmentType(e.target.value)}
          placeholder="Attachment/Grip (e.g., EZ bar, V bar)" maxLength={100}
          style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)', fontSize: '14px' }} />
      </div>

      {/* Add Set */}
      <div className="form-field">
        <div className='add-set-header'>
            <label className="form-field__label">③ Add Set</label>
            <div className="drop-mode-toggle-row">
            <button
                type="button"
                onClick={() => setIsDropMode(d => !d)}
                className={`drop-mode-toggle ${isDropMode ? 'drop-mode-toggle--active' : ''}`}
            >
                {isDropMode ? '🔴 Drop set' : 'Drop set'}
            </button>
            </div>
        </div>
        {isDurationExercise ? (
          <div className="form-field__row">
            <DurationInput
              mins={currentMins} secs={currentSecs}
              onMinsChange={setCurrentMins} onSecsChange={setCurrentSecs}
            />
						<div>
            <button onClick={addSet} className="workout-form__add-set">+</button>
						</div>	
          </div>
        ) : (
          <div className="form-field__row">
            <div>
              <div className="counter__label">Reps</div>
              <Counter value={currentReps} min={1} max={100} onChange={setCurrentReps} />
            </div>
            <div className="form-field__input-wrapper">
              <div className="counter__label">Weight kg</div>
              <input ref={weightRef} type="number" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)}
                placeholder="e.g. 20" min="0" step="2.5" className="workout-form__weight-input" />
            </div>
            <div>
            <button onClick={addSet} className="workout-form__add-set">+</button>
						</div>
          </div>
        )}
        <input type="text" value={currentSetNote} onChange={e => setCurrentSetNote(e.target.value)}
          placeholder="Additional note" maxLength={80} className="workout-form__set-note-input" />
      </div>

      {/* Sets List */}
      {setsList.length > 0 && (
        <div className="form-field">
          <label className="form-field__label">Sets ({setsList.length})</label>
          <div className="sets-list">
            {setsList.map((set, idx) => (
              <div key={idx} className={`sets-list__edit-inline ${set.isDropSet ? 'drop-set-highlight' : ''}`} style={{ alignItems: set.type === 'duration' ? 'center' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  {set.type === 'duration' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <Counter value={set.mins} min={0} max={99} onChange={val => updateSet(idx, 'mins', val)} />
                      </div>
                      <span style={{ fontSize: 20, color: 'var(--c-muted)', paddingBottom: 1 }}>:</span>
                      <div>
                        <Counter value={set.secs} min={0} max={59} onChange={val => updateSet(idx, 'secs', val)} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <Counter value={set.reps} min={1} max={100} onChange={(val) => updateSet(idx, 'reps', val)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="number" value={set.weight} onChange={e => updateSet(idx, 'weight', e.target.value)}
                          placeholder="(W)" min="0" step="2.5"
                          className="workout-form__weight-input" />
                      </div>
											{<input type="text" value={set.note || ''} onChange={e => updateSet(idx, 'note', e.target.value)}
                    maxLength={80} className="workout-form__set-note-input" />}
                    </div>
                  )}
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