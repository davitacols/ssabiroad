import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, type } = body;

    if (!location) {
      return NextResponse.json(
        { error: "Location data is required" },
        { status: 400 }
      );
    }

    // Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY, // Make sure to add this to your .env file
    });

    // Determine what kind of content to generate based on the type
    let prompt = "";
    let maxTokens = 300;

    switch (type) {
      case "description":
        prompt = generateDescriptionPrompt(location);
        maxTokens = 300;
        break;
      case "history":
        prompt = generateHistoryPrompt(location);
        maxTokens = 400;
        break;
      case "itinerary":
        prompt = generateItineraryPrompt(location);
        maxTokens = 500;
        break;
      case "tips":
        prompt = generateTipsPrompt(location);
        maxTokens = 250;
        break;
      default:
        prompt = generateDescriptionPrompt(location);
    }

    // Generate text using Anthropic's Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // Using the Claude 3.7 Sonnet model
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Extract the response text
    const text = message.content[0].text;

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error generating AI content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// Helper functions to create prompts - these remain the same
function generateDescriptionPrompt(location: any): string {
  const name = location.name || "this location";
  const category = location.category || "";
  const address = location.address || "";
  const buildingType = location.buildingType || "";
  const architecturalStyle = location.architecturalStyle || "";
  const materialType = location.materialType || "";
  
  return `Write a vivid, engaging description of ${name} (${category}), located at ${address}. 
  ${buildingType ? `It's a ${buildingType} building.` : ""} 
  ${architecturalStyle ? `It features ${architecturalStyle} architecture.` : ""} 
  ${materialType ? `It's primarily made of ${materialType}.` : ""}
  Focus on what makes this place special and interesting to visitors. Keep it informative yet conversational.`;
}

function generateHistoryPrompt(location: any): string {
  const name = location.name || "this location";
  const yearBuilt = location.yearBuilt || "";
  
  return `Write a brief, fascinating historical overview of ${name}. 
  ${yearBuilt ? `It was built in ${yearBuilt}.` : ""} 
  Include interesting historical facts, significant events, and how this place has evolved over time. 
  Make it educational and engaging for someone visiting this location.`;
}

function generateItineraryPrompt(location: any): string {
  const name = location.name || "this location";
  const category = location.category || "";
  const nearbyPlaces = location.nearbyPlaces || [];
  
  let nearbyPlacesText = "";
  if (nearbyPlaces.length > 0) {
    nearbyPlacesText = "Nearby attractions include: " + 
      nearbyPlaces.map((place: any) => place.name).join(", ");
  }
  
  return `Create a half-day itinerary for someone visiting ${name} (${category}). 
  ${nearbyPlacesText}
  Include recommendations for how long to spend there, what specific features to look for, 
  and suggestions for food, drinks, or activities in the area. Make it practical and engaging.`;
}

function generateTipsPrompt(location: any): string {
  const name = location.name || "this location";
  const category = location.category || "";
  const weatherConditions = location.weatherConditions || "";
  const crowdDensity = location.crowdDensity || "";
  
  return `Provide 3-5 practical visitor tips for ${name} (${category}). 
  ${weatherConditions ? `Typical weather conditions: ${weatherConditions}.` : ""} 
  ${crowdDensity ? `Crowd density is typically: ${crowdDensity}.` : ""}
  Include advice about the best times to visit, how to avoid crowds, photo opportunities, 
  and any insider tips that would enhance someone's visit. Keep it concise and useful.`;
}