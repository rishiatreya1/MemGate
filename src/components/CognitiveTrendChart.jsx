import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

const DAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const GAME_COLORS = { nback: '#22d3ee', spatial: '#a78bfa', word: '#fbbf24' }

const TOD_BUCKETS = [
  { label: 'Night',     range: [0,  6],  color: '#6366f1' },
  { label: 'Morning',   range: [6,  12], color: '#f59e0b' },
  { label: 'Afternoon', range: [12, 18], color: '#10b981' },
  { label: 'Evening',   range: [18, 24], color: '#8b5cf6' },
]

function buildWeeklyData(scores) {
  // Last 28 days, grouped by day-of-week
  const cutoff = Date.now() - 28 * 86_400_000
  const recent = scores.filter(s => new Date(s.date).getTime() > cutoff)

  const buckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0, nback: 0, nbackN: 0, spatial: 0, spatialN: 0, word: 0, wordN: 0 }))

  for (const s of recent) {
    const day = new Date(s.date).getDay()
    buckets[day].total += s.score
    buckets[day].count++
    if (s.gameType === 'nback')   { buckets[day].nback   += s.score; buckets[day].nbackN++   }
    if (s.gameType === 'spatial') { buckets[day].spatial += s.score; buckets[day].spatialN++ }
    if (s.gameType === 'word')    { buckets[day].word    += s.score; buckets[day].wordN++    }
  }

  // Rotate so today is rightmost
  const today = new Date().getDay()
  const order = Array.from({ length: 7 }, (_, i) => (today - 6 + i + 7) % 7)

  return order.map(dayIdx => ({
    day: DAY_LABELS[dayIdx],
    avg: buckets[dayIdx].count ? Math.round(buckets[dayIdx].total / buckets[dayIdx].count) : null,
    nback:   buckets[dayIdx].nbackN   ? Math.round(buckets[dayIdx].nback   / buckets[dayIdx].nbackN)   : null,
    spatial: buckets[dayIdx].spatialN ? Math.round(buckets[dayIdx].spatial / buckets[dayIdx].spatialN) : null,
    word:    buckets[dayIdx].wordN    ? Math.round(buckets[dayIdx].word    / buckets[dayIdx].wordN)    : null,
    sessions: buckets[dayIdx].count,
  }))
}

function buildTodData(scores) {
  const result = TOD_BUCKETS.map(b => ({ ...b, total: 0, count: 0 }))
  for (const s of scores) {
    const h = new Date(s.date).getHours()
    const bucket = result.find(b => h >= b.range[0] && h < b.range[1])
    if (bucket) { bucket.total += s.score; bucket.count++ }
  }
  return result.map(b => ({ ...b, avg: b.count ? Math.round(b.total / b.count) : null }))
}

function PeakInsight({ todData }) {
  const withData = todData.filter(b => b.avg !== null)
  if (withData.length < 2) return null
  const peak = withData.reduce((a, b) => b.avg > a.avg ? b : a)
  const diff  = withData.length > 1
    ? peak.avg - Math.round(withData.filter(b => b.label !== peak.label).reduce((s, b) => s + b.avg, 0) / (withData.length - 1))
    : 0
  if (diff <= 0) return null

  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
      <span className="text-cyan-400 text-lg mt-0.5">⚡</span>
      <p className="text-sm text-gray-300 leading-relaxed">
        Your encoding is{' '}
        <span className="text-cyan-400 font-semibold">{diff}% sharper</span> during{' '}
        <span className="text-white font-semibold">{peak.label}</span> — peak window is{' '}
        {peak.range[0]}:00–{peak.range[1]}:00.
      </p>
    </div>
  )
}

function TodHeatmap({ todData }) {
  const max = Math.max(...todData.map(b => b.avg ?? 0), 1)
  return (
    <div className="grid grid-cols-4 gap-2">
      {todData.map(b => {
        const pct = b.avg !== null ? b.avg / max : 0
        return (
          <div key={b.label} className="rounded-lg p-3 text-center relative overflow-hidden"
               style={{ background: `rgba(${hexToRgb(b.color)}, ${0.05 + pct * 0.25})`, border: `1px solid ${b.color}25` }}>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all"
              style={{ height: `${pct * 100}%`, background: `${b.color}18` }}
            />
            <div className="relative">
              <div className="text-xs text-gray-500 mb-1">{b.label}</div>
              <div className="font-bold tabular-nums" style={{ color: b.avg !== null ? b.color : '#374151' }}>
                {b.avg !== null ? `${b.avg}%` : '—'}
              </div>
              <div className="text-gray-700 text-xs mt-0.5">{b.count}x</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-gray-400 mb-1 font-medium">{label}</div>
      {payload.map(p => p.value != null && (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.dataKey === 'avg' ? 'Overall' : p.dataKey}</span>
          <span className="font-semibold ml-1" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function CognitiveTrendChart({ scores }) {
  const weeklyData = buildWeeklyData(scores)
  const todData    = buildTodData(scores)
  const hasWeekly  = weeklyData.some(d => d.avg !== null)

  return (
    <div className="space-y-6">
      {/* Weekly line chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-gray-200 font-medium text-sm">Weekly Performance</div>
            <div className="text-gray-600 text-xs mt-0.5">Last 28 days by day of week</div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {Object.entries(GAME_COLORS).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5 capitalize">
                <span className="w-2 h-2 rounded-sm" style={{ background: c }} />{k}
              </span>
            ))}
          </div>
        </div>

        {hasWeekly ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#374151" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="nback"   stroke={GAME_COLORS.nback}   strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="spatial" stroke={GAME_COLORS.spatial} strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="word"    stroke={GAME_COLORS.word}    strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="avg"     stroke="#ffffff" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-gray-600 text-sm">
            Train at least one session to see weekly trends
          </div>
        )}
      </div>

      {/* Peak Performance heatmap */}
      <div>
        <div className="text-gray-200 font-medium text-sm mb-3">Peak Performance Window</div>
        <TodHeatmap todData={todData} />
        <PeakInsight todData={todData} />
      </div>
    </div>
  )
}
