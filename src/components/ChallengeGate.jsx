import { useState, Component } from 'react'
import NBackGame from './games/NBackGame'
import SpatialRecallGame from './games/SpatialRecallGame'
import WordRecallGame from './games/WordRecallGame'

class GameErrorBoundary extends Component {
  state = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) {
      return (
        <div className="text-center space-y-3 py-6">
          <div className="text-red-400 font-medium">Game failed to load</div>
          <div className="text-gray-500 text-sm">Try refreshing the page.</div>
          <button
            className="btn-primary text-sm px-6 mt-2"
            onClick={() => this.setState({ crashed: false })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const GAMES    = ['nback', 'spatial', 'word']
const LABELS   = { nback: 'N-Back', spatial: 'Spatial Recall', word: 'Word Encoding' }
const ACCENTS  = { nback: 'text-cyan-400', spatial: 'text-violet-400', word: 'text-amber-400' }
const PASS_THRESHOLD = 60   // % required to unlock

const GameComponents = {
  nback:   NBackGame,
  spatial: SpatialRecallGame,
  word:    WordRecallGame,
}

// Pick a random game once per challenge (stable across re-renders)
function pickGame() {
  return GAMES[Math.floor(Math.random() * GAMES.length)]
}

export default function ChallengeGate({ site, returnUrl, difficulty, onPass }) {
  const [phase,   setPhase]   = useState('gate')   // 'gate' | 'playing' | 'passed' | 'failed'
  const [gamePick]            = useState(pickGame)
  const [lastScore, setScore] = useState(null)

  const GameComponent = GameComponents[gamePick]

  function handleComplete(score) {
    setScore(score)
    if (score >= PASS_THRESHOLD) {
      setPhase('passed')
      // Notify the content script → background worker → grant 30-min unlock
      window.dispatchEvent(
        new CustomEvent('memgate:challenge-passed', { detail: { site, returnUrl } })
      )
      onPass()
    } else {
      setPhase('failed')
    }
  }

  // ── Gate screen ──────────────────────────────────────────────────────────────
  if (phase === 'gate') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6 text-center animate-fadeUp">

          {/* Lock icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-900 border border-gray-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="5" y="13" width="18" height="12" rx="2.5" stroke="#9ca3af" strokeWidth="1.8" />
              <path d="M9 13V9.5a5 5 0 0 1 10 0V13" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="14" cy="19" r="1.5" fill="#9ca3af" />
            </svg>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">You want to open</div>
            <div className="text-gray-100 text-2xl font-semibold">{site}</div>
          </div>

          <div className="card p-4 text-sm text-gray-400 leading-relaxed">
            This site is gated by <span className="text-cyan-400 font-medium">MemGate</span>.
            Pass a memory challenge to earn 30 minutes of access.
          </div>

          <div className="text-gray-600 text-xs">
            Challenge: <span className={`font-medium ${ACCENTS[gamePick]}`}>{LABELS[gamePick]}</span>
            {' '}· pass threshold: {PASS_THRESHOLD}%
          </div>

          <button className="btn-primary w-full" onClick={() => setPhase('playing')}>
            Start challenge
          </button>

          <button
            className="btn-ghost w-full text-sm"
            onClick={() => { if (returnUrl) window.history.back() }}
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <div className="border-b border-gray-800 px-4 h-14 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-gray-400 text-sm">
            Challenge · <span className="text-gray-200">{site}</span>
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg card p-6">
            <GameErrorBoundary key={gamePick}>
              <GameComponent difficulty={difficulty} onComplete={handleComplete} />
            </GameErrorBoundary>
          </div>
        </div>
      </div>
    )
  }

  // ── Passed ───────────────────────────────────────────────────────────────────
  if (phase === 'passed') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4 animate-fadeUp">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14.5l5 5 9-9" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-emerald-400 text-xl font-semibold">{lastScore}% — Access granted</div>
            <div className="text-gray-500 text-sm mt-1">Redirecting to {site}…</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Failed ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4 animate-fadeUp">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M9 9l10 10M19 9L9 19" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-red-400 text-xl font-semibold">{lastScore}% — Access denied</div>
          <div className="text-gray-500 text-sm mt-1">Score must be ≥{PASS_THRESHOLD}%. Try again.</div>
        </div>
        <button className="btn-primary w-full" onClick={() => setPhase('playing')}>
          Retry
        </button>
      </div>
    </div>
  )
}
