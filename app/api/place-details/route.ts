import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("placeId")
    
    if (!placeId) {
      return NextResponse.json({ error: "Place ID required" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,rating,website,formatted_phone_number,opening_hours,reviews,price_level,business_status,types,user_ratings_total&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error("Failed to fetch place details")
    }

    const data = await response.json()
    
    if (data.status !== "OK") {
      throw new Error(data.error_message || "Place details not found")
    }

    const result = data.result
    const photos = result.photos?.slice(0, 6).map((photo: any) => 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
    ) || []

    const reviews = result.reviews?.slice(0, 5).map((review: any) => ({
      author: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.relative_time_description,
    })) || []

    return NextResponse.json({
      name: result.name,
      address: result.formatted_address,
      photos,
      rating: result.rating,
      website: result.website,
      phoneNumber: result.formatted_phone_number,
      openingHours: result.opening_hours?.open_now,
      weekdayText: result.opening_hours?.weekday_text,
      reviews,
      priceLevel: result.price_level,
      businessStatus: result.business_status,
      types: result.types,
      userRatingsTotal: result.user_ratings_total,
      geometry: result.geometry,
    })
  } catch (error) {
    console.error("Place details error:", error)
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    )
  }
}