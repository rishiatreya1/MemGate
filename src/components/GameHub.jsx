import { useState } from 'react'
import NBackGame from './games/NBackGame'
import SpatialRecallGame from './games/SpatialRecallGame'
import WordRecallGame from './games/WordRecallGame'
import { DIFFICULTIES, GAME_META } from '../utils/difficulty'

function GameIcon({ id }) {
  if (id === 'nback') return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="4" height="4" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="10" y="4" width="4" height="4" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="16" y="4" width="4" height="4" rx="1" fill="currentColor" />
      <path d="M6 12h12M12 10l4 2-4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="16" width="4" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="10" y="16" width="4" height="4" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="16" y="16" width="4" height="4" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
  )
  if (id === 'spatial') return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9.5" y="3" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="16" y="3" width="5" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="3" y="9.5" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="16" y="9.5" width="5" height="5" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="3" y="16" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="9.5" y="16" width="5" height="5" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="16" y="16" width="5" height="5" rx="1" fill="currentColor" opacity="0.9" />
    </svg>
  )
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21.5 17.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const ACCENT_CLASSES = {
  cyan:  { text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20',   hover: 'hover:border-cyan-400/50'  },
  violet:{ text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', hover: 'hover:border-violet-400/50'},
  amber: { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  hover: 'hover:border-amber-400/50' },
}

function GameCard({ meta, onClick }) {
  const ac = ACCENT_CLASSES[meta.accent]
  return (
    <button
      onClick={onClick}
      className={`card p-5 text-left transition-all duration-200 group
        ${ac.border} ${ac.hover} hover:bg-gray-800/50`}
    >
      <div className={`w-10 h-10 rounded-lg ${ac.bg} ${ac.text} flex items-center justify-center mb-4`}>
        <GameIcon id={meta.id} />
      </div>
      <div className="font-semibold text-gray-100 mb-0.5">{meta.title}</div>
      <div className={`text-xs font-medium mb-2 ${ac.text}`}>{meta.subtitle}</div>
      <div className="text-gray-500 text-sm leading-relaxed">{meta.description}</div>
      <div className={`mt-4 text-xs font-medium ${ac.text} flex items-center gap-1`}>
        Play <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  )
}

function PostGameOverlay({ result, diffChanged, onPlayAnother, onHome }) {
  const msg = result.score >= 85 ? 'Excellent recall.' :
              result.score >= 70 ? 'Solid performance.' :
              result.score >= 55 ? 'Keep training.' : 'Room to grow.'
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-30 p-4">
      <div className="card p-8 max-w-xs w-full text-center border-gray-700 animate-fadeUp space-y-4">
        <div>
          <div
            className={`text-5xl font-bold tabular-nums mb-1 ${
              result.score >= 85 ? 'text-emerald-400' :
              result.score >= 70 ? 'text-cyan-400' :
              result.score >= 55 ? 'text-yellow-400' : 'text-red-400'
            }`}
          >
            {result.score}%
          </div>
          <div className="text-gray-400 text-sm">{msg}</div>
        </div>

        {diffChanged && (
          <div className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
            {diffChanged}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button className="btn-primary w-full" onClick={onPlayAnother}>Train again</button>
          <button className="btn-ghost w-full py-2" onClick={onHome}>Back to dashboard</button>
        </div>
      </div>
    </div>
  )
}

const GAMES = Object.values(GAME_META)

function randomGameId() {
  return GAMES[Math.floor(Math.random() * GAMES.length)].id
}

export default function GameHub({ difficulty, onComplete, autoStart = false }) {
  // autoStart=true (from "Train now") picks a random game immediately
  const [activeGame, setActiveGame] = useState(() => autoStart ? randomGameId() : null)
  const [lastResult, setLastResult] = useState(null)

  function handleGameComplete(score, gameType) {
    onComplete(score, gameType)
    setLastResult({ score, gameType })
    setActiveGame(null)
  }

  function launchRandom() {
    setActiveGame(randomGameId())
  }

  const GameComponent = {
    nback: NBackGame,
    spatial: SpatialRecallGame,
    word: WordRecallGame,
  }[activeGame]

  return (
    <div className="space-y-6 animate-fadeUp">

      {/* Post-game overlay */}
      {lastResult && (
        <PostGameOverlay
          result={lastResult}
          onPlayAnother={() => setLastResult(null)}
          onHome={() => { setLastResult(null); onComplete.__backToDash?.() }}
        />
      )}

      {/* Active game */}
      {activeGame && GameComponent ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveGame(null)}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              ← Back
            </button>
            <span className="text-gray-600 text-sm">/</span>
            <span className="text-gray-300 text-sm font-medium">
              {GAME_META[activeGame]?.title}
            </span>
            <span className={`badge ml-auto ${DIFFICULTIES[difficulty].bg} ${DIFFICULTIES[difficulty].color} ${DIFFICULTIES[difficulty].border} border`}>
              {DIFFICULTIES[difficulty].label}
            </span>
          </div>
          <div className="card p-6">
            <GameComponent difficulty={difficulty} onComplete={handleGameComplete} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-100">Training</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Level <span className={DIFFICULTIES[difficulty].color}>{DIFFICULTIES[difficulty].label}</span> · Choose a challenge
              </p>
            </div>
            <button className="btn-secondary text-sm" onClick={launchRandom}>
              Random
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {GAMES.map(meta => (
              <GameCard key={meta.id} meta={meta} onClick={() => setActiveGame(meta.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
