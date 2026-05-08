import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { Song } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('artist', { ascending: true })
      .order('title', { ascending: true })

    if (error) throw error

    return NextResponse.json(data as Song[])
  } catch (error) {
    console.error('GET /api/songs error:', error)
    return NextResponse.json({ error: 'Error fetching songs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, artist, image_urls, lyrics } = body as {
      title: string
      artist: string
      image_urls?: string[]
      lyrics?: string | null
    }

    if (!title || !artist) {
      return NextResponse.json(
        { error: 'title and artist are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('songs')
      .insert({ title, artist, image_urls: image_urls ?? [], lyrics: lyrics ?? null })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data as Song, { status: 201 })
  } catch (error) {
    console.error('POST /api/songs error:', error)
    return NextResponse.json({ error: 'Error creating song' }, { status: 500 })
  }
}
