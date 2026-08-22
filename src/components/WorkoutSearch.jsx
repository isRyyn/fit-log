import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from '../hooks/useAuth.jsx';
import '../styles/WorkoutSearch.css';

const EQUIPMENT = ['Any', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'];

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDuration(mins, secs) {
  return `${String(mins ?? 0).padStart(2,'0')}:${String(secs ?? 0).padStart(2,'0')}`;
}

export default function WorkoutSearch({ onBack, onNavigate }) {
  const { user } = useAuth();
  const [query_text, setQueryText] = useState('');
  const [equipment, setEquipment] = useState('Any');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (!user || !query_text.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const term = query_text.trim().toLowerCase();
      const filtered = all.filter(w => {
        const matchesExercise = w.exercise?.toLowerCase().includes(term);
        const matchesEquipment = equipment === 'Any' || w.equipment === equipment;
        return matchesExercise && matchesEquipment;
      });
      setResults(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, query_text, equipment]);

  // Auto-search when equipment filter changes if already searched
  useEffect(() => {
    if (searched) search();
  }, [equipment]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div className="ws">
      <div className="ws__header">
        <button className="ws__back" onClick={onBack}>←</button>
        <input
          className="ws__input"
          type="text"
          value={query_text}
          onChange={e => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search exercise…"
          autoFocus
        />
        <button className="ws__search-btn" onClick={search}>
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </div>

      {/* Equipment filter */}
      <div className="ws__filters">
        {EQUIPMENT.map(eq => (
          <button
            key={eq}
            onClick={() => setEquipment(eq)}
            className={`ws__filter-btn ${equipment === eq ? 'ws__filter-btn--active' : ''}`}
          >
            {eq}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="ws__results">
        {loading && <p className="ws__empty">Searching…</p>}

        {!loading && searched && results.length === 0 && (
          <p className="ws__empty">No results found.</p>
        )}

        {!loading && results.map(w => {
          const isDuration = w.sets?.[0]?.type === 'duration' || w.sets?.[0]?.mins !== undefined;
          return (
            <div key={w.id} className="ws__result ws__result--clickable" onClick={() => onNavigate(w.date)}>
              <div className="ws__result-header">
                <span className="ws__result-exercise">{w.exercise}</span>
                <span className="ws__result-date">{formatDate(w.date)}</span>
              </div>
              <div className="ws__result-meta">
                <span className="ws__result-equipment">{w.equipment}</span>
                {w.equipmentType && <span className="ws__result-equipment-type">{w.equipmentType}</span>}
              </div>
              <div className="ws__result-sets">
                {w.sets?.map((s, i) => (
                  <span key={i} className={`ws__result-set ${s.isDropSet ? 'ws__result-set--drop' : ''}`}>
                    {isDuration
                      ? formatDuration(s.mins, s.secs)
                      : `${s.reps}×${s.weight ? `${s.weight}kg` : 'BW'}`}
                  </span>
                ))}
              </div>
              {w.notes && <p className="ws__result-notes">{w.notes}</p>}
            </div>
          );
        })}

        {!searched && (
          <p className="ws__empty">Type an exercise name and hit search.</p>
        )}
      </div>
    </div>
  );
}