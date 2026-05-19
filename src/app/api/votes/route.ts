import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import type { Tier } from '@/types'

const VALID_TIERS = new Set<Tier>(['free', 'priority', 'next'])
const MAX_VOTES = 5
const MAX_SESSION_ID_LENGTH = 128
const MAX_DEDICATION_LENGTH = 280

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === '23505'
}

interface VoteBody {
  entryId: string
  eventId?: string
  sessionId: string
  tier: Tier
  dedication?: string
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit({ key: `votes:${ip}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: VoteBody
  try {
    body = (await req.json()) as VoteBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { entryId, eventId, sessionId, tier, dedication } = body

  if (!entryId || !sessionId || !tier) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!VALID_TIERS.has(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  if (sessionId.length > MAX_SESSION_ID_LENGTH) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  if (dedication && dedication.length > MAX_DEDICATION_LENGTH) {
    return NextResponse.json({ error: 'Dedication too long' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: activeEvent } = await supabase
    .from('events')
    .select('id')
    .eq('active', true)
    .single()

  if (!activeEvent || (eventId && eventId !== activeEvent.id)) {
    return NextResponse.json({ error: 'No active event' }, { status: 404 })
  }

  // If this is a virtual entry (not yet in DB), create it first
  let realEntryId = entryId
  if (entryId.startsWith('virtual-')) {
    const songId = entryId.replace('virtual-', '')

    // Get max position
    const { data: maxData } = await supabase
      .from('setlist_entries')
      .select('position')
      .eq('event_id', activeEvent.id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = (maxData?.position ?? 0) + 1

    const { data: newEntry, error: createError } = await supabase
      .from('setlist_entries')
      .insert({ event_id: activeEvent.id, song_id: songId, position, status: 'pending', tier: 'free', votes: 0, bizum_confirmed: false })
      .select('id')
      .single()

    if (createError) {
      // Might already exist (race condition) — try to fetch it
      const { data: existing } = await supabase
        .from('setlist_entries')
        .select('id').eq('event_id', activeEvent.id).eq('song_id', songId).single()
      if (!existing) return NextResponse.json({ error: 'Could not create entry' }, { status: 500 })
      realEntryId = existing.id
    } else {
      realEntryId = newEntry.id
    }
  } else {
    const { data: entry } = await supabase
      .from('setlist_entries')
      .select('id')
      .eq('id', entryId)
      .eq('event_id', activeEvent.id)
      .single()

    if (!entry) return NextResponse.json({ error: 'Invalid entry' }, { status: 400 })
  }

  const { data: eventEntries, error: entriesError } = await supabase
    .from('setlist_entries')
    .select('id')
    .eq('event_id', activeEvent.id)

  if (entriesError) {
    console.error('[POST /api/votes] fetch event entries error:', entriesError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const entryIds = (eventEntries ?? []).map((entry) => entry.id)
  if (entryIds.length > 0) {
    const { count, error: countError } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .in('setlist_entry_id', entryIds)

    if (countError) {
      console.error('[POST /api/votes] count votes error:', countError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if ((count ?? 0) >= MAX_VOTES) {
      return NextResponse.json({ error: 'Vote limit reached' }, { status: 403 })
    }
  }

  // Insert vote
  const { error: voteError } = await supabase
    .from('votes')
    .insert({ setlist_entry_id: realEntryId, session_id: sessionId })

  if (voteError) {
    // Unique constraint violation = already voted
    if (isUniqueViolation(voteError)) {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 })
    }
    console.error('[POST /api/votes] insert vote error:', voteError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // For paid tiers, update the setlist entry
  if (tier === 'priority' || tier === 'next') {
    const updatePayload: Record<string, unknown> = {
      tier,
      bizum_confirmed: false,
    }
    if (dedication) updatePayload.dedication = dedication.trim()

    const { error: updateError } = await supabase
      .from('setlist_entries')
      .update(updatePayload)
      .eq('id', realEntryId)

    if (updateError) {
      console.error('[POST /api/votes] update entry error:', updateError)
      // Vote was already inserted, don't fail the whole request
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
