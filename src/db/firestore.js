import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';

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

export const WorkoutDB = {
  async getByDate(userId, date) {
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      where('date', '==', date),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...computeVirtuals(doc.data()),
    }));
    // Sort by sortOrder if present, fall back to createdAt order
    return docs.sort((a, b) => {
      const aOrder = a.sortOrder ?? Infinity;
      const bOrder = b.sortOrder ?? Infinity;
      return aOrder - bOrder;
    });
  },

  async getAll(userId) {
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...computeVirtuals(doc.data()),
    }));
  },

  async getById(id) {
    const docSnap = await getDocs(query(collection(db, 'workouts'), where('__name__', '==', id)));
    if (docSnap.empty) return null;
    const data = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      ...computeVirtuals(data),
    };
  },

  async create(userId, body) {
    const workout = {
      userId,
      date: body.date,
      exercise: body.exercise,
      muscleGroup: body.muscleGroup || 'Other',
      equipment: body.equipment,
      equipmentType: body.equipmentType || '',
      sets: buildSets(body),
      notes: body.notes || '',
      sortOrder: body.sortOrder ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'workouts'), workout);
    return {
      id: docRef.id,
      ...computeVirtuals(workout),
    };
  },

  async update(id, body) {
    const docRef = doc(db, 'workouts', id);
    const updates = {
      ...(body.date && { date: body.date }),
      ...(body.exercise && { exercise: body.exercise }),
      ...(body.muscleGroup && { muscleGroup: body.muscleGroup }),
      ...(body.equipment && { equipment: body.equipment }),
      ...(body.equipmentType !== undefined && { equipmentType: body.equipmentType }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.sets && { sets: buildSets(body) }),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, updates);
    // Return updated doc
    const snapshot = await getDocs(query(collection(db, 'workouts'), where('__name__', '==', id)));
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...computeVirtuals(data),
    };
  },

  async updateSortOrder(id, sortOrder) {
    const docRef = doc(db, 'workouts', id);
    await updateDoc(docRef, { sortOrder });
  },

  async delete(id) {
    const docRef = doc(db, 'workouts', id);
    await deleteDoc(docRef);
  },

  async statsForDate(userId, date) {
    const workouts = await WorkoutDB.getByDate(userId, date);
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

  async exportAll(userId) {
    const workouts = await WorkoutDB.getAll(userId);
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      count: workouts.length,
      workouts,
    };
  },
};
