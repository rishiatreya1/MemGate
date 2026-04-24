import { useState, useEffect } from 'react'

const ROUND1 = { size: 4, cells: 6,  studyMs: 5000 }
const ROUND2 = { size: 6, cells: 12, studyMs: 5000 }  // 6 cells per flash, 2 flashes
const PASS_THRESHOLD = 60

function generateCells(size, count) {
  const all = Array.from({ length: size * size }, (_, i) => i)
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return new Set(shuffled.slice(0, count))
}

// Two non-overlapping cell sets for the 6x6 sequential flashes
function generateRound2Patterns() {
  const all = Array.from({ length: ROUND2.size * ROUND2.size }, (_, i) => i)
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  const half = ROUND2.cells / 2
  const flash1 = new Set(shuffled.slice(0, half))
  const flash2 = new Set(shuffled.slice(half, ROUND2.cells))
  const total  = new Set([...flash1, ...flash2])
  return { flash1, flash2, total }
}

function cellSize(size) {
  if (size <= 4) return 56
  return 42
}

function Grid({ size, litCells, selectedCells, interactive, onToggle, pattern, showResults }) {
  const px  = cellSize(size)
  const gap = 6

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
              borderRadius: 8,
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

function calcScore(pattern, selected) {
  const hits = [...pattern].filter(i => selected.has(i)).length
  const fas  = [...selected].filter(i => !pattern.has(i)).length
  return Math.round(Math.max(0, (hits - fas * 0.5) / pattern.size) * 100)
}

export default function SpatialRecallGame({ onComplete }) {
  const [phase,     setPhase]    = useState('instructions')
  const [countdown, setCountdown]= useState(0)
  const [flashNum,  setFlashNum] = useState(1)

  // Round 1 (4x4)
  const [pattern1,  setPattern1] = useState(new Set())
  const [selected1, setSelected1]= useState(new Set())
  const [score1,    setScore1]   = useState(0)

  // Round 2 (6x6 sequential)
  const [flash1,    setFlash1]   = useState(new Set())
  const [flash2,    setFlash2]   = useState(new Set())
  const [pattern2,  setPattern2] = useState(new Set())
  const [selected2, setSelected2]= useState(new Set())
  const [score2,    setScore2]   = useState(0)

  function startGame() {
    const p = generateCells(ROUND1.size, ROUND1.cells)
    setPattern1(p)
    setSelected1(new Set())
    setCountdown(ROUND1.studyMs / 1000)
    setPhase('study1')
  }

  // Round 1 study countdown
  useEffect(() => {
    if (phase !== 'study1') return
    if (countdown <= 0) { setPhase('input1'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  function submitRound1() {
    const s = calcScore(pattern1, selected1)
    setScore1(s)
    setPhase('result1')
  }

  function startRound2() {
    const { flash1: f1, flash2: f2, total } = generateRound2Patterns()
    setFlash1(f1); setFlash2(f2); setPattern2(total)
    setSelected2(new Set())
    setFlashNum(1)
    setCountdown(ROUND2.studyMs / 1000)
    setPhase('study2')
  }

  // Round 2 study countdown (shared for both flashes)
  useEffect(() => {
    if (phase !== 'study2') return
    if (countdown <= 0) {
      if (flashNum === 1) {
        setPhase('blank2')
      } else {
        setPhase('input2')
      }
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, flashNum])

  useEffect(() => {
    if (phase !== 'blank2') return
    const t = setTimeout(() => {
      setFlashNum(2)
      setCountdown(ROUND2.studyMs / 1000)
      setPhase('study2')
    }, 500)
    return () => clearTimeout(t)
  }, [phase])

  function submitRound2() {
    const s = calcScore(pattern2, selected2)
    setScore2(s)
    setPhase('results2')
  }

  function toggleCell1(i) {
    setSelected1(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }
  function toggleCell2(i) {
    setSelected2(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  function handleDone() {
    // Final score: average of both rounds if round 2 was played, else round 1 only
    const final = phase === 'results2' ? Math.round((score1 + score2) / 2) : score1
    onComplete(final, 'spatial')
  }

  // ── Instructions ─────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center animate-fadeUp">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Spatial Recall</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            <strong className="text-gray-200">Round 1:</strong> A pattern lights up on a 4×4 grid for 5s — reproduce it from memory.
            <br /><br />
            <strong className="text-gray-200">Round 2 (if you pass):</strong> Two patterns flash on a 6×6 grid, 5s each. Memorise both and reproduce the combined result.
          </p>
          <p className="text-gray-600 text-xs mt-2">Pass threshold: {PASS_THRESHOLD}%</p>
        </div>
        <button className="btn-primary w-full" onClick={startGame}>Begin</button>
      </div>
    )
  }

  // ── Round 1 study ─────────────────────────────────────────────────────────────
  if (phase === 'study1') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Round 1 · 4×4</div>
          <div className="text-3xl font-bold text-cyan-400 tabular-nums">{countdown}</div>
          <div className="text-gray-500 text-sm">Memorise this pattern</div>
        </div>
        <Grid size={ROUND1.size} litCells={pattern1} selectedCells={new Set()} interactive={false} />
        <div className="w-full max-w-xs h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-1 bg-cyan-400 rounded-full transition-all duration-1000"
               style={{ width: `${(countdown / (ROUND1.studyMs / 1000)) * 100}%` }} />
        </div>
      </div>
    )
  }

  // ── Round 1 input ─────────────────────────────────────────────────────────────
  if (phase === 'input1') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Round 1 · Recall</div>
          <div className="text-gray-200 font-medium">Reproduce the 4×4 pattern</div>
          <div className="text-gray-500 text-sm mt-0.5">{selected1.size} / {ROUND1.cells} selected</div>
        </div>
        <Grid size={ROUND1.size} litCells={new Set()} selectedCells={selected1} interactive={true} onToggle={toggleCell1} />
        <button className="btn-primary w-full max-w-xs" onClick={submitRound1}>Submit</button>
      </div>
    )
  }

  // ── Round 1 result ────────────────────────────────────────────────────────────
  if (phase === 'result1') {
    const hits1   = [...pattern1].filter(i => selected1.has(i)).length
    const misses1 = [...pattern1].filter(i => !selected1.has(i)).length
    const fas1    = [...selected1].filter(i => !pattern1.has(i)).length
    const passed  = score1 >= PASS_THRESHOLD

    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Round 1 Result</div>
          <div className={`text-6xl font-bold tabular-nums ${passed ? 'text-violet-400' : 'text-red-400'}`}>{score1}%</div>
          <div className={`text-sm mt-1 font-medium ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {passed ? 'Passed — Round 2 unlocked!' : 'Below threshold — game over'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {[
            { label: 'Hits',         value: hits1, color: 'text-emerald-400' },
            { label: 'Misses',       value: misses1, color: 'text-red-400' },
            { label: 'False alarms', value: fas1,  color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <div className={`text-2xl font-semibold ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <Grid size={ROUND1.size} litCells={new Set()} selectedCells={selected1}
              interactive={false} pattern={pattern1} showResults={true} />

        {passed
          ? <button className="btn-primary w-full max-w-xs" onClick={startRound2}>Start Round 2</button>
          : <button className="btn-primary w-full max-w-xs" onClick={handleDone}>Continue</button>
        }
      </div>
    )
  }

  // ── Round 2 blank gap ─────────────────────────────────────────────────────────
  if (phase === 'blank2') {
    return (
      <div className="flex flex-col items-center gap-4 animate-fadeUp">
        <div className="text-gray-500 text-sm">Get ready for flash 2…</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ROUND2.size}, ${cellSize(ROUND2.size)}px)`, gap: '6px' }}>
          {Array.from({ length: ROUND2.size * ROUND2.size }, (_, i) => (
            <div key={i} style={{ width: cellSize(ROUND2.size), height: cellSize(ROUND2.size), borderRadius: 8, background: '#1f2937', border: '1px solid #374151' }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Round 2 study ─────────────────────────────────────────────────────────────
  if (phase === 'study2') {
    const litCells = flashNum === 1 ? flash1 : flash2
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Round 2 · 6×6 · Flash {flashNum} of 2</div>
          <div className="text-3xl font-bold text-violet-400 tabular-nums">{countdown}</div>
          <div className="text-gray-500 text-sm">Memorise this pattern</div>
        </div>
        <Grid size={ROUND2.size} litCells={litCells} selectedCells={new Set()} interactive={false} />
        <div className="w-full max-w-sm h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-1 bg-violet-400 rounded-full transition-all duration-1000"
               style={{ width: `${(countdown / (ROUND2.studyMs / 1000)) * 100}%` }} />
        </div>
      </div>
    )
  }

  // ── Round 2 input ─────────────────────────────────────────────────────────────
  if (phase === 'input2') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Round 2 · Recall Combined</div>
          <div className="text-gray-200 font-medium">Reproduce both patterns combined</div>
          <div className="text-gray-500 text-sm mt-0.5">{selected2.size} / {ROUND2.cells} selected</div>
        </div>
        <Grid size={ROUND2.size} litCells={new Set()} selectedCells={selected2} interactive={true} onToggle={toggleCell2} />
        <button className="btn-primary w-full max-w-sm" onClick={submitRound2}>Submit</button>
      </div>
    )
  }

  // ── Round 2 results ───────────────────────────────────────────────────────────
  if (phase === 'results2') {
    const hits2   = [...pattern2].filter(i => selected2.has(i)).length
    const misses2 = [...pattern2].filter(i => !selected2.has(i)).length
    const fas2    = [...selected2].filter(i => !pattern2.has(i)).length
    const final   = Math.round((score1 + score2) / 2)

    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Final Score</div>
          <div className="text-6xl font-bold text-violet-400 tabular-nums">{final}%</div>
          <div className="text-gray-500 text-sm mt-1">R1: {score1}% · R2: {score2}%</div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {[
            { label: 'Hits',         value: hits2,   color: 'text-emerald-400' },
            { label: 'Misses',       value: misses2, color: 'text-red-400'     },
            { label: 'False alarms', value: fas2,    color: 'text-orange-400'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <div className={`text-2xl font-semibold ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="text-gray-600 text-xs">Green = correct · Faded = missed · Red = wrong</div>
        <Grid size={ROUND2.size} litCells={new Set()} selectedCells={selected2}
              interactive={false} pattern={pattern2} showResults={true} />

        <button className="btn-primary w-full max-w-sm" onClick={handleDone}>Continue</button>
      </div>
    )
  }

  return null
}
