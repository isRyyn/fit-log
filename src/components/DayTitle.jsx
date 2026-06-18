import React, { useState, useRef, useEffect } from 'react';
import { useDayTitle } from '../hooks/useDayTitle.js';
import '../styles/DayTitle.css';

const CATEGORIES = ['Bodyweight', 'Chest', 'Triceps', 'Back', 'Biceps', 'Legs', 'Shoulders', 'Core', 'Forearm'];

export default function DayTitle({ date }) {
  const { categories, saveCategories, loading } = useDayTitle(date);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (cat) => {
    if (categories.includes(cat)) {
      saveCategories(categories.filter(c => c !== cat));
    } else {
      saveCategories([...categories, cat]);
    }
  };

  if (loading) return null;

  return (
    <div className="day-title" ref={containerRef}>
      <button className="day-title__display" onClick={() => setOpen(o => !o)}>
        {categories.length > 0 ? (
          <span className="day-title__pills">
            {categories.map(cat => (
              <span key={cat} className="day-title__pill">{cat}</span>
            ))}
          </span>
        ) : (
          <span className="day-title__placeholder">+ Tag this session</span>
        )}
      </button>

      {open && (
        <div className="day-title__dropdown">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`day-title__option ${categories.includes(cat) ? 'day-title__option--selected' : ''}`}
              onClick={() => toggle(cat)}
            >
              <span className="day-title__checkbox">{categories.includes(cat) ? '✓' : ''}</span>
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}