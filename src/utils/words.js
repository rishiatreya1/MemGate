// Curated pool of common everyday English words
const WORD_POOL = [
  'apple', 'beach', 'chair', 'dance', 'earth', 'flame', 'grape', 'heart',
  'juice', 'knife', 'lemon', 'music', 'night', 'ocean', 'paint', 'smile',
  'table', 'uncle', 'voice', 'water', 'bread', 'clock', 'dream', 'field',
  'glass', 'horse', 'light', 'money', 'noise', 'olive', 'plane', 'river',
  'stone', 'tiger', 'wheel', 'candy', 'eagle', 'faith', 'giant', 'happy',
  'magic', 'power', 'rebel', 'tower', 'amber', 'blaze', 'crane', 'drift',
  'ember', 'frost', 'ivory', 'jewel', 'maple', 'orbit', 'pearl', 'ridge',
  'shade', 'arrow', 'brush', 'cabin', 'ferry', 'hotel', 'mango', 'pasta',
  'ranch', 'sauce', 'trend', 'value', 'watch', 'brave', 'bloom', 'coast',
  'crown', 'feast', 'fruit', 'grace', 'guard', 'habit', 'honey', 'honor',
  'human', 'judge', 'learn', 'level', 'lodge', 'match', 'medal', 'metal',
  'model', 'month', 'motor', 'mouse', 'movie', 'nerve', 'north', 'novel',
  'nurse', 'alarm', 'angel', 'badge', 'basil', 'blade', 'blood', 'bonus',
  'brain', 'brand', 'chess', 'child', 'claim', 'clean', 'clear', 'cliff',
  'cloud', 'coach', 'cobra', 'coral', 'count', 'court', 'cover', 'craft',
  'crazy', 'creek', 'crisp', 'cross', 'crush', 'cycle', 'daisy', 'delta',
  'depth', 'digit', 'diner', 'dodge', 'donor', 'doubt', 'draft', 'drain',
  'drape', 'early', 'entry', 'error', 'event', 'exact', 'exile', 'extra',
  'fable', 'fence', 'fiber', 'final', 'first', 'fixed', 'flood', 'floor',
  'focus', 'force', 'forge', 'forum', 'found', 'frank', 'fresh', 'front',
  'frost', 'funds', 'funny', 'gauge', 'ghost', 'glare', 'globe', 'gloom',
]

// Validate a word using the Free Dictionary API
async function isRealWord(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      { signal: AbortSignal.timeout(3000) }
    )
    return res.ok
  } catch {
    return true  // assume valid if API is unreachable
  }
}

/**
 * Pick `count` words from the pool, validated against dictionaryapi.dev.
 * Falls back to the local pool directly if all API calls fail.
 */
export async function fetchWords(count) {
  const shuffled   = [...WORD_POOL].sort(() => Math.random() - 0.5)
  const candidates = shuffled.slice(0, count * 3)  // 3x buffer in case some fail

  try {
    const valid = []
    const checks = await Promise.all(candidates.map(isRealWord))
    candidates.forEach((w, i) => { if (checks[i]) valid.push(w) })
    if (valid.length >= count) return valid.slice(0, count)
  } catch {
    // fall through
  }

  return shuffled.slice(0, count)
}

export function sampleWords(count) {
  return [...WORD_POOL].sort(() => Math.random() - 0.5).slice(0, count)
}

export function normalise(word) {
  return word.trim().toLowerCase()
}
