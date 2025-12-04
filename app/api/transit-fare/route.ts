import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const distance = parseFloat(searchParams.get('distance') || '0')
  const mode = searchParams.get('mode') || 'transit'

  try {
    const baseFare = mode === 'BUS' ? 2.5 : 3.5
    const perKmRate = mode === 'BUS' ? 0.15 : 0.25
    const estimatedFare = (baseFare + (distance * perKmRate)).toFixed(2)

    const paymentOptions = [
      { method: 'Cash', available: true },
      { method: 'Transit Card', available: true, discount: '10%' },
      { method: 'Mobile Payment', available: true, discount: '5%' },
      { method: 'Monthly Pass', available: true, price: '$80' }
    ]

    return NextResponse.json({ 
      fare: estimatedFare, 
      currency: 'USD',
      paymentOptions,
      breakdown: {
        baseFare: baseFare.toFixed(2),
        distanceFare: (distance * perKmRate).toFixed(2)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate fare' }, { status: 500 })
  }
}
