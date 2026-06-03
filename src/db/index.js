import { openDB } from 'idb';

const DB_NAME = 'fit-log';
const DB_VERSION = 1;

// ─── Open / migrate ───────────────────────────────────────────────────────────

let _db = null;

async function getDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        // workouts store
      const workouts = db.createObjectStore('workouts', { keyPath: 'id' });
      workouts.createIndex('by-date', 'date');
      workouts.createIndex('by-created', 'createdAt');
    },
  });
  return _db;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function computeVirtuals(workout) {
  const totalReps = workout.sets.reduce((a, s) => a + s.reps, 0);
  return { ...workout, totalReps };
}

function buildSets(body) {
  if (Array.isArray(body.sets)) {
    return body.sets.map((s, i) => ({
      setNumber: i + 1,
      reps: Number(s.reps),
      weight: s.weight != null ? Number(s.weight) : null,
      unit: s.unit || 'kg',
      note: s.note || '',
    }));
  }
  const count = parseInt(body.sets, 10);
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps: Number(body.reps),
    weight: body.weight != null ? Number(body.weight) : null,
    unit: body.unit || 'kg',
    note: '',
  }));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const WorkoutDB = {
  async getByDate(date) {
    const db = await getDB();
    const all = await db.getAllFromIndex('workouts', 'by-date', date);
    return all.map(computeVirtuals).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getAll() {
    const db = await getDB();
    const all = await db.getAll('workouts');
    return all.map(computeVirtuals).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  },

  async getById(id) {
    const db = await getDB();
    const w = await db.get('workouts', id);
    return w ? computeVirtuals(w) : null;
  },

  async create(body) {
    const db = await getDB();
    const workout = {
      id: randomId(),
      date: body.date,
      exercise: body.exercise,
      muscleGroup: body.muscleGroup || 'Other',
      equipment: body.equipment,
      sets: buildSets(body),
      notes: body.notes || '',
      createdAt: now(),
      updatedAt: now(),
    };
    await db.put('workouts', workout);
    return computeVirtuals(workout);
  },

  async update(id, body) {
    const db = await getDB();
    const existing = await db.get('workouts', id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...(body.date && { date: body.date }),
      ...(body.exercise && { exercise: body.exercise }),
      ...(body.muscleGroup && { muscleGroup: body.muscleGroup }),
      ...(body.equipment && { equipment: body.equipment }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.sets && { sets: buildSets(body) }),
      updatedAt: now(),
    };
    await db.put('workouts', updated);
    return computeVirtuals(updated);
  },

  async delete(id) {
    const db = await getDB();
    await db.delete('workouts', id);
  },

  async statsForDate(date) {
    const workouts = await WorkoutDB.getByDate(date);
    const totalSets = workouts.reduce((a, w) => a + w.sets.length, 0);
    const totalReps = workouts.reduce((a, w) => a + w.totalReps, 0);
    const byMuscleGroup = workouts.reduce((acc, w) => {
      acc[w.muscleGroup] = (acc[w.muscleGroup] || 0) + 1;
      return acc;
    }, {});
    return {
      date,
      exerciseCount: workouts.length,
      totalSets,
      totalReps,
      byMuscleGroup,
    };
  },

  // Full export for Drive backup
  async exportAll() {
    const workouts = await WorkoutDB.getAll();
    return {
      exportedAt: now(),
      version: 1,
      count: workouts.length,
      workouts,
    };
  },
};
