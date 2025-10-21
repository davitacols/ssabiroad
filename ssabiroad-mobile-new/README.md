# Pic2Nav - Photo Location Analysis & Professional Tools

A React Native mobile application for photo location analysis and professional EXIF/GPS editing tools.

## Features

### 📸 Photo Scanner
- **Camera Integration**: Take photos directly in the app
- **Photo Upload**: Select existing photos from your gallery
- **Location Identification**: AI-powered location detection from images
- **GPS Analysis**: Extract and analyze GPS data from photo metadata

### 🛠️ Professional Tools
- **Bulk EXIF Editor**: Edit metadata for multiple photos
- **GPS Geotagging**: Add or modify GPS coordinates
- **Multi-photo Processing**: Handle large batches of images
- **Metadata Optimization**: Clean and optimize photo metadata
- **Processing History**: Track all editing operations

### 📍 Location Management
- **Save Locations**: Bookmark discovered locations
- **Share Results**: Export location data and analysis
- **Organize Collections**: Create custom location collections
- **Cross-platform Sync**: Sync with SSABIRoad web platform

## Technology Stack

- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **React Navigation** for smooth navigation
- **Expo Camera** for camera functionality
- **Expo Image Picker** for photo selection
- **Expo Media Library** for photo access

## Getting Started

### Prerequisites
- Node.js 20.17.0 or later
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. Navigate to the app directory:
   ```bash
   cd ssabiroad-mobile-new
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
   - Scan QR code with Expo Go app
   - Press 'i' for iOS Simulator
   - Press 'a' for Android Emulator
   - Press 'w' for web browser

## App Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx      # Dashboard and quick actions
│   ├── CameraScreen.tsx    # Photo capture and upload
│   ├── MapScreen.tsx       # Location visualization
│   └── ProfileScreen.tsx   # User profile and settings
```

## Key Features in Detail

### Photo Scanner
- Point camera at any location for instant analysis
- Upload existing photos from your gallery
- Get detailed location information including:
  - Identified location name and address
  - GPS coordinates and accuracy
  - Photo metadata analysis
  - Nearby location suggestions

### Professional Tools
- **EXIF Editor**: Modify camera settings, timestamps, and technical data
- **GPS Geotagging**: Add precise location data to photos
- **Batch Processing**: Handle multiple photos simultaneously
- **Metadata Management**: Clean, optimize, and standardize photo data

### Location Intelligence
- **Smart Detection**: AI-powered location identification
- **Confidence Scoring**: Accuracy ratings for all identifications
- **Nearby Suggestions**: Discover related locations and points of interest
- **Save & Share**: Bookmark locations and share discoveries

## Permissions

The app requires the following permissions:

### iOS
- **Camera**: For taking photos and analyzing locations
- **Photo Library**: For accessing and analyzing existing photos

### Android
- **Camera**: For photo capture functionality
- **Storage**: For reading and writing photo files

## Development

### Adding New Features

1. Create new screens in `src/screens/`
2. Update navigation in `App.tsx`
3. Add new functionality to existing screens
4. Update TypeScript types as needed

### Testing

Test the app on multiple devices and platforms:
- iPhone (various sizes and iOS versions)
- Android phones and tablets
- Different camera capabilities
- Various photo formats and metadata

## Integration with SSABIRoad

Pic2Nav integrates seamlessly with the SSABIRoad web platform:
- Shared user accounts and authentication
- Synchronized location data
- Cross-platform photo analysis
- Consistent branding and user experience

## Professional Use Cases

### Real Estate
- Geotagging property photos
- Location verification for listings
- Batch processing of property images

### Photography
- Adding GPS data to photos taken without location services
- Organizing photos by location
- Metadata management for professional workflows

### Travel & Tourism
- Identifying locations from travel photos
- Creating location-based photo collections
- Sharing discovered locations with others

### Research & Documentation
- Geotagging field research photos
- Location verification for documentation
- Batch processing of survey images

## Support

For issues and feature requests, please refer to the main SSABIRoad repository or contact support through the app's Help & Support section.

## License

This project is proprietary software. All rights reserved.