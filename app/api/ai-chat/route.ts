import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
    }

    const messages = conversationHistory?.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    })) || [];

    messages.push({ role: 'user', content: query });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: `You are a helpful location assistant. Help users find places and answer questions about locations. 
      
When a user asks about finding places, respond with JSON:
{"needsPlaceSearch": true, "placeType": "restaurant", "location": "Lagos", "response": "Let me find restaurants in Lagos for you!"}

When answering questions about places already shown, respond with JSON:
{"needsPlaceSearch": false, "response": "your helpful answer"}

Be friendly and conversational.`,
      messages: messages as any,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content.text);
    } catch {
      parsedResponse = { needsPlaceSearch: false, response: content.text };
    }

    if (parsedResponse.needsPlaceSearch && parsedResponse.placeType && parsedResponse.location) {
      const { placeType, location } = parsedResponse;

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();

      if (geocodeData.results?.[0]) {
        const coords = geocodeData.results[0].geometry.location;
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=5000&keyword=${encodeURIComponent(placeType)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        const placesRes = await fetch(placesUrl);
        const placesData = await placesRes.json();

        if (placesData.results && placesData.results.length > 0) {
          const places = placesData.results.slice(0, 10).map((place: any) => ({
            name: place.name,
            address: place.vicinity,
            location: place.geometry.location,
            rating: place.rating,
            open_now: place.opening_hours?.open_now,
          }));

          return NextResponse.json({
            success: true,
            response: parsedResponse.response,
            places,
            needsPlaceSearch: true
          });
        }
      }

      return NextResponse.json({
        success: true,
        response: "I couldn't find any places. Try a different location?",
        places: [],
        needsPlaceSearch: false
      });
    }

    return NextResponse.json({
      success: true,
      response: parsedResponse.response,
      needsPlaceSearch: false
    });

  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Chat failed' }, { status: 500 });
  }
}
