import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from './useAuth.jsx';

export const PR_EXERCISES = ['Bench Press', 'Deadlift', 'Squat', 'Overhead Press'];

const todayStr = () => new Date().toISOString().split('T')[0];

export function usePersonalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);

  const docId = user ? `${user.uid}_prs` : null;

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    getDoc(doc(db, 'personalRecords', docId))
      .then(snap => setRecords(snap.exists() ? snap.data().records || {} : {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [docId]);

  const saveRecord = useCallback(async (exercise, weight, reps, date) => {
    if (!docId) return;
    // Always read latest from Firestore before writing to avoid race condition
    // overwriting other PRs with stale local state
    const snap = await getDoc(doc(db, 'personalRecords', docId));
    const latest = snap.exists() ? snap.data().records || {} : {};
    const updated = {
      ...latest,
      [exercise]: { weight: parseFloat(weight), reps: parseInt(reps), date },
    };
    await setDoc(doc(db, 'personalRecords', docId), { userId: user.uid, records: updated });
    setRecords(updated);
  }, [docId, user]);

  const clearRecord = useCallback(async (exercise) => {
    if (!docId) return;
    // Same — read latest before clearing to avoid wiping other PRs
    const snap = await getDoc(doc(db, 'personalRecords', docId));
    const latest = snap.exists() ? snap.data().records || {} : {};
    const updated = { ...latest };
    delete updated[exercise];
    await setDoc(doc(db, 'personalRecords', docId), { userId: user.uid, records: updated });
    setRecords(updated);
  }, [docId, user]);

  return { records, loading, saveRecord, clearRecord };
}