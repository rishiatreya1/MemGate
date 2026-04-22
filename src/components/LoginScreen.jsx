import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function WaveAccent() {
  return (
    <svg width="200" height="24" viewBox="0 0 200 24" fill="none" className="opacity-20" aria-hidden>
      <path
        d="M0 12 Q16 3 32 12 Q48 21 64 12 Q80 3 96 12 Q112 21 128 12 Q144 3 160 12 Q176 21 192 12"
        stroke="#22d3ee" strokeWidth="1.5" fill="none"
      />
    </svg>
  )
}

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogle() {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError('Sign-in failed. Make sure pop-ups are allowed.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="6" stroke="#22d3ee" strokeWidth="2" />
              <path d="M2 14h4M22 14h4M14 2v4M14 22v4" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-100 tracking-tight">
              Mem<span className="text-cyan-400">Gate</span>
            </h1>
            <WaveAccent />
            <p className="text-gray-500 text-sm mt-1">Neural priming · Memory science · Access control</p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Sign in to continue</h2>
            <p className="text-gray-500 text-sm mt-1">
              Your streaks and scores are stored securely in the cloud.
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900
                       font-medium py-3 px-4 rounded-xl transition-all duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Google logo */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.9 36 24 36c-5.2 0-9.7-2.9-11.3-7l-6.5 5C9.7 39.7 16.4 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C41 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <p className="text-gray-700 text-xs">
            By signing in you agree to use this tool for personal productivity only.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['N-Back up to 4×', 'Dual-channel', '12×12 spatial', 'Word recall', 'Streak tracking'].map(f => (
            <span key={f} className="badge bg-gray-900 border-gray-800 text-gray-600 text-xs">{f}</span>
          ))}
        </div>

      </div>
    </div>
  )
}
