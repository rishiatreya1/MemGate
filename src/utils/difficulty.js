export const DIFFICULTIES = {
  1: { label: 'Novice',       color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  2: { label: 'Apprentice',   color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/30'    },
  3: { label: 'Practitioner', color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30'  },
  4: { label: 'Expert',       color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30'  },
  5: { label: 'Master',       color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30'     },
}

export function adaptDifficulty(currentLevel, score) {
  if (score >= 85) return Math.min(5, currentLevel + 1)
  if (score < 55)  return Math.max(1, currentLevel - 1)
  return currentLevel
}

// Dual N-back: starts at 2-back, advances to 4-back
export const NBACK_PARAMS = {
  1: { N: 2, length: 14, stimMs: 2200, dual: false },
  2: { N: 2, length: 18, stimMs: 2000, dual: true  },
  3: { N: 3, length: 20, stimMs: 1600, dual: true  },
  4: { N: 4, length: 24, stimMs: 1300, dual: true  },
  5: { N: 4, length: 28, stimMs: 1000, dual: true  },
}

// Spatial recall: 3×3 → 12×12
// Level 2 (4×4) and level 3 (6×6) share the same 5s study window — same time, more cells = higher intensity
export const SPATIAL_PARAMS = {
  1: { size: 3,  cells: 3,  studyMs: 3000, sequential: false },
  2: { size: 4,  cells: 6,  studyMs: 5000, sequential: false },
  3: { size: 6,  cells: 12, studyMs: 5000, sequential: true  },
  4: { size: 8,  cells: 20, studyMs: 3500, sequential: true  },
  5: { size: 12, cells: 30, studyMs: 2000, sequential: true  },
}

// Word recall: 5s encoding, 10s math distractor
export const WORD_PARAMS = {
  1: { count: 6,  studyMs: 5000, distractors: 2, distractorMs: 10000 },
  2: { count: 8,  studyMs: 5000, distractors: 3, distractorMs: 10000 },
  3: { count: 10, studyMs: 5000, distractors: 4, distractorMs: 10000 },
  4: { count: 12, studyMs: 5000, distractors: 5, distractorMs: 10000 },
  5: { count: 15, studyMs: 5000, distractors: 6, distractorMs: 10000 },
}

export const GAME_META = {
  nback: {
    id: 'nback',
    title: 'N-Back',
    subtitle: 'Working memory',
    description: 'Identify when the current stimulus matches the one shown N steps back.',
    icon: 'nback',
    accent: 'cyan',
  },
  spatial: {
    id: 'spatial',
    title: 'Spatial Recall',
    subtitle: 'Visuospatial memory',
    description: 'Memorize the lit grid pattern, then reproduce it from memory.',
    icon: 'spatial',
    accent: 'violet',
  },
  word: {
    id: 'word',
    title: 'Word Encoding',
    subtitle: 'Episodic memory',
    description: 'Study a word list, survive a distractor task, then free-recall as many as you can.',
    icon: 'word',
    accent: 'amber',
  },
}