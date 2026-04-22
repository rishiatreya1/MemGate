import { useState, useEffect } from 'react'
import { SPATIAL_PARAMS } from '../../utils/difficulty'

function generatePatterns(size, cellCount) {
  const all      = Array.from({ length: size * size }, (_, i) => i)
  const shuffled = all.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, cellCount)
  const mid      = Math.ceil(cellCount / 2)
  return {
    flash1: new Set(selected.slice(0, mid)),
    flash2: new Set(selected.slice(mid)),
    total:  new Set(selected),
  }
}

// Compute cell pixel size so the grid fits comfortably at any size
function cellSize(size) {
  if (size <= 3)  return 64
  if (size <= 4)  return 52
  if (size <= 6)  return 40
  if (size <= 8)  return 30
  return 22   // 12×12
}

function Grid({ size, litCells, selectedCells, interactive, onToggle, pattern, showResults }) {
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

  const colors = {
    idle:          'background: #1f2937; border-color: #374151',
    lit:           'background: #22d3ee; border-color: #67e8f9; box-shadow: 0 0 14px rgba(34,211,238,.55)',
    selected:      'background: rgba(139,92,246,.7); border-color: #a78bfa',
    hit:           'background: rgba(52,211,153,.8); border-color: #6ee7b7',
    miss:          'background: rgba(34,211,238,.2); border-color: rgba(34,211,238,.4)',
    'false-alarm': 'background: rgba(239,68,68,.6); border-color: #f87171',
  }

  const px   = cellSize(size)
  const gap  = size <= 6 ? 6 : 4
  const total = size * size

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${px}px)`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const state = stateOf(i)
        return (
          <button
            key={i}
            disabled={!interactive}
            onClick={() => interactive && onToggle?.(i)}
            style={{
              width: px,
              height: px,
              borderRadius: size <= 6 ? 8 : 4,
              border: '1px solid',
              transition: 'all .15s',
              cursor: interactive ? 'pointer' : 'default',
              ...Object.fromEntries(
                colors[state].split(';').map(s => {
                  const [k, v] = s.split(':').map(x => x.trim())
                  return [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]
                })
              ),
            }}
            aria-label={`Cell ${i}`}
          />
        )
      })}
    </div>
  )
}

export default function SpatialRecallGame({ difficulty, onComplete }) {
  const params  = SPATIAL_PARAMS[difficulty]

  const [phase,    setPhase]    = useState('instructions')
  const [patterns, setPatterns] = useState({ flash1: new Set(), flash2: new Set(), total: new Set() })
  const [flashNum, setFlashNum] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [countdown, setCdown]   = useState(0)

  function startGame() {
    const p = generatePatterns(params.size, params.cells)
    setPatterns(p)
    setSelected(new Set())
    setFlashNum(1)
    setCdown(Math.ceil((params.sequential ? params.studyMs / 2 : params.studyMs) / 1000))
    setPhase('study')
  }

  useEffect(() => {
    if (phase !== 'study') return
    if (countdown <= 0) {
      if (params.sequential && flashNum === 1) {
        setPhase('blank')
      } else {
        setPhase('input')
      }
      return
    }
    const t = setTimeout(() => setCdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, params.sequential, flashNum])

  useEffect(() => {
    if (phase !== 'blank') return
    const t = setTimeout(() => {
      setFlashNum(2)
      setCdown(Math.ceil(params.studyMs / 2 / 1000))
      setPhase('study')
    }, 400)
    return () => clearTimeout(t)
  }, [phase, params.studyMs])

  function toggleCell(i) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function submit() { setPhase('results') }

  function calcScore() {
    const hits        = [...patterns.total].filter(i => selected.has(i)).length
    const falseAlarms = [...selected].filter(i => !patterns.total.has(i)).length
    return Math.round(Math.max(0, (hits - falseAlarms * 0.5) / params.cells) * 100)
  }

  function handleDone() { onComplete(calcScore(), 'spatial') }

  // ── Instructions ─────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center animate-fadeUp">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Surgical Precision</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {params.sequential ? (
              <>
                Two separate patterns will flash on a {params.size}×{params.size} grid —
                each for ~{(params.studyMs / 2000).toFixed(1)}s. Memorise{' '}
                <strong className="text-gray-200">both</strong> and reproduce the{' '}
                <strong className="text-gray-200">combined</strong> pattern.
              </>
            ) : (
              <>
                A pattern will light up on a {params.size}×{params.size} grid for{' '}
                <strong className="text-gray-200">{(params.studyMs / 1000).toFixed(1)}s</strong>.
                Reproduce it from memory.
              </>
            )}
          </p>
          <p className="text-gray-600 text-xs mt-2">
            {params.cells} cells · {params.size}×{params.size} grid
            {params.sequential ? ' · 2 flashes' : ''}
          </p>
        </div>
        <button className="btn-primary w-full" onClick={startGame}>Begin</button>
      </div>
    )
  }

  // ── Blank gap ─────────────────────────────────────────────────────────────────
  if (phase === 'blank') {
    return (
      <div className="flex flex-col items-center gap-4 animate-fadeUp">
        <div className="text-gray-600 text-sm">Get ready for flash 2…</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${params.size}, ${cellSize(params.size)}px)`,
            gap: `${params.size <= 6 ? 6 : 4}px`,
          }}
        >
          {Array.from({ length: params.size * params.size }, (_, i) => (
            <div
              key={i}
              style={{
                width: cellSize(params.size),
                height: cellSize(params.size),
                borderRadius: params.size <= 6 ? 8 : 4,
                background: '#1f2937',
                border: '1px solid #374151',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Study ─────────────────────────────────────────────────────────────────────
  if (phase === 'study') {
    const litCells = params.sequential
      ? (flashNum === 1 ? patterns.flash1 : patterns.flash2)
      : patterns.total
    const totalSecs = Math.ceil((params.sequential ? params.studyMs / 2 : params.studyMs) / 1000)

    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-3xl font-bold text-cyan-400 tabular-nums">{countdown}</div>
          <div className="text-gray-500 text-sm">
            {params.sequential ? `Flash ${flashNum} of 2 — ` : ''}Memorise this pattern
          </div>
        </div>
        <Grid size={params.size} litCells={litCells} selectedCells={new Set()} interactive={false} />
        <div className="w-full max-w-xs h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-1 bg-cyan-400 rounded-full transition-all duration-1000"
               style={{ width: `${(countdown / totalSecs) * 100}%` }} />
        </div>
      </div>
    )
  }

  // ── Input ─────────────────────────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-200 font-medium">
            {params.sequential ? 'Reproduce the combined pattern' : 'Reproduce the pattern'}
          </div>
          <div className="text-gray-500 text-sm mt-0.5">
            {selected.size} / {params.cells} selected
          </div>
        </div>
        <Grid
          size={params.size} litCells={new Set()} selectedCells={selected}
          interactive={true} onToggle={toggleCell}
        />
        <button className="btn-primary w-full max-w-xs" onClick={submit}>Submit</button>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  const hits        = [...patterns.total].filter(i => selected.has(i)).length
  const misses      = [...patterns.total].filter(i => !selected.has(i)).length
  const falseAlarms = [...selected].filter(i => !patterns.total.has(i)).length
  const score       = calcScore()

  return (
    <div className="flex flex-col items-center gap-5 animate-fadeUp">
      <div className="text-center">
        <div className="text-6xl font-bold text-violet-400 tabular-nums">{score}%</div>
        <div className="text-gray-400 text-sm mt-1">accuracy</div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[
          { label: 'Hits',         value: hits,         color: 'text-emerald-400' },
          { label: 'Misses',       value: misses,        color: 'text-red-400'     },
          { label: 'False alarms', value: falseAlarms,   color: 'text-orange-400'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="text-gray-600 text-xs">Green = correct · Faded = missed · Red = wrong</div>

      <Grid
        size={params.size} litCells={new Set()} selectedCells={selected}
        interactive={false} pattern={patterns.total} showResults={true}
      />
      <button className="btn-primary w-full max-w-xs" onClick={handleDone}>Continue</button>
    </div>
  )
}