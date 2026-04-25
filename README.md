# MemGate

A cognitive training web app that acts as a paywall for distraction. Complete three memory games to unlock access to the sites you want to visit — rewiring your brain's relationship with impulsive browsing.

Built with React + Vite + Firebase + Tailwind CSS.

---

## What it does

Before you can access a blocked site, you have to earn it. MemGate puts three cognitive challenges between you and the distraction:

| Game | Tests | Mechanic |
|---|---|---|
| **N-Back** | Working memory | Identify when a letter/position matches N steps ago — 30 second game |
| **Spatial Recall** | Visuospatial memory | Memorise a 4×4 grid pattern (5s), recall it; if you pass, tackle a harder 6×6 with two sequential flashes |
| **Word Encoding** | Episodic memory | Study a word list for 15s, complete a math distractor, then free-recall as many words as possible |

Difficulty adapts based on your performance (1–5). Scores and streaks are synced to Firebase so your progress persists across devices.

---

## Features

- **Chrome Extension** — intercepts blocked sites and redirects to the challenge gate
- **Adaptive difficulty** — scores ≥ 85% advance difficulty; < 55% drops it
- **Streak tracking** — daily training streak with Firebase sync
- **Leaderboard** — compare scores across sessions
- **Lock Mode** — manage which sites require a cognitive challenge to unlock
- **Immediate Access bonus** — 100% word recall in under 30s skips the gate entirely

---

## Stack

- **React 18** + **Vite**
- **Firebase** (Auth + Firestore)
- **Tailwind CSS**
- **Recharts** for score trend charts

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/memgate.git
cd memgate
npm install
```

### 2. Firebase config

Create a `.env` file in the `memgate/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run locally

```bash
npm run dev
```

### 4. Deploy (Firebase Hosting)

```bash
npm run build
firebase deploy
```

---

## Chrome Extension

The `memgate-extension/` folder contains a Chrome extension that intercepts navigation to blocked sites.

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `memgate-extension/` folder
4. The extension will redirect blocked sites to your MemGate app URL with a `?challenge=` param

---

## Games — detailed rules

### N-Back (30 seconds)
A letter flashes at a grid position every 1–2.2 seconds depending on difficulty. Press:
- `L` — letter matches N steps ago
- `P` — position matches N steps ago (dual mode)
- `A` / `S` — no match (single / dual mode)

The game ends when the 30-second timer runs out. Positions never repeat on consecutive steps, ensuring uniform grid coverage.

### Spatial Recall
**Round 1 (4×4):** Six cells light up for 5 seconds. Click to reproduce the pattern. Score ≥ 60% to unlock Round 2.

**Round 2 (6×6):** Two separate patterns flash sequentially, 5 seconds each. Reproduce the combined pattern from memory. Final score is the average of both rounds.

### Word Encoding
- 15 seconds to study the word list
- 10-second math distractor (arithmetic problems)
- 45 seconds to free-recall as many words as possible
- All words are common everyday English words

---

## Project structure

```
memgate/
├── src/
│   ├── components/
│   │   ├── games/
│   │   │   ├── NBackGame.jsx
│   │   │   ├── SpatialRecallGame.jsx
│   │   │   └── WordRecallGame.jsx
│   │   ├── layout/
│   │   ├── Dashboard.jsx
│   │   ├── GameHub.jsx
│   │   ├── Leaderboard.jsx
│   │   └── LockMode.jsx
│   ├── utils/
│   │   ├── difficulty.js   # game params + adaptive difficulty logic
│   │   └── words.js        # word pool for Word Encoding game
│   ├── contexts/AuthContext.jsx
│   ├── hooks/
│   └── config/firebase.js
memgate-extension/          # Chrome extension
expo-app/                   # Mobile app (Expo / React Native)
```

---
