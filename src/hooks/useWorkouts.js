import { useState, useEffect, useCallback } from 'react';
import { WorkoutDB } from '../db/firestore.js';
import { useAuth } from './useAuth.jsx';

const today = () => new Date().toISOString().split('T')[0];

export function useWorkouts() {
  const { user, isAuthenticated } = useAuth();
  const [date, setDate] = useState(today());
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [w, s] = await Promise.all([
        WorkoutDB.getByDate(user.uid, date),
        WorkoutDB.statsForDate(user.uid, date),
      ]);
      setWorkouts(w);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date, user, isAuthenticated]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addWorkout = useCallback(async (body) => {
    if (!user) throw new Error('User not authenticated');
    // Assign sortOrder as current max + 1
    const maxOrder = workouts.reduce((max, w) => Math.max(max, w.sortOrder ?? 0), 0);
    const w = await WorkoutDB.create(user.uid, { ...body, sortOrder: maxOrder + 1 });
    await fetchAll();
    return w;
  }, [fetchAll, user, workouts]);

  const removeWorkout = useCallback(async (id) => {
    await WorkoutDB.delete(id);
    await fetchAll();
  }, [fetchAll]);

  const updateWorkout = useCallback(async (id, body) => {
    await WorkoutDB.update(id, body);
    await fetchAll();
  }, [fetchAll]);

  const reorderWorkouts = useCallback(async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    // Optimistically reorder in state
    const reordered = [...workouts];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    // Assign new sortOrder values based on new positions
    const updated = reordered.map((w, i) => ({ ...w, sortOrder: i + 1 }));
    setWorkouts(updated);
    // Persist all affected sortOrders
    await Promise.all(updated.map(w => WorkoutDB.updateSortOrder(w.id, w.sortOrder)));
  }, [workouts]);

  return { date, setDate, workouts, stats, loading, error, addWorkout, removeWorkout, updateWorkout, reorderWorkouts, refetch: fetchAll };
}