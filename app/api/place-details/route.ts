import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("placeId")
    const includePhotos = searchParams.get("includePhotos") === "true"
    const includeContact = searchParams.get("includeContact") === "true"
    const includeAtmosphere = searchParams.get("includeAtmosphere") === "true"
    const includeReviews = searchParams.get("includeReviews") === "true"
    
    if (!placeId) {
      return NextResponse.json({ error: "Place ID required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Server Places API key not configured" }, { status: 500 })
    }

    const fields = new Set(["name", "formatted_address", "geometry", "types"])
    if (includePhotos) fields.add("photos")
    if (includeContact) {
      fields.add("website")
      fields.add("formatted_phone_number")
    }
    if (includeAtmosphere) {
      fields.add("rating")
      fields.add("opening_hours")
      fields.add("price_level")
      fields.add("business_status")
      fields.add("user_ratings_total")
    }
    if (includeReviews) fields.add("reviews")

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${encodeURIComponent([...fields].join(","))}&key=${apiKey}`,
      { next: { revalidate: 60 * 60 * 24 } }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch place details")
    }

    const data = await response.json()
    
    if (data.status !== "OK") {
      throw new Error(data.error_message || "Place details not found")
    }

    const result = data.result
    const photos = includePhotos ? (result.photos?.slice(0, 6).map((photo: any) =>
      `/api/place-photo?reference=${encodeURIComponent(photo.photo_reference)}`
    ) || []) : []

    const reviews = includeReviews ? (result.reviews?.slice(0, 5).map((review: any) => ({
      author: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.relative_time_description,
    })) || []) : []

    return NextResponse.json({
      name: result.name,
      address: result.formatted_address,
      photos,
      rating: includeAtmosphere ? result.rating : undefined,
      website: includeContact ? result.website : undefined,
      phoneNumber: includeContact ? result.formatted_phone_number : undefined,
      openingHours: includeAtmosphere ? result.opening_hours?.open_now : undefined,
      weekdayText: includeAtmosphere ? result.opening_hours?.weekday_text : undefined,
      reviews,
      priceLevel: includeAtmosphere ? result.price_level : undefined,
      businessStatus: includeAtmosphere ? result.business_status : undefined,
      types: result.types,
      userRatingsTotal: includeAtmosphere ? result.user_ratings_total : undefined,
      geometry: result.geometry,
      location: result.geometry?.location ? {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      } : null,
    })
  } catch (error) {
    console.error("Place details error:", error)
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    )
  }
}
