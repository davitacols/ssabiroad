import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius') || '1000';
    const type = searchParams.get('type') || 'restaurant';

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${data.status}`);
    }

    const places = data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating,
      priceLevel: place.price_level,
      types: place.types,
      vicinity: place.vicinity,
      openNow: place.opening_hours?.open_now,
      photos: place.photos?.[0]?.photo_reference,
      geometry: place.geometry.location,
      distance: calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      placeId: place.place_id
    }));

    return NextResponse.json({
      success: true,
      places: places.sort((a: any, b: any) => a.distance - b.distance),
      total: places.length
    });

  } catch (error: any) {
    console.error('Nearby POI error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}