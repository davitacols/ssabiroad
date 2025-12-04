import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stopId = searchParams.get('stopId')
  const routeId = searchParams.get('routeId')

  if (!stopId) {
    return NextResponse.json({ error: 'Stop ID required' }, { status: 400 })
  }

  try {
    const arrivals = [
      { route: routeId || 'Bus 42', arrival: '2 min', delay: 0, vehicle: 'BUS' },
      { route: routeId || 'Bus 42', arrival: '15 min', delay: 2, vehicle: 'BUS' },
      { route: 'Train A', arrival: '5 min', delay: 0, vehicle: 'TRAIN' }
    ]

    return NextResponse.json({ arrivals, lastUpdate: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch real-time data' }, { status: 500 })
  }
}
