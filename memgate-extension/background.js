// MemGate background service worker
// Intercepts navigation, checks locked list, redirects to challenge if needed.

const MEMGATE_URL = 'https://memgateofficial.web.app'

chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    // Only intercept top-level page navigations
    if (details.frameId !== 0) return

    const url = details.url

    // Never intercept MemGate itself or internal browser pages
    if (
      url.startsWith(MEMGATE_URL) ||
      url.startsWith('chrome') ||
      url.startsWith('about') ||
      url.startsWith('edge')
    ) return

    const data = await chrome.storage.local.get(['mg_loggedIn', 'mg_lockEnabled', 'mg_locked', 'mg_unlocked'])
    if (!data.mg_loggedIn)    return   // not logged in — never block
    if (!data.mg_lockEnabled) return

    const locked   = data.mg_locked  ?? []
    const unlocked = data.mg_unlocked ?? {}

    let hostname
    try {
      hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    } catch {
      return
    }

    // Find a matching locked item
    const match = locked.find(item => {
      if (!item.enabled) return false
      const name = item.name
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
      // Match if hostname contains the locked name or vice versa
      return hostname.includes(name) || name.includes(hostname.split('.')[0])
    })

    if (!match) return

    // Check if temporarily unlocked (10-minute window)
    const expiry = unlocked[match.name]
    if (expiry && Date.now() < expiry) return

    // Redirect to MemGate challenge
    const challengeUrl =
      `${MEMGATE_URL}/?challenge=${encodeURIComponent(match.name)}` +
      `&from=${encodeURIComponent(url)}`

    chrome.tabs.update(details.tabId, { url: challengeUrl })
  },
  { url: [{ schemes: ['http', 'https'] }] }
)

// Handle messages from content_script.js
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {

  // Sync: MemGate app pushed updated lock settings
  if (msg.type === 'SYNC') {
    chrome.storage.local.set({
      mg_loggedIn:    msg.loggedIn,
      mg_locked:      msg.locked,
      mg_lockEnabled: msg.lockEnabled,
    })
    return
  }

  // Unlock: user passed a challenge — grant 10-minute access to that site
  if (msg.type === 'UNLOCK') {
    chrome.storage.local.get('mg_unlocked', ({ mg_unlocked = {} }) => {
      const updated = {
        ...mg_unlocked,
        [msg.site]: Date.now() + 10 * 60 * 1000,   // 10 minutes from now
      }
      chrome.storage.local.set({ mg_unlocked: updated }, () => {
        sendResponse({ ok: true })
      })
    })
    return true  // keep channel open for async sendResponse
  }
})
