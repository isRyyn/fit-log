import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from './useAuth.jsx';

export function useSleepLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sleepLog'),
        where('userId', '==', user.uid),
        orderBy('date', 'asc')
      );
      const snap = await getDocs(q);
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addEntry = useCallback(async (hours, mins, date) => {
    if (!user) return;
    const entry = {
      userId: user.uid,
      hours: parseInt(hours),
      mins: parseInt(mins),
      totalMins: parseInt(hours) * 60 + parseInt(mins),
      date,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'sleepLog'), entry);
    setEntries(prev => [...prev, { id: ref.id, ...entry }].sort((a, b) => a.date.localeCompare(b.date)));
  }, [user]);

  const removeEntry = useCallback(async (id) => {
    await deleteDoc(doc(db, 'sleepLog', id));
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return { entries, loading, addEntry, removeEntry };
}