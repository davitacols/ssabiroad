import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const originLat = searchParams.get('originLat')
  const originLng = searchParams.get('originLng')
  const destLat = searchParams.get('destLat')
  const destLng = searchParams.get('destLng')

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: 'Origin and destination coordinates required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=transit&alternatives=true&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const data = await response.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.status, routes: [] }, { status: 200 })
    }

    const routes = data.routes.map((route: any) => ({
      summary: route.summary,
      duration: route.legs[0].duration.text,
      distance: route.legs[0].distance.text,
      steps: route.legs[0].steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.text,
        duration: step.duration.text,
        travelMode: step.travel_mode,
        transitDetails: step.transit_details ? {
          line: step.transit_details.line.short_name || step.transit_details.line.name,
          vehicle: step.transit_details.line.vehicle.type,
          departure: step.transit_details.departure_stop.name,
          arrival: step.transit_details.arrival_stop.name,
          numStops: step.transit_details.num_stops
        } : null
      }))
    }))

    return NextResponse.json({ routes })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get directions' }, { status: 500 })
  }
}
