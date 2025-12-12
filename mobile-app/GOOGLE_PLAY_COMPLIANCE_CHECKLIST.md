# Google Play Store Compliance Checklist

## ✅ Required Actions for Submission

### 1. Data Safety Section (CRITICAL)
**Status:** Ready to fill
**Location:** Google Play Console → Policy → App content → Data safety

#### Data Types to Declare:

**Location (Precise & Approximate)**
- [x] Collected: YES
- [x] Shared: NO
- [x] Required: YES
- [x] Purpose: App functionality
- [x] Reason: "Extract GPS coordinates from photo EXIF data and provide location-based features like nearby places and geofence alerts"

**Photos**
- [x] Collected: YES
- [x] Shared: NO
- [x] Required: YES
- [x] Ephemeral: YES
- [x] Purpose: App functionality
- [x] Reason: "Analyze building features and architectural elements to identify locations. Photos are processed temporarily and not stored permanently."

**Files and Docs (EXIF Metadata)**
- [x] Collected: YES
- [x] Shared: NO
- [x] Required: YES
- [x] Purpose: App functionality
- [x] Reason: "Extract GPS coordinates, camera settings, and timestamp data from photo metadata for accurate location identification"

**Device ID**
- [x] Collected: NO

**Personal Info**
- [x] Collected: NO

---

### 2. Foreground Service Declaration (CRITICAL)
**Status:** Ready to declare
**Location:** Google Play Console → Policy → App content → Foreground service

**Service Type:** Location

**Declaration Text:**
```
Pic2Nav uses location foreground service exclusively for the optional geofence alerts feature. 

WHEN IT'S USED:
- Only when user explicitly enables geofence alerts for saved locations
- User must manually turn on this feature in app settings
- Can be disabled at any time

WHAT IT DOES:
- Monitors proximity to user-saved locations
- Sends notifications when entering/exits saved location boundaries
- Tracks location history for journey mapping (optional feature)

USER VISIBILITY:
- Persistent notification shown: "Pic2Nav is monitoring your saved locations"
- Notification includes "Stop tracking" action button
- Clear indication in app settings when service is active

CORE FUNCTIONALITY:
- This is NOT required for core functionality
- Main features (photo location analysis, building recognition) work without it
- Completely optional enhancement feature

PERMISSION HANDLING:
- Requests background location permission only when user enables geofences
- Clear explanation shown before requesting permission
- Graceful degradation if permission denied
```

---

### 3. App Content Declarations

#### Target Audience
- [x] Target age: 13+
- [x] Appeals to children: NO
- [x] Reason: Professional/utility tool for location analysis

#### Ads
- [x] Contains ads: NO
- [x] Ad-free experience

#### Content Rating
- [x] Complete questionnaire
- [x] Expected rating: Everyone/PEGI 3

#### Privacy Policy
- [x] URL: https://pic2nav.com/privacy
- [x] Accessible and complete: YES
- [x] Matches data collection: YES

#### App Access
- [x] All features accessible without login: YES
- [x] Demo account needed: NO

---

### 4. Store Listing Requirements

#### App Description (Must Include)
```
🎯 WHAT IS PIC2NAV?
Pic2Nav identifies buildings, landmarks, and locations from photos using AI-powered image analysis and GPS data extraction.

📸 CORE FEATURES:
• Photo Location Scanner - Extract GPS coordinates from photo EXIF metadata
• AI Building Recognition - Identify buildings using computer vision
• Location Intelligence - Get address, nearby places, weather data
• EXIF Metadata Tools - Professional photo geotagging and editing
• Geofence Alerts - Optional notifications for saved locations (uses background location)

🔒 PRIVACY & PERMISSIONS:
• Photos: Required to extract GPS data and analyze building features (core functionality)
• Location: Required for location-based features and optional geofence alerts
• Camera: Required to capture photos for analysis
• Storage: Required to read photo metadata

Photos are processed locally and temporarily - not stored on our servers.

✨ USE CASES:
• Delivery riders finding vague addresses
• Real estate agents showing property locations
• Tourists identifying landmarks
• Photographers managing location metadata
• Anyone needing to identify locations from photos

🌍 Works in 195+ countries
⚡ Results in under 3 seconds
🆓 Free forever, no hidden costs

PERMISSIONS EXPLAINED:
We request photo access to read GPS coordinates from EXIF metadata and analyze building features - this is our core functionality. Background location is only used for optional geofence alerts that you can enable/disable anytime.

Privacy Policy: https://pic2nav.com/privacy
Terms of Service: https://pic2nav.com/terms
```

#### Short Description
```
AI-powered location finder. Identify buildings and locations from photos using GPS extraction and computer vision. Free forever.
```

#### Screenshots (Required: 2-8)
- [x] Show photo upload/capture
- [x] Show location results
- [x] Show map view
- [x] Show EXIF tools
- [x] Show geofence feature (with "Optional" label)
- [x] Show permissions explanation

#### Feature Graphic (1024x500)
- [x] Required for featured placement
- [x] No text covering more than 30%
- [x] High quality, professional

---

### 5. App Category & Tags
- [x] Category: Tools
- [x] Tags: location, GPS, photo, AI, navigation, maps

---

### 6. Technical Requirements

