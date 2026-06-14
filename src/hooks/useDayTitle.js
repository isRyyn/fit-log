import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from './useAuth.jsx';

export function useDayTitle(date) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const docId = user ? `${user.uid}_${date}` : null;

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    getDoc(doc(db, 'dayTitles', docId))
      .then(snap => setTitle(snap.exists() ? snap.data().title : ''))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [docId]);

  const saveTitle = useCallback(async (value) => {
    if (!docId) return;
    const trimmed = value.trim();
    if (trimmed) {
      await setDoc(doc(db, 'dayTitles', docId), { title: trimmed, userId: user.uid, date });
    } else {
      await deleteDoc(doc(db, 'dayTitles', docId)).catch(() => {});
    }
    setTitle(trimmed);
  }, [docId, user, date]);

  return { title, setTitle, saveTitle, loading };
}