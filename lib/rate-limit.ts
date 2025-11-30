import { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(req: NextRequest, limit = 100, window = 60000): boolean {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function getRateLimitHeaders(req: NextRequest, limit = 100) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const record = rateLimit.get(ip)
  
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': record ? (limit - record.count).toString() : limit.toString(),
    'X-RateLimit-Reset': record ? new Date(record.resetTime).toISOString() : new Date(Date.now() + 60000).toISOString()
  }
}
