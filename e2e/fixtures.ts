/**
 * E2E test fixtures — creates isolated test data and cleans up after.
 * Uses the API directly to avoid depending on existing DB state.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Luke-Skywalker001'

export interface TestFixture {
  eventId: string
  songIds: string[]
  cleanup: () => Promise<void>
}

async function adminFetch(path: string, options: RequestInit = {}) {
  // Get session cookie first
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  })
  const cookies = loginRes.headers.get('set-cookie') ?? ''

  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
      ...options.headers,
    },
  })
}

export async function createTestFixture(): Promise<TestFixture> {
  // Create a test event
  const eventRes = await adminFetch('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify({
      name: `[TEST] E2E Event ${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    }),
  })
  const event = await eventRes.json() as { id: string }

  // Create test songs
  const songTitles = ['Test Song Alpha', 'Test Song Beta', 'Test Song Gamma']
  const songIds: string[] = []

  for (const title of songTitles) {
    const res = await fetch(`${BASE}/api/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist: 'Test Artist' }),
    })
    const song = await res.json() as { id: string }
    songIds.push(song.id)
  }

  async function cleanup() {
    // Delete songs
    for (const id of songIds) {
      await adminFetch(`/api/songs/${id}`, { method: 'DELETE' })
    }
    // Delete event (cascades setlist_entries and votes)
    await adminFetch(`/api/admin/events/${event.id}`, { method: 'DELETE' })
  }

  return { eventId: event.id, songIds, cleanup }
}
