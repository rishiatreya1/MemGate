const WORD_POOL = [
  'apple', 'beach', 'chair', 'dance', 'earth', 'flame', 'grape', 'heart',
  'juice', 'knife', 'lemon', 'music', 'night', 'ocean', 'paint', 'smile',
  'table', 'uncle', 'voice', 'water', 'bread', 'clock', 'dream', 'field',
  'glass', 'horse', 'light', 'money', 'noise', 'olive', 'plane', 'river',
  'stone', 'tiger', 'wheel', 'candy', 'eagle', 'faith', 'giant', 'happy',
  'magic', 'noble', 'power', 'rebel', 'solar', 'tower', 'amber', 'blaze',
  'crane', 'drift', 'ember', 'frost', 'ivory', 'jewel', 'lunar', 'maple',
  'orbit', 'pearl', 'ridge', 'shade', 'thorn', 'arrow', 'brush', 'cabin',
  'ferry', 'hotel', 'mango', 'pasta', 'ranch', 'sauce', 'trend', 'value',
  'watch', 'brave', 'bloom', 'brook', 'coast', 'crown', 'feast', 'flute',
  'fluid', 'fruit', 'grace', 'grant', 'grave', 'greet', 'guard', 'guide',
  'habit', 'haven', 'honey', 'honor', 'human', 'humor', 'ideal', 'judge',
  'layer', 'learn', 'ledge', 'level', 'linen', 'lodge', 'loyal', 'lunar',
  'match', 'medal', 'merit', 'metal', 'model', 'month', 'moral', 'motor',
  'mouse', 'mouth', 'movie', 'nerve', 'north', 'novel', 'nurse', 'occur',
]

export async function fetchWords(count) {
  const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function sampleWords(count) {
  return [...WORD_POOL].sort(() => Math.random() - 0.5).slice(0, count)
}

export function normalise(word) {
  return word.trim().toLowerCase()
}
