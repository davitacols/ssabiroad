import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    
    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const photos: string[] = []
    
    // Strategy 1: Search by exact business name
    const searchStrategies = [
      query,
      query.replace('photos', '').trim(),
      `${query.replace('photos', '').trim()} hotel`,
      `${query.replace('photos', '').trim()} Calabar`,
      `hotel Calabar Nigeria`,
      `Atekong Drive Calabar`
    ]
    
    for (const searchQuery of searchStrategies) {
      if (photos.length >= 6) break
      
      try {
        let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`
        
        if (lat && lng) {
          searchUrl += `&location=${lat},${lng}&radius=2000`
        }

        const searchResponse = await fetch(searchUrl)
        if (!searchResponse.ok) continue

        const searchData = await searchResponse.json()
        
        if (searchData.status === "OK" && searchData.results?.length) {
          for (const place of searchData.results.slice(0, 5)) {
            if (place.photos && photos.length < 6) {
              for (const photo of place.photos.slice(0, 3)) {
                if (photos.length < 6) {
                  photos.push(
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${photo.photo_reference}&key=${apiKey}`
                  )
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Search strategy failed for: ${searchQuery}`, error)
        continue
      }
    }

    // If no photos found, return empty array
    if (photos.length === 0) {
      console.log(`No photos found for query: ${query} at location: ${lat},${lng}`)
      return NextResponse.json({ photos: [] })
    }

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Location photos error:", error)
    return NextResponse.json({ photos: [] })
  }
}