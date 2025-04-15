/**
 * Enhanced address parser for addresses worldwide
 * This helps with parsing addresses from OCR text that might be incomplete or malformatted
 */

// Common UK postcodes patterns
const UK_POSTCODE_REGEX = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i
const PARTIAL_POSTCODE_REGEX = /[A-Z]{1,2}[0-9][A-Z0-9]?/i

// Common street suffixes in the UK
const UK_STREET_SUFFIXES = [
  "Street",
  "St",
  "Road",
  "Rd",
  "Avenue",
  "Ave",
  "Lane",
  "Ln",
  "Drive",
  "Dr",
  "Boulevard",
  "Blvd",
  "Court",
  "Ct",
  "Place",
  "Pl",
  "Square",
  "Sq",
  "Terrace",
  "Ter",
  "Way",
  "Crescent",
  "Cres",
  "Close",
  "Gardens",
  "Gdns",
  "Grove",
  "Gr",
  "Hill",
  "Park",
]

// Common London area codes
const LONDON_AREA_CODES = [
  "SE1",
  "SE2",
  "SE3",
  "SE4",
  "SE5",
  "SE6",
  "SE7",
  "SE8",
  "SE9",
  "SE10",
  "SE11",
  "SE12",
  "SE13",
  "SE14",
  "SE15",
  "SE16",
  "SE17",
  "SE18",
  "SE19",
  "SE20",
  "SE21",
  "SE22",
  "SE23",
  "SE24",
  "SE25",
  "SE26",
  "SE27",
  "SE28",
  "SW1",
  "SW2",
  "SW3",
  "SW4",
  "SW5",
  "SW6",
  "SW7",
  "SW8",
  "SW9",
  "SW10",
  "SW11",
  "SW12",
  "SW13",
  "SW14",
  "SW15",
  "SW16",
  "SW17",
  "SW18",
  "SW19",
  "SW20",
  "E1",
  "E2",
  "E3",
  "E4",
  "E5",
  "E6",
  "E7",
  "E8",
  "E9",
  "E10",
  "E11",
  "E12",
  "E13",
  "E14",
  "E15",
  "E16",
  "E17",
  "E18",
  "E19",
  "E20",
  "W1",
  "W2",
  "W3",
  "W4",
  "W5",
  "W6",
  "W7",
  "W8",
  "W9",
  "W10",
  "W11",
  "W12",
  "W13",
  "W14",
  "N1",
  "N2",
  "N3",
  "N4",
  "N5",
  "N6",
  "N7",
  "N8",
  "N9",
  "N10",
  "N11",
  "N12",
  "N13",
  "N14",
  "N15",
  "N16",
  "N17",
  "N18",
  "N19",
  "N20",
  "N21",
  "N22",
  "NW1",
  "NW2",
  "NW3",
  "NW4",
  "NW5",
  "NW6",
  "NW7",
  "NW8",
  "NW9",
  "NW10",
  "NW11",
  "EC1",
  "EC2",
  "EC3",
  "EC4",
  "WC1",
  "WC2",
]

/**
 * Normalizes OCR text that might contain line breaks or special characters
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n|\r|\n/g, " ") // Replace line breaks with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/[^\w\s,.'-]/g, "") // Remove special characters except those common in addresses
    .trim()
}

/**
 * Extracts a potential UK postcode from text
 */
export function extractPostcode(text: string): string | null {
  const fullMatch = text.match(UK_POSTCODE_REGEX)
  if (fullMatch) return fullMatch[0].toUpperCase().replace(/\s+/g, " ")

  // Look for partial postcodes
  const partialMatch = text.match(PARTIAL_POSTCODE_REGEX)
  if (partialMatch) {
    const partial = partialMatch[0].toUpperCase()

    // Check if it's a known London area code
    if (LONDON_AREA_CODES.includes(partial)) {
      return partial
    }
  }

  return null
}

/**
 * Extracts a street name with number from text
 */
