# READ_MEDIA_IMAGES Permission - 250 Words

## Copy-Paste for Google Play Console

```
Pic2Nav is a location identification app that analyzes photos to determine where they were taken. READ_MEDIA_IMAGES permission is essential for our core functionality.

PRIMARY PURPOSE - GPS EXTRACTION:
When users select "Choose from Gallery," we access photos to read EXIF metadata containing GPS coordinates (latitude and longitude). This embedded location data tells us exactly where the photo was taken. Without this permission, users cannot select photos from their gallery, and our app's primary purpose cannot function.

SECONDARY PURPOSE - VISUAL ANALYSIS:
We analyze photo content using AI to identify buildings, landmarks, and architectural features. This computer vision analysis helps identify locations when GPS data is incomplete or provides additional context about the location.

HOW IT WORKS:
1. User taps "Choose from Gallery"
2. User selects a specific photo
3. We read GPS coordinates from EXIF metadata
4. We analyze building features using AI
5. We display location results (address, map, nearby places)

DATA HANDLING:
Photos are processed ephemerally (temporarily) on our secure servers for analysis only. After extracting GPS data and analyzing features, photos are immediately deleted. We do NOT store photos permanently, share them with third parties, or use them for any purpose other than location identification. Only the location results (coordinates, address) are retained, not the photo itself.

This permission is REQUIRED for core functionality. Users have full control - they select which specific photos to analyze and can revoke permission anytime in device settings.
```

**Word Count: 248 words** ✓
