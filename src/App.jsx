import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import useFirestoreSync from './hooks/useFirestoreSync'
import { adaptDifficulty } from './utils/difficulty'
import Header from './components/layout/Header'
import Dashboard from './components/Dashboard'
import GameHub from './components/GameHub'
import LockMode from './components/LockMode'
import ChallengeGate from './components/ChallengeGate'
import Leaderboard from './components/Leaderboard'
import LoginScreen from './components/LoginScreen'

function readChallengeParams() {
  const p = new URLSearchParams(window.location.search)
  const site = p.get('challenge')
  if (!site) return null
  return { site, returnUrl: p.get('from') ?? null }
}

function AppInner() {
  const { user, loading } = useAuth()
  const [view,       setView]      = useState('dashboard')
  const [autoStart,  setAutoStart] = useState(false)
  const [trainKey,   setTrainKey]  = useState(0)
  const [challengeMode] = useState(readChallengeParams)

  const [scores,      setScores]     = useFirestoreSync('mg_scores',    [],                               user)
  const [streak,      setStreak]     = useFirestoreSync('mg_streak',    { count: 0, lastDate: null },     user)
  const [difficulty,  setDifficulty] = useFirestoreSync('mg_difficulty', 2,                               user)
  const [lockedItems, setLockedItems]= useFirestoreSync('mg_locked',    [],                               user)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  function handleGameComplete(score, gameType) {
    const entry = { score, gameType, date: new Date().toISOString() }
    setScores(prev => [...prev, entry])
    setDifficulty(prev => adaptDifficulty(prev, score))
    setStreak(prev => {
      const today     = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86_400_000).toDateString()
      if (prev.lastDate === today) return prev
      const newCount = prev.lastDate === yesterday ? prev.count + 1 : 1
      return { count: newCount, lastDate: today }
    })
  }

  if (challengeMode) {
    return (
      <ChallengeGate
        site={challengeMode.site}
        returnUrl={challengeMode.returnUrl}
        difficulty={difficulty}
        onPass={() => { window.history.replaceState({}, '', '/') }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header view={view} setView={(v) => {
        if (v === 'games') { setAutoStart(false); setTrainKey(k => k + 1) }
        setView(v)
      }} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <Dashboard
            scores={scores}
            streak={streak}
            difficulty={difficulty}
            onStartGame={() => { setAutoStart(true); setTrainKey(k => k + 1); setView('games') }}
          />
        )}

        {view === 'games' && (
          <GameHub
            difficulty={difficulty}
            onComplete={handleGameComplete}
            autoStart={autoStart}
            key={trainKey}
          />
        )}

        {view === 'leaderboard' && (
          <Leaderboard
            scores={scores}
            streak={streak}
            difficulty={difficulty}
          />
        )}

        {view === 'lock' && (
          <LockMode
            lockedItems={lockedItems}
            setLockedItems={setLockedItems}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
