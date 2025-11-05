# Pic2Nav - Android Play Store Publishing Guide

## Prerequisites

1. **Google Play Console Account** ($25 one-time fee)
2. **EAS CLI installed**: `npm install -g eas-cli`
3. **Expo account** (already configured with projectId)
4. **Google Service Account** for automated submissions (optional)

## Step 1: Build the AAB

```bash
cd mobile-app
eas build --platform android --profile production
```

This will:
- Auto-increment versionCode
- Build an Android App Bundle (.aab)
- Upload to EAS servers
- Provide download link when complete

## Step 2: Download the AAB

After build completes, download the `.aab` file from the provided link or:
```bash
eas build:list
```

## Step 3: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in details:
   - **App name**: Pic2Nav
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Accept all required declarations

## Step 4: Set Up Store Listing

### App Details
- **App name**: Pic2Nav
- **Short description** (80 chars max):
  ```
  Smart location recognition from photos using AI-powered image analysis
  ```
- **Full description** (4000 chars max):
  ```
  Pic2Nav is your intelligent location companion that transforms photos into detailed location insights.

  🎯 KEY FEATURES

  📸 Photo Scanner
  • Identify locations from any photo
  • Extract GPS coordinates from EXIF data
  • AI-powered landmark recognition
  • Building and architecture analysis

  🗺️ Location Intelligence
  • Discover nearby points of interest
  • Get detailed location information
  • View walkability and safety scores
  • Access environmental metrics

  🔍 AI Search
  • Ask questions about any location
  • Get instant intelligent answers
  • Natural language processing
  • Context-aware responses

  📊 Professional Tools
  • Batch process multiple photos
  • Edit EXIF metadata
  • Add GPS coordinates to photos
  • Export and share locations

  📁 Organization
  • Create custom collections
  • Tag and categorize locations
  • Compare multiple locations
  • Track your journey timeline

  🔔 Smart Geofencing
  • Set location-based alerts
  • Get notified when entering/leaving areas
  • Background location monitoring
  • Privacy-focused tracking

  📖 Location Stories
  • View your 24-hour location history
  • Private-only stories
  • Beautiful visual timeline
  • Auto-expiring content

  Perfect for travelers, photographers, real estate professionals, urban explorers, and anyone curious about the world around them.

  Download Pic2Nav today and unlock the stories behind every location!
  ```

### Graphics Assets Required

**App icon**: Already set (512x512 PNG)

**Feature graphic**: 1024x500 PNG
**Phone screenshots**: At least 2, up to 8 (16:9 or 9:16 ratio)
**7-inch tablet screenshots**: At least 2 (optional but recommended)
**10-inch tablet screenshots**: At least 2 (optional but recommended)

### Categorization
- **App category**: Travel & Local
- **Tags**: location, GPS, photos, AI, travel, navigation

### Contact Details
- **Email**: support@pic2nav.com
- **Website**: https://pic2nav.com
- **Privacy policy**: https://pic2nav.com/privacy

## Step 5: Content Rating

1. Click "Start questionnaire"
2. Select category: **Utility, Productivity, Communication, or Other**
3. Answer questions honestly:
   - Does app contain violence? No
   - Does app contain sexual content? No
   - Does app contain profanity? No
   - Does app contain controlled substances? No
   - Does app contain gambling? No
   - Does app share location? Yes (for core functionality)

## Step 6: App Access

- Select: **All functionality is available without special access**
- Or provide test credentials if login required

## Step 7: Ads Declaration

- **Does your app contain ads?** No

## Step 8: Target Audience and Content

1. **Target age groups**: 13+ (or appropriate age)
2. **Store presence**: Available in all countries
3. **Content guidelines**: Confirm app meets all guidelines

## Step 9: Data Safety

Declare what data you collect:

**Location**
- ✅ Approximate location - Required for core functionality
- ✅ Precise location - Required for core functionality
- Purpose: App functionality, Analytics
- Data shared: No
- Data collected: Yes
- Ephemeral: No
- Required: Yes

**Photos and videos**
- ✅ Photos - Required for location recognition
- Purpose: App functionality
- Data shared: No
- Data collected: Yes (temporarily)
- Ephemeral: Yes
- Required: Yes

**Device or other IDs**
- ✅ Device ID - For geofence notifications
- Purpose: App functionality
- Data shared: No
- Data collected: Yes
- Ephemeral: No
- Required: No

## Step 10: Create Release

1. Go to **Production** → **Create new release**
2. Upload the `.aab` file
3. **Release name**: 1.0.0 (or current version)
4. **Release notes**:
   ```
   Initial release of Pic2Nav!

   Features:
   • Photo-based location recognition
   • AI-powered search
   • Nearby places discovery
   • Smart geofencing
   • Location collections
   • Batch photo processing
   • EXIF metadata editing
   • Journey timeline
   • Location stories (24h)
   ```

## Step 11: Review and Rollout

1. Review all sections (must have green checkmarks)
2. Click **Review release**
3. Click **Start rollout to Production**

## Step 12: Wait for Review

- **Review time**: 1-7 days (usually 1-3 days)
- **Status**: Check in Play Console dashboard
- **Notifications**: You'll receive email updates

## Automated Submission (Optional)

If you have a Google Service Account JSON:

```bash
eas submit --platform android --profile production
```

This will automatically upload to Play Console internal testing track.

## Post-Launch

### Monitor
- Check crash reports in Play Console
- Monitor user reviews and ratings
- Track installation metrics

### Update Process
1. Increment version in `app.json`
2. Build new AAB: `eas build --platform android --profile production`
3. Upload to Play Console
4. Add release notes
5. Roll out update

## Troubleshooting

### Build Fails
- Check `eas.json` configuration
- Verify all dependencies are compatible
- Check Expo SDK version compatibility

### Upload Rejected
- Ensure versionCode is higher than previous
- Check package name matches: `com.ssabiroad.pic2nav`
- Verify signing configuration

### Review Rejection
- Address specific feedback from Google
- Update store listing or app functionality
- Resubmit with changes

## Important Notes

- **First release**: Takes longest (up to 7 days)
- **Updates**: Usually faster (1-3 days)
- **Staged rollout**: Consider rolling out to 20% → 50% → 100%
- **Beta testing**: Use internal/closed testing tracks first
- **Compliance**: Ensure GDPR, COPPA compliance if applicable

## Support

- **EAS Build docs**: https://docs.expo.dev/build/introduction/
- **Play Console help**: https://support.google.com/googleplay/android-developer
- **Expo forums**: https://forums.expo.dev/
