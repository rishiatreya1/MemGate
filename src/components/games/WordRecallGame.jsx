import { useState, useEffect, useRef } from 'react'
import { WORD_PARAMS } from '../../utils/difficulty'
import { fetchWords, normalise } from '../../utils/words'

function generateDistractors(count) {
  return Array.from({ length: count }, () => {
    const a  = Math.floor(Math.random() * 9) + 1
    const b  = Math.floor(Math.random() * 9) + 1
    const ops = ['+', '-', '*']
    const op  = ops[Math.floor(Math.random() * ops.length)]
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b
    return { q: `${a} ${op} ${b}`, answer }
  })
}

// Immediate-Access unlock overlay shown when 100 % recall in < 30s
function ImmediateAccessOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95">
      <div className="text-center space-y-4 animate-fadeUp px-6">
        <div className="relative mx-auto w-24 h-24">
          {/* Pulsing rings */}
          {[1, 2, 3].map(i => (
            <span
              key={i}
              className="absolute inset-0 rounded-full border border-cyan-400/40"
              style={{ animation: `ping ${0.8 + i * 0.4}s cubic-bezier(0,0,.2,1) infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#22d3ee" strokeWidth="2" />
              <path d="M14 24l7 7 13-13" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div>
          <div className="text-cyan-400 text-xs font-mono uppercase tracking-[0.2em] mb-1">
            Speed bonus activated
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">IMMEDIATE ACCESS</div>
          <div className="text-gray-500 text-sm mt-2">Perfect recall · sub-30s</div>
        </div>
        <div className="flex gap-1 justify-center">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                 style={{ animation: `bounce 0.6s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WordRecallGame({ difficulty, onComplete }) {
  const params = WORD_PARAMS[difficulty]

  const [phase,        setPhase]       = useState('instructions')
  const [fetching,     setFetching]    = useState(false)
  const [words,        setWords]       = useState([])
  const [countdown,    setCountdown]   = useState(0)
  const [distractors,  setDistractors] = useState([])
  const [distIdx,      setDistIdx]     = useState(0)
  const [distInput,    setDistInput]   = useState('')
  const [distFeedback, setDistFeedback]= useState(null)
  const [distTimer,    setDistTimer]   = useState(0)  // 10-second distractor countdown
  const [recallInput,  setRecallInput] = useState('')
  const [recalled,     setRecalled]    = useState([])
  const [recallTime,   setRecallTime]  = useState(45)
  const [recallStart,  setRecallStart] = useState(null)
  const [showUnlock,   setShowUnlock]  = useState(false)
  const inputRef = useRef(null)

  async function startGame() {
    setFetching(true)
    const ws = await fetchWords(params.count)
    setFetching(false)
    const ds = generateDistractors(params.distractors)
    setWords(ws)
    setDistractors(ds)
    setDistIdx(0)
    setDistInput('')
    setDistFeedback(null)
    setDistTimer(Math.ceil(params.distractorMs / 1000))
    setRecalled([])
    setRecallInput('')
    setRecallTime(45)
    setRecallStart(null)
    setShowUnlock(false)
    setCountdown(Math.ceil(params.studyMs / 1000))
    setPhase('study')
  }

  // Study countdown
  useEffect(() => {
    if (phase !== 'study') return
    if (countdown <= 0) {
      setPhase(params.distractors > 0 ? 'distractor' : 'recall')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, params.distractors])

  // Distractor 10-second global timer
  useEffect(() => {
    if (phase !== 'distractor') return
    if (distTimer <= 0) { setPhase('recall'); return }
    const t = setTimeout(() => setDistTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, distTimer])

  // Recall countdown
  useEffect(() => {
    if (phase !== 'recall') return
    if (recallStart === null) setRecallStart(Date.now())
    if (recallTime <= 0) { setPhase('results'); return }
    const t = setTimeout(() => setRecallTime(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, recallTime, recallStart])

  useEffect(() => {
    if (phase === 'recall') inputRef.current?.focus()
  }, [phase])

  function submitDistractor(e) {
    e.preventDefault()
    const val = parseInt(distInput.trim(), 10)
    if (isNaN(val)) return
    const correct = val === distractors[distIdx]?.answer
    setDistFeedback(correct ? 'ok' : 'wrong')
    setTimeout(() => {
      setDistFeedback(null)
      setDistInput('')
      if (distIdx >= distractors.length - 1) {
        setPhase('recall')
      } else {
        setDistIdx(i => i + 1)
      }
    }, 350)
  }

  function submitRecall(e) {
    e.preventDefault()
    const word = normalise(recallInput)
    if (!word) return
    const alreadyRecalled = recalled.some(r => normalise(r.word) === word)
    if (alreadyRecalled) { setRecallInput(''); return }
    const correct = words.some(w => normalise(w) === word)
    const next = [...recalled, { word: recallInput.trim(), correct }]
    setRecalled(next)
    setRecallInput('')

    // Speed unlock check: 100% recall in under 30 seconds
    const elapsed = recallStart ? (Date.now() - recallStart) / 1000 : 999
    const correctCount = next.filter(r => r.correct).length
    if (correctCount === params.count && elapsed < 30) {
      setShowUnlock(true)
    }
  }

  function handleUnlockDone() {
    setShowUnlock(false)
    const correctCount = recalled.filter(r => r.correct).length
    const score = Math.round((correctCount / params.count) * 100)
    onComplete(score, 'word')
  }

  function finish() {
    const correctCount = recalled.filter(r => r.correct).length
    const score = Math.round((correctCount / params.count) * 100)
    onComplete(score, 'word')
  }

  if (showUnlock) return <ImmediateAccessOverlay onDone={handleUnlockDone} />

  // ── Instructions ─────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center animate-fadeUp">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Word Encoding</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Study <strong className="text-gray-200">{params.count} words</strong> for 20 seconds.
            After a 10-second math distractor, free-recall as many as you can.{' '}
            <span className="text-cyan-400">100% recall in under 30s</span> unlocks an immediate-access bonus.
          </p>
          <p className="text-gray-600 text-xs mt-2">20s to memorise · 45s to recall</p>
        </div>
        <button className="btn-primary w-full" onClick={startGame} disabled={fetching}>
          {fetching ? 'Loading words…' : 'Begin'}
        </button>
      </div>
    )
  }

  // ── Study ─────────────────────────────────────────────────────────────────────
  if (phase === 'study') {
    return (
      <div className="flex flex-col items-center gap-5 animate-fadeUp">
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-400 tabular-nums">{countdown}</div>
          <div className="text-gray-500 text-sm">Memorise these words</div>
        </div>
        <div className="card p-5 w-full max-w-sm">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {words.map((word, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-700 text-xs tabular-nums w-4">{i + 1}</span>
                <span className="text-gray-100 font-medium">{word}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-sm h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-1 bg-amber-400 rounded-full transition-all duration-1000"
            style={{ width: `${(countdown / Math.ceil(params.studyMs / 1000)) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Distractor (10-second timer) ──────────────────────────────────────────────
  if (phase === 'distractor') {
    const dist = distractors[distIdx]
    const timerPct = (distTimer / Math.ceil(params.distractorMs / 1000)) * 100
    return (
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto animate-fadeUp">
        <div className="w-full flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            Distractor {distIdx + 1} / {distractors.length}
          </div>
          <div className={`text-xl font-bold tabular-nums ${distTimer <= 3 ? 'text-red-400' : 'text-orange-400'}`}>
            {distTimer}s
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden -mt-3">
          <div
            className={`h-1 rounded-full transition-all duration-1000 ${distTimer <= 3 ? 'bg-red-400' : 'bg-orange-400'}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        <div
          className={`card p-8 text-center w-full transition-colors ${
            distFeedback === 'ok' ? 'border-emerald-500/50' : distFeedback === 'wrong' ? 'border-red-500/50' : ''
          }`}
        >
          <div className="text-4xl font-bold text-gray-100 font-mono">{dist?.q} = ?</div>
        </div>
        <form onSubmit={submitDistractor} className="flex gap-2 w-full">
          <input
            autoFocus
            type="number"
            value={distInput}
            onChange={e => setDistInput(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 text-center text-lg font-mono focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="answer"
          />
          <button type="submit" className="btn-primary px-6">
            {distFeedback === 'ok' ? '✓' : distFeedback === 'wrong' ? '✗' : '→'}
          </button>
        </form>
      </div>
    )
  }

  // ── Recall ────────────────────────────────────────────────────────────────────
  if (phase === 'recall') {
    const correctCount = recalled.filter(r => r.correct).length
    return (
      <div className="flex flex-col gap-5 max-w-sm mx-auto animate-fadeUp">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-200 font-medium">Free recall</div>
            <div className="text-gray-500 text-sm">{correctCount} / {params.count} words found</div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold tabular-nums ${recallTime <= 10 ? 'text-red-400' : 'text-amber-400'}`}>
              {recallTime}s
            </div>
            {recallStart && (
              <div className="text-gray-700 text-xs">
                {Math.round((Date.now() - recallStart) / 1000)}s elapsed
              </div>
            )}
          </div>
        </div>

        {/* Speed bonus hint */}
        {correctCount < params.count && recallStart && (Date.now() - recallStart) / 1000 < 25 && (
          <div className="text-xs text-cyan-500/70 bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-2 text-center">
            ⚡ 100% recall in under 30s triggers Immediate Access
          </div>
        )}

        <form onSubmit={submitRecall} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={recallInput}
            onChange={e => setRecallInput(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400 transition-colors"
            placeholder="Type a word and press Enter"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="btn-secondary px-4">→</button>
        </form>

        <div className="flex flex-wrap gap-2">
          {recalled.map((r, i) => (
            <span
              key={i}
              className={`badge ${
                r.correct
                  ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25'
                  : 'bg-red-400/10 text-red-400 border border-red-400/20 line-through'
              }`}
            >
              {r.word}
            </span>
          ))}
        </div>

        <button className="btn-secondary w-full mt-auto" onClick={() => setPhase('results')}>
          Done recalling
        </button>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  const correctCount = recalled.filter(r => r.correct).length
  const score = Math.round((correctCount / params.count) * 100)
  const missed = words.filter(w => !recalled.some(r => r.correct && normalise(r.word) === normalise(w)))

  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto animate-fadeUp">
      <div className="text-center">
        <div className="text-6xl font-bold text-amber-400 tabular-nums">{score}%</div>
        <div className="text-gray-400 text-sm mt-1">
          {correctCount} of {params.count} words recalled
        </div>
      </div>

      <div className="card p-5 w-full">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-3">Words you missed</div>
        {missed.length === 0 ? (
          <div className="text-emerald-400 text-sm font-medium">Perfect recall!</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missed.map((w, i) => (
              <span key={i} className="badge bg-gray-800 text-gray-400 border border-gray-700">{w}</span>
            ))}
          </div>
        )}
      </div>

      <button className="btn-primary w-full" onClick={finish}>Continue</button>
    </div>
  )
}