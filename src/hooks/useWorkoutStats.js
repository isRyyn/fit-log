import { useState, useEffect } from 'react';
import { WorkoutDB } from '../db/firestore.js';
import { useAuth } from './useAuth.jsx';

export function calcExerciseVolume(sets) {
  return sets.reduce((total, s) => {
    if (s.type === 'duration' || s.mins !== undefined) return total;
    const w = parseFloat(s.weight);
    const r = parseInt(s.reps);
    if (!w || !r) return total;
    return total + w * r;
  }, 0);
}

function computeStats(workouts) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Unique workout days (sorted ascending)
  const allDays = [...new Set(workouts.map(w => w.date))].sort();

  // Days worked out this month
  const thisMonthDays = allDays.filter(d => {
    const dt = new Date(d);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });

  // Current streak
  let currentStreak = 0;
  if (allDays.length > 0) {
    const lastDate = new Date(allDays[allDays.length - 1]);
    const diffFromToday = Math.floor((today - lastDate) / 86400000);
    if (diffFromToday <= 1) {
      currentStreak = 1;
      for (let i = allDays.length - 2; i >= 0; i--) {
        const gap = Math.floor((new Date(allDays[i + 1]) - new Date(allDays[i])) / 86400000);
        if (gap === 1) currentStreak++;
        else break;
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let runningStreak = allDays.length > 0 ? 1 : 0;
  for (let i = 1; i < allDays.length; i++) {
    const gap = Math.floor((new Date(allDays[i]) - new Date(allDays[i - 1])) / 86400000);
    if (gap === 1) runningStreak++;
    else { longestStreak = Math.max(longestStreak, runningStreak); runningStreak = 1; }
  }
  longestStreak = Math.max(longestStreak, runningStreak);

  // All active days as a Set (used by heatmap for any month)
  const allActiveDays = new Set(allDays);

  // Days on break — 0 if streak is alive, else days since last workout
  // Use local date strings to avoid UTC timezone offset issues
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysOnBreak = allDays.length === 0 ? 0 : (() => {
    const [ly, lm, ld] = allDays[allDays.length - 1].split('-').map(Number);
    const lastLocal = new Date(ly, lm - 1, ld);
    const diff = Math.floor((todayLocal - lastLocal) / 86400000);
    return diff <= 1 ? 0 : diff;
  })();

  // Category counts for this month
  const categoriesByDate = {};
  for (const w of workouts) {
    const dt = new Date(w.date);
    if (dt.getFullYear() !== year || dt.getMonth() !== month) continue;
    if (!w.muscleGroup || w.muscleGroup === 'Other') continue;
    if (!categoriesByDate[w.date]) categoriesByDate[w.date] = new Set();
    categoriesByDate[w.date].add(w.muscleGroup);
  }
  const categoryCounts = {};
  for (const catsSet of Object.values(categoriesByDate)) {
    for (const cat of catsSet) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }
  const titleSummary = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // Volume per session — group by date, sum across exercises, skip duration
  const volumeMap = {};
  for (const w of workouts) {
    const vol = calcExerciseVolume(w.sets || []);
    if (vol > 0) volumeMap[w.date] = (volumeMap[w.date] || 0) + vol;
  }
  const volumeBySession = Object.entries(volumeMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([date, volume]) => ({ date, volume: Math.round(volume) }));

  return {
    daysThisMonth: thisMonthDays.length,
    currentStreak,
    longestStreak,
    totalWorkouts: workouts.length,
    daysOnBreak,
    titleSummary,
    allActiveDays,
    volumeBySession,
  };
}

export function useWorkoutStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    WorkoutDB.getAll(user.uid)
      .then(workouts => setStats(computeStats(workouts)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return { stats, loading };
}