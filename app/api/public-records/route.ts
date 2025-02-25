import { type NextRequest, NextResponse } from "next/server"
import fetch from "node-fetch"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")
  const apiKey = process.env.PROPERTY_DATA_API_KEY

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.propertydata.com/v1/public-records?address=${encodeURIComponent(address)}&api_key=${apiKey}`,
    )
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch public records" }, { status: 500 })
  }
}

