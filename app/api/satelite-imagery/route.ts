import { type NextRequest, NextResponse } from "next/server"

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=600x300&maptype=satellite&key=${apiKey}`

  return NextResponse.json({ imageUrl })
}

