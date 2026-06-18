import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { WorkoutDB } from '../db/firestore.js';
import { db } from '../lib/firebase.js';
import { useAuth } from './useAuth.jsx';

function computeStats(workouts, dayTitleDocs) {
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
    const lastDay = allDays[allDays.length - 1];
    const lastDate = new Date(lastDay);
    const diffFromToday = Math.floor((today - lastDate) / 86400000);

    // Streak is alive if last workout was today or yesterday
    if (diffFromToday <= 1) {
      currentStreak = 1;
      for (let i = allDays.length - 2; i >= 0; i--) {
        const curr = new Date(allDays[i + 1]);
        const prev = new Date(allDays[i]);
        const gap = Math.floor((curr - prev) / 86400000);
        if (gap === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let runningStreak = allDays.length > 0 ? 1 : 0;
  for (let i = 1; i < allDays.length; i++) {
    const curr = new Date(allDays[i]);
    const prev = new Date(allDays[i - 1]);
    const gap = Math.floor((curr - prev) / 86400000);
    if (gap === 1) {
      runningStreak++;
    } else {
      longestStreak = Math.max(longestStreak, runningStreak);
      runningStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, runningStreak);

  // Active days set for heatmap
  const activeDaysThisMonth = new Set(thisMonthDays);

  // Category tag counts for this month (e.g. Back - 3, Push - 3, Legs - 5)
  const categoryCounts = {};
  for (const { date, categories } of dayTitleDocs) {
    const dt = new Date(date);
    if (dt.getFullYear() === year && dt.getMonth() === month && Array.isArray(categories)) {
      for (const cat of categories) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }
  }
  const titleSummary = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return {
    daysThisMonth: thisMonthDays.length,
    currentStreak,
    longestStreak,
    totalWorkouts: workouts.length,
    titleSummary,
    activeDaysThisMonth,
  };
}

export function useWorkoutStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      WorkoutDB.getAll(user.uid),
      getDocs(query(collection(db, 'dayTitles'), where('userId', '==', user.uid))),
    ])
      .then(([workouts, titleSnap]) => {
        const dayTitleDocs = titleSnap.docs.map(d => d.data());
        setStats(computeStats(workouts, dayTitleDocs));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return { stats, loading };
}