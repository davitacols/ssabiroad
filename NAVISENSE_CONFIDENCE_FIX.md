# NaviSense ML Confidence Threshold Fix

## Problem
NaviSense ML returns wrong locations with invalid confidence scores (>1.0), and location-recognition-v2 API accepts them without validation, preventing fallback to Claude/Vision API.

## Solution
Add confidence threshold validation in location-recognition-v2 API route.

## Implementation

Find the section in `route.ts` where NaviSense ML response is processed (around line 1100+), and add this validation:

```typescript
// After receiving navisenseResult from ML API
if (navisenseResult) {
  // CRITICAL: Validate confidence before accepting result
  const isValidConfidence = navisenseResult.confidence >= 0.85 && navisenseResult.confidence <= 1.0;
  
  if (navisenseResult.success && isValidConfidence) {
    console.log('✅ NaviSense result accepted:', navisenseResult.confidence);
    // Use NaviSense result
    return navisenseResult;
  } else {
    console.log('⚠️ NaviSense confidence invalid or too low:', navisenseResult.confidence, '- falling back to Claude/Vision');
    // Continue to Claude/Vision API fallback
  }
}
```

## Expected Behavior After Fix
- ✅ High-confidence NaviSense results (0.85-1.0) are used
- ✅ Low-confidence results (<0.85) trigger fallback to Claude/Vision
- ✅ Invalid confidence scores (>1.0) trigger fallback to Claude/Vision
- ✅ Better overall accuracy

## Testing
1. Restart NaviSense ML service with updated code (threshold 0.85, confidence capped at 0.95)
2. Test with the image that returned wrong location
3. Verify it now falls back to Claude/Vision API
4. Confirm correct location is returned
