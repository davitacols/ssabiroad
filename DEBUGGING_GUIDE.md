# Location Recognition API Debugging Guide

## Current Issue
The location recognition API is returning "no-location-data" error, meaning all three methods (EXIF, Claude AI, Google Vision) are failing.

## How to Check Server Logs

### Option 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your `ssabiroad` project
3. Click on "Logs" in the left sidebar
4. Filter by:
   - Function: `/api/location-recognition-v2`
   - Time: Last 1 hour
5. Look for logs with these emojis:
   - 🔍 Step 2: Claude AI analysis
   - 🔍 Step 3: Google Vision analysis
   - ⚠️ Warnings
   - ❌ Errors
   - ✅ Success indicators

### Option 2: Vercel CLI
```bash
vercel logs --follow
```

## What to Look For

### 1. Claude AI Failure (Step 2)
Look for these log messages:
- `⚠️ Claude AI analysis failed:` - Shows the error message
- `❌ Claude API authentication failed` - API key issue
- `⏱️ Claude API timed out after 120 seconds` - Timeout issue

**Common Causes:**
- Invalid ANTHROPIC_API_KEY
- API rate limit exceeded
- Network timeout

### 2. Google Vision Failure (Step 3)
Look for these log messages:
- `⚠️ Google Vision analysis timed out or failed:`
- `Vision client not available`
- `⏱️ Vision API timeout occurred after 60 seconds`

**Common Causes:**
- Missing GOOGLE_APPLICATION_CREDENTIALS_JSON
- Vision API not enabled
- Network timeout

### 3. EXIF GPS Failure (Step 1)
Look for:
- `❌ No valid GPS data found in EXIF`
- `🔍 GPS extraction complete - no valid coordinates found`

**Expected:** This is normal for images without GPS data

## Quick Fixes

### Fix 1: Check API Keys
```bash
# Check if environment variables are set
vercel env ls

# Add missing keys
vercel env add ANTHROPIC_API_KEY
vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON
```

### Fix 2: Increase Timeout (Already Done)
The timeouts have been increased to:
- Claude AI: 120 seconds
- Google Vision: 60 seconds
- Individual Vision API calls: 45 seconds

### Fix 3: Test with Simple Image
Try uploading an image with:
1. Clear business signage
2. Visible address or phone number
3. Good lighting and focus

## Expected Log Flow

### Successful Recognition:
```
🔍 Step 2: Trying Claude AI comprehensive analysis...
✅ CLAUDE SUCCESS - ENRICHING AND RETURNING: [address]
```

### Partial Success (Vision fallback):
```
🔍 Step 2: Trying Claude AI comprehensive analysis...
⚠️ Claude AI analysis failed: [error]
🔍 Step 3: Trying Google Vision analysis...
Google Vision found location: [coordinates]
```

### Complete Failure:
```
🔍 Step 2: Trying Claude AI comprehensive analysis...
⚠️ Claude AI analysis failed: [error]
🔍 Step 3: Trying Google Vision analysis...
⚠️ Google Vision analysis timed out or failed: [error]
❌ All AI methods failed (EXIF, Claude, Vision)
```

## Next Steps

1. **Check Vercel logs** to see which specific step is failing
2. **Verify API keys** are correctly set in Vercel environment
3. **Test with different images** to isolate the issue
4. **Share the server logs** with me so I can provide specific fixes

## Testing Commands

### Test API directly with curl:
```bash
curl -X POST https://ssabiroad.vercel.app/api/location-recognition-v2 \
  -F "image=@test-image.jpg" \
  -F "latitude=0" \
  -F "longitude=0"
```

### Check API key validity:
```bash
# Test Anthropic API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

## Contact Support

If the issue persists after checking logs:
1. Share the Vercel server logs (with sensitive data redacted)
2. Describe the image you're testing with
3. Note any error patterns you observe
