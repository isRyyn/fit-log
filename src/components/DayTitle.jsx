import React, { useState, useEffect, useRef } from 'react';
import { useDayTitle } from '../hooks/useDayTitle.js';
import '../styles/DayTitle.css';

export default function DayTitle({ date }) {
  const { title, setTitle, saveTitle, loading } = useDayTitle(date);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading) setDraft(title);
  }, [title, loading]);

  const startEditing = () => {
    setDraft(title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = async () => {
    setEditing(false);
    if (draft !== title) await saveTitle(draft);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { setEditing(false); setDraft(title); }
  };

  if (loading) return null;

  return (
    <div className="day-title">
      {editing ? (
        <input
          ref={inputRef}
          className="day-title__input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="Name this session…"
          maxLength={60}
        />
      ) : (
        <button className="day-title__display" onClick={startEditing}>
          {title
            ? <span className="day-title__text">{title}</span>
            : <span className="day-title__placeholder">+ Add session title</span>
          }
        </button>
      )}
    </div>
  );
}