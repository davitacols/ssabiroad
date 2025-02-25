import { type NextRequest, NextResponse } from "next/server"
import fetch from "node-fetch"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&key=${apiKey}`,
    )
    const data = (await response.json()) as any

    const demographicData = {
      population: data.results.length * 100, // Rough estimate based on number of places
      placeTypes: [...new Set(data.results.flatMap((place: any) => place.types))],
      numberOfBusinesses: data.results.filter((place: any) => place.types.includes("establishment")).length,
    }

    return NextResponse.json(demographicData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch demographic data" }, { status: 500 })
  }
}

