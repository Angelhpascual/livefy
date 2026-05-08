import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import type { Event } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Event[])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json() as { name: string; date: string; bizum_number?: string }
  const { name, date, bizum_number } = body

  if (!name || !date) {
    return NextResponse.json({ error: 'name and date are required' }, { status: 400 })
  }

  // Desactiva cualquier evento activo antes de crear el nuevo
  await supabase.from('events').update({ active: false }).eq('active', true)

  const { data, error } = await supabase
    .from('events')
    .insert({
      name,
      date,
      active: true,
      bizum_number: bizum_number ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Event, { status: 201 })
}
