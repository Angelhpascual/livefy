import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import type { EntryStatus, Tier } from '@/types'

type PatchBody = {
  status?: EntryStatus
  tier?: Tier
  position?: number
  bizum_confirmed?: boolean
  dedication?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json() as PatchBody

  // If changing status to 'playing', set all other entries in the same event to 'pending'
  if (body.status === 'playing') {
    const { data: entry } = await supabase
      .from('setlist_entries')
      .select('event_id')
      .eq('id', id)
      .single()

    if (entry) {
      await supabase
        .from('setlist_entries')
        .update({ status: 'pending' })
        .eq('event_id', entry.event_id)
        .eq('status', 'playing')
        .neq('id', id)
    }
  }

  const { data, error } = await supabase
    .from('setlist_entries')
    .update(body)
    .eq('id', id)
    .select('*, song:songs(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.bizum_confirmed === true && data?.tier && data.tier !== 'free') {
    const clientWithRpc = supabase as typeof supabase & {
      rpc?: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }
    const { error: reorderError } = clientWithRpc.rpc
      ? await clientWithRpc.rpc('reorder_on_tier_upgrade', { p_entry_id: id, p_new_tier: data.tier })
      : { error: null }

    if (reorderError) {
      return NextResponse.json({ error: reorderError.message }, { status: 500 })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('setlist_entries')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
