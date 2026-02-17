// NAVISENSE ML CONFIDENCE VALIDATION FIX
// Add this code in route.ts POST handler after receiving NaviSense ML response

// Find this pattern in your code (around line 1100-1200):
// const navisenseResult = await fetch(ML_API_URL + '/predict', ...)
// const data = await response.json()

// REPLACE the section that checks navisenseResult.success with:

if (navisenseResult) {
  // CRITICAL FIX: Validate confidence threshold before accepting NaviSense result
  const isValidConfidence = 
    navisenseResult.confidence >= 0.85 && 
    navisenseResult.confidence <= 1.0;
  
  if (navisenseResult.success && isValidConfidence) {
    console.log('✅ NaviSense ML result accepted - confidence:', navisenseResult.confidence);
    
    // Enrich and return NaviSense result
    const enrichedResult = await recognizer.enrichLocationData(
      navisenseResult,
      buffer,
      false
    );
    
    return NextResponse.json(enrichedResult);
  } else {
    // Log why NaviSense was rejected
    if (!navisenseResult.success) {
      console.log('⚠️ NaviSense returned unsuccessful result');
    } else if (!isValidConfidence) {
      console.log('⚠️ NaviSense confidence invalid or too low:', 
        navisenseResult.confidence, 
        '- falling back to Claude/Vision API');
    }
    
    // Continue to Claude/Vision API fallback below
    // DO NOT return here - let it fall through to other methods
  }
}

// Then continue with Claude AI analysis:
// console.log('Trying Claude AI analysis...');
// const claudeResult = await recognizer.analyzeWithClaude(...)
