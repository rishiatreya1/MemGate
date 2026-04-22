const GAME_COLORS = {
  nback:   '#22d3ee',
  spatial: '#a78bfa',
  word:    '#fbbf24',
}

const W = 320
const H = 72
const BAR_GAP = 3

export default function ScoreChart({ scores }) {
  const recent = scores.slice(-14)

  if (recent.length === 0) {
    return (
      <div className="h-[72px] flex items-center justify-center text-gray-600 text-sm">
        No sessions recorded yet
      </div>
    )
  }

  const barW = (W - BAR_GAP * (recent.length - 1)) / recent.length

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Score history bar chart"
    >
      <defs>
        {Object.entries(GAME_COLORS).map(([game, color]) => (
          <linearGradient key={game} id={`grad-${game}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        ))}
      </defs>

      {/* Baseline */}
      <line x1="0" y1={H} x2={W} y2={H} stroke="#1f2937" strokeWidth="1" />

      {/* Score bars */}
      {recent.map((entry, i) => {
        const barH = Math.max(3, (entry.score / 100) * (H - 8))
        const x = i * (barW + BAR_GAP)
        const y = H - barH
        const color = GAME_COLORS[entry.gameType] ?? '#6b7280'
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={`url(#grad-${entry.gameType})`}
              rx="2"
            />
            <title>{entry.score}% — {entry.gameType} — {new Date(entry.date).toLocaleDateString()}</title>
          </g>
        )
      })}

      {/* Axis labels */}
      <text x="0" y={H - 1} fill="#374151" fontSize="8" fontFamily="Inter, sans-serif">0</text>
      <text x="0" y="9" fill="#374151" fontSize="8" fontFamily="Inter, sans-serif">100</text>
    </svg>
  )
}
