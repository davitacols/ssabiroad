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
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=transit_station&key=${apiKey}`,
    )
    const data = (await response.json()) as any

    const transitStations = data.results.map((station: any) => ({
      name: station.name,
      location: station.geometry.location,
      types: station.types,
    }))

    return NextResponse.json({ transitStations })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transit data" }, { status: 500 })
  }
}

