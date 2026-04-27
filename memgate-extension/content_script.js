// Injected into the MemGate app (localhost:5173).
// Two jobs:
//   1. Keep chrome.storage in sync with the app's localStorage settings.
//   2. Relay the "challenge passed" event back to the background worker,
//      then navigate to the originally requested site.

function syncSettings() {
  try {
    const locked      = JSON.parse(localStorage.getItem('mg_locked')      ?? '[]')
    const lockEnabled = JSON.parse(localStorage.getItem('mg_lockEnabled') ?? 'false')
    const loggedIn    = localStorage.getItem('mg_loggedIn') === 'true'
    chrome.runtime.sendMessage({ type: 'SYNC', locked, lockEnabled, loggedIn })
  } catch (err) {
    // Extension context may be invalidated after reload — ignore
  }
}

// Sync immediately and then every 3 seconds
syncSettings()
setInterval(syncSettings, 3000)

// The React app dispatches this event after a challenge is passed
window.addEventListener('memgate:challenge-passed', (e) => {
  const { site, returnUrl } = e.detail

  chrome.runtime.sendMessage({ type: 'UNLOCK', site }, () => {
    // Navigate to the originally requested URL
    if (returnUrl) {
      window.location.href = returnUrl
    }
  })
})
