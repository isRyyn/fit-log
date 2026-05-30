# Fit Log — PWA (offline-first)

A React PWA that runs entirely on your Android phone. No backend server.
All workout data is stored in **IndexedDB** on-device. Optional **Google Drive** backup on demand.

---

## Quick start

```bash
npm install
cp .env.example .env      # add your Google Client ID for Drive sync (optional)
npm run dev               # http://localhost:3000
```

To test PWA features (service worker, offline, install prompt), build and preview:
```bash
npm run build
npm run preview           # http://localhost:4173
```

---

## Project structure

```
src/
├── db/
│   └── index.js          # All IndexedDB operations (via idb)
├── sync/
│   └── driveSync.js      # Google Drive OAuth + upload (browser-only)
├── hooks/
│   ├── useWorkouts.js    # CRUD against IndexedDB
│   └── useDriveSync.js   # Drive auth state + export
├── components/
│   ├── DatePicker.jsx
│   ├── StatsBar.jsx
│   ├── WorkoutForm.jsx
│   ├── WorkoutLog.jsx
│   └── DriveSyncPanel.jsx
├── styles/global.css
├── App.jsx               # 3-tab mobile layout (Log / Add / Sync)
└── main.jsx              # SW registration + ReactDOM
```

---

## Installing on Android

1. Build and deploy (or run `npm run preview` on your local network)
2. Open Chrome on Android → navigate to your URL
3. Chrome shows **"Add to Home Screen"** banner, or tap ⋮ → *Install app*
4. App opens fullscreen like a native app, works offline

---

## Google Drive backup (optional)

Only needed if you want cloud backup. All workout data works without it.

### 1. Google Cloud Console setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → new project
2. Enable **Google Drive API** under *APIs & Services → Library*
3. *APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID*
4. Application type: **Web application**
5. Add **Authorised JavaScript origins**:
   - `http://localhost:3000` (dev)
   - `https://your-deployed-domain.com` (prod)
6. No redirect URI needed — uses implicit/token flow (popup)
7. Copy **Client ID** → paste into `.env` as `VITE_GOOGLE_CLIENT_ID`

### 2. Using the sync

1. Go to the **Sync** tab in the app
2. Tap **Connect Google Drive** — a Google popup appears
3. Authorise the app (only requests `drive.file` scope — can only see files it creates)
4. Tap **Backup to Drive** — uploads a timestamped JSON file

The access token is stored in `localStorage` and expires after 1 hour.
Tapping backup again re-authorises automatically via popup if needed.

---

## Data model (IndexedDB)

**Object store: `workouts`**

| Field        | Type    | Notes                                      |
|--------------|---------|--------------------------------------------|
| id           | string  | UUID (crypto.randomUUID)                   |
| date         | string  | YYYY-MM-DD, indexed                        |
| exercise     | string  |                                            |
| muscleGroup  | string  | Chest / Back / Shoulders / Arms / Legs / Core / Other |
| equipment    | string  | Barbell / Dumbbell / Machine / Bodyweight / Cable |
| sets         | array   | [{setNumber, reps, weight, unit}]          |
| notes        | string  |                                            |
| createdAt    | string  | ISO datetime                               |
| updatedAt    | string  | ISO datetime                               |

---

## Deployment (host the static build anywhere)

```bash
npm run build    # outputs to dist/
```

Deploy `dist/` to:
- **Netlify** — drag and drop or `netlify deploy --dir dist`
- **Vercel** — `vercel --prod`
- **GitHub Pages** — push `dist/` to `gh-pages` branch
- **Cloudflare Pages** — connect repo, build command `npm run build`

All free. No server needed.
