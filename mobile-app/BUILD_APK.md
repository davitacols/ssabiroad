# Build APK Guide

## Quick Build (Recommended)

Run the automated script:
```bash
cd mobile-app
build-apk.bat
```

## Manual Build Steps

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Build APK
```bash
eas build --platform android --profile preview
```

### 4. Build AAB (for Play Store)
```bash
eas build --platform android --profile production
```

## Build Profiles

- **preview**: Builds APK for testing (faster, can install directly)
- **production**: Builds AAB for Google Play Store submission

## Download APK

After build completes:
1. Check the build URL in terminal
2. Download APK from Expo dashboard
3. Install on Android device

## Local Build (Alternative)

If you want to build locally without EAS:
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`
