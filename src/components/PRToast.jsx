import React, { useEffect } from 'react';
import '../styles/PRToast.css';

export default function PRToast({ pr, onSave, onDismiss }) {
  // Auto-dismiss after 10 seconds if user ignores it
  useEffect(() => {
    const t = setTimeout(onDismiss, 10000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!pr) return null;

  return (
    <div className="pr-toast">
      <div className="pr-toast__icon">🎉</div>
      <div className="pr-toast__body">
        <span className="pr-toast__title">New PR — {pr.exercise}!</span>
        <span className="pr-toast__detail">{pr.weight}kg × {pr.reps}</span>
      </div>
      <div className="pr-toast__actions">
        <button className="pr-toast__btn pr-toast__btn--save" onClick={onSave}>Save PR</button>
        <button className="pr-toast__btn pr-toast__btn--dismiss" onClick={onDismiss}>✕</button>
      </div>
    </div>
  );
}