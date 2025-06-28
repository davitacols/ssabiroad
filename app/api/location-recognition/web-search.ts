/**
 * Web search functionality for business location verification
 */

import axios from 'axios';

interface SearchResult {
  success: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  confidence: number;
}

/**
 * Search for business location using web search
 */
export async function searchBusinessLocation(businessName: string, currentLocation?: { latitude: number; longitude: number }): Promise<SearchResult> {
  try {
    console.log(`Web searching for: "${businessName}"`);
    
    // Try multiple search strategies (avoid generic terms)
    const searchQueries = [
      businessName, // Exact name only
    ];
    
    for (const query of searchQueries) {
      console.log(`Trying search query: "${query}"`);
      
      const response = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
        params: {
          query,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          ...(currentLocation && {
            location: `${currentLocation.latitude},${currentLocation.longitude}`,
            radius: 50000 // 50km radius for local results
          })
        },
        timeout: 5000,
      });

      if (response.data.results && response.data.results.length > 0) {
        // Filter results by distance if current location is provided
        let filteredResults = response.data.results;
        
        if (currentLocation) {
          filteredResults = response.data.results.filter(result => {
            const resultLat = result.geometry.location.lat;
            const resultLng = result.geometry.location.lng;
            
            // Calculate distance (rough approximation)
            const latDiff = Math.abs(currentLocation.latitude - resultLat);
            const lngDiff = Math.abs(currentLocation.longitude - resultLng);
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            
            // Only accept results within reasonable distance (about 500km)
            return distance < 5;
          });
        }
        
        if (filteredResults.length > 0) {
          // Validate that the result actually matches the business name
          const originalBusinessName = businessName.split(' ')[0]; // Get first word for matching
          const validResults = filteredResults.filter(result => {
            const resultName = result.name.toLowerCase();
            const searchName = originalBusinessName.toLowerCase();
            
            // Check if the result name contains key parts of the search
            return resultName.includes(searchName) || 
                   searchName.includes(resultName.split(' ')[0]);
          });
          
          if (validResults.length > 0) {
            const result = validResults[0];
            const location = result.geometry.location;
            
            console.log(`Web search found: ${result.name} at ${result.formatted_address}`);
            
            return {
              success: true,
              location: {
                latitude: location.lat,
                longitude: location.lng,
              },
              address: result.formatted_address,
              confidence: result.rating ? Math.min(0.9, result.rating / 5) : 0.8
            };
          } else {
            console.log(`No matching business name found for: "${query}"`);
          }
        } else {
          console.log(`No nearby results found for: "${query}"`);
        }
      }
    }

    console.log(`No web search results found for: "${businessName}"`);
    return { success: false, confidence: 0 };
  } catch (error) {
    console.error("Web search error:", error);
    return { success: false, confidence: 0 };
  }
}