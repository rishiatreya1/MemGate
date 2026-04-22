// Local fallback pool — used when the API is unavailable
const FALLBACK_POOL = [
  'neuron', 'cortex', 'synapse', 'photon', 'vector', 'signal', 'prism', 'helix',
  'plasma', 'quartz', 'proton', 'enzyme', 'genome', 'lattice', 'tensor', 'cipher',
  'glacier', 'canyon', 'lagoon', 'summit', 'tundra', 'mantle', 'delta', 'crater',
  'cavern', 'canopy', 'torrent', 'fossil', 'monsoon', 'quiver', 'burrow', 'current',
  'lantern', 'compass', 'anvil', 'candle', 'mirror', 'locket', 'column', 'vessel',
  'pulley', 'goblet', 'helmet', 'saddle', 'beacon', 'cinder', 'fulcrum', 'anchor',
  'falcon', 'lynx', 'otter', 'crane', 'bison', 'viper', 'tapir', 'marmot',
  'ferret', 'jackal', 'python', 'magpie', 'osprey', 'narwhal', 'serval', 'wombat',
  'marble', 'cobalt', 'nimbus', 'radiant', 'vertex', 'solvent', 'piston', 'orbit',
  'turban', 'casket', 'flagon', 'bridle', 'rampart', 'cloister', 'dowel', 'gimbal',
]

// Cache of API words so we don't re-fetch mid-game
let apiWordCache = []
let cacheExpiry  = 0   // epoch ms

/** Fetch a batch from the random-word API and populate the cache */
async function refreshCache(needed = 50) {
  try {
    const res = await fetch(
      `https://random-word-api.herokuapp.com/word?number=${needed}`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) throw new Error('non-2xx')
    const words = await res.json()
    // Keep only clean single alphabetic words (3–10 chars)
    const clean = words.filter(w => /^[a-z]{3,10}$/.test(w))
    if (clean.length >= Math.floor(needed / 2)) {
      apiWordCache = clean
      cacheExpiry  = Date.now() + 5 * 60 * 1000   // 5-minute TTL
    }
  } catch {
    // Network failure — cache stays empty; callers fall back to local pool
  }
}

/**
 * Return `count` unique random words.
 * Tries the API first; if the cache is cold it fetches in the background
 * while immediately returning words from the local pool so the game never blocks.
 */
export async function fetchWords(count) {
  // Warm the cache if stale
  if (Date.now() > cacheExpiry) {
    await refreshCache(Math.max(60, count * 4))
  }

  const pool = apiWordCache.length >= count ? apiWordCache : FALLBACK_POOL
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** Synchronous sample — used only as a last resort if async path isn't wired yet */
export function sampleWords(count) {
  const pool = apiWordCache.length >= count ? apiWordCache : FALLBACK_POOL
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}

/** Normalise a user-typed word for comparison */
export function normalise(word) {
  return word.trim().toLowerCase()
}
