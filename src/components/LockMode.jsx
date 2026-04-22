import { useState } from 'react'

const GAME_OPTIONS = [
  { value: 'any',     label: 'Any game'     },
  { value: 'nback',   label: 'N-Back'       },
  { value: 'spatial', label: 'Spatial'      },
  { value: 'word',    label: 'Word Recall'  },
]

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-cyan-500' : 'bg-gray-700'
      }`}
      style={{ height: '22px' }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function GameBadge({ game }) {
  const colors = {
    any:     'bg-gray-800 text-gray-400 border-gray-700',
    nback:   'bg-cyan-400/10 text-cyan-400 border-cyan-400/25',
    spatial: 'bg-violet-400/10 text-violet-400 border-violet-400/25',
    word:    'bg-amber-400/10 text-amber-400 border-amber-400/25',
  }
  const labels = { any: 'Any', nback: 'N-Back', spatial: 'Spatial', word: 'Word' }
  return (
    <span className={`badge text-xs border ${colors[game] ?? colors.any}`}>
      {labels[game] ?? 'Any'}
    </span>
  )
}

function ItemRow({ item, onToggle, onRemove, onGameChange }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-3 py-3">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0">
          {item.type === 'site' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 1.5C7 1.5 4.5 4 4.5 7s2.5 5.5 2.5 5.5M7 1.5C7 1.5 9.5 4 9.5 7S7 12.5 7 12.5M1.5 7h11" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4.5 5.5h5M4.5 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-gray-200 text-sm font-medium truncate">{item.name}</div>
            <GameBadge game={item.game ?? 'any'} />
          </div>
          <div className="text-gray-600 text-xs capitalize">{item.type}</div>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="text-gray-600 hover:text-gray-400 transition-colors p-1"
          title="Configure game"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 3h10M1 9h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            {expanded
              ? <path d="M4 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              : <path d="M3 6h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
          </svg>
        </button>

        <ToggleSwitch checked={item.enabled} onChange={v => onToggle(item.id, v)} />

        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-700 hover:text-red-400 transition-colors ml-1"
          aria-label="Remove"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Expanded game selector */}
      {expanded && (
        <div className="pb-3 pl-11 pr-2 -mt-1">
          <div className="text-gray-600 text-xs mb-2">Required game for this site:</div>
          <div className="flex flex-wrap gap-2">
            {GAME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onGameChange(item.id, opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  (item.game ?? 'any') === opt.value
                    ? opt.value === 'nback'   ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40'
                    : opt.value === 'spatial' ? 'bg-violet-400/15 text-violet-400 border-violet-400/40'
                    : opt.value === 'word'    ? 'bg-amber-400/15 text-amber-400 border-amber-400/40'
                    :                          'bg-gray-700 text-gray-300 border-gray-600'
                    : 'bg-gray-800/50 text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Example presets for quick-add
const PRESETS = [
  { name: 'reddit.com',   type: 'site', game: 'nback'   },
  { name: 'youtube.com',  type: 'site', game: 'word'    },
  { name: 'twitter.com',  type: 'site', game: 'spatial' },
  { name: 'instagram.com',type: 'site', game: 'any'     },
]

export default function LockMode({ lockedItems, setLockedItems }) {
  const [inputName, setInputName] = useState('')
  const [inputType, setInputType] = useState('site')
  const [inputGame, setInputGame] = useState('any')
  const [globalEnabled, setGlobalEnabled] = useState(
    () => JSON.parse(localStorage.getItem('mg_lockEnabled') ?? 'false')
  )

  function toggleGlobal(v) {
    setGlobalEnabled(v)
    localStorage.setItem('mg_lockEnabled', JSON.stringify(v))
  }

  function addItem(e) {
    e.preventDefault()
    const name = inputName.trim()
    if (!name) return
    if (lockedItems.some(i => i.name.toLowerCase() === name.toLowerCase())) return
    setLockedItems(prev => [
      ...prev,
      { id: Date.now(), name, type: inputType, enabled: true, game: inputGame },
    ])
    setInputName('')
  }

  function addPreset(preset) {
    if (lockedItems.some(i => i.name.toLowerCase() === preset.name.toLowerCase())) return
    setLockedItems(prev => [...prev, { id: Date.now(), ...preset, enabled: true }])
  }

  function toggleItem(id, enabled) {
    setLockedItems(prev => prev.map(i => i.id === id ? { ...i, enabled } : i))
  }

  function removeItem(id) {
    setLockedItems(prev => prev.filter(i => i.id !== id))
  }

  function updateGame(id, game) {
    setLockedItems(prev => prev.map(i => i.id === id ? { ...i, game } : i))
  }

  const enabledCount = lockedItems.filter(i => i.enabled).length

  return (
    <div className="space-y-6 animate-fadeUp max-w-lg">

      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Lock Mode</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gate sites behind a specific memory challenge.
        </p>
      </div>

      {/* Master toggle */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="text-gray-200 font-medium">Enable Lock Mode</div>
          <div className="text-gray-500 text-sm mt-0.5">
            {globalEnabled
              ? `${enabledCount} item${enabledCount !== 1 ? 's' : ''} gated`
              : 'Currently disabled'}
          </div>
        </div>
        <ToggleSwitch checked={globalEnabled} onChange={toggleGlobal} />
      </div>

      {/* Add item form */}
      <div className="card p-5 space-y-3">
        <div className="text-gray-300 text-sm font-medium">Add site or app</div>
        <form onSubmit={addItem} className="flex gap-2">
          <input
            type="text"
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            placeholder="e.g. reddit.com or YouTube"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm
                       focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-600"
          />
          <select
            value={inputType}
            onChange={e => setInputType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm
                       focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            <option value="site">Site</option>
            <option value="app">App</option>
          </select>
          <button type="submit" className="btn-primary text-sm px-4">Add</button>
        </form>

        {/* Game selector for new item */}
        <div>
          <div className="text-gray-600 text-xs mb-2">Required game:</div>
          <div className="flex flex-wrap gap-2">
            {GAME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInputGame(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  inputGame === opt.value
                    ? opt.value === 'nback'   ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40'
                    : opt.value === 'spatial' ? 'bg-violet-400/15 text-violet-400 border-violet-400/40'
                    : opt.value === 'word'    ? 'bg-amber-400/15 text-amber-400 border-amber-400/40'
                    :                          'bg-gray-700 text-gray-300 border-gray-600'
                    : 'bg-gray-800/50 text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-700 text-xs">
          The browser extension will intercept these and require the chosen game before access.
        </p>
      </div>

      {/* Quick-add presets */}
      {lockedItems.length === 0 && (
        <div className="card p-5 space-y-3">
          <div className="text-gray-300 text-sm font-medium">Quick-add presets</div>
          <div className="space-y-2">
            {PRESETS.map(p => (
              <div key={p.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">{p.name}</span>
                  <GameBadge game={p.game} />
                </div>
                <button
                  onClick={() => addPreset(p)}
                  className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked items list */}
      {lockedItems.length > 0 ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-gray-300 text-sm font-medium">
              Gated items ({lockedItems.length})
            </div>
            <button
              onClick={() => setLockedItems([])}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div>
            {lockedItems.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onRemove={removeItem}
                onGameChange={updateGame}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center border-dashed">
          <div className="text-gray-600 text-sm">No items added yet.</div>
          <div className="text-gray-700 text-xs mt-1">
            Add a site or app above to get started.
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400/80 leading-relaxed">
        <strong className="text-amber-400">Extension stub</strong> — the browser extension that intercepts
        navigation is not yet installed. Lock Mode settings are saved locally and will be read by the
        extension once it's connected.
      </div>

    </div>
  )
}
