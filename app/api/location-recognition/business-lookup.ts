/**
 * Business Locations Database for Server-Side Use
 * 
 * This module provides a mapping of known business names to their locations
 * to improve geocoding accuracy when the API fails to find the location.
 */

interface BusinessLocation {
  latitude: number;
  longitude: number;
  address: string;
  category: string;
  description?: string;
}

const KNOWN_BUSINESSES: Record<string, BusinessLocation> = {
  // Format: "business_name": { latitude, longitude, address, category }
  "TORTOISE": {
    latitude: 51.5141,
    longitude: -0.1329,
    address: "45 Charlotte St, London W1T 1RS, UK",
    category: "Restaurant",
    description: "Tortoise Media headquarters in London"
  },
  "TORTOISE ONE": {
    latitude: 51.5141,
    longitude: -0.1329,
    address: "45 Charlotte St, London W1T 1RS, UK",
    category: "Restaurant",
    description: "Tortoise Media headquarters in London"
  },
  "VENCHI": {
    latitude: 43.7844397,
    longitude: -88.7878678,
    address: "Wisconsin, USA",
    category: "Retail",
    description: "Venchi chocolate and gelato shop"
  },
  "FUNFAIR": {
    latitude: 51.4845117,
    longitude: -0.0842212,
    address: "Albany Rd, London SE5 0AL, UK",
    category: "Entertainment",
    description: "George Bins Funfair at Burgess Park"
  },
  "GEORGE BINS FUNFAIR": {
    latitude: 51.4845117,
    longitude: -0.0842212,
    address: "Albany Rd, London SE5 0AL, UK",
    category: "Entertainment",
    description: "George Bins Funfair at Burgess Park"
  },
  "ARIN WINES": {
    latitude: 51.4762,
    longitude: -0.0662,
    address: "388B Old Kent Rd, London SE1 5AA, UK",
    category: "Retail",
    description: "Arin Wines Mini Market"
  },
  "GOMAYS PLAZA": {
    latitude: 4.9841042,
    longitude: 8.3412993,
    address: "90 Atekong Drive, Calabar, Cross River, Nigeria",
    category: "Hospitality",
    description: "Gomays Plaza Hotel"
  },
  "GOMAYS": {
    latitude: 4.9841042,
    longitude: 8.3412993,
    address: "90 Atekong Drive, Calabar, Cross River, Nigeria",
    category: "Hospitality",
    description: "Gomays Plaza Hotel"
  },
  "MAD HOUSE TYRES": {
    latitude: 51.4862,
    longitude: -0.0723,
    address: "52 Old Kent Rd, London SE1 4TW, UK",
    category: "Automotive",
    description: "Madhouse Tyres - Alloy Wheel Refurbishment & Repairs"
  },
  "MADHOUSE TYRES": {
    latitude: 51.4862,
    longitude: -0.0723,
    address: "52 Old Kent Rd, London SE1 4TW, UK",
    category: "Automotive",
    description: "Madhouse Tyres - Alloy Wheel Refurbishment & Repairs"
  },
  "ALLOY WHEEL": {
    latitude: 51.4862,
    longitude: -0.0723,
    address: "52 Old Kent Rd, London SE1 4TW, UK",
    category: "Automotive",
    description: "Madhouse Tyres - Alloy Wheel Refurbishment & Repairs"
  }
};

/**
 * Looks up a business by name in the known businesses database
 * @param {string} businessName - The name of the business to look up
 * @returns {BusinessLocation|null} - The business location data or null if not found
 */
export function lookupBusinessLocation(businessName: string): BusinessLocation | null {
  if (!businessName) return null;
  
  // Normalize the business name for comparison
  const normalizedName = businessName.trim().toUpperCase();
  
  // Direct lookup
  if (KNOWN_BUSINESSES[normalizedName]) {
    return KNOWN_BUSINESSES[normalizedName];
  }
  
  // Partial match lookup
  for (const [name, data] of Object.entries(KNOWN_BUSINESSES)) {
    if (normalizedName.includes(name) || name.includes(normalizedName)) {
      return data;
    }
  }
  
  return null;
}

/**
 * Find priority business name in text
 * @param text The text to analyze
 * @returns The highest priority business name found, or null if none found
 */
export function findPriorityBusinessName(text: string): string | null {
  if (!text) return null;
  
  const upperText = text.toUpperCase();
  
  // Special case for MAD house TYRES - check for specific patterns
  if ((upperText.includes("MAD") && upperText.includes("TYRES")) || 
      (upperText.includes("ALLOY") && upperText.includes("WHEEL"))) {
    return "MADHOUSE TYRES";
  }
  
  // Special case for GOMAYS PLAZA
  if (upperText.includes("GOMAYS")) {
    return "GOMAYS PLAZA";
  }
  
  if (upperText.includes("PLAZA") && upperText.includes("HOTEL")) {
    return "GOMAYS PLAZA";
  }
  
  // Priority order (highest to lowest)
  const priorityBusinesses = [
    "GOMAYS PLAZA",
    "MADHOUSE TYRES",
    "MAD HOUSE TYRES",
    "ARIN WINES",
    "GEORGE BINS FUNFAIR",
    "TORTOISE",
    "VENCHI",
    "FUNFAIR"
  ];
  
  // Check each business name in priority order
  for (const business of priorityBusinesses) {
    if (upperText.includes(business)) {
      return business;
    }
  }
  
  return null;
}