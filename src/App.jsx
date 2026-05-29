import React, { useState } from 'react';
import { useWorkouts } from './hooks/useWorkouts.js';
import DatePicker from './components/DatePicker.jsx';
import StatsBar from './components/StatsBar.jsx';
import WorkoutForm from './components/WorkoutForm.jsx';
import WorkoutLog from './components/WorkoutLog.jsx';
import DriveSyncPanel from './components/DriveSyncPanel.jsx';
import './styles/App.css';

const TAB = { LOG: 'log', ADD: 'add', SYNC: 'sync' };

export default function App() {
  const { date, setDate, workouts, stats, loading, error, addWorkout, removeWorkout, updateWorkout } = useWorkouts();
  const [tab, setTab] = useState(TAB.LOG);
  const [editingWorkout, setEditingWorkout] = useState(null);

  return (
    <div className="app">

      {/* Header */}
      <header className="app__header">
        <span className="app__header-logo">⊕</span>
        <span className="app__header-title">Workout Manager</span>
        <span className="app__header-info">PWA · offline</span>
      </header>

      {/* Scrollable content */}
      <div className="app__content">

        {tab === TAB.LOG && (
          <>
            <DatePicker date={date} onChange={setDate} />
            <StatsBar stats={stats} />
            {error && (
              <div className="app__error-banner">
                ⚠ {error}
              </div>
            )}
            <div className="app__section-header">
              <span className="app__section-title">Today's log</span>
              <span className="app__section-badge">
                {workouts.length} {workouts.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <WorkoutLog workouts={workouts} onDelete={removeWorkout} onEdit={(w) => { setEditingWorkout(w); setTab(TAB.ADD); }} loading={loading} />
          </>
        )}

        {tab === TAB.ADD && (
          <WorkoutForm date={date} onAdd={async (body) => { await addWorkout(body); setTab(TAB.LOG); }} editingWorkout={editingWorkout} onUpdate={async (id, body) => { await updateWorkout(id, body); setEditingWorkout(null); setTab(TAB.LOG); }} />
        )}

        {tab === TAB.SYNC && (
          <div style={{ padding:'8px 0' }}>
            <div style={{ padding:'16px 16px 0' }}>
              <p style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--c-muted)', fontWeight:600, marginBottom:10 }}>Storage</p>
              <div style={{ background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'var(--radius-lg)', padding:'14px 16px' }}>
                <p style={{ fontSize:14, color:'var(--c-text)', fontWeight:500, marginBottom:4 }}>IndexedDB — on device</p>
                <p style={{ fontSize:13, color:'var(--c-muted)' }}>All workouts are stored locally on your Android. No internet required.</p>
              </div>
            </div>
            <DriveSyncPanel />
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <nav className="app__nav">
        {[
          { key: TAB.LOG,  label: 'Log',  icon: '○' },
          { key: TAB.ADD,  label: 'Add',  icon: '+' },
          { key: TAB.SYNC, label: 'Sync', icon: '↑' },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`app__nav-btn ${tab === key ? 'app__nav-btn--active' : ''}`}>
            <span className={`app__nav-icon ${key === TAB.ADD ? 'app__nav-icon--add' : ''}`}>{icon}</span>
            <span className="app__nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
