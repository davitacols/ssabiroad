import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  try {
    const alerts = [
      { type: 'delay', severity: 'medium', route: 'Bus 42', message: 'Delayed by 5 minutes due to traffic', timestamp: new Date().toISOString() },
      { type: 'closure', severity: 'high', route: 'Train A', message: 'Station closed for maintenance', timestamp: new Date().toISOString() }
    ]

    return NextResponse.json({ alerts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
