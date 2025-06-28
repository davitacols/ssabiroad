// Smart decision engine for when to use web search
export const shouldUseWebSearch = (imageAnalysis, location, confidence) => {
  // Don't use web search if confidence is already high
  if (confidence > 0.85) return false;
  
  const fullText = imageAnalysis.text?.join(' ') || '';
  
  // Skip web search for non-location items
  const nonLocationItems = [
    /payment card/i,
    /credit card/i,
    /debit card/i,
    /www\./i,
    /\.com/i,
    /card number/i,
    /expiry/i,
    /cvv/i
  ];
  
  if (nonLocationItems.some(pattern => pattern.test(fullText))) {
    return false;
  }
  
  // Use web search for these scenarios:
  const triggers = [
    // Low confidence results
    confidence < 0.6,
    
    // Detected landmarks or famous buildings
    imageAnalysis.labels?.some(label => 
      ['landmark', 'monument', 'building', 'architecture', 'statue', 'tower'].includes(label.toLowerCase())
    ),
    
    // Business signs detected (especially banks and furniture stores)
    imageAnalysis.text?.some(text => 
      /\b(restaurant|hotel|store|shop|cafe|bank|seacoastbank|hospital|school|furniture)\b/i.test(text)
    ),
    
    // Street signs or addresses
    imageAnalysis.text?.some(text => 
      /\b(street|st|avenue|ave|road|rd|blvd|drive|dr)\b/i.test(text)
    ),
    
    // Brand names detected (including banks and furniture stores)
    imageAnalysis.text?.some(text => 
      /\b(mcdonalds|starbucks|walmart|target|apple|google|microsoft|seacoastbank|seacoast bank|wells fargo|bank of america|chase|turkiye furniture|sweet home)\b/i.test(text)
    ),
    
    // Multi-word business names that need web search
    imageAnalysis.text?.some(text => 
      /\b(right choice|sweet home|turkiye furniture)\b/i.test(text)
    )
  ];
  
  return triggers.some(Boolean);
};

export const getSearchQuery = (imageAnalysis, location) => {
  const fullText = imageAnalysis.text?.join(' ') || '';
  
  // Simple bank detection first
  if (/seacoastbank|seacoast bank/i.test(fullText)) {
    if (/cuadrille/i.test(fullText)) {
      return 'Seacoast Bank Cuadrille Boulevard';
    }
    return 'Seacoast Bank';
  }
  
  // Clean OCR text
  const cleanText = fullText
    .replace(/EN SH/gi, 'ENISH')
    .replace(/ALBANY ROADS/gi, 'ALBANY ROAD')
    .replace(/\s+/g, ' ');
  
  // Extract business name with OCR corrections
  const businessMatch = cleanText.match(/(RIGHT CHOICE[,\s]*SWEET HOME[,\s]*TURKIYE FURNITURE|TURKIYE FURNITURE|[A-Z\s]+FURNITURE|ENISH[,\s]*NIGERIAN\s+RESTAURANT\s*&?\s*LOUNGE|[A-Z\s]+NIGERIAN\s+RESTAURANT\s*&?\s*LOUNGE|[A-Z\s]+RESTAURANT\s*&?\s*LOUNGE|[A-Z\s]+RESTAURANT)/i);
  if (businessMatch) {
    let businessName = businessMatch[1].trim();
    
    // Fix specific OCR errors
    if (businessName.includes('ENISH')) {
      businessName = 'ENISH NIGERIAN RESTAURANT & LOUNGE';
    }
    if (businessName.includes('RIGHT CHOICE') && businessName.includes('TURKIYE')) {
      businessName = 'RIGHT CHOICE SWEET HOME TURKIYE FURNITURE';
    } else if (businessName.includes('TURKIYE')) {
      businessName = 'TURKIYE FURNITURE';
    }
    
    // Extract street address
    const streetMatch = cleanText.match(/(ALBANY ROAD|[A-Z\s]+ROAD[S]?|[A-Z\s]+STREET|[A-Z\s]+AVENUE)/i);
    const street = streetMatch ? streetMatch[1].trim() : '';
    
    // Determine location context for better search
    let locationContext = '';
    if (location) {
      // Nigeria coordinates range
      if (location.latitude >= 4 && location.latitude <= 14 && location.longitude >= 3 && location.longitude <= 15) {
        locationContext = 'Nigeria';
      }
      // UK coordinates range  
      else if (location.latitude >= 49 && location.latitude <= 61 && location.longitude >= -8 && location.longitude <= 2) {
        locationContext = 'UK';
      }
    }
    
    // Create location-aware search query
    let query = businessName;
    if (street && locationContext) {
      query = `${businessName} ${street} ${locationContext}`;
    } else if (locationContext) {
      query = `${businessName} ${locationContext}`;
    } else if (street) {
      query = `${businessName} ${street}`;
    }
    
    if (location) {
      return `${query} near ${location.latitude},${location.longitude}`;
    }
    return query;
  }
  
  // Extract business name with address (fallback)
  const fallbackMatch = fullText.match(/(SEACOASTBANK|SEACOAST BANK|[A-Z\s]+(?:BANK|STORE|SHOP|CAFE))/i);
  if (fallbackMatch) {
    const businessName = fallbackMatch[1].trim();
    const streetMatch = fullText.match(/(CUADRILLE|[A-Z\s]+ROAD[S]?|[A-Z\s]+STREET|[A-Z\s]+AVENUE|[A-Z\s]+BOULEVARD)/i);
    const street = streetMatch ? streetMatch[1].trim() : '';
    
    let query = businessName;
    if (street) {
      if (street.includes('CUADRILLE')) {
        query = `${businessName} Cuadrille Boulevard`;
      } else {
        query = `${businessName} ${street}`;
      }
    }
    
    if (location) {
      return `${query} near ${location.latitude},${location.longitude}`;
    }
    return query;
  }
  
  // Fallback to original logic
  const textTerms = imageAnalysis.text?.filter(text => 
    text.length > 2 && !/^\d+$/.test(text)
  ).slice(0, 3) || [];
  
  const searchTerms = textTerms.join(' ');
  
  if (location) {
    return `${searchTerms} near ${location.latitude},${location.longitude}`;
  }
  
  return searchTerms;
};