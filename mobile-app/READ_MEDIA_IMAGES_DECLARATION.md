# READ_MEDIA_IMAGES Permission Declaration

## For Google Play Console Data Safety Form

---

## Core Functionality Description

**Pic2Nav's primary purpose is to identify locations from photos by extracting GPS coordinates from image metadata and analyzing building features using AI.**

---

## Why We Need READ_MEDIA_IMAGES Permission

### Primary Use: GPS Coordinate Extraction
We access photos to read EXIF metadata containing GPS coordinates. This is the core functionality of our app - users select a photo, and we extract the embedded location data to identify where it was taken.

### Secondary Use: Visual Analysis
We analyze the visual content of photos to identify buildings, landmarks, and architectural features using computer vision AI. This helps identify locations even when GPS data is incomplete or unavailable.

### Specific Use Cases:
1. **Extract GPS from EXIF data** - Read latitude/longitude embedded in photo metadata
2. **Read camera metadata** - Device model, timestamp, camera settings for accuracy
3. **Analyze building features** - Identify architectural elements, landmarks, building types
4. **Match locations** - Compare visual features with known locations in our database

---

## How It Works

1. User selects "Choose from Gallery" in the app
2. READ_MEDIA_IMAGES permission allows access to photo library
3. User selects a photo
4. App reads EXIF metadata to extract GPS coordinates
5. App analyzes image content to identify buildings/landmarks
6. App displays location information (address, nearby places, map)

---

## Data Handling

### What We Do:
- ✅ Read photo EXIF metadata (GPS, timestamp, camera info)
- ✅ Analyze photo content using AI (temporary processing)
- ✅ Display location results to user

### What We DON'T Do:
- ❌ Store photos on our servers permanently
- ❌ Share photos with third parties
- ❌ Use photos for advertising
- ❌ Access photos without user selection
- ❌ Modify or delete user photos

### Processing:
- Photos are processed **ephemerally** (temporarily)
- Sent to our API for analysis
- Deleted immediately after processing
- Only location results are retained (not the photo itself)

---

## Is This Permission Required?

**YES - This is essential for core functionality.**

Without READ_MEDIA_IMAGES permission:
- Users cannot select photos from their gallery
- Cannot extract GPS coordinates from EXIF data
- Cannot identify locations from existing photos
- App's primary purpose cannot function

---

## User Control

Users have full control:
- Permission requested only when user taps "Choose from Gallery"
- Users select which specific photo to analyze
- Can revoke permission anytime in device settings
- App clearly explains why permission is needed

---

## Copy-Paste for Google Play Console

### Question: "Why does your app need access to photos and videos?"

**Answer:**
```
Pic2Nav requires READ_MEDIA_IMAGES permission for its core functionality: identifying locations from photos.

PRIMARY USE - GPS Extraction:
We read EXIF metadata from photos to extract GPS coordinates (latitude/longitude). This is essential for our app's main purpose - users select a photo, and we identify where it was taken by reading the embedded location data.

SECONDARY USE - Visual Analysis:
We analyze photo content using AI to identify buildings, landmarks, and architectural features. This helps identify locations when GPS data is incomplete.

DATA HANDLING:
Photos are processed temporarily on our secure servers and deleted immediately after analysis. We do NOT store photos permanently or share them with third parties. Only location results (address, coordinates) are retained.

This permission is REQUIRED for core functionality - without it, users cannot select photos from their gallery for location identification, which is the app's primary purpose.
```

### Question: "Is this data collected, shared, or both?"

**Answer:** Collected only

### Question: "Is this data processed ephemerally?"

**Answer:** Yes

### Question: "Is this data required for your app to function, or can users choose whether it's collected?"

**Answer:** Required for app functionality

### Question: "Why is this user data collected?"

**Answer:** App functionality

### Question: "Provide additional context (optional)"

**Answer:**
```
READ_MEDIA_IMAGES is essential for our core feature: location identification from photos. Users select a photo, we extract GPS coordinates from EXIF metadata and analyze building features using AI. Photos are processed temporarily (ephemerally) and not stored permanently. This is the app's primary purpose and cannot function without this permission.
```

---

## Video Demonstration Points

When recording demo video, show:
1. User taps "Choose from Gallery"
2. Permission dialog appears
3. User grants permission
4. User selects a photo
5. App extracts GPS and shows location on map
6. Text overlay: "Extracting GPS from EXIF metadata"

---

## Technical Details

### EXIF Data We Read:
- GPS Latitude
- GPS Longitude
- GPS Altitude
- Timestamp
- Camera Make/Model
- Camera Settings (ISO, aperture, etc.)

### Image Analysis:
- Building detection
- Landmark recognition
- Architectural style identification
- Text recognition (street signs, building names)

### APIs Used:
- Google Cloud Vision API (image analysis)
- Custom ML models (location matching)

---

## Privacy Compliance

✅ GDPR Compliant - Data processed temporarily, user consent required
✅ CCPA Compliant - No data sold, clear disclosure
✅ COPPA Compliant - Not directed at children under 13
✅ Transparent - Clear explanation in privacy policy

---

## Related Permissions

This permission works with:
- **CAMERA** - To capture new photos with location
- **ACCESS_MEDIA_LOCATION** - To read GPS from photo metadata
- **ACCESS_FINE_LOCATION** - To enhance location accuracy

All permissions serve the same core purpose: location identification from photos.

---

## Summary

**Permission:** READ_MEDIA_IMAGES
**Purpose:** Extract GPS from EXIF metadata + Analyze building features
**Required:** YES - Core functionality
**Data Storage:** Ephemeral (temporary processing only)
**User Control:** Full control - select specific photos, revoke anytime
**Privacy:** Photos not stored permanently, not shared with third parties
