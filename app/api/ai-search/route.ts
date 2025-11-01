import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    console.log('AI Search query:', query);

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY missing');
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }

    // Use Claude to extract location and place type
    console.log('Calling Claude API...');
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extract the place type and location from this query: "${query}". Return ONLY a JSON object with "placeType" and "location" fields. Example: {"placeType":"volleyball court","location":"Lagos, Nigeria"}`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      console.error('Invalid Claude response type');
      throw new Error('Invalid response');
    }

    console.log('Claude response:', content.text);
    
    let placeType, location;
    try {
      const parsed = JSON.parse(content.text);
      placeType = parsed.placeType;
      location = parsed.location;
    } catch (e) {
      // Fallback: extract from text using regex
      const placeMatch = content.text.match(/"placeType"\s*:\s*"([^"]+)"/i);
      const locMatch = content.text.match(/"location"\s*:\s*"([^"]+)"/i);
      placeType = placeMatch?.[1] || query.split(' in ')[0];
      location = locMatch?.[1] || query.split(' in ')[1] || 'Lagos, Nigeria';
    }
    console.log('Extracted:', { placeType, location });

    // Get coordinates for the location
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY missing');
      return NextResponse.json({ success: false, error: 'Maps API key not configured' }, { status: 500 });
    }

    console.log('Geocoding location:', location);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();
    console.log('Geocode response:', geocodeData.status);

    if (!geocodeData.results?.[0]) {
      console.error('Location not found:', location);
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    const coords = geocodeData.results[0].geometry.location;
    console.log('Coordinates:', coords);

    // Search for places
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY missing');
      return NextResponse.json({ success: false, error: 'Places API key not configured' }, { status: 500 });
    }

    console.log('Searching for places:', placeType);
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=5000&keyword=${encodeURIComponent(placeType)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();
    console.log('Places response:', placesData.status, 'Results:', placesData.results?.length);

    if (!placesData.results || placesData.results.length === 0) {
      console.error('No places found');
      return NextResponse.json({ success: false, error: 'No places found' }, { status: 404 });
    }

    const places = placesData.results.slice(0, 10).map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      rating: place.rating,
      open_now: place.opening_hours?.open_now,
    }));

    console.log('Returning', places.length, 'places');
    return NextResponse.json({ success: true, places });
  } catch (error: any) {
    console.error('AI Search error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ success: false, error: error.message || 'Search failed' }, { status: 500 });
  }
}
