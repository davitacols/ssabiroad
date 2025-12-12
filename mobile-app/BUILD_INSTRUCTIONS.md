# Build AAB for Google Play Store

## Prerequisites
- EAS CLI installed
- Expo account
- All fixes applied

## Build Steps

### 1. Install EAS CLI (if not installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure EAS (if first time)
```bash
cd mobile-app
eas build:configure
```

### 4. Build Production AAB
```bash
cd mobile-app
eas build --platform android --profile production
```

### 5. Wait for Build
- Build takes 15-30 minutes
- You'll get a URL to track progress
- Download AAB when complete

### 6. Upload to Google Play Console
1. Go to Google Play Console
2. Navigate to: Production → Releases
3. Create new release
4. Upload the downloaded AAB file
5. Fill out release notes
6. **IMPORTANT:** Declare permissions in Data Safety form (see DECLARE_MEDIA_PERMISSIONS.md)
7. Submit for review

## Build Command Reference

```bash
# Production build (AAB for Play Store)
eas build --platform android --profile production

# Preview build (APK for testing)
eas build --platform android --profile preview

# Check build status
eas build:list
```

## Troubleshooting

### Build fails with "credentials error"
```bash
eas credentials
# Select Android → Production → Keystore → Generate new
```

### Build fails with "out of memory"
- This is normal, EAS will retry automatically

### Need to cancel build
```bash
eas build:cancel
```

## After Build Success

1. Download AAB from EAS dashboard
2. Test on device if needed
3. Upload to Google Play Console
4. Complete Data Safety form
5. Declare foreground service
6. Submit for review

## Version Management

Current version in app.json:
- Version: 1.0.1
- Version Code: 2

For next build, increment:
```json
"version": "1.0.2",
"versionCode": 3
```
