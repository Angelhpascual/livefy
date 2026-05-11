/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

describe('GET /api/artist-image', () => {
  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn()
  })

  it('returns null when no artist param', async () => {
    const { GET } = await import('@/app/api/artist-image/route')
    const req = new NextRequest('http://localhost/api/artist-image')
    const res = await GET(req)
    const json = await res.json() as { url: null }
    expect(json.url).toBeNull()
  })

  it('returns artwork url from iTunes when found', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        results: [{ artworkUrl100: 'https://example.com/art/100x100bb.jpg' }],
      }),
    })

    const { GET } = await import('@/app/api/artist-image/route')
    const req = new NextRequest('http://localhost/api/artist-image?artist=Outkast&title=Hey+Ya')
    const res = await GET(req)
    const json = await res.json() as { url: string }

    expect(json.url).toBe('https://example.com/art/600x600bb.jpg')
  })

  it('returns null when iTunes returns no results', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ results: [] }),
    })

    const { GET } = await import('@/app/api/artist-image/route')
    const req = new NextRequest('http://localhost/api/artist-image?artist=UnknownArtist')
    const res = await GET(req)
    const json = await res.json() as { url: null }

    expect(json.url).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { GET } = await import('@/app/api/artist-image/route')
    const req = new NextRequest('http://localhost/api/artist-image?artist=Outkast')
    const res = await GET(req)
    const json = await res.json() as { url: null }

    expect(json.url).toBeNull()
  })

  it('upgrades artwork url to 600x600', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        results: [{ artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music/art/100x100bb.jpg' }],
      }),
    })

    const { GET } = await import('@/app/api/artist-image/route')
    const req = new NextRequest('http://localhost/api/artist-image?artist=Test')
    const res = await GET(req)
    const json = await res.json() as { url: string }

    expect(json.url).toContain('600x600bb')
    expect(json.url).not.toContain('100x100bb')
  })
})
