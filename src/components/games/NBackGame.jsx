import { useState, useEffect, useRef } from 'react'
import { NBACK_PARAMS } from '../../utils/difficulty'

const LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'.split('')
const GRID_SIZE = 3

const GAME_SECONDS = 30

function generateSequence(length, N) {
  const letters   = []
  const positions = []

  for (let i = 0; i < length; i++) {
    if (i >= N && Math.random() < 0.3) {
      letters.push(letters[i - N])
    } else {
      let l
      do { l = LETTERS[Math.floor(Math.random() * LETTERS.length)] }
      while (i >= N && l === letters[i - N])
      letters.push(l)
    }

    if (i >= N && Math.random() < 0.3) {
      positions.push(positions[i - N])
    } else {
      let p
      do { p = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)) }
      while (
        (i >= N && p === positions[i - N]) ||
        (i > 0  && p === positions[i - 1])
      )
      positions.push(p)
    }
  }

  return { letters, positions }
}

function PositionGrid({ position, letter, feedback }) {
  const cells = GRID_SIZE * GRID_SIZE
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }, (_, i) => {
        const active = i === position
        const base   = 'w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-150'
        const style  = active
          ? feedback === 'correct' ? `${base} bg-cyan-500/30 border-2 border-cyan-400`
          : feedback === 'wrong'   ? `${base} bg-red-500/20  border-2 border-red-400`
          :                          `${base} bg-cyan-500/20 border-2 border-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.3)]`
          : `${base} bg-gray-800 border border-gray-700`
        return (
          <div key={i} className={style}>
            {active && (
              <span className="text-3xl font-bold text-gray-100 font-mono select-none">
                {letter}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LetterDisplay({ letter, feedback }) {
  const borderClass = feedback === 'correct' ? 'border-cyan-400/60 animate-flashCorrect'
                    : feedback === 'wrong'   ? 'border-red-400/60  animate-flashWrong'
                    : 'border-gray-700'
  return (
    <div className={`w-36 h-36 rounded-2xl border-2 flex items-center justify-center transition-all ${borderClass}`}>
      <span className="text-7xl font-bold text-gray-100 font-mono select-none">{letter}</span>
    </div>
  )
}

function ResultsScreen({ results, dual, onDone }) {
  const { letterHits, letterMisses, letterFAs, letterCRs,
          posHits,    posMisses,    posFAs,    posCRs,
          total, score } = results

  const rows = dual
    ? [
        { label: 'Letter hits',              v: letterHits,  c: 'text-emerald-400' },
        { label: 'Letter correct rej.',      v: letterCRs,   c: 'text-emerald-400' },
        { label: 'Letter misses',            v: letterMisses,c: 'text-red-400'     },
        { label: 'Letter false alarms',      v: letterFAs,   c: 'text-orange-400'  },
        { label: 'Position hits',            v: posHits,     c: 'text-violet-400'  },
        { label: 'Position correct rej.',    v: posCRs,      c: 'text-violet-400'  },
        { label: 'Position misses',          v: posMisses,   c: 'text-red-400'     },
        { label: 'Position false alarms',    v: posFAs,      c: 'text-orange-400'  },
      ]
    : [
        { label: 'Correct hits',       v: letterHits,  c: 'text-emerald-400' },
        { label: 'Correct rejections', v: letterCRs,   c: 'text-emerald-400' },
        { label: 'Misses',             v: letterMisses,c: 'text-red-400'     },
        { label: 'False alarms',       v: letterFAs,   c: 'text-orange-400'  },
      ]

  return (
    <div className="flex flex-col items-center gap-5 animate-fadeUp">
      <div className="text-center">
        <div className="text-6xl font-bold text-cyan-400 tabular-nums">{score}%</div>
        <div className="text-gray-400 text-sm mt-1">accuracy · {total} scoreable steps</div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {rows.map(({ label, v, c }) => (
          <div key={label} className="card p-3 text-center">
            <div className={`text-xl font-semibold ${c}`}>{v}</div>
            <div className="text-gray-600 text-xs mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      <button className="btn-primary w-full max-w-xs" onClick={onDone}>Continue</button>
    </div>
  )
}

export default function NBackGame({ difficulty, onComplete }) {
  const params = NBACK_PARAMS[difficulty]
  const { dual } = params

  const [phase,      setPhase]     = useState('instructions')
  const [seq,        setSeq]       = useState({ letters: [], positions: [] })
  const [stepIdx,    setStepIdx]   = useState(0)
  const [timeLeft,   setTimeLeft]  = useState(GAME_SECONDS)
  const [lResponded, setLRespd]    = useState(false)
  const [pResponded, setPRespd]    = useState(false)
  const [feedback,   setFeedback]  = useState(null)
  const letterResps  = useRef({})
  const posResps     = useRef({})
  const resultsRef   = useRef(null)
  const stepIdxRef   = useRef(0)

  useEffect(() => { stepIdxRef.current = stepIdx }, [stepIdx])

  function startGame() {
    // Generate enough steps to outlast the 30s timer at any difficulty
    const buffer = Math.ceil((GAME_SECONDS / (params.stimMs / 1000)) * 2) + params.N + 4
    const s = generateSequence(buffer, params.N)
    setSeq(s)
    setStepIdx(0)
    setTimeLeft(GAME_SECONDS)
    setLRespd(false); setPRespd(false)
    setFeedback(null)
    letterResps.current = {}; posResps.current = {}
    resultsRef.current  = null
    setPhase('playing')
  }

  // 30-second game timer
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      resultsRef.current = calcResults(stepIdxRef.current)
      setPhase('results')
      return
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  // Step advancement
  useEffect(() => {
    if (phase !== 'playing' || seq.letters.length === 0) return
    const t = setTimeout(() => {
      setStepIdx(i => i + 1)
      setLRespd(false); setPRespd(false)
      setFeedback(null)
    }, params.stimMs)
    return () => clearTimeout(t)
  })

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'playing') return
    function onKey(e) {
      if (e.key === 'l' || e.key === 'L') respondLetter(true)
      if (e.key === 'a' || e.key === 'A') respondLetter(false)
      if (e.key === 'p' || e.key === 'P') respondPos(true)
      if (e.key === 's' || e.key === 'S') respondPos(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function respondLetter(isMatch) {
    if (phase !== 'playing' || stepIdx < params.N || lResponded) return
    letterResps.current[stepIdx] = isMatch
    setLRespd(true)
    const correct = isMatch === (seq.letters[stepIdx] === seq.letters[stepIdx - params.N])
    setFeedback(correct ? 'correct' : 'wrong')
  }

  function respondPos(isMatch) {
    if (phase !== 'playing' || stepIdx < params.N || pResponded) return
    posResps.current[stepIdx] = isMatch
    setPRespd(true)
  }

  function calcResults(maxStep) {
    let letterHits = 0, letterMisses = 0, letterFAs = 0, letterCRs = 0
    let posHits    = 0, posMisses    = 0, posFAs    = 0, posCRs    = 0

    for (let i = params.N; i <= maxStep; i++) {
      const lMatch = seq.letters[i]   === seq.letters[i - params.N]
      const pMatch = seq.positions[i] === seq.positions[i - params.N]
      const userL  = letterResps.current[i] ?? false
      const userP  = posResps.current[i]    ?? false

      if (lMatch  && userL)  letterHits++
      else if (lMatch)       letterMisses++
      else if (userL)        letterFAs++
      else                   letterCRs++

      if (!dual) continue

      if (pMatch  && userP)  posHits++
      else if (pMatch)       posMisses++
      else if (userP)        posFAs++
      else                   posCRs++
    }

    const total         = Math.max(0, maxStep - params.N + 1)
    const letterCorrect = letterHits + letterCRs
    const posCorrect    = posHits    + posCRs
    const score = dual
      ? Math.round((letterCorrect + posCorrect) / Math.max(1, 2 * total) * 100)
      : Math.round(letterCorrect / Math.max(1, total) * 100)

    return { letterHits, letterMisses, letterFAs, letterCRs,
             posHits, posMisses, posFAs, posCRs, total, score }
  }

  function handleDone() {
    if (resultsRef.current) onComplete(resultsRef.current.score, 'nback')
  }

  const eligible = stepIdx >= params.N
  const letter   = seq.letters[stepIdx]  ?? ''
  const position = seq.positions[stepIdx] ?? 0

  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-amber-400' : 'text-cyan-400'

  if (phase === 'instructions') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center animate-fadeUp">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            {params.N}-Back{dual ? ' (Dual)' : ''}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            A letter flashes every {(params.stimMs / 1000).toFixed(1)}s{dual ? ' at one of 9 positions in a grid' : ''}.
            Press <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-xs">L</kbd> if the{' '}
            <strong className="text-gray-200">letter</strong> matches{' '}
            <strong className="text-gray-200">{params.N}</strong> step{params.N > 1 ? 's' : ''} back.
            {dual && (
              <>
                {' '}Press <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-violet-400 font-mono text-xs">P</kbd> if the{' '}
                <strong className="text-gray-200">position</strong> matches. Track both independently.
              </>
            )}
          </p>
          {dual && (
            <p className="text-gray-600 text-xs mt-2">
              Letter: <kbd className="font-mono">L</kbd> match · <kbd className="font-mono">A</kbd> no-match
              &nbsp;|&nbsp;
              Position: <kbd className="font-mono">P</kbd> match · <kbd className="font-mono">S</kbd> no-match
            </p>
          )}
          <p className="text-gray-600 text-xs mt-2">30 second game</p>
        </div>
        <button className="btn-primary w-full" onClick={startGame}>Begin</button>
      </div>
    )
  }

  if (phase === 'results') {
    return <ResultsScreen results={resultsRef.current} dual={dual} onDone={handleDone} />
  }

  return (
    <div className="flex flex-col items-center gap-5 animate-fadeUp">
      {/* Timer + step info */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-600">Step {stepIdx + 1} · {params.N}-back{dual ? ' · dual' : ''}</span>
          <span className={`text-2xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-400' : 'bg-cyan-500'}`}
            style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      {dual
        ? <PositionGrid position={position} letter={letter} feedback={feedback} />
        : <LetterDisplay letter={letter} feedback={feedback} />
      }

      <div className={`grid gap-3 w-full max-w-xs grid-cols-2`}>
        <button
          className={`py-3 rounded-lg font-semibold text-sm border transition-all ${
            !eligible || lResponded
              ? 'border-gray-800 text-gray-700 cursor-not-allowed'
              : 'border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10'
          }`}
          onClick={() => respondLetter(true)}
          disabled={!eligible || lResponded}
        >
          Letter match <span className="text-xs opacity-50 block">[L]</span>
        </button>

        {dual ? (
          <button
            className={`py-3 rounded-lg font-semibold text-sm border transition-all ${
              !eligible || pResponded
                ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                : 'border-violet-500/40 text-violet-400 hover:bg-violet-500/10'
            }`}
            onClick={() => respondPos(true)}
            disabled={!eligible || pResponded}
          >
            Position match <span className="text-xs opacity-50 block">[P]</span>
          </button>
        ) : (
          <button
            className={`py-3 rounded-lg font-semibold text-sm border transition-all ${
              !eligible || lResponded
                ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                : 'border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
            onClick={() => respondLetter(false)}
            disabled={!eligible || lResponded}
          >
            No match <span className="text-xs opacity-50 block">[A]</span>
          </button>
        )}
      </div>

      {!eligible
        ? <p className="text-gray-600 text-xs">Responses begin at step {params.N + 1}</p>
        : dual && (
          <p className="text-gray-600 text-xs">
            Letter {lResponded ? '✓' : '·'} &nbsp; Position {pResponded ? '✓' : '·'}
          </p>
        )
      }
    </div>
  )
}
