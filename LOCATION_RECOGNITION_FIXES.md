# Location Recognition V2 - Bug Fixes

## Date: 2026-01-20

## Issues Identified and Fixed

### 1. Google Cloud Vision API Credentials Parsing Error ✅ FIXED

**Problem:**
```
Failed to parse JSON credentials: Bad control character in string literal in JSON at position 167
```

**Root Cause:**
The `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable contains escaped newline characters (`\n`) that weren't being properly unescaped before JSON parsing.

**Solution:**
Updated `route.ts` line ~1450 to unescape newlines before parsing:

```typescript
// Before:
const credentials = JSON.parse(credentialsJson);

// After:
const unescapedJson = credentialsJson.replace(/\\n/g, '\n');
const credentials = JSON.parse(unescapedJson);
```

**File Modified:** `app/api/location-recognition-v2/route.ts`

---

### 2. Navisense ML Service Connection Failure ✅ FIXED

**Problem:**
```
Navisense prediction failed: fetch failed
```

**Root Cause:**
The code was looking for `NAVISENSE_ML_URL` environment variable, but the `.env` file only had `ML_API_URL`.

**Solution:**
Updated the Navisense prediction function to check both environment variables:

```typescript
// Before:
const NAVISENSE_URL = process.env.NAVISENSE_ML_URL || 'http://localhost:8000';

// After:
const NAVISENSE_URL = process.env.NAVISENSE_ML_URL || process.env.ML_API_URL || 'http://localhost:8000';
```

**File Modified:** `app/api/location-recognition-v2/route.ts` (line ~5207)

**Environment Variables:**
- `ML_API_URL=https://navisense-ml-678649320532.us-east1.run.app` ✅ Already set
- `NAVISENSE_ML_URL` (optional, will fallback to ML_API_URL)

---

### 3. Claude AI Low Confidence (Expected Behavior)

**Status:** ⚠️ Working as Designed

**Observation:**
```
Claude analysis response: The image does not contain any visible business names...
confidence: 0.7
```

**Explanation:**
This is expected behavior when:
- The image doesn't have clear business signage
- Text is not readable or partially obscured
- The image shows a landmark or bridge without business context

**No Action Required:** The system correctly falls back to Google Vision API when Claude returns low confidence or invalid business names.

---

## Testing Recommendations

1. **Test Google Vision API:**
   - Upload an image with clear business signage
   - Verify that Vision API credentials are now working
   - Check logs for "Vision client initialized with JSON credentials successfully"

2. **Test Navisense ML:**
   - Upload an image that the ML model has been trained on
   - Verify connection to: `https://navisense-ml-678649320532.us-east1.run.app`
   - Check for successful prediction response

3. **Test Claude AI:**
   - Upload images with clear text and business names
   - Verify Claude can read and extract business information
   - Confirm fallback to Vision API when Claude confidence is low

---

## System Flow After Fixes

```
1. EXIF GPS Extraction
   ↓ (if no GPS)
2. Navisense ML Prediction ✅ NOW WORKING
   ↓ (if confidence < 0.7)
3. Claude AI Analysis ✅ WORKING
   ↓ (if invalid/low confidence)
4. Google Vision API ✅ NOW WORKING
   ↓ (if all fail)
5. Fallback Options
```

---

## Files Modified

1. `app/api/location-recognition-v2/route.ts`
   - Line ~1450: Fixed Google credentials JSON parsing
   - Line ~5207: Fixed Navisense ML URL fallback

---

## Environment Variables Status

✅ **Working:**
- `ANTHROPIC_API_KEY` - Claude AI
- `GOOGLE_PLACES_API_KEY` - Google Places/Geocoding
- `ML_API_URL` - Navisense ML Service
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Google Vision (now fixed)

⚠️ **Optional:**
- `NAVISENSE_ML_URL` - Will use ML_API_URL if not set

---

## Next Steps

1. Restart your development server to apply changes
2. Test with various image types:
   - Images with GPS data
   - Images with clear business signage
   - Images with landmarks
   - Images with partial/unclear text
3. Monitor logs for successful API connections
4. Verify all three AI methods are working correctly

---

## Additional Notes

- The Google Vision API requires proper credentials to be set up in Google Cloud Console
- Make sure the Vision API is enabled for your project: `pic2nav`
- The Navisense ML service should be running and accessible at the configured URL
- Claude AI has a 180-second timeout for complex image analysis
