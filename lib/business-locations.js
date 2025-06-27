"use client";

/**
 * Business Locations Database
 * 
 * This module provides a mapping of known business names to their locations
 * to improve geocoding accuracy when the API fails to find the location.
 */

const KNOWN_BUSINESSES = {
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
  }
};

/**
 * Looks up a business by name in the known businesses database
 * @param {string} businessName - The name of the business to look up
 * @returns {Object|null} - The business location data or null if not found
 */
export function lookupBusinessLocation(businessName) {
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
 * Enhances location data with known business information
 * @param {Object} locationData - The location data to enhance
 * @returns {Object} - The enhanced location data
 */
export function enhanceWithKnownBusinessData(locationData) {
  if (!locationData) return locationData;
  
  // Check if this is a known business
  const businessName = locationData.businessName || locationData.name;
  const knownBusiness = lookupBusinessLocation(businessName);
  
  if (knownBusiness) {
    return {
      ...locationData,
      name: businessName || knownBusiness.name,
      address: knownBusiness.address,
      location: {
        latitude: knownBusiness.latitude,
        longitude: knownBusiness.longitude
      },
      category: knownBusiness.category,
      description: knownBusiness.description || locationData.description,
      confidence: 0.9, // High confidence for known businesses
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${knownBusiness.latitude},${knownBusiness.longitude}`,
      formattedAddress: knownBusiness.address
    };
  }
  
  return locationData;
}