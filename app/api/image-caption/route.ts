import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, style, modelProvider } = body;

    if (!location) {
      return NextResponse.json(
        { error: "Location data is required" },
        { status: 400 }
      );
    }

    // Determine the style of caption to generate
    const captionStyle = style || "informative";
    
    // Create a prompt for generating the image caption
    let prompt = `Generate a ${captionStyle} caption for a photo of ${location.name || "this location"}`;
    
    // Add location details to the prompt
    if (location.address) prompt += ` located at ${location.address}.`;
    if (location.category) prompt += ` It's a ${location.category}.`;
    if (location.description) prompt += ` Brief description: ${location.description}.`;
    if (location.buildingType) prompt += ` It's a ${location.buildingType} building.`;
    if (location.architecturalStyle) prompt += ` It features ${location.architecturalStyle} architecture.`;
    if (location.materialType) prompt += ` It's primarily made of ${location.materialType}.`;
    if (location.weatherConditions) prompt += ` Current weather: ${location.weatherConditions}.`;
    if (location.timeOfDay) prompt += ` Time of day: ${location.timeOfDay}.`;
    
    // Add style-specific instructions
    switch (captionStyle) {
      case "informative":
        prompt += " Create an informative, factual caption that would be suitable for a travel guide or educational content.";
        break;
      case "social":
        prompt += " Create a catchy, engaging caption perfect for social media posts on Instagram or Facebook, including relevant hashtags.";
        break;
      case "poetic":
        prompt += " Create a poetic, evocative caption that captures the mood and essence of this place in a literary style.";
        break;
      case "humorous":
        prompt += " Create a witty, humorous caption that would make people smile or laugh.";
        break;
      default:
        prompt += " Create a balanced, informative yet engaging caption.";
    }
    
    prompt += " The caption should be 1-3 sentences long.";

    // Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Generate text using Anthropic's Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 200,
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
    console.error("Error generating image caption:", error);
    return NextResponse.json(
      { error: "Failed to generate image caption" },
      { status: 500 }
    );
  }
}