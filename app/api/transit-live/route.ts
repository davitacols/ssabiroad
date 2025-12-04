import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const routeId = searchParams.get('routeId')
  const vehicleId = searchParams.get('vehicleId')

  try {
    const now = Date.now()
    const vehicles = [
      {
        id: vehicleId || 'BUS-42-001',
        route: routeId || 'Bus 42',
        lat: 6.4541 + (Math.sin(now / 10000) * 0.01),
        lng: 3.3947 + (Math.cos(now / 10000) * 0.01),
        speed: 35 + Math.random() * 10,
        heading: (now / 100) % 360,
        occupancy: Math.floor(Math.random() * 100),
        nextStop: 'TBS Bus Terminal',
        eta: '3 min',
        delay: Math.floor(Math.random() * 5)
      }
    ]

    return NextResponse.json({ vehicles, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 })
  }
}