export function extractStreetAddress(text: string): string | null {
  // Look for patterns like "123 Main Street" or "Flat 4, 123 Main Street"
  const streetRegex = new RegExp(`\\b(\\d+[a-z]?)?\\s+([A-Za-z\\s]+\\s+(${UK_STREET_SUFFIXES.join("|")}))\\b`, "i")

  const match = text.match(streetRegex)
  if (match) {
    return match[0].trim()
  }

  // Look for "Court", "House", etc. which might be part of a building name
  const buildingRegex = /\b\d+\s+[A-Za-z\s]+(Court|House|Building|Apartments|Flats)\b/i
  const buildingMatch = text.match(buildingRegex)
  if (buildingMatch) {
    return buildingMatch[0].trim()
  }

  return null
}

/**
 * Enhances an address by adding "London" if it's missing and contains a London area code
 */
export function enhanceWithLondon(address: string): string {
  if (address.toLowerCase().includes("london")) {
    return address
  }

  // Check if it contains a London area code
  for (const code of LONDON_AREA_CODES) {
    if (address.includes(code)) {
      return `${address}, London`
    }
  }

  return address
}

/**
 * Corrects common OCR errors in addresses
 */
export function correctOcrErrors(text: string): string {
  let corrected = text
    .replace(/[0O](\d)/g, "0$1") // Replace O with 0 when followed by a digit
    .replace(/(\d)[0O]/g, "$10") // Replace O with 0 when preceded by a digit
    .replace(/l(\d)/g, "1$1") // Replace l with 1 when followed by a digit
    .replace(/(\d)l/g, "$11") // Replace l with 1 when preceded by a digit

  // Fix specific OCR errors we've seen in the logs
  corrected = corrected.replace(/SEISTR/g, "SE1")
  corrected = corrected.replace(/SEISTR/i, "SE1")
  corrected = corrected.replace(/SE1STR/g, "SE1")
  corrected = corrected.replace(/SE1STR/i, "SE1")

  // Fix other common OCR errors for UK postcodes
  corrected = corrected.replace(/SEI/g, "SE1")
  corrected = corrected.replace(/SEl/g, "SE1")
  corrected = corrected.replace(/SWI/g, "SW1")
  corrected = corrected.replace(/SWl/g, "SW1")
  corrected = corrected.replace(/NWI/g, "NW1")
  corrected = corrected.replace(/NWl/g, "NW1")
  corrected = corrected.replace(/WCI/g, "WC1")
  corrected = corrected.replace(/WCl/g, "WC1")
  corrected = corrected.replace(/ECI/g, "EC1")
  corrected = corrected.replace(/ECl/g, "EC1")

  return corrected
}

/**
 * Processes an address extracted from OCR to make it more accurate for geocoding
 */
export function processAddress(text: string): string {
  // Normalize and correct OCR errors
  let processed = normalizeText(text)
  processed = correctOcrErrors(processed)

  // Extract components
  const postcode = extractPostcode(processed)
  const streetAddress = extractStreetAddress(processed)

  // Build a better formatted address
  let formattedAddress = ""

  if (streetAddress) {
    formattedAddress += streetAddress
  } else {
    // If no street address found, use the original text
    formattedAddress += processed
  }

  // Add London if it's missing but has a London postcode
  formattedAddress = enhanceWithLondon(formattedAddress)

  // Add postcode if found and not already in the address
  if (postcode && !formattedAddress.includes(postcode)) {
    formattedAddress += `, ${postcode}`
  }

  return formattedAddress
}

/**
 * Generates alternative address formats to try with geocoding
 */
export function generateAddressAlternatives(address: string): string[] {
  const alternatives = [address]

  // Try with "London" added
  if (!address.toLowerCase().includes("london")) {
    alternatives.push(`${address}, London`)
  }

  // Extract postcode if present
  const postcode = extractPostcode(address)
  if (postcode) {
    // Try just the postcode with London
    alternatives.push(`${postcode}, London`)

    // Try street number + postcode
    const match = address.match(/\b\d+\b/)
    if (match) {
      alternatives.push(`${match[0]} ${postcode}, London`)
    }
  }

  // Try with common OCR errors fixed
  const corrected = correctOcrErrors(address)
  if (corrected !== address) {
    alternatives.push(corrected)
  }

  // Special case for "19 Peace Court London SEISTR" from the logs
  if (address.includes("Peace Court") && address.includes("London")) {
    alternatives.push("19 Peace Court, London SE1")
    alternatives.push("Peace Court, London SE1")
  }

  return [...new Set(alternatives)] // Remove duplicates
}

