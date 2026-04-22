import { useState, useMemo } from 'react'
import { DIFFICULTIES } from '../utils/difficulty'

// Deterministically generate stable fake community players
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const FAKE_NAMES = [
  'n_pioneer', 'axon_flux', 'recall_pro', 'mnemonic_x',
  'theta_wave', 'synapse77', 'cortex_k', 'alpha_drift',
  'memory_lab', 'delta_node', 'grid_mind', 'flux_recall',
  'engram_rx', 'peak_hz', 'deep_loop', 'trace_mem',
  'neural_one', 'encode_d', 'bitwise_b', 'seq_runner',
  'rapid_mem', 'spike_io', 'recall_q', 'mindframe',
  'pattern_x', 'wm_core', 'latent_pf', 'trace_back',
]

function buildLeaderboard(userScore, userStreak, userDifficulty) {
  const rng = seededRand(42)
  const entries = FAKE_NAMES.slice(0, 20).map((name, i) => {
    const score  = Math.round(55 + rng() * 45)
    const streak = Math.round(1 + rng() * 30)
    const diff   = Math.round(1 + rng() * 4)
    const rank   = computeRankScore(score, streak, diff)
    return { id: i, name, score, streak, diff, rank }
  })

  const userRankScore = computeRankScore(userScore, userStreak, userDifficulty)
  entries.push({ id: 99, name: 'You', score: userScore, streak: userStreak, diff: userDifficulty, rank: userRankScore, isUser: true })
  entries.sort((a, b) => b.rank - a.rank)

  const userPos  = entries.findIndex(e => e.isUser)
  const total    = entries.length
  const topPct   = Math.round(((userPos + 1) / total) * 100)

  return { entries, userPos, total, topPct }
}

function computeRankScore(avgScore, streak, difficulty) {
  return avgScore * 0.6 + Math.min(streak * 3, 30) * 0.2 + difficulty * 4 * 0.2
}

function tierLabel(topPct) {
  if (topPct <= 5)  return { label: 'Apex',       color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30'  }
  if (topPct <= 15) return { label: 'Elite',       color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30'   }
  if (topPct <= 35) return { label: 'Advanced',    color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/30' }
  if (topPct <= 60) return { label: 'Developing',  color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/30'}
  return                   { label: 'Beginner',    color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-700'       }
}

function buildShareText(topPct, streak, nVal) {
  const tier = tierLabel(topPct)
  return `Just primed my brain with a ${nVal}-back streak on MemGate. Connectivity Rank: Top ${topPct}%. ${tier.label} tier · ${streak} day streak · memgate.app`
}

function RankRow({ entry, position, isUser }) {
  const diff = DIFFICULTIES[entry.diff] ?? DIFFICULTIES[1]
  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
      isUser ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-gray-800/50'
    }`}>
      <div className={`w-6 text-center text-sm font-bold tabular-nums ${
        position === 0 ? 'text-yellow-400' :
        position === 1 ? 'text-gray-300'   :
        position === 2 ? 'text-orange-400' :
        isUser         ? 'text-cyan-400'   : 'text-gray-600'
      }`}>
        {position + 1}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'font-semibold text-cyan-300' : 'text-gray-300'} text-sm truncate`}>
        {isUser ? '→ You' : entry.name}
      </div>

      <div className={`text-xs font-medium ${diff.color} hidden sm:block`}>{diff.label}</div>

      <div className="flex items-center gap-1 text-orange-400 text-xs">
        <span>⚡</span><span>{entry.streak}d</span>
      </div>

      <div className={`w-12 text-right font-semibold tabular-nums text-sm ${
        entry.score >= 80 ? 'text-emerald-400' :
        entry.score >= 60 ? 'text-yellow-400'  : 'text-red-400'
      }`}>
        {entry.score}%
      </div>
    </div>
  )
}

export default function Leaderboard({ scores, streak, difficulty }) {
  const [copied, setCopied] = useState(false)

  const avgScore = scores.length
    ? Math.round(scores.slice(-10).reduce((s, r) => s + r.score, 0) / Math.min(scores.length, 10))
    : 50

  const nVal = difficulty >= 4 ? 4 : difficulty >= 3 ? 3 : 2

  const { entries, userPos, total, topPct } = useMemo(
    () => buildLeaderboard(avgScore, streak.count, difficulty),
    [avgScore, streak.count, difficulty]
  )

  const tier = tierLabel(topPct)

  // Show a window of ~5 rows around the user
  const windowStart = Math.max(0, Math.min(userPos - 2, entries.length - 7))
  const visible = entries.slice(windowStart, windowStart + 7)

  async function copyShare() {
    const text = buildShareText(topPct, streak.count, nVal)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy your share text:', text)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Global Connectivity Rank</h2>
          <p className="text-gray-500 text-sm mt-0.5">MemGate Community · {total} active users</p>
        </div>
        <button className="btn-secondary text-sm px-3 flex-shrink-0" onClick={copyShare}>
          {copied ? 'Copied ✓' : '⎘ Share'}
        </button>
      </div>

      {/* Rank card */}
      <div className={`card p-5 ${tier.border} ${tier.bg}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${tier.bg} ${tier.color} border ${tier.border}`}>
            {userPos + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-2xl font-bold ${tier.color}`}>Top {topPct}%</span>
              <span className={`badge text-xs ${tier.bg} ${tier.color} ${tier.border} border`}>{tier.label}</span>
            </div>
            <div className="text-gray-400 text-sm mt-0.5">
              Rank #{userPos + 1} of {total} · avg {avgScore}% · {streak.count}d streak
            </div>
          </div>
        </div>

        {/* Rank progress bar */}
        <div className="mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${100 - topPct}%`, background: `linear-gradient(90deg, #22d3ee, #a78bfa)` }}
          />
        </div>
        <div className="flex justify-between text-gray-700 text-xs mt-1">
          <span>Top 1%</span><span>Bottom</span>
        </div>
      </div>

      {/* Leaderboard rows */}
      <div className="card p-4 space-y-0.5">
        <div className="flex items-center justify-between px-3 pb-2 border-b border-gray-800 mb-1">
          <div className="text-gray-600 text-xs uppercase tracking-wider">Rank</div>
          <div className="flex gap-6 text-gray-600 text-xs uppercase tracking-wider">
            <span>Streak</span><span>Score</span>
          </div>
        </div>

        {/* Top 3 always visible */}
        {entries.slice(0, 3).map((e, i) => (
          <RankRow key={e.id} entry={e} position={i} isUser={e.isUser} />
        ))}

        {/* Gap indicator if user isn't near top */}
        {windowStart > 3 && (
          <div className="text-center text-gray-700 text-xs py-1.5">· · ·</div>
        )}

        {/* Window around user */}
        {visible.map((e, i) => {
          const pos = windowStart + i
          if (pos < 3) return null  // already shown above
          return <RankRow key={e.id} entry={e} position={pos} isUser={e.isUser} />
        })}
      </div>

      {/* Share preview */}
      <div className="card p-4 border-dashed">
        <div className="text-gray-600 text-xs uppercase tracking-wider mb-2">Share preview</div>
        <p className="text-gray-400 text-sm font-mono leading-relaxed">
          {buildShareText(topPct, streak.count, nVal)}
        </p>
        <button className="mt-3 text-xs text-cyan-500 hover:text-cyan-400 transition-colors" onClick={copyShare}>
          {copied ? '✓ Copied to clipboard' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  )
}
