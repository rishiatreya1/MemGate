# MemGate

> **Earn your distractions.** MemGate gates your most-visited time-sink sites behind a quick memory challenge. Pass the test, get 30 minutes of access. Skip the test, skip the site.

**Live app → [memgateofficial.web.app](https://memgateofficial.web.app)**

**Demo → (https://youtu.be/bW2NCtlvW0w?si=FXCbkwl7PoD_O_ND)**

---

## How it works

1. You add a site to your lock list (e.g. YouTube, Reddit, Twitter)
2. The Chrome extension intercepts any navigation to that site
3. You're redirected to a 60-second memory challenge
4. Score ≥ 60% → 30 minutes of access granted
5. Time's up → the gate resets

Difficulty adapts automatically based on your performance across sessions.

---

## Quick start — no setup needed

**You only need two things:**

### Step 1 — Sign in to the web app

Go to **[memgateofficial.web.app](https://memgateofficial.web.app)** and sign in with Google.

### Step 2 — Install the Chrome extension

1. [Download or clone this repo](https://github.com/rishiatreya1/MemGate)
2. Open Chrome and go to **`chrome://extensions`**
3. Toggle **Developer mode** on (top-right corner)
4. Click **Load unpacked**
5. Select the **`memgate-extension/`** folder from this repo
6. The MemGate extension icon will appear in your toolbar

> **Note:** The extension must stay installed and enabled for site blocking to work. You do not need to reload it after signing in.

### Step 3 — Add sites to your lock list

1. In the MemGate web app, go to **Lock Mode** (padlock icon in the nav)
2. Toggle **Enable Lock Mode** on
3. Type a site name (e.g. `youtube.com`) and click **Add**
4. Choose which game that site requires, or leave it on **Any game**

That's it. Next time you navigate to that site, the challenge gate will intercept it.

---

## The games

All three games appear at random when you hit a gated site. Your score must be **≥ 60%** to unlock access.

### N-Back — Working memory (30 seconds)

A letter flashes on screen every 1–2 seconds. You must identify when the **current letter or position matches the one shown N steps earlier**.

| Difficulty | Mode | Interval |
|---|---|---|
| Novice | Single (letter only) | 2.2s |
| Apprentice+ | Dual (letter + position) | 2.0s → 1.0s |

**Controls:**
- `L` — letter matches N steps ago
- `P` — position matches N steps ago *(dual mode)*
- `A` — letter does not match
- `S` — position does not match

The game ends when the **30-second timer** runs out. Your score is accuracy across all scoreable steps.

---

### Spatial Recall — Visuospatial memory (4 rounds)

Four rounds of increasing grid size. Each pattern is shown for **5 seconds** — memorize it, then click to reproduce it from memory.

| Round | Grid | Cells to remember |
|---|---|---|
| 1 | 3×3 | 3 |
| 2 | 4×4 | 5 |
| 3 | 6×6 | 10 |
| 4 | 12×12 | 18 |

Your **combined average** across all four rounds must reach 60% to pass.

**Color guide after submitting:**
- Green = correct cell
- Faded cyan = cell you missed
- Red = cell you selected that wasn't in the pattern

---

### Word Encoding — Episodic memory

1. **Study** — 20 seconds to memorize 8 common English words
2. **Distractor** — solve quick arithmetic problems for 10 seconds (designed to flush short-term memory)
3. **Recall** — 45 seconds to type back as many words as you can remember

Score = (words correctly recalled) / 8 × 100%.

**Bonus:** Recall all 8 words in under 30 seconds → Immediate Access unlocked (no timer).

---

## Features

- **Adaptive difficulty** — 5 levels (Novice → Master). Score ≥ 85% advances; < 55% drops you back.
- **Daily streak** — tracks consecutive days of training, synced to your account
- **Score history** — trend charts show your cognitive performance over time
- **Leaderboard** — see how your scores compare across sessions
- **Per-site game assignment** — lock YouTube to Word Recall, Reddit to N-Back, etc.
- **30-minute unlock window — pass once, browse freely for 30 minutes before the gate resets
- **Cross-device sync** — scores and settings stored in Firebase, available on any device you sign in to

---

## Chrome extension — detailed install

The extension is a local unpacked extension (not on the Chrome Web Store yet). Here is the full install flow:

```
1. Download this repo
   → Click "Code" → "Download ZIP" on GitHub, then unzip
   OR
   → git clone https://github.com/rishiatreya1/MemGate.git

2. Open Chrome
   → Type chrome://extensions in the address bar and press Enter

3. Enable Developer Mode
   → Toggle the switch in the top-right corner of the Extensions page

4. Load the extension
   → Click "Load unpacked"
   → Navigate to the unzipped/cloned folder
   → Select the memgate-extension/ subfolder
   → Click "Select Folder"

5. Confirm it's active
   → You should see "MemGate" appear in your extensions list
   → Pin it to your toolbar via the puzzle-piece icon if you want quick access

6. Sign in to the web app
   → Go to https://memgateofficial.web.app and sign in with Google
   → The extension reads your lock list from the app automatically
```

> **Troubleshooting:** If the extension isn't intercepting sites, make sure:
> - Lock Mode is toggled **on** in the app
> - The site is in your lock list with **enabled** toggled on
> - You are signed in to the web app in the same browser

---

## Developer setup

Only needed if you want to run or modify the code locally.

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore + Google Auth enabled

### Install and run

```bash
git clone https://github.com/rishiatreya1/MemGate.git
cd MemGate/memgate
npm install
```

Create a `.env` file in `memgate/`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

```bash
npm run dev        # start dev server at localhost:5173
npm run build      # production build → dist/
firebase deploy    # deploy to Firebase Hosting
```

For local extension testing, the manifest already includes `http://localhost:5173/*` as a content script match.

---

## Project structure

```
MemGate/
├── memgate/                    # React web app
│   ├── src/
│   │   ├── components/
│   │   │   ├── games/
│   │   │   │   ├── NBackGame.jsx
│   │   │   │   ├── SpatialRecallGame.jsx
│   │   │   │   └── WordRecallGame.jsx
│   │   │   ├── ChallengeGate.jsx   # shown when extension intercepts a site
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GameHub.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── LockMode.jsx
│   │   ├── utils/
│   │   │   ├── difficulty.js       # game params + adaptive difficulty
│   │   │   └── words.js            # word pool + dictionaryapi.dev validation
│   │   ├── contexts/AuthContext.jsx
│   │   └── config/firebase.js
│   └── memgate-extension/      # Chrome extension (load unpacked)
│       ├── manifest.json
│       ├── background.js       # intercepts navigation, manages unlock windows
│       └── content_script.js   # syncs settings, relays challenge-passed event
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Auth + DB | Firebase (Google Auth + Firestore) |
| Charts | Recharts |
| Word validation | [Free Dictionary API](https://dictionaryapi.dev/) |
| Hosting | Firebase Hosting |

---

## License

Rishi Atreya 
(thyrishi@gmail.com)
