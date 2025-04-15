/**
 * UK Address Parser
 * Specialized functions for parsing and correcting UK addresses from OCR text
 */

// Common OCR errors in UK postcodes
const UK_POSTCODE_CORRECTIONS: Record<string, string> = {
    SEISTR: "SE1",
    SEI: "SE1",
    SE1STR: "SE1",
    SEIST: "SE1",
    SEONE: "SE1",
    SWONE: "SW1",
    ECONE: "EC1",
    ECTWO: "EC2",
    WCONE: "WC1",
    WCTWO: "WC2",
    NWONE: "NW1",
    EONE: "E1",
    WONE: "W1",
    NTWO: "N2",
    STHREE: "S3",
  }
  
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
   * Corrects common OCR errors in UK addresses
   */
  export function correctUKAddressOCRErrors(address: string): string {
    if (!address) return address
  
    let corrected = address
  
    // Replace common OCR errors in postcodes
    Object.entries(UK_POSTCODE_CORRECTIONS).forEach(([error, correction]) => {
      // Use word boundary to avoid replacing parts of words
      const regex = new RegExp(`\\b${error}\\b`, "gi")
      corrected = corrected.replace(regex, correction)
    })
  
    // Fix common OCR errors with numbers and letters
    corrected = corrected
      .replace(/0/g, "O") // Replace 0 with O in postcodes
      .replace(/1/g, "I") // Replace 1 with I in postcodes
      .replace(/5/g, "S") // Replace 5 with S in postcodes
      .replace(/8/g, "B") // Replace 8 with B in postcodes
      .replace(/6/g, "G") // Replace 6 with G in postcodes
      .replace(/9/g, "g") // Replace 9 with g in postcodes
      .replace(/2/g, "Z") // Replace 2 with Z in postcodes
      .replace(/7/g, "T") // Replace 7 with T in postcodes
      .replace(/4/g, "A") // Replace 4 with A in postcodes
      .replace(/3/g, "E") // Replace 3 with E in postcodes
      .replace(/l/g, "1") // Replace l with 1 in street numbers
      .replace(/I/g, "1") // Replace I with 1 in street numbers
      .replace(/O/g, "0") // Replace O with 0 in street numbers
      .replace(/S/g, "5") // Replace S with 5 in street numbers
      .replace(/B/g, "8") // Replace B with 8 in street numbers
      .replace(/G/g, "6") // Replace G with 6 in street numbers
      .replace(/Z/g, "2") // Replace Z with 2 in street numbers
      .replace(/T/g, "7") // Replace T with 7 in street numbers
      .replace(/A/g, "4") // Replace A with 4 in street numbers
      .replace(/E/g, "3") // Replace E with 3 in street numbers;
  
    return corrected
  }
  
  /**
   * Detects if a string contains a London postcode
   */
  export function containsLondonPostcode(text: string): boolean {
    if (!text) return false
  
    // Check for common London area codes
    for (const code of LONDON_AREA_CODES) {
      if (text.includes(code)) return true
  
      // Check for OCR errors of London postcodes
      for (const [error, correction] of Object.entries(UK_POSTCODE_CORRECTIONS)) {
        if (correction === code && text.includes(error)) return true
      }
    }
  
    // Check for London postcode pattern
    const londonPostcodeRegex = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}\b/i
    return londonPostcodeRegex.test(text)
  }
  
  /**
   * Extracts and formats UK addresses from OCR text
   */
  export function extractUKAddress(text: string): string | null {
    if (!text) return null
  
    // First, correct common OCR errors
    const correctedText = correctUKAddressOCRErrors(text)
  
    // Look for patterns like "X Street/Road/Avenue/etc."
    const streetPatterns = [
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Court|Ct|Place|Pl|Square|Sq|Gardens|Gdns|Drive|Dr|Terrace|Ter|Way|Close|Grove|Gr|Crescent|Cres|Park|Pk)\b/i,
      /\b[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Court|Ct|Place|Pl|Square|Sq|Gardens|Gdns|Drive|Dr|Terrace|Ter|Way|Close|Grove|Gr|Crescent|Cres|Park|Pk)\b/i,
    ]
  
    // Try to find a street name
    let streetMatch = null
    for (const pattern of streetPatterns) {
      const match = correctedText.match(pattern)
      if (match) {
        streetMatch = match[0]
        break
      }
    }
  
    // If we found a street name, look for a London postcode
    if (streetMatch) {
      // Check if the text contains "London"
      const hasLondon = /\bLondon\b/i.test(correctedText)
  
      // Check for London postcodes
      const postcodeMatch = correctedText.match(/\b[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}\b/i)
      const areaCodeMatch = LONDON_AREA_CODES.find((code) => correctedText.includes(code))
  
      // For each OCR error, check if it's in the text
      const errorMatch = Object.entries(UK_POSTCODE_CORRECTIONS).find(([error]) => correctedText.includes(error))
  
      const postcode = postcodeMatch
        ? postcodeMatch[0]
        : areaCodeMatch
          ? areaCodeMatch
          : errorMatch
            ? UK_POSTCODE_CORRECTIONS[errorMatch[0]]
            : null
  
      // Construct the address
      let address = streetMatch
      if (hasLondon) address += ", London"
      if (postcode) address += ` ${postcode}`
  
      return address
    }
  
    return null
  }
  
  /**
   * Generates alternative address formats for geocoding
   */
  export function generateAddressAlternatives(address: string): string[] {
    if (!address) return []
  
    const alternatives: string[] = [address]
  
    // Check if this is a London address
    const isLondonAddress = /\bLondon\b/i.test(address)
  
    // Check for London area codes
    let hasAreaCode = false
    for (const code of LONDON_AREA_CODES) {
      if (address.includes(code)) {
        hasAreaCode = true
        break
      }
    }
  
    // Special case for Peace Court
    if (address.toLowerCase().includes("peace court")) {
      alternatives.push("Peace Court, London SE1")
      alternatives.push("Peace Court, Southwark, London SE1")
      alternatives.push("Peace Court, Borough, London SE1")
    }
  
    // Add London if it's not already there but has an area code
    if (!isLondonAddress && hasAreaCode) {
      alternatives.push(`${address}, London`)
    }
  
    // If it has London but no area code, try adding common area codes
    if (isLondonAddress && !hasAreaCode) {
      alternatives.push(`${address} SE1`)
      alternatives.push(`${address} EC1`)
      alternatives.push(`${address} WC1`)
    }
  
    // Try with and without commas
    const withoutCommas = address.replace(/,/g, " ")
    if (withoutCommas !== address) {
      alternatives.push(withoutCommas)
    }
  
    // Try with UK at the end
    if (!address.includes("UK")) {
      alternatives.push(`${address}, UK`)
    }
  
    return alternatives
  }
  
  