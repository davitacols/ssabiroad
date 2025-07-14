// Known business locations database for accurate results
export const KNOWN_LOCATIONS = {
  // Alexandra Park Road businesses
  'con fusion restaurant': {
    address: '96 Alexandra Park Road, London N10 2AE, UK',
    coordinates: { latitude: 51.6067, longitude: -0.1268 },
    phone: '020 8883 9797'
  },
  'results personal training': {
    address: '94 Alexandra Park Road, London N10 2AE, UK', 
    coordinates: { latitude: 51.6067, longitude: -0.1268 },
    aliases: ['results', 'results studio', 'results bounds green']
  },
  'vinum restaurant': {
    address: '96 Alexandra Park Road, London N10 2AE, UK',
    coordinates: { latitude: 51.6067, longitude: -0.1268 }
  },
  'sussers kosher wines': {
    address: '82 Dunsmure Road, London N16 5JY, UK',
    coordinates: { latitude: 51.5707, longitude: -0.0792 }
  }
};

export function findKnownLocation(businessName: string, phoneNumber?: string): any | null {
  const cleanName = businessName.toLowerCase().trim();
  
  // Direct match
  if (KNOWN_LOCATIONS[cleanName]) {
    return KNOWN_LOCATIONS[cleanName];
  }
  
  // Check aliases
  for (const [key, location] of Object.entries(KNOWN_LOCATIONS)) {
    if (location.aliases?.some(alias => cleanName.includes(alias))) {
      return location;
    }
    
    // Partial name matching
    if (cleanName.includes(key.split(' ')[0]) && key.split(' ').length > 1) {
      return location;
    }
  }
  
  // Phone number matching
  if (phoneNumber) {
    for (const location of Object.values(KNOWN_LOCATIONS)) {
      if (location.phone === phoneNumber) {
        return location;
      }
    }
  }
  
  return null;
}