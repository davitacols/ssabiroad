# Pic2Nav Mobile App

React Native mobile app for AI-powered location discovery from photos.

## Features

- 📸 **Camera Integration**: Take photos with built-in camera
- 🤖 **AI Analysis**: Connects to your SSABIRoad API for location recognition
- 📍 **GPS Integration**: Uses device location to enhance analysis
- 📱 **Native Performance**: Built with React Native and Expo
- 📚 **History**: View past location analyses
- 🎯 **Real-time Results**: Instant location identification

## Setup

1. **Install dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Install Expo CLI**:
   ```bash
   npm install -g @expo/cli
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Install Expo Go app on your phone
   - Scan QR code from terminal
   - Or run `npm run android` / `npm run ios`

## API Integration

The app connects to your deployed SSABIRoad API at `https://ssabiroad.vercel.app`

Key endpoints used:
- `POST /api/location-recognition-v2` - Photo analysis
- `POST /api/save-location` - Save results
- `GET /api/recent-locations` - History

## Permissions

The app requires:
- Camera access for photo capture
- Location access for GPS enhancement
- Storage access for photo processing

## Build for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Architecture

- **Navigation**: React Navigation stack
- **Camera**: Expo Camera with permissions
- **Location**: Expo Location services  
- **API**: Fetch-based service layer
- **State**: React hooks for local state