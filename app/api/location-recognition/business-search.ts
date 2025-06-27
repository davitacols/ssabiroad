import axios from 'axios';

/**
 * Extracts the most likely business name from text
 * @param text The text to analyze
 * @returns The extracted business name or null if none found
 */
export function extractBusinessNameFromText(text: string): string | null {
  if (!text) return null;
  
  // Remove numbers and special characters
  const cleanText = text.replace(/\d+/g, '').replace(/[^\w\s]/gi, '').trim();
  
  // Split into lines
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for potential business names (usually in the first few lines)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    // Business names are typically all caps or title case and at least 3 characters
    if (line.length >= 3 && (line === line.toUpperCase() || /^[A-Z][a-z]+/.test(line))) {
      return line;
    }
  }
  
  // If no good candidate in first lines, return the first non-empty line
  return lines.length > 0 ? lines[0] : null;
}

/**
 * Searches for a business by name using Google Places API
 * @param businessName The name of the business to search for
 * @param apiKey Google Maps API key
 * @returns Location information or null if not found
 */
export async function searchBusinessByName(
  businessName: string, 
  apiKey: string
): Promise<{
  success: boolean;
  location?: { latitude: number; longitude: number };
  formattedAddress?: string;
} | null> {
  try {
    if (!businessName || businessName.length < 3) return null;
    
    console.log(`Searching for business: "${businessName}" using Places API`);
    
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", {
      params: {
        input: businessName,
        inputtype: "textquery",
        fields: "formatted_address,geometry,name",
        key: apiKey,
      }
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const place = response.data.candidates[0];
      console.log(`Found "${businessName}" via Places API:`, place.formatted_address);
      return {
        success: true,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        formattedAddress: place.formatted_address,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error searching for business:", error);
    return null;
  }
}