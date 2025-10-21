# SSABIRoad Mobile App Setup Guide

## Quick Start

1. **Install Expo CLI globally:**
   ```bash
   npm install -g @expo/cli
   ```

2. **Navigate to mobile app directory:**
   ```bash
   cd mobile-app
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press 'i' for iOS Simulator
   - Press 'a' for Android Emulator
   - Press 'w' for web browser

## Development Setup

### Prerequisites
- Node.js 16+
- Expo CLI
- iOS Simulator (macOS) or Android Studio (for emulators)
- Physical device with Expo Go app (recommended for testing)

### Environment Configuration

The app connects to the SSABIRoad backend API. Ensure the backend is running at:
- Production: `https://ssabiroad.vercel.app`
- Development: Update `API_BASE_URL` in services if using local backend

### Building for Production

#### iOS
```bash
expo build:ios
```

#### Android
```bash
expo build:android
```

### Testing

Test on multiple devices and screen sizes:
- iPhone (various sizes)
- Android phones and tablets
- Different OS versions

### Key Features to Test

1. **Camera functionality**
   - Building detection and analysis
   - Photo capture and processing
   - Permission handling

2. **Location services**
   - GPS accuracy
   - Location-based features
   - Permission handling

3. **API integration**
   - Network connectivity
   - Error handling
   - Offline behavior

4. **Navigation**
   - Tab navigation
   - Screen transitions
   - Back button behavior

### Troubleshooting

#### Common Issues

1. **Metro bundler issues:**
   ```bash
   expo start --clear
   ```

2. **iOS Simulator not opening:**
   - Ensure Xcode is installed
   - Check iOS Simulator path in Expo settings

3. **Android emulator issues:**
   - Ensure Android Studio is installed
   - Check ADB path configuration

4. **Camera not working:**
   - Check device permissions
   - Test on physical device (camera doesn't work in simulators)

#### Performance Optimization

1. **Image optimization:**
   - Compress images before upload
   - Use appropriate image formats
   - Implement image caching

2. **API calls:**
   - Implement request caching
   - Add loading states
   - Handle network errors gracefully

3. **Memory management:**
   - Clean up listeners on unmount
   - Optimize image rendering
   - Monitor memory usage

### Deployment Checklist

- [ ] Test on multiple devices
- [ ] Verify all permissions work
- [ ] Test offline functionality
- [ ] Check app icons and splash screens
- [ ] Verify API endpoints
- [ ] Test camera and location features
- [ ] Review app store guidelines
- [ ] Prepare app store assets

### Next Steps

1. **Enhanced Features:**
   - Offline mode with local storage
   - Push notifications
   - Social sharing
   - Advanced filters and search

2. **Performance:**
   - Image compression
   - Caching strategies
   - Background processing

3. **User Experience:**
   - Onboarding flow
   - Tutorial screens
   - Accessibility improvements