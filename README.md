# Fit Log — PWA

A React PWA for tracking your gym workouts, built for mobile. All data is stored in **Firebase Firestore** (cloud, real-time). Supports Google, Email/Password, and Guest (anonymous) login.

---

## Quick start

```bash
npm install
cp .env.example .env      # add your Firebase config (see below)
npm run dev               # http://localhost:5173
```

To test PWA features (service worker, offline, install prompt), build and preview:
```bash
npm run build
npm run preview
```

---

## Environment variables

Create a `.env` file at the root with your Firebase project credentials:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Project structure

```
src/
├── components/
│   ├── DatePicker.jsx         # Date navigation
│   ├── DayTitle.jsx           # Auto-derived muscle group tags per day
│   ├── ExerciseHistory.jsx    # Full history screen for an exercise
│   ├── LoginPage.jsx          # Google / Email / Guest login
│   ├── PersonalRecords.jsx    # PR display and editing
│   ├── PRToast.jsx            # New PR detection toast notification
│   ├── StatsBar.jsx           # Daily summary (sets, reps, exercises)
│   ├── WeightTracker.jsx      # Body weight log + line chart
│   ├── WorkoutForm.jsx        # Log / edit exercise form
│   ├── WorkoutLog.jsx         # Daily workout list with reorder
│   └── WorkoutStats.jsx       # Monthly stats, heatmap, streaks
├── constants/
│   └── exercises.js           # Exercise lists grouped by muscle group
├── db/
│   └── firestore.js           # All Firestore CRUD operations
├── hooks/
│   ├── useAuth.jsx            # Firebase Auth state + login/logout
│   ├── useExerciseHistory.js  # Fetch all sessions for one exercise
│   ├── usePersonalRecords.js  # PR read/write (Firestore)
│   ├── useWeightLog.js        # Body weight entries (Firestore)
│   ├── useWorkouts.js         # Workout CRUD + reorder for selected date
│   └── useWorkoutStats.js     # Streak, heatmap, category breakdown
├── lib/
│   └── firebase.js            # Firebase app init + auth helpers
├── styles/                    # Per-component CSS files + common/global
├── App.jsx                    # 3-tab layout (Log / Add / Profile)
└── main.jsx                   # ReactDOM entry + SW registration
```

---

## Features

**Workout logging**
- Log exercises grouped by muscle group (Chest, Back, Legs, Shoulders, Biceps, Triceps, Core, Forearm, Cardio, Bodyweight)
- Per-set reps, weight, and optional grip/variation note
- Reorder exercises with up/down arrows
- Edit and delete individual entries
- Session tags auto-derived from logged muscle groups

**Exercise history**
- Inline last session preview when selecting an exercise
- One-tap "Repeat last session" to pre-fill sets from previous log
- Full history screen showing all past sessions for any exercise

**Personal Records**
- Track PRs for Bench Press, Deadlift, Squat, Overhead Press
- Auto-detection: notifies with a toast when a new PR is set
- PR rules: new weight > current PR, or same weight with higher reps
- Tap to save or dismiss; shows days since last PR update

**Stats & Progress**
- Monthly heatmap with prev/next month navigation
- Current streak, longest streak, days on break, total workouts logged
- Session category breakdown (e.g. Back × 4, Legs × 3)
- Body weight tracker with line chart and total change

**Auth**
- Google sign-in
- Email/Password (register + sign in)
- Guest/anonymous mode (data lost on sign out)

---

## Firebase setup

### 1. Create a project
Go to [firebase.google.com](https://firebase.google.com) → Add project → enable Firestore and Authentication.

### 2. Enable auth providers
Firebase Console → Authentication → Sign-in method → enable:
- Google
- Email/Password
- Anonymous

### 3. Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /workouts/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /dayTitles/{docId} {
      allow get: if request.auth != null;
      allow list: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create, update, delete: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /personalRecords/{docId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /weightLog/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 4. Firestore indexes
Some queries require composite indexes. Firebase will log a direct link to create each one when the query first runs — just click the link and hit **Create index**.

Required indexes:
- `workouts`: `userId` + `date` + `createdAt`
- `workouts`: `userId` + `exercise` + `date` + `createdAt`
- `weightLog`: `userId` + `date`

---

## Data model (Firestore)

### `workouts/{id}`
| Field         | Type    | Notes                                          |
|---------------|---------|------------------------------------------------|
| userId        | string  | Firebase Auth UID                              |
| date          | string  | YYYY-MM-DD                                     |
| exercise      | string  |                                                |
| muscleGroup   | string  | Chest / Back / Legs / Shoulders / etc.         |
| equipment     | string  | Barbell / Dumbbell / Machine / Cable / Bodyweight |
| equipmentType | string  | Optional grip/attachment note                  |
| sets          | array   | `[{ setNumber, reps, weight, unit, note }]`    |
| notes         | string  | Session-level note                             |
| sortOrder     | number  | Controls display order within a day            |
| createdAt     | timestamp |                                              |
| updatedAt     | timestamp |                                              |

### `personalRecords/{userId}_prs`
| Field   | Type   | Notes                        |
|---------|--------|------------------------------|
| userId  | string |                              |
| records | map    | `{ [exercise]: { weight, reps, date } }` |

### `weightLog/{id}`
| Field     | Type      | Notes             |
|-----------|-----------|-------------------|
| userId    | string    |                   |
| weight    | number    | kg                |
| date      | string    | YYYY-MM-DD        |
| createdAt | timestamp |                   |

---

## Installing on Android

1. Build and deploy (or run `npm run preview` on your local network)
2. Open Chrome on Android → navigate to your URL
3. Chrome shows **"Add to Home Screen"** banner, or tap ⋮ → *Install app*
4. App opens fullscreen like a native app

---

## Deployment

```bash
npm run build    # outputs to dist/
```

Deploy `dist/` to any static host:
- **Netlify** — drag and drop or `netlify deploy --dir dist`
- **Vercel** — `vercel --prod`
- **Firebase Hosting** — `firebase deploy`
- **Cloudflare Pages** — connect repo, build command `npm run build`