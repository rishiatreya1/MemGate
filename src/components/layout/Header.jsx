const NAV = [
  { id: 'dashboard',   label: 'Dashboard'   },
  { id: 'games',       label: 'Train'       },
  { id: 'leaderboard', label: 'Rank'        },
  { id: 'lock',        label: 'Lock Mode'   },
]

function WaveAccent() {
  return (
    <svg width="120" height="20" viewBox="0 0 120 20" fill="none" className="opacity-30" aria-hidden>
      <path
        d="M0 10 Q10 2 20 10 Q30 18 40 10 Q50 2 60 10 Q70 18 80 10 Q90 2 100 10 Q110 18 120 10"
        stroke="#22d3ee"
        strokeWidth="1.5"
        fill="none"
        className="wave-line"
      />
    </svg>
  )
}

import { useAuth } from '../../contexts/AuthContext'

export default function Header({ view, setView }) {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-3 group"
        >
          <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" stroke="#22d3ee" strokeWidth="1.5" />
              <path d="M1 7h2M11 7h2M7 1v2M7 11v2" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-gray-100 tracking-tight">
            Mem<span className="text-cyan-400">Gate</span>
          </span>
          <WaveAccent />
        </button>

        {/* Nav + sign-out */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {NAV.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === id
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {user && (
            <button
              onClick={signOut}
              title={`Sign out (${user.email})`}
              className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            >
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
              )}
              Sign out
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