#### App Bundle
- [x] Format: AAB (Android App Bundle)
- [x] Target SDK: 35 (Android 15)
- [x] Min SDK: 21 (Android 5.0)
- [x] 64-bit support: YES

#### Permissions (Properly Justified)
```xml
<!-- CAMERA: Required to capture photos for location analysis -->
<uses-permission android:name="android.permission.CAMERA"/>

<!-- PHOTOS: Required to read GPS data from photo EXIF metadata (core functionality) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.ACCESS_MEDIA_LOCATION"/>

<!-- LOCATION: Required for location-based features and optional geofence alerts -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>

<!-- FOREGROUND SERVICE: Only for optional geofence alerts feature -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION"/>
```

---

### 7. Security & Privacy

#### Data Encryption
- [x] In transit: HTTPS only
- [x] At rest: SecureStore for sensitive data

#### Data Deletion
- [x] Users can delete saved locations
- [x] Clear data deletion option in settings
- [x] No permanent server storage

#### Third-Party SDKs
- [x] Expo SDK: Disclosed
- [x] Google Maps: Disclosed
- [x] All SDKs comply with policies

---

### 8. Testing Requirements

#### Pre-Submission Testing
- [x] Test on Android 5.0+ devices
- [x] Test permission flows
- [x] Test permission denial scenarios
- [x] Test foreground service notification
- [x] Test offline functionality
- [x] Test data deletion
- [x] No crashes or ANRs

#### Test Account (If Needed)
- [x] Not required - all features accessible without login

---

### 9. Legal Compliance

#### Privacy Policy Requirements
- [x] What data is collected
- [x] How data is used
- [x] How data is shared (or not)
- [x] User rights (access, deletion)
- [x] Contact information
- [x] Children's privacy (COPPA)
- [x] Data retention policy
- [x] Security measures

#### Terms of Service Requirements
- [x] Service description
- [x] User responsibilities
- [x] Prohibited uses
- [x] Liability limitations
- [x] Intellectual property
- [x] Termination policy
- [x] Governing law
- [x] Contact information

---

### 10. Content Policy Compliance

#### Prohibited Content
- [x] No deceptive behavior
- [x] No malware or harmful code
- [x] No copyright infringement
- [x] No hate speech or violence
- [x] No illegal activities
- [x] No misleading claims

#### User-Generated Content
- [x] Not applicable - no UGC features

---

## 📋 Submission Checklist

### Before Building
- [x] Update version code in app.json
- [x] Update version name (1.0.0 → 1.0.1)
- [x] Test all features thoroughly
- [x] Check all permissions work correctly
- [x] Verify privacy policy is accessible

### Building
```bash
cd mobile-app
npm install
npx expo install expo-build-properties
eas build --platform android --profile production
```

### In Play Console
1. **App content** (Complete all sections)
   - [ ] Privacy policy URL
   - [ ] Data safety
   - [ ] Foreground service declaration
   - [ ] Target audience
   - [ ] Content rating
   - [ ] News apps (N/A)
   - [ ] COVID-19 contact tracing (N/A)
   - [ ] Data safety form
   - [ ] Ads declaration

2. **Store listing**
   - [ ] App name: Pic2Nav
   - [ ] Short description (80 chars)
   - [ ] Full description (4000 chars)
   - [ ] Screenshots (2-8)
   - [ ] Feature graphic (1024x500)
   - [ ] App icon (512x512)
   - [ ] Category: Tools
   - [ ] Tags

3. **Release**
   - [ ] Upload AAB
   - [ ] Release notes
   - [ ] Rollout percentage (start with 20%)

---

## 🚨 Common Rejection Reasons & Prevention

### "Insufficient permission justification"
**Prevention:** 
- Detailed explanation in Data Safety form
- Clear in-app permission rationale
- Updated app description with permission explanations

### "Foreground service not properly declared"
**Prevention:**
- Completed foreground service declaration form
- Emphasized it's optional
- Documented user-visible notification

### "Privacy policy doesn't match data collection"
**Prevention:**
- Updated privacy policy with all data types
- Matches Data Safety declarations exactly
- Includes foreground service explanation

### "Misleading app description"
**Prevention:**
- Accurate feature descriptions
- No exaggerated claims
- Clear about optional features

---

## 📞 Support Resources

**Google Play Console Help:**
- Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Foreground Services: https://support.google.com/googleplay/android-developer/answer/13392821
- Permissions: https://support.google.com/googleplay/android-developer/answer/9888170

**Contact:**
- Google Play Support: Via Play Console
- App Support: support@pic2nav.com

---

## ✅ Final Pre-Submission Checklist

- [ ] All app content sections completed in Play Console
- [ ] Data safety form filled with accurate information
- [ ] Foreground service declaration submitted
- [ ] Privacy policy accessible at https://pic2nav.com/privacy
- [ ] Terms of service accessible at https://pic2nav.com/terms
- [ ] App description includes permission explanations
- [ ] Screenshots show key features
- [ ] Feature graphic uploaded
- [ ] AAB uploaded and tested
- [ ] Release notes written
- [ ] Content rating completed
- [ ] Target audience set correctly
- [ ] All testing completed successfully

**Ready to submit!** 🚀
