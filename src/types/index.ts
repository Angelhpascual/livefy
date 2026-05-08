export type Song = {
  id: string
  title: string
  artist: string
  image_urls: string[]
  lyrics: string | null
  artwork_url: string | null
  created_at: string
}

export type Event = {
  id: string
  name: string
  date: string
  active: boolean
  bizum_number: string | null
  created_at: string
}

export type SetlistEntry = {
  id: string
  event_id: string
  song_id: string
  position: number
  status: 'pending' | 'playing' | 'played'
  tier: 'free' | 'priority' | 'next'
  votes: number
  dedication: string | null
  bizum_confirmed: boolean
  requester_session: string | null
  created_at: string
  song?: Song
}

export type Vote = {
  id: string
  setlist_entry_id: string
  session_id: string
  created_at: string
}

export type Tier = 'free' | 'priority' | 'next'
export type EntryStatus = 'pending' | 'playing' | 'played'
