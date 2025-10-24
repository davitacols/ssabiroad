import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    if (location) {
      url += `&location=${location}&radius=50000`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Google Places API error');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${data.status}`);
    }

    const places = data.results?.map((place: any) => {
      let distance = null;
      if (location) {
        const [lat, lng] = location.split(',').map(Number);
        distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      }
      
      return {
        id: place.place_id,
        name: place.name,
        vicinity: place.vicinity || place.formatted_address,
        address: place.formatted_address,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        openNow: place.opening_hours?.open_now,
        placeId: place.place_id,
        distance
      };
    }) || [];

    return NextResponse.json({ places: places.sort((a: any, b: any) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      return 0;
    }) });
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
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