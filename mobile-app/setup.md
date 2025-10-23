# Pic2Nav Mobile App Setup Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: macOS with Xcode
- For Android: Android Studio

## Installation Steps

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Backend API

Edit `services/api.ts` and update the API_URL:

```typescript
const API_URL = 'https://your-backend-url.com/api';
// For local development: 'http://localhost:3000/api'
// For production: 'https://ssabiroad.com/api'
```

### 3. Add Assets

Place the following files in the `assets` folder:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon

### 4. Start Development Server

```bash
npm start
```

This will open Expo Dev Tools in your browser.

### 5. Run on Device

#### iOS Simulator
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

#### Physical Device
1. Install Expo Go app from App Store or Play Store
2. Scan the QR code from Expo Dev Tools

## Features

### Photo Scanner
- Take photos with camera
- Upload from gallery
- Automatic location detection
- GPS data extraction from EXIF
- Visual location analysis

### Professional Tools

#### EXIF Editor (`app/tools/exif-editor.tsx`)
- Bulk edit photo metadata
- Update camera information
- Add copyright data
- Batch processing

#### GPS Geotagging (`app/tools/gps-tagger.tsx`)
- Add GPS coordinates to photos
- Capture current location
- Apply to multiple photos
- Preserve original files

### History
- View past scanned locations
- Access saved results
- Quick re-analysis

## Project Structure

```
mobile-app/
├── app/
│   ├── (tabs)/          # Main tab screens
│   │   ├── index.tsx    # Scanner screen
│   │   ├── history.tsx  # History screen
│   │   └── settings.tsx # Settings screen
│   ├── tools/           # Professional tools
│   │   ├── exif-editor.tsx
│   │   └── gps-tagger.tsx
│   └── _layout.tsx      # Root layout
├── services/
│   └── api.ts           # API integration
├── assets/              # Images and icons
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## API Integration

The app connects to the SSABIRoad backend API:

- `POST /api/location-recognition` - Analyze location from image
- `GET /api/detections` - Get detection history
- `POST /api/save-location` - Save location data

## Permissions

The app requires:
- Camera access
- Photo library access
- Location services
- Storage (Android)

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Troubleshooting

### Camera not working
- Check permissions in device settings
- Restart the app
- Clear Expo cache: `expo start -c`

### Location not detected
- Enable location services
- Grant location permission
- Check GPS signal

### API connection issues
- Verify API_URL is correct
- Check network connection
- Ensure backend is running

## Environment Variables

Create `.env` file:
```
API_URL=https://your-api-url.com
```

## Support

For issues or questions, contact the development team or open an issue in the repository.
