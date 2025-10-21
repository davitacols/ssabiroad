# SSABIRoad Mobile App

A React Native mobile application for smart building analysis and location intelligence.

## Features

- **Building Analysis**: Use your camera to analyze buildings and get detailed information about architectural style, materials, and condition
- **Location Intelligence**: Get comprehensive location data including walkability scores, environmental metrics, and safety assessments
- **Smart Detection**: AI-powered building recognition and landmark detection
- **Personal Dashboard**: Track your analysis history, saved locations, and statistics
- **Interactive Maps**: Visualize analyzed buildings and saved locations on an interactive map

## Technology Stack

- React Native with Expo
- TypeScript
- React Navigation
- Expo Camera & Location
- React Native Maps
- Axios for API communication

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your preferred platform:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

### Configuration

The app connects to the SSABIRoad backend API. Make sure the backend is running and accessible.

## App Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Main app screens
├── services/           # API and business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Screens
- **HomeScreen**: Dashboard with quick actions and recent activity
- **CameraScreen**: Camera interface for building analysis
- **MapScreen**: Interactive map showing analyzed locations
- **ProfileScreen**: User profile and statistics

### Services
- **LocationService**: Handles location-related API calls
- **VisionService**: Manages image analysis functionality
- **AuthService**: User authentication and session management

## Features in Detail

### Building Analysis
- Point your camera at any building
- Get instant analysis of architectural style, materials, and condition
- View detailed environmental and cultural significance data
- Save interesting buildings to your collection

### Location Intelligence
- Automatic location detection using GPS
- Walkability and bike scores
- Environmental metrics (air quality, noise levels)
- Safety assessments and urban density analysis

### Personal Dashboard
- Track your analysis history
- View statistics on buildings analyzed
- Manage saved locations and bookmarks
- Monitor your accuracy scores

## API Integration

The mobile app integrates with the SSABIRoad web application's API endpoints:

- `/api/location-recognition-v2` - Building analysis
- `/api/save-detection` - Save analysis results
- `/api/recent-locations` - Get user's recent activity
- `/api/saved-locations` - Manage saved locations
- `/api/usage-stats` - User statistics

## Permissions

The app requires the following permissions:
- **Camera**: For building analysis
- **Location**: For GPS-based location services
- **Storage**: For saving images and data

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add new screens to `src/screens/`
3. Update navigation in `App.tsx`
4. Add API calls to appropriate service files
5. Update TypeScript types in `src/types/`

### Testing

Run the app on different devices and screen sizes to ensure compatibility.

## Deployment

### iOS
1. Build the app: `expo build:ios`
2. Submit to App Store Connect

### Android
1. Build the app: `expo build:android`
2. Upload to Google Play Console

## Support

For issues and feature requests, please refer to the main SSABIRoad repository.