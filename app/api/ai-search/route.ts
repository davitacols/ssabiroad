import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
    }

    // Use Claude to extract location and place type
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extract the place type and location from this query: "${query}". Return ONLY a JSON object with "placeType" and "location" fields. Example: {"placeType":"volleyball court","location":"Lagos, Nigeria"}`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response');
    }

    const parsed = JSON.parse(content.text);
    const { placeType, location } = parsed;

    // Get coordinates for the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (!geocodeData.results?.[0]) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    const coords = geocodeData.results[0].geometry.location;

    // Search for places
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=5000&keyword=${encodeURIComponent(placeType)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    if (!placesData.results) {
      return NextResponse.json({ success: false, error: 'No places found' }, { status: 404 });
    }

    const places = placesData.results.slice(0, 10).map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      rating: place.rating,
      open_now: place.opening_hours?.open_now,
    }));

    return NextResponse.json({ success: true, places });
  } catch (error: any) {
    console.error('AI Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
