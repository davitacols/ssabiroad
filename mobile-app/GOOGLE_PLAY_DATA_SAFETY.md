# Google Play Data Safety Form - Pic2Nav

## App Access and Collection

### Location
**Does your app collect location data?** YES
- **Precise location**: YES (for photo location analysis)
- **Approximate location**: YES (for nearby places)
- **Is this data collected, shared, or both?** Collected only
- **Is this data processed ephemerally?** NO
- **Is collection of this data required or optional?** Required
- **Why is this user data collected?** App functionality - Core feature for location recognition from photos

### Photos and Videos
**Does your app collect photos or videos?** YES
- **Photos**: YES
- **Videos**: NO
- **Is this data collected, shared, or both?** Collected only
- **Is this data processed ephemerally?** YES (processed for analysis, not permanently stored)
- **Is collection of this data required or optional?** Required
- **Why is this user data collected?** App functionality - Core feature to analyze buildings and locations from images

### Files and Docs
**Does your app collect files and docs?** YES
- **Files and docs**: YES (EXIF metadata from photos)
- **Is this data collected, shared, or both?** Collected only
- **Is this data processed ephemerally?** NO
- **Is collection of this data required or optional?** Required
- **Why is this user data collected?** App functionality - Extract GPS coordinates and metadata from photos

### Device or Other IDs
**Does your app collect device or other IDs?** NO

### Personal Info
**Does your app collect personal info?** NO (no email, name, or personal identifiers collected)

## Core Functionality Declaration

### Primary Purpose
Pic2Nav is a location recognition and analysis app that identifies buildings, landmarks, and locations from photos using AI-powered image analysis and GPS data extraction.

### Core Functionality Description for Google Play
**Title:** Photo Location Analysis & Building Recognition

**Description:**
Pic2Nav helps users identify and analyze locations from photos through:

1. **Photo Scanner**: Users take or upload photos to identify exact locations using GPS data extraction and AI visual analysis
2. **Building Recognition**: AI analyzes architectural features to identify buildings and landmarks
3. **Location Intelligence**: Provides detailed information about identified locations including address, nearby places, and environmental data
4. **Professional Tools**: EXIF metadata editor and GPS geotagging for photographers and professionals

**Why we need photo/video access:**
- Extract GPS coordinates from photo metadata (EXIF data)
- Analyze building features and architectural elements using computer vision
- Identify landmarks and locations through image recognition
- Process multiple photos for batch location analysis

**Why we need location access:**
- Match photo locations with real-world coordinates
- Provide nearby places and points of interest
- Enable geofence alerts for saved locations
- Show user's current location on maps for navigation

## Foreground Service Declaration

### Foreground Service Types Used
**FOREGROUND_SERVICE_LOCATION**

### Purpose of Foreground Service
**Title:** Background Location Tracking for Geofence Alerts

**Description:**
Pic2Nav uses a foreground service with location access to:
1. Monitor geofence boundaries for saved locations
2. Send notifications when user enters/exits saved location areas
3. Track location history for journey mapping feature
4. Provide real-time location updates for navigation

**User-visible notification:**
When the location foreground service is active, users see a persistent notification that says "Pic2Nav is tracking your location for geofence alerts" with an option to stop tracking.

**When is it used:**
- Only when user explicitly enables geofence alerts for saved locations
- Can be disabled at any time from app settings
- Automatically stops when all geofences are removed

## Data Security

### Encryption
- All data transmitted over HTTPS
- Location data encrypted at rest
- No sensitive data stored on device

### Data Deletion
- Users can delete their location history anytime
- Processed photos are not stored permanently
- Account deletion removes all user data

### Data Retention
- Location history: Until user deletes
- Photo analysis results: 30 days
- EXIF metadata: Processed ephemerally, not stored

## Privacy Policy
Full privacy policy available at: https://pic2nav.com/privacy

## Terms of Service
Full terms available at: https://pic2nav.com/terms
