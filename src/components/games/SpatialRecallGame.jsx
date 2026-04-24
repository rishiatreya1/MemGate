import { useState, useEffect } from 'react'

const ROUNDS = [
  { size: 3,  cells: 3,  label: '3×3'   },
  { size: 4,  cells: 5,  label: '4×4'   },
  { size: 6,  cells: 10, label: '6×6'   },
  { size: 12, cells: 18, label: '12×12' },
]
const STUDY_SECS = 5
const PASS_THRESHOLD = 60

function generateCells(size, count) {
  const all = Array.from({ length: size * size }, (_, i) => i)
  return new Set([...all].sort(() => Math.random() - 0.5).slice(0, count))
}

function cellPx(size) {
  if (size <= 3)  return 64
  if (size <= 4)  return 56
  if (size <= 6)  return 42
  return 26
}

function gapPx(size) {
  return size <= 6 ? 6 : 4
}

function calcScore(pattern, selected) {
  const hits = [...pattern].filter(i => selected.has(i)).length
  const fas  = [...selected].filter(i => !pattern.has(i)).length
  return Math.round(Math.max(0, (hits - fas * 0.5) / pattern.size) * 100)
}

function Grid({ size, litCells, selectedCells, interactive, onToggle, pattern, showResults }) {
  const px  = cellPx(size)
  const gap = gapPx(size)

  const stateOf = (i) => {
    if (showResults) {
      const inPat  = pattern.has(i)
      const picked = selectedCells.has(i)
      if (inPat  && picked)  return 'hit'
      if (inPat  && !picked) return 'miss'
      if (!inPat && picked)  return 'false-alarm'
      return 'idle'
    }
    if (litCells?.has(i))      return 'lit'
    if (selectedCells?.has(i)) return 'selected'
    return 'idle'
  }

  const styles = {
    idle:          { background: '#1f2937', borderColor: '#374151' },
    lit:           { background: '#22d3ee', borderColor: '#67e8f9', boxShadow: '0 0 14px rgba(34,211,238,.55)' },
    selected:      { background: 'rgba(139,92,246,.7)', borderColor: '#a78bfa' },
    hit:           { background: 'rgba(52,211,153,.8)', borderColor: '#6ee7b7' },
    miss:          { background: 'rgba(34,211,238,.2)', borderColor: 'rgba(34,211,238,.4)' },
    'false-alarm': { background: 'rgba(239,68,68,.6)',  borderColor: '#f87171' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${px}px)`, gap: `${gap}px` }}>
      {Array.from({ length: size * size }, (_, i) => {
        const state = stateOf(i)
        return (
          <button
            key={i}
            disabled={!interactive}
            onClick={() => interactive && onToggle?.(i)}
            style={{
              width: px, height: px,
              borderRadius: size <= 6 ? 8 : 4,
              border: '1px solid',
              transition: 'all .15s',
              cursor: interactive ? 'pointer' : 'default',
              ...styles[state],
            }}
            aria-label={`Cell ${i}`}
          />
        )
      })}
    </div>
  )
}

export default function SpatialRecallGame({ onComplete }) {
  const [phase,     setPhase]    = useState('instructions')
  const [roundIdx,  setRoundIdx] = useState(0)
  const [pattern,   setPattern]  = useState(new Set())
  const [selected,  setSelected] = useState(new Set())
  const [scores,    setScores]   = useState([])
  const [countdown, setCountdown]= useState(STUDY_SECS)

  const round = ROUNDS[roundIdx]

  function beginRound(idx) {
    const r = ROUNDS[idx]
    setRoundIdx(idx)
    setPattern(generateCells(r.size, r.cells))
    setSelected(new Set())
    setCountdown(STUDY_SECS)
    setPhase('study')
  }

  function startGame() {
    setScores([])
    beginRound(0)
  }

  // Study countdown
  useEffect(() => {
    if (phase !== 'study') return
    if (countdown <= 0) { setPhase('recall'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  function submitRecall() {
    const s = calcScore(pattern, selected)
    setScores(prev => [...prev, s])
    setPhase('round_result')
  }

  function advanceFromResult() {
    if (roundIdx < ROUNDS.length - 1) {
      beginRound(roundIdx + 1)
    } else {
      setPhase('final_results')
    }
  }

  function toggleCell(i) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  // ── Instructions ─────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center animate-fadeUp">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Spatial Recall</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Four rounds of increasing grid size: 3×3 → 4×4 → 6×6 → 12×12.
            Each pattern flashes for <strong className="text-gray-200">5 seconds</strong> — memorise it, then reproduce it.
            Score <strong className="text-cyan-400">≥{PASS_THRESHOLD}% combined</strong> to pass.
          </p>
          <div className="flex justify-center gap-3 mt-3">
            {ROUNDS.map((r, i) => (
              <span key={i} className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">{r.label}</span>
            ))}
          </div>
        </div>
        <button className="btn-primary w-full" onClick={startGame}>Begin</button>
      </div>
    )
  }

  // ── Study ─────────────────────────────────────────────────────────────────────
  if (phase === 'study') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Round {roundIdx + 1} / {ROUNDS.length} · {round.label}
          </div>
          <div className="text-3xl font-bold text-cyan-400 tabular-nums">{countdown}</div>
          <div className="text-gray-500 text-sm">Memorise this pattern</div>
        </div>
        <Grid size={round.size} litCells={pattern} selectedCells={new Set()} interactive={false} />
        <div className="w-full max-w-sm h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-1 bg-cyan-400 rounded-full transition-all duration-1000"
               style={{ width: `${(countdown / STUDY_SECS) * 100}%` }} />
        </div>
      </div>
    )
  }

  // ── Recall ────────────────────────────────────────────────────────────────────
  if (phase === 'recall') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Round {roundIdx + 1} / {ROUNDS.length} · {round.label} · Recall
          </div>
          <div className="text-gray-200 font-medium">Reproduce the pattern</div>
          <div className="text-gray-500 text-sm mt-0.5">{selected.size} / {round.cells} selected</div>
        </div>
        <Grid
          size={round.size} litCells={new Set()} selectedCells={selected}
          interactive={true} onToggle={toggleCell}
        />
        <button className="btn-primary w-full max-w-sm" onClick={submitRecall}>Submit</button>
      </div>
    )
  }

  // ── Round result ──────────────────────────────────────────────────────────────
  if (phase === 'round_result') {
    const roundScore  = scores[scores.length - 1] ?? 0
    const hits        = [...pattern].filter(i => selected.has(i)).length
    const misses      = [...pattern].filter(i => !selected.has(i)).length
    const falseAlarms = [...selected].filter(i => !pattern.has(i)).length
    const isLast      = roundIdx === ROUNDS.length - 1

    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Round {roundIdx + 1} / {ROUNDS.length} · {round.label}
          </div>
          <div className="text-5xl font-bold text-violet-400 tabular-nums">{roundScore}%</div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {[
            { label: 'Hits',         value: hits,        color: 'text-emerald-400' },
            { label: 'Misses',       value: misses,       color: 'text-red-400'     },
            { label: 'False alarms', value: falseAlarms,  color: 'text-orange-400'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <div className={`text-2xl font-semibold ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <Grid
          size={round.size} litCells={new Set()} selectedCells={selected}
          interactive={false} pattern={pattern} showResults={true}
        />

        {/* Running score tally */}
        <div className="flex gap-2 flex-wrap justify-center">
          {scores.map((s, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded ${s >= PASS_THRESHOLD ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
              {ROUNDS[i].label}: {s}%
            </span>
          ))}
        </div>

        <button className="btn-primary w-full max-w-sm" onClick={advanceFromResult}>
          {isLast ? 'See Final Results' : `Next: ${ROUNDS[roundIdx + 1].label}`}
        </button>
      </div>
    )
  }

  // ── Final results ─────────────────────────────────────────────────────────────
  if (phase === 'final_results') {
    const combined = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const passed   = combined >= PASS_THRESHOLD

    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Final Score</div>
          <div className={`text-6xl font-bold tabular-nums ${passed ? 'text-violet-400' : 'text-red-400'}`}>
            {combined}%
          </div>
          <div className={`text-sm mt-1 font-medium ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {passed ? 'Access granted' : `Need ${PASS_THRESHOLD}% to pass`}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {ROUNDS.map((r, i) => (
            <div key={i} className="card p-3 text-center">
              <div className={`text-2xl font-semibold ${scores[i] >= PASS_THRESHOLD ? 'text-emerald-400' : 'text-red-400'}`}>
                {scores[i]}%
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{r.label}</div>
            </div>
          ))}
        </div>

        <button className="btn-primary w-full max-w-xs" onClick={() => onComplete(combined, 'spatial')}>
          Continue
        </button>
      </div>
    )
  }

  return null
}
