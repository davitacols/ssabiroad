/**
 * Text analysis utilities for location recognition
 */

// Regular expressions for common address patterns
export const ADDRESS_PATTERNS = [
    // Street address with number
    /\b\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)\b/gi,
  
    // Building/landmark with location
    /\b(?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Building|Tower|Center|Centre|Mall|Plaza|Park|Museum|Library|Stadium|Arena|Theater|Theatre|Hotel|Restaurant|Cafe|Shop|Store|Market)\b/g,
  
    // City, State/Province format
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  
    // City, Country format
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  
    // Postal/ZIP code patterns
    /\b[A-Z]{1,2}\d[A-Z\d]?\s+\d[A-Z]{2}\b/g, // UK postal code
    /\b\d{5}(?:-\d{4})?\b/g, // US ZIP code
    /\b[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d\b/g, // Canadian postal code
  
    // Landmark names
    /\b(?:Statue of|Mount|Mt\.|Tower|Cathedral|Church|Temple|Mosque|Palace|Castle|Fort|Bridge|Square)\b/g,
  
    // Hotel and accommodation patterns
    /\b(?:Hotel|Plaza|Suites|Inn|Resort|Apartments|Towers|Motel|Lodge|Hostel)\b/gi,
    
    // Restaurant and food service patterns
    /\b(?:Restaurant|Cafe|Bistro|Diner|Eatery|Grill|Bar|Pub|Tavern|Bakery|Pizzeria)\b/gi,
    
    // Retail and shopping patterns
    /\b(?:Mall|Plaza|Center|Centre|Market|Shop|Store|Boutique|Outlet|Supermarket|Hypermarket)\b/gi,
    
    // Business and office patterns
    /\b(?:Office|Building|Tower|Complex|Park|Campus|Headquarters|HQ)\b/gi,
    
    // Entertainment and leisure patterns
    /\b(?:Cinema|Theater|Theatre|Club|Lounge|Spa|Gym|Fitness|Studio|Arena|Stadium)\b/gi
]

// Regular expressions for UK phone numbers
const PHONE_PATTERNS = [
  // Format: 020X XXX XXXX (London)
  /\b(?:0207|0208|0203)\s*\d{3}\s*\d{4}\b/g,
  
  // Format: 0XXXX XXXXXX (Outside London)
  /\b0\d{4}\s*\d{6}\b/g,
  
  // Format: +44 XXX XXX XXXX (International)
  /\b(?:\+44|0044)\s*\d{3}\s*\d{3}\s*\d{4}\b/g,
  
  // Format with period prefix: t.0207 XXX XXXX
  /\bt\.*\s*(?:0207|0208|0203)\s*\d{3}\s*\d{4}\b/g
]

// List of common location keywords
const LOCATION_KEYWORDS = [
    "located",
    "location",
    "address",
    "place",
    "visit",
    "find",
    "at",
    "in",
    "near",
    "next to",
    "across from",
    "between",
    "around",
    "downtown",
    "uptown",
    "city center",
    "neighborhood",
    "district",
    "area",
    "region",
    "north",
    "south", 
    "east",
    "west",
    "northeast",
    "northwest",
    "southeast",
    "southwest",
]

/**
 * Extract addresses from text
 * @param text The text to analyze
 * @returns Array of potential addresses
 */
export function extractAddressFromText(text: string): string[] {
    const addresses: string[] = []
  
    // Apply each regex pattern to find potential addresses
    ADDRESS_PATTERNS.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          if (!addresses.includes(match)) {
            addresses.push(match)
          }
        })
      }
    })
  
    return addresses
}

/**
 * Extract phone numbers from text
 * @param text The text to analyze
 * @returns Array of found phone numbers
 */
export function extractPhoneNumbers(text: string): string[] {
    const phoneNumbers: string[] = [];
    
    PHONE_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up the phone number by removing 't.' prefix and standardizing spaces
          const cleaned = match.replace(/^t\.*\s*/, '').replace(/\s+/g, ' ').trim();
          if (!phoneNumbers.includes(cleaned)) {
            phoneNumbers.push(cleaned);
          }
        });
      }
    });
    
    return phoneNumbers;
}

/**
 * Extract potential location names from text
 * @param text The text to analyze
 * @returns Array of potential location names
 */
export function extractPotentialLocations(text: string): string[] {
    const locations: string[] = []
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  
    // Process each sentence
    sentences.forEach((sentence) => {
      // Check if sentence contains location keywords
      const hasLocationKeyword = LOCATION_KEYWORDS.some((keyword) =>
        sentence.toLowerCase().includes(keyword.toLowerCase()),
      )
  
      if (hasLocationKeyword) {
        locations.push(sentence)
      }
  
      // Look for proper nouns that might be locations
      const words = sentence.split(/\s+/)
      let potentialName = ""
  
      for (let i = 0; i < words.length; i++) {
        const word = words[i]
  
        // Check if word starts with capital letter (potential proper noun)
        if (/^[A-Z][a-z]+$/.test(word)) {
          if (potentialName.length > 0) {
            potentialName += " "
          }
          potentialName += word
        } else if (potentialName.length > 0) {
          // End of potential name
          if (potentialName.split(/\s+/).length >= 2 && !locations.includes(potentialName)) {
            locations.push(potentialName)
          }
          potentialName = ""
        }
      }
  
      // Check if we have a pending potential name at the end
      if (potentialName.length > 0 && potentialName.split(/\s+/).length >= 2 && !locations.includes(potentialName)) {
        locations.push(potentialName)
      }
    })
  
    return locations
}

/**
 * Analyze text to determine if it contains location information 
 * @param text The text to analyze
 * @returns Score indicating likelihood of containing location info (0-1)
 */
export function getLocationRelevanceScore(text: string): number {
    let score = 0
    const lowerText = text.toLowerCase()
  
    // Check for location keywords
    LOCATION_KEYWORDS.forEach((keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 0.1
      }
    })
  
    // Check for address patterns
    const addresses = extractAddressFromText(lowerText)
    score += addresses.length * 0.2
  
    // Cap score at 1.0
    return Math.min(score, 1.0)
}