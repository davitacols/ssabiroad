import { type NextRequest, NextResponse } from "next/server"
import fetch from "node-fetch"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const apiKey = process.env.ENVIRONMENTAL_DATA_API_KEY

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`,
    )
    const data = (await response.json()) as any

    return NextResponse.json({
      airQualityIndex: data.list[0].main.aqi,
      pollutants: data.list[0].components,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch environmental data" }, { status: 500 })
  }
}

