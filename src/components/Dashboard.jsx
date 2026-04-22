import { useState } from 'react'
import ScoreChart from './ScoreChart'
import CognitiveTrendChart from './CognitiveTrendChart'
import { DIFFICULTIES } from '../utils/difficulty'

const GAME_LABELS = { nback: 'N-Back', spatial: 'Spatial', word: 'Word' }

function buildShareText(scores, streak, difficulty) {
  const avg  = scores.length ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : null
  const best = scores.length ? Math.max(...scores.map(r => r.score)) : null
  const diff = DIFFICULTIES[difficulty]
  const recent = scores.slice(-5).reverse()

  const lines = [
    'MemGate — Training Report',
    '─────────────────────────',
    `Streak:   ${streak.count} day${streak.count !== 1 ? 's' : ''}`,
    `Sessions: ${scores.length}`,
    `Average:  ${avg !== null ? avg + '%' : '—'}`,
    `Best:     ${best !== null ? best + '%' : '—'}`,
    `Level:    ${diff.label} (${difficulty}/5)`,
    '',
  ]

  if (recent.length) {
    lines.push('Recent sessions:')
    recent.forEach(e => {
      const d = new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      lines.push(`  ${d}  ·  ${GAME_LABELS[e.gameType] ?? e.gameType}  ·  ${e.score}%`)
    })
    lines.push('')
  }

  lines.push('memgate.app')
  return lines.join('\n')
}

function StatCard({ label, value, sub, accent = 'text-gray-100' }) {
  return (
    <div className="card p-4">
      <div className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="text-gray-400 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function StreakBadge({ streak }) {
  const active = streak.count > 0
  return (
    <div className={`card p-5 flex items-center gap-4 ${active ? 'border-orange-500/30' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${active ? 'bg-orange-500/15' : 'bg-gray-800'}`}>
        {active ? '⚡' : '—'}
      </div>
      <div>
        <div className={`text-3xl font-bold tabular-nums ${active ? 'text-orange-400' : 'text-gray-600'}`}>
          {streak.count}
        </div>
        <div className="text-gray-400 text-sm">day streak</div>
        {streak.lastDate && (
          <div className="text-gray-600 text-xs mt-0.5">
            Last session {new Date(streak.lastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ scores, streak, difficulty, onStartGame }) {
  const diff = DIFFICULTIES[difficulty]
  const [copied, setCopied] = useState(false)
  const [chartTab, setChartTab] = useState('history') // 'history' | 'trends'

  const avgScore  = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : null
  const bestScore = scores.length > 0 ? Math.max(...scores.map(r => r.score)) : null
  const recent    = scores.slice(-5).reverse()

  async function copyReport() {
    const text = buildShareText(scores, streak, difficulty)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy your report:', text)
    }
  }

  return (
    <div className="space-y-6 animate-fadeUp">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your cognitive training progress</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {scores.length > 0 && (
            <button className="btn-secondary text-sm px-3" onClick={copyReport}>
              {copied ? 'Copied ✓' : 'Share'}
            </button>
          )}
          <button className="btn-primary" onClick={onStartGame}>Train now</button>
        </div>
      </div>

      {/* Streak + difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <StreakBadge streak={streak} />
        <div className={`card p-5 border ${diff.border}`}>
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Current level</div>
          <div className={`text-2xl font-semibold ${diff.color}`}>{diff.label}</div>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map(l => (
              <div
                key={l}
                className={`flex-1 h-1.5 rounded-full ${l <= difficulty ? diff.color.replace('text-', 'bg-') : 'bg-gray-800'}`}
              />
            ))}
          </div>
          <div className="text-gray-600 text-xs mt-2">Level {difficulty} / 5</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Sessions" value={scores.length} sub="total" />
        <StatCard label="Average" value={avgScore !== null ? `${avgScore}%` : '—'} sub="accuracy" accent="text-cyan-400" />
        <StatCard label="Best" value={bestScore !== null ? `${bestScore}%` : '—'} sub="all-time" accent="text-violet-400" />
      </div>

      {/* Charts panel with tab switcher */}
      <div className="card p-5">
        {/* Tab header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartTab('history')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                chartTab === 'history' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setChartTab('trends')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                chartTab === 'trends' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Trends ✦
            </button>
          </div>
          {chartTab === 'history' && (
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {[['nback', '#22d3ee', 'N-Back'], ['spatial', '#a78bfa', 'Spatial'], ['word', '#fbbf24', 'Word']].map(([k, c, l]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c }} />{l}
                </span>
              ))}
            </div>
          )}
        </div>

        {chartTab === 'history' ? (
          <>
            <div className="text-gray-600 text-xs mb-3">Last 14 sessions</div>
            <ScoreChart scores={scores} />
          </>
        ) : (
          <CognitiveTrendChart scores={scores} />
        )}
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div className="card p-5">
          <div className="text-gray-200 font-medium text-sm mb-3">Recent sessions</div>
          <div className="space-y-2">
            {recent.map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
                    {GAME_LABELS[entry.gameType] ?? entry.gameType}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={`font-semibold tabular-nums ${
                  entry.score >= 80 ? 'text-emerald-400' :
                  entry.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {entry.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {scores.length === 0 && (
        <div className="card p-8 text-center border-dashed">
          <div className="text-gray-600 text-sm mb-3">No sessions recorded yet.</div>
          <button className="btn-primary" onClick={onStartGame}>Start your first session</button>
        </div>
      )}

    </div>
  )
}
