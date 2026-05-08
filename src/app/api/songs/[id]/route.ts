import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { Song } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data as Song)
  } catch (error) {
    console.error('GET /api/songs/[id] error:', error)
    return NextResponse.json({ error: 'Error fetching song' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, artist, image_urls, lyrics, artwork_url } = body as Partial<
      Pick<Song, 'title' | 'artist' | 'image_urls' | 'lyrics' | 'artwork_url'>
    >

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('songs')
      .update({ title, artist, image_urls, lyrics, artwork_url })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data as Song)
  } catch (error) {
    console.error('PUT /api/songs/[id] error:', error)
    return NextResponse.json({ error: 'Error updating song' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase.from('songs').delete().eq('id', id)

    if (error) throw error

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/songs/[id] error:', error)
    return NextResponse.json({ error: 'Error deleting song' }, { status: 500 })
  }
}
