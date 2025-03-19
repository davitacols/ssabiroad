import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, currentLocation, preferences } = body;

    if (!location) {
      return NextResponse.json(
        { error: "Location data is required" },
        { status: 400 }
      );
    }

    // Create a concise prompt for generating location suggestions
    const prompt = `
      Suggest 3-5 interesting places near ${location.name || "this location"}.
      ${location.address ? `Located at: ${location.address}.` : ""}
      ${location.category ? `Category: ${location.category}.` : ""}
      ${location.description ? `Details: ${location.description}.` : ""}

      Current GPS: ${currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : "Not provided"}.
      Preferences: ${preferences || "General recommendations"}.

      Provide:
      - Name
      - Short description (1-2 sentences)
      - Why visit
      - Approximate distance from current location (if available)
    `;

    // Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Generate text using Anthropic's Claude API
    let text;
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      // Extract the response text
      text = message.content[0].text;
    } catch (apiError: any) {
      console.error("Claude API error:", apiError);

      // Handle API quota errors
      if (apiError?.status === 429) {
        return NextResponse.json(
          {
            error: "Claude API rate limit exceeded. Please try again later.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate location suggestions" },
        { status: 500 }
      );
    }

    // Parse the generated text into structured suggestions
    const suggestions = parseGeneratedSuggestions(text);

    return NextResponse.json({ text, suggestions });
  } catch (error) {
    console.error("Error generating location suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate location suggestions" },
      { status: 500 }
    );
  }
}

// Improved parser for structured location suggestions
function parseGeneratedSuggestions(text: string) {
  const suggestions = [];
  const lines = text.split("\n");

  let currentSuggestion: any = null;
  let collectingDescription = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Identify numbered list items
    const numberMatch = trimmedLine.match(/^(\d+)[\.\)]/);

    if (numberMatch) {
      // Push the previous suggestion before starting a new one
      if (currentSuggestion) {
        suggestions.push(currentSuggestion);
      }

      // Start a new suggestion
      currentSuggestion = {
        name: trimmedLine.substring(numberMatch[0].length).trim(),
        description: "",
        reason: "",
        distance: "",
      };
      collectingDescription = true;
    } else if (currentSuggestion && trimmedLine) {
      if (/distance|km|mile|minute/.test(trimmedLine.toLowerCase())) {
        currentSuggestion.distance = trimmedLine;
      } else if (/why|worth/.test(trimmedLine.toLowerCase())) {
        currentSuggestion.reason = trimmedLine;
      } else if (collectingDescription) {
        currentSuggestion.description += (currentSuggestion.description ? " " : "") + trimmedLine;
      }
    }
  }

  // Add the last suggestion if available
  if (currentSuggestion) {
    suggestions.push(currentSuggestion);
  }

  return suggestions;
}