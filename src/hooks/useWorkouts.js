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
    
    // Check if an exercise with the same name and equipment exists on the same day
    const existing = workouts.find(w => w.exercise === body.exercise && w.equipment === body.equipment);
    
    if (existing) {
      // Add a new set to the existing workout instead of creating a new entry
      const newSet = {
        setNumber: existing.sets.length + 1,
        reps: Number(body.reps),
        weight: body.weight != null ? Number(body.weight) : null,
        unit: body.unit || 'kg',
      };
      const updated = {
        ...existing,
        sets: [...existing.sets, newSet],
      };
      const w = await WorkoutDB.update(existing.id, updated);
      await fetchAll();
      return w;
    } else {
      // Create a new workout entry
      const w = await WorkoutDB.create(user.uid, body);
      await fetchAll();
      return w;
    }
  }, [fetchAll, workouts, user]);

  const removeWorkout = useCallback(async (id) => {
    await WorkoutDB.delete(id);
    await fetchAll();
  }, [fetchAll]);

  const updateWorkout = useCallback(async (id, body) => {
    await WorkoutDB.update(id, body);
    await fetchAll();
  }, [fetchAll]);

  return { date, setDate, workouts, stats, loading, error, addWorkout, removeWorkout, updateWorkout, refetch: fetchAll };
}
