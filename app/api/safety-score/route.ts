import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limit'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '5')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 })
  }

  try {
    const crimeReports = await prisma.crimeReport.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }
    })

    const nearbyCrimes = crimeReports.filter(report => {
      const loc = report.location as any
      if (!loc?.lat || !loc?.lng) return false
      const distance = calculateDistance(lat, lng, loc.lat, loc.lng)
      return distance <= radius
    })

    const safetyScore = Math.max(0, 100 - (nearbyCrimes.length * 5))

    return NextResponse.json({
      latitude: lat,
      longitude: lng,
      safetyScore,
      classification: safetyScore >= 80 ? 'Very Safe' : safetyScore >= 60 ? 'Safe' : safetyScore >= 40 ? 'Moderate' : 'Caution Advised',
      recentIncidents: nearbyCrimes.length,
      radius
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate safety score' }, { status: 500 })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
