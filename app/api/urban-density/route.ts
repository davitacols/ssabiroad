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
    const censusApiKey = process.env.CENSUS_API_KEY
    const year = new Date().getFullYear() - 1

    const response = await fetch(
      `https://api.census.gov/data/${year}/acs/acs5?get=B01003_001E,B25001_001E&for=tract:*&in=state:*&key=${censusApiKey}`
    )
    const data = await response.json()

    const population = parseInt(data[1]?.[0] || '0')
    const housingUnits = parseInt(data[1]?.[1] || '0')
    const density = population / (housingUnits || 1)

    return NextResponse.json({
      latitude: lat,
      longitude: lng,
      population,
      housingUnits,
      densityScore: Math.min(Math.round(density * 10), 100),
      classification: density > 10 ? 'High Density' : density > 5 ? 'Medium Density' : 'Low Density'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch urban density data' }, { status: 500 })
  }
}
