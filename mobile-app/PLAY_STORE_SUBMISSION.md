# Google Play Store Submission Guide for Pic2Nav

## Prerequisites

### 1. Google Play Console Account
- Create account at: https://play.google.com/console
- Pay one-time $25 registration fee
- Complete account verification

### 2. Required Assets

#### App Icon
- ✅ Already configured: `./assets/icon.png` (1024x1024px)

#### Feature Graphic
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Create at: `./assets/feature-graphic.png`

#### Screenshots (Required: minimum 2)
- Phone: 16:9 or 9:16 aspect ratio
- Minimum dimension: 320px
- Maximum dimension: 3840px
- Recommended: 1080 x 1920 pixels (portrait)
- Save in: `./assets/screenshots/`

#### Privacy Policy
- Required for apps requesting permissions
- Host at: https://ssabiroad.com/privacy or use GitHub Pages
- Update in app.json

## Step-by-Step Submission Process

### Step 1: Build Production AAB

```bash
cd mobile-app
eas build --platform android --profile production
```

This creates an Android App Bundle (.aab) optimized for Play Store.

### Step 2: Download the AAB

After build completes, download the .aab file from the Expo dashboard or use:

```bash
eas build:list
```

### Step 3: Create Google Play Console Listing

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **Pic2Nav**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
   - Accept declarations

### Step 4: Complete Store Listing

#### Main Store Listing
- **App name**: Pic2Nav
- **Short description** (80 chars max):
  ```
  AI-powered location recognition from photos with GPS data extraction
  ```
- **Full description** (4000 chars max):
  ```
  Pic2Nav is your smart companion for location recognition and photo analysis. 
  
  🎯 KEY FEATURES:
  
  📸 Photo Scanner
  - Identify locations from images using GPS data
  - AI-powered visual landmark recognition
  - Extract EXIF metadata automatically
  
  🛠️ Professional Tools
  - Bulk EXIF editor for metadata management
  - GPS geotagging tool for adding location data
  - Multi-photo processing capabilities
  - Processing history and file management
  
  📍 Location Intelligence
  - Precise geolocation tracking
  - Save and organize discovered locations
  - Share locations with others
  - View location history
  
  🔒 Privacy & Security
  - All processing done securely
  - No data sold to third parties
  - Full control over your data
  
  Perfect for photographers, real estate professionals, travelers, and anyone 
  who needs to manage photo locations efficiently.
  ```

- **App icon**: Upload `./assets/icon.png`
- **Feature graphic**: Upload `./assets/feature-graphic.png`
- **Screenshots**: Upload at least 2 phone screenshots

#### App Category
- **Category**: Tools or Photography
- **Tags**: location, GPS, EXIF, photo, metadata

#### Contact Details
- **Email**: support@ssabiroad.com
- **Website**: https://ssabiroad.com
- **Privacy policy**: https://ssabiroad.com/privacy

### Step 5: Content Rating

1. Go to "Content rating" section
2. Fill out questionnaire
3. Categories likely: ESRB: Everyone, PEGI: 3

### Step 6: App Content

#### Privacy Policy
- URL: https://ssabiroad.com/privacy (or create one)

#### Data Safety
Declare what data you collect:
- ✅ Location (approximate and precise)
- ✅ Photos and videos
- ✅ Device or other IDs
- Data usage: App functionality, Analytics
- Data sharing: No data shared with third parties

#### Permissions Declaration
- Camera: "To scan and analyze photos"
- Location: "To provide accurate location data"
- Storage: "To access and process photos"

### Step 7: Upload AAB

1. Go to "Production" → "Create new release"
2. Upload the .aab file downloaded from EAS
3. Add release notes:
   ```
   Initial release of Pic2Nav
   
   Features:
   - Photo location scanner
   - EXIF metadata editor
   - GPS geotagging tool
   - Location history
   - Professional photo tools
   ```

### Step 8: Review and Publish

1. Complete all required sections (marked with red exclamation)
2. Click "Review release"
3. Submit for review

Review typically takes 1-7 days.

## Alternative: Automated Submission with EAS

### Setup Service Account (Recommended)

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google Play Android Developer API
4. Create service account:
   - Go to IAM & Admin → Service Accounts
   - Create service account
   - Download JSON key
   - Save as `google-service-account.json` in mobile-app folder

5. Grant access in Play Console:
   - Settings → API access
   - Link Google Cloud project
   - Grant access to service account
   - Permissions: Release manager

### Submit via EAS

```bash
eas submit --platform android --profile production
```

This automatically uploads to Play Store internal testing track.

## Testing Before Production

### Internal Testing
```bash
# Build and submit to internal track
eas build --platform android --profile production
eas submit --platform android --profile production
```

Add testers in Play Console → Internal testing → Testers

### Closed Testing (Beta)
- Promote from internal testing
- Add up to 100 testers
- Get feedback before public release

### Open Testing
- Public beta available to anyone
- Collect reviews and ratings

## Post-Submission Checklist

- [ ] App built successfully
- [ ] AAB uploaded to Play Console
- [ ] Store listing completed
- [ ] Screenshots uploaded (minimum 2)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Data safety form filled
- [ ] Release notes added
- [ ] App submitted for review

## Common Issues

### Build Failures
- Check expo-doctor: `npx expo-doctor`
- Verify all dependencies installed
- Clear cache: `eas build --clear-cache`

### Rejection Reasons
- Missing privacy policy
- Incomplete data safety section
- Low-quality screenshots
- Misleading app description
- Permissions not justified

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Configure project
eas build:configure

# Update credentials
eas credentials

# Check project status
eas project:info
```

## Resources

- Play Console: https://play.google.com/console
- EAS Documentation: https://docs.expo.dev/submit/android/
- Play Store Guidelines: https://play.google.com/about/developer-content-policy/
- Asset Guidelines: https://developer.android.com/distribute/marketing-tools/device-art-generator
