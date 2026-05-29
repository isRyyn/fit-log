import { WorkoutDB } from '../db/index.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || null;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'gd_token';
const TOKEN_EXPIRY_KEY = 'gd_token_expiry';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
  if (!token || Date.now() > expiry) return null;
  return token;
}

function storeToken(token, expiresIn) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000 - 60_000));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isAuthorised() {
  return !!getStoredToken();
}

// ─── OAuth2 implicit flow (no backend needed) ─────────────────────────────────
// Uses Google Identity Services tokenClient for a popup-based token grant.
// Tokens are short-lived (1hr). Re-auth is triggered automatically when expired.

let _tokenClient = null;

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export async function authorise() {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set in .env');
  await loadGIS();

  return new Promise((resolve, reject) => {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) { reject(new Error(response.error)); return; }
        storeToken(response.access_token, response.expires_in);
        resolve(response.access_token);
      },
    });
    _tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

async function getToken() {
  const stored = getStoredToken();
  if (stored) return stored;
  return authorise(); // triggers popup if expired
}

// ─── Upload to Drive ──────────────────────────────────────────────────────────

async function uploadToDrive(token, fileName, jsonContent) {
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    ...(FOLDER_ID && { parents: [FOLDER_ID] }),
  };

  // Multipart upload
  const boundary = 'workout_boundary_' + Date.now();
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    jsonContent,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Drive upload failed (${res.status})`);
  }

  return res.json();
}

// ─── Public: export all workouts → Drive ─────────────────────────────────────

export async function syncToDrive() {
  const token = await getToken();
  const payload = await WorkoutDB.exportAll();
  const fileName = `workout-backup-${new Date().toISOString().split('T')[0]}.json`;
  const jsonContent = JSON.stringify(payload, null, 2);
  const file = await uploadToDrive(token, fileName, jsonContent);
  return { fileName: file.name, driveFileId: file.id, webViewLink: file.webViewLink, workoutCount: payload.count };
}

// ─── Public: restore from a JSON backup file ─────────────────────────────────

export async function restoreFromFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.workouts || !Array.isArray(data.workouts)) {
    throw new Error('Invalid backup file format');
  }
  let imported = 0;
  for (const w of data.workouts) {
    // create preserves original id so duplicates are idempotent via put()
    const { idb } = await import('../db/index.js');
    const db = await import('../db/index.js');
    await db.WorkoutDB.create(w); // will upsert via put
    imported++;
  }
  return { imported };
}
