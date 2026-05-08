import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist')
  const title = request.nextUrl.searchParams.get('title')

  if (!artist) return NextResponse.json({ url: null })

  try {
    const query = title ? `${title} ${artist}` : artist
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`,
      { cache: 'no-store' }
    )
    const data = await res.json() as {
      results?: { artworkUrl100?: string }[]
    }

    const artwork = data.results?.[0]?.artworkUrl100
    if (!artwork) return NextResponse.json({ url: null })

    // Upgrade to high resolution
    const url = artwork.replace('100x100bb', '600x600bb')
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}
