/**
 * Logo-based location database
 */

interface LogoLocation {
  latitude: number;
  longitude: number;
  address: string;
  category: string;
  description?: string;
}

export const LOGO_LOCATIONS: Record<string, LogoLocation> = {
  "McDonald's": {
    latitude: 40.7589,
    longitude: -73.9851,
    address: "Times Square, New York, NY",
    category: "Restaurant",
    description: "McDonald's fast food restaurant"
  },
  "Starbucks": {
    latitude: 40.7614,
    longitude: -73.9776,
    address: "Manhattan, New York, NY",
    category: "Restaurant",
    description: "Starbucks coffee shop"
  },
  "Subway": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Restaurant",
    description: "Subway sandwich shop"
  },
  "KFC": {
    latitude: 40.7580,
    longitude: -73.9855,
    address: "New York, NY",
    category: "Restaurant",
    description: "KFC fried chicken restaurant"
  },
  "Pizza Hut": {
    latitude: 40.7549,
    longitude: -73.9840,
    address: "New York, NY",
    category: "Restaurant",
    description: "Pizza Hut restaurant"
  },
  "Burger King": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Restaurant",
    description: "Burger King fast food restaurant"
  },
  "Taco Bell": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Restaurant",
    description: "Taco Bell Mexican fast food"
  },
  "Walmart": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Retail",
    description: "Walmart superstore"
  },
  "Target": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Retail",
    description: "Target retail store"
  },
  "Shell": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Gas Station",
    description: "Shell gas station"
  },
  "BP": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Gas Station",
    description: "BP gas station"
  },
  "Exxon": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Gas Station",
    description: "Exxon gas station"
  },
  "DHL": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Logistics",
    description: "DHL shipping and logistics"
  },
  "FedEx": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Logistics",
    description: "FedEx shipping and logistics"
  },
  "UPS": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Logistics",
    description: "UPS shipping and logistics"
  },
  "Maersk": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Logistics",
    description: "Maersk shipping and logistics"
  },
  "COSCO": {
    latitude: 40.7505,
    longitude: -73.9934,
    address: "New York, NY",
    category: "Logistics",
    description: "COSCO shipping and logistics"
  }
};

export function lookupLogoLocation(logoName: string): LogoLocation | null {
  if (!logoName) return null;
  
  const normalizedName = logoName.trim();
  
  // Direct lookup
  if (LOGO_LOCATIONS[normalizedName]) {
    return LOGO_LOCATIONS[normalizedName];
  }
  
  // Partial match with better scoring
  const matches = [];
  for (const [name, data] of Object.entries(LOGO_LOCATIONS)) {
    const nameLower = name.toLowerCase();
    const logoLower = normalizedName.toLowerCase();
    
    if (nameLower.includes(logoLower) || logoLower.includes(nameLower)) {
      // Calculate match score
      const score = Math.max(logoLower.length / nameLower.length, nameLower.length / logoLower.length);
      matches.push({ data, score });
    }
  }
  
  // Return best match if any
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    return matches[0].data;
  }
  
  return null;
}