# Pic2Nav Mobile App

A React Native mobile application for smart location analysis using AI-powered image recognition.

## Features

- **Camera Integration**: Take photos or select from gallery
- **Location Analysis**: AI-powered location recognition using the Pic2Nav API
- **History Tracking**: View previous analysis results
- **User Profile**: App information and statistics

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device/simulator:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

## API Integration

The app connects to the deployed Pic2Nav API at `https://pic2nav.com/api/location-recognition-v2` for image analysis.

## Screens

- **Home**: Overview and quick actions
- **Camera**: Photo capture and analysis
- **History**: Previous analysis results
- **Profile**: User information and app details

## Permissions

The app requires:
- Camera access for photo capture
- Photo library access for image selection
- Location access for enhanced analysis (optional)