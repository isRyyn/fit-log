import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuth } from './useAuth.jsx';

export function useDayTitle(date) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const docId = user ? `${user.uid}_${date}` : null;

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    getDoc(doc(db, 'dayTitles', docId))
      .then(snap => {
        if (!snap.exists()) { setCategories([]); return; }
        const data = snap.data();
        // categories is the canonical field; fall back to [] for any old shape
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [docId]);

  const saveCategories = useCallback(async (values) => {
    if (!docId) return;
    const cleaned = [...new Set(values)].filter(Boolean);
    if (cleaned.length > 0) {
      await setDoc(doc(db, 'dayTitles', docId), { categories: cleaned, userId: user.uid, date });
    } else {
      await deleteDoc(doc(db, 'dayTitles', docId)).catch(() => {});
    }
    setCategories(cleaned);
  }, [docId, user, date]);

  return { categories, saveCategories, loading };
}