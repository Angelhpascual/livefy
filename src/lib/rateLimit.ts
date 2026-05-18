// In-memory rate limiter — resets on server restart (sufficient for Vercel serverless)
// For persistent limits, use Upstash Redis

const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= limit) return false // blocked

  entry.count++
  return true // allowed
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  return 'unknown'
}
