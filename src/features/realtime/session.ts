const SESSION_KEY = 'livefy_session_id'

function generateUUIDv4(): string {
  // Use crypto.randomUUID if available (modern browsers + Node 19+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback: manual UUID v4 construction
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getSessionId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return ''
  }

  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing

    const id = generateUUIDv4()
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    // localStorage may be blocked (e.g. private browsing restrictions)
    return generateUUIDv4()
  }
}
