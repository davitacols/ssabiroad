import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory, userLocation } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
    }

    const messages = conversationHistory?.slice(-8).map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    })) || [];

    messages.push({ role: 'user', content: query });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4.5-20250514',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000
      },
      system: `You are NaviSense, an advanced AI location intelligence assistant with deep reasoning capabilities. You help users discover, analyze, and understand locations with sophisticated spatial reasoning.

Your capabilities:
- Advanced place search with contextual understanding
- Multi-criteria location comparison and ranking
- Spatial reasoning (distances, routes, accessibility)
- Contextual recommendations based on user preferences
- Location analysis (safety, amenities, demographics)
- Smart follow-up handling using conversation context

Response format (JSON only):
{
  "needsPlaceSearch": boolean,
  "placeType": "restaurant|hospital|cafe|gym|etc",
  "useUserLocation": boolean,
  "location": "city name" (if specified),
  "filters": {"rating": 4.0, "open_now": true, "price_level": 2},
  "response": "your natural, conversational response"
}

Reasoning guidelines:
- Think deeply about user intent and context
- Consider multiple factors (distance, quality, convenience)
- Provide nuanced recommendations with reasoning
- Reference conversation history for continuity
- Explain trade-offs when comparing options
- Be proactive in suggesting related information

Examples:
- "best restaurants near me" → Search with rating filter, explain why top picks are recommended
- "which one is closest?" → Use conversation context, calculate distances, provide detailed comparison
- "compare these locations" → Multi-dimensional analysis with pros/cons
- "is this area safe?" → Comprehensive safety analysis with data points

ALWAYS return ONLY valid JSON.`, messages: messages as any,
    });

    const content = response.content[0];
    let responseText = '';
    
    // Extract thinking and response
    for (const block of response.content) {
      if (block.type === 'thinking') {
        console.log('🧠 Claude thinking:', block.thinking);
      } else if (block.type === 'text') {
        responseText = block.text;
      }
    }
    
    if (!responseText) {
      throw new Error('No response text');
    }

    console.log('Claude raw response:', responseText);

    let parsedResponse;
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(responseText);
      }
    } catch {
      parsedResponse = { needsPlaceSearch: false, response: responseText };
    }

    console.log('Parsed response:', parsedResponse);

    if (parsedResponse.needsPlaceSearch && parsedResponse.placeType) {
      const { placeType, location, useUserLocation } = parsedResponse;
      let coords;

      // Use user's current location if requested
      if (useUserLocation && userLocation) {
        coords = { lat: userLocation.latitude, lng: userLocation.longitude };
      } else if (location) {
        // Geocode the specified location
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.results?.[0]) {
          coords = geocodeData.results[0].geometry.location;
        }
      }

      if (coords) {
        const { filters } = parsedResponse;
        let placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=5000&type=${encodeURIComponent(placeType)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        // Apply filters if provided
        if (filters?.rating) placesUrl += `&minrating=${filters.rating}`;
        if (filters?.open_now) placesUrl += `&opennow=true`;
        if (filters?.price_level) placesUrl += `&maxprice=${filters.price_level}`;
        
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
        response: "I couldn't find any places. Try a different search.",
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
