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
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
    const data = (await response.json()) as any

    const zoningInfo = data.results[0].address_components.find((component: any) =>
      component.types.includes("administrative_area_level_2"),
    )

    return NextResponse.json({
      zoneType: zoningInfo ? zoningInfo.long_name : "Unknown",
      fullAddress: data.results[0].formatted_address,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch zoning information" }, { status: 500 })
  }
}

