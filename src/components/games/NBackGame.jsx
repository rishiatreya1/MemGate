import { useState, useEffect, useRef, useMemo } from 'react'
import { NBACK_PARAMS } from '../../utils/difficulty'

const LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'.split('')
const GRID_SIZE = 3   // 3×3 = 9 positions for dual N-back

// Generate letter sequence + position sequence (independently)
function generateSequence(length, N) {
  const letters   = []
  const positions = []

  for (let i = 0; i < length; i++) {
    // ~30 % chance of letter match at eligible positions
    if (i >= N && Math.random() < 0.3) {
      letters.push(letters[i - N])
    } else {
      let l
      do { l = LETTERS[Math.floor(Math.random() * LETTERS.length)] }
      while (i >= N && l === letters[i - N])
      letters.push(l)
    }

    // ~30 % chance of position match (independent of letter)
    if (i >= N && Math.random() < 0.3) {
      positions.push(positions[i - N])
    } else {
      let p
      do { p = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)) }
      while (i >= N && p === positions[i - N])
      positions.push(p)
    }
  }

  return { letters, positions }
}

// 3×3 grid showing the current letter at the active position
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

// Simple letter-only display for non-dual mode
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
        { label: 'Letter hits',             v: letterHits, c: 'text-emerald-400' },
        { label: 'Letter correct rejections',v: letterCRs,  c: 'text-emerald-400' },
        { label: 'Letter misses',            v: letterMisses,c:'text-red-400'     },
        { label: 'Letter false alarms',      v: letterFAs,   c:'text-orange-400'  },
        { label: 'Position hits',            v: posHits,    c: 'text-violet-400'  },
        { label: 'Position correct rej.',    v: posCRs,     c: 'text-violet-400'  },
        { label: 'Position misses',          v: posMisses,  c: 'text-red-400'     },
        { label: 'Position false alarms',    v: posFAs,     c: 'text-orange-400'  },
      ]
    : [
        { label: 'Correct hits',       v: letterHits, c: 'text-emerald-400' },
        { label: 'Correct rejections', v: letterCRs,  c: 'text-emerald-400' },
        { label: 'Misses',             v: letterMisses,c:'text-red-400'     },
        { label: 'False alarms',       v: letterFAs,   c:'text-orange-400'  },
      ]

  return (
    <div className="flex flex-col items-center gap-5 animate-fadeUp">
      <div className="text-center">
        <div className="text-6xl font-bold text-cyan-400 tabular-nums">{score}%</div>
        <div className="text-gray-400 text-sm mt-1">accuracy · {total} scoreable steps</div>
      </div>

      <div className={`grid gap-2 w-full max-w-xs ${dual ? 'grid-cols-2' : 'grid-cols-2'}`}>
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

  const [phase,     setPhase]     = useState('instructions')
  const [seq,       setSeq]       = useState({ letters: [], positions: [] })
  const [stepIdx,   setStepIdx]   = useState(0)
  const [lResponded, setLRespd]   = useState(false)   // letter response given
  const [pResponded, setPRespd]   = useState(false)   // position response given
  const [feedback,  setFeedback]  = useState(null)    // 'correct'|'wrong'|null (letter-response feedback)
  const letterResps = useRef({})
  const posResps    = useRef({})
  const resultsRef  = useRef(null)

  function startGame() {
    const s = generateSequence(params.length, params.N)
    setSeq(s)
    setStepIdx(0)
    setLRespd(false); setPRespd(false)
    setFeedback(null)
    letterResps.current = {}; posResps.current = {}
    resultsRef.current  = null
    setPhase('playing')
  }

  // Advance sequence on a chained timeout
  useEffect(() => {
    if (phase !== 'playing' || seq.letters.length === 0) return
    const t = setTimeout(() => {
      if (stepIdx >= seq.letters.length - 1) {
        resultsRef.current = calcResults()
        setPhase('results')
      } else {
        setStepIdx(i => i + 1)
        setLRespd(false); setPRespd(false)
        setFeedback(null)
      }
    }, params.stimMs)
    return () => clearTimeout(t)
  })  // intentionally no deps — re-runs each render during 'playing' but only timer fires

  // Only schedule during playing phase
  useEffect(() => {}, [phase, stepIdx])

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'playing') return
    function onKey(e) {
      if (e.key === 'l' || e.key === 'L') respondLetter(true)
      if (e.key === 'a' || e.key === 'A') respondLetter(false)   // 'A' = letter no-match
      if (e.key === 'p' || e.key === 'P') respondPos(true)
      if (e.key === 's' || e.key === 'S') respondPos(false)      // 'S' = position no-match
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

  function calcResults() {
    let letterHits = 0, letterMisses = 0, letterFAs = 0, letterCRs = 0
    let posHits    = 0, posMisses    = 0, posFAs    = 0, posCRs    = 0
    const total = seq.letters.length - params.N

    for (let i = params.N; i < seq.letters.length; i++) {
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

    const letterCorrect = letterHits + letterCRs
    const posCorrect    = posHits    + posCRs
    const score = dual
      ? Math.round((letterCorrect + posCorrect) / (2 * total) * 100)
      : Math.round(letterCorrect / total * 100)

    return { letterHits, letterMisses, letterFAs, letterCRs,
             posHits, posMisses, posFAs, posCRs, total, score }
  }

  function handleDone() {
    if (resultsRef.current) onComplete(resultsRef.current.score, 'nback')
  }

  const progress  = seq.letters.length > 0 ? (stepIdx + 1) / seq.letters.length : 0
  const eligible  = stepIdx >= params.N
  const letter    = seq.letters[stepIdx]
  const position  = seq.positions?.[stepIdx] ?? 0

  // ── Instructions ─────────────────────────────────────────────────────────────
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
          <p className="text-gray-600 text-xs mt-2">{params.length} stimuli</p>
        </div>
        <button className="btn-primary w-full" onClick={startGame}>Begin</button>
      </div>
    )
  }

  if (phase === 'results') {
    return <ResultsScreen results={resultsRef.current} dual={dual} onDone={handleDone} />
  }

  // ── Playing ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 animate-fadeUp">
      {/* Progress */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span>Step {stepIdx + 1} / {seq.letters.length}</span>
          <span>{params.N}-back{dual ? ' · dual' : ''}</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full">
          <div className="h-1 bg-cyan-500 rounded-full transition-all duration-300"
               style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Stimulus */}
      {dual
        ? <PositionGrid position={position} letter={letter} feedback={feedback} />
        : <LetterDisplay letter={letter} feedback={feedback} />
      }

      {/* Response buttons */}
      <div className={`grid gap-3 w-full max-w-xs ${dual ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {/* Letter match */}
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
          /* Position match */
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
          /* No match (single mode) */
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
