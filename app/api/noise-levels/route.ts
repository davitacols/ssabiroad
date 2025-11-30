import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 })
  }

  try {
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&key=${process.env.GOOGLE_PLACES_API_KEY}`
    )
    const placesData = await placesResponse.json()

    const roadCount = placesData.results?.filter((p: any) => 
      p.types?.includes('route') || p.types?.includes('street_address')
    ).length || 0

    const commercialCount = placesData.results?.filter((p: any) => 
      p.types?.includes('store') || p.types?.includes('restaurant')
    ).length || 0

    const noiseLevel = Math.min(30 + (roadCount * 5) + (commercialCount * 3), 90)

    return NextResponse.json({
      latitude: lat,
      longitude: lng,
      noiseLevelDb: noiseLevel,
      classification: noiseLevel > 70 ? 'High' : noiseLevel > 50 ? 'Moderate' : 'Low',
      factors: {
        nearbyRoads: roadCount,
        commercialActivity: commercialCount
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to estimate noise levels' }, { status: 500 })
  }
}
