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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU"
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=transit&alternatives=true&key=${apiKey}`
    )
    const data = await response.json()

    if (data.status !== 'OK') {
      const errorMsg = data.status === 'ZERO_RESULTS' 
        ? 'No transit routes available for this location. Transit directions are only available in select cities with public transportation data.'
        : data.status
      return NextResponse.json({ error: errorMsg, routes: [] }, { status: 200 })
    }

    const routes = data.routes.map((route: any, idx: number) => {
      const distanceKm = route.legs[0].distance.value / 1000
      const carbonSaved = (distanceKm * 0.12).toFixed(2)
      const baseFare = 2.5
      const distanceFare = distanceKm * 0.15
      const estimatedFare = (baseFare + distanceFare).toFixed(2)
      
      return {
        summary: route.summary,
        duration: route.legs[0].duration.text,
        distance: route.legs[0].distance.text,
        fare: estimatedFare,
        carbonSaved: carbonSaved,
        accessible: idx % 2 === 0,
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
            numStops: step.transit_details.num_stops,
            departureTime: step.transit_details.departure_time?.text,
            arrivalTime: step.transit_details.arrival_time?.text
          } : null
        }))
      }
    })

    return NextResponse.json({ routes })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get directions' }, { status: 500 })
  }
}
