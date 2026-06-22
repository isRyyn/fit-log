import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from './useAuth.jsx';

export function useExerciseHistory(exerciseName) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user || !exerciseName) { setHistory([]); return; }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', user.uid),
        where('exercise', '==', exerciseName),
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, exerciseName]);

  useEffect(() => { fetch(); }, [fetch]);

  return { history, loading };
}