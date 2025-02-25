import { type NextRequest, NextResponse } from "next/server"
import fetch from "node-fetch"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&fields=name,rating,formatted_address,place_id&key=${apiKey}`,
    )
    const data = (await response.json()) as any

    if (data.candidates && data.candidates.length > 0) {
      const placeId = data.candidates[0].place_id
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,review,price_level&key=${apiKey}`,
      )
      const detailsData = (await detailsResponse.json()) as any

      return NextResponse.json({
        name: detailsData.result.name,
        rating: detailsData.result.rating,
        reviews: detailsData.result.reviews,
        priceLevel: detailsData.result.price_level,
      })
    } else {
      return NextResponse.json({ error: "No historical data found for this address" }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}

