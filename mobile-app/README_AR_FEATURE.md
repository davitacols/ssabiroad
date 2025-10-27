# AR Building Explorer Feature

## Overview
The AR Building Explorer is an advanced augmented reality feature that overlays real-time building information when users point their camera at structures.

## Features Implemented

### 1. Real-Time AR Overlay
- **Building Recognition**: Automatically detects and identifies buildings in camera view
- **Information Display**: Shows architectural style, year built, materials, and more
- **Distance Tracking**: Real-time distance calculation to buildings
- **Compass Integration**: Heading-based positioning for accurate AR placement

### 2. Multiple AR Modes
- **Overlay Mode**: View building information overlaid on camera feed
- **Measure Mode**: Measure building dimensions using AR
- **Compare Mode**: Side-by-side comparison of multiple buildings

### 3. Building Analysis
- Architectural style detection
- Material identification
- Year built estimation
- Floor count estimation
- Energy rating assessment
- Structural condition evaluation
- Historical significance

### 4. Professional Tools
- **AR Measurements**: Measure building height, width, and distances
- **Report Generation**: Create detailed building analysis reports
- **Photo Capture**: Save AR views with overlays
- **Community Notes**: Add and view notes from other users

### 5. Interactive Features
- Tap buildings to view detailed information
- Save buildings to collections
- Navigate to building locations
- Share AR experiences

## Technical Implementation

### Mobile App Components

#### Main Screen
- `app/ar-building-explorer.tsx` - Main AR screen with camera and overlays

#### Components
- `components/BuildingInfoOverlay.tsx` - Building information overlay component
- `components/ARMeasurementTool.tsx` - AR measurement tool

#### Services
- `services/arBuildingService.ts` - API integration and calculations

### Backend API Endpoints

#### Building Analysis
- `POST /api/ar-building-analysis` - Analyze building from image
  - Uses Google Vision API for landmark and label detection
  - Extracts architectural features and materials
  - Estimates building characteristics

#### Nearby Buildings
- `GET /api/nearby-buildings` - Fetch buildings within radius
  - Parameters: latitude, longitude, radius
  - Returns buildings with distance calculations

#### Building Comparison
- `POST /api/building-comparison` - Compare multiple buildings
  - Analyzes similarities and differences
  - Calculates average distances

#### AR Measurements
- `POST /api/ar-measurements` - Save AR measurements
- `GET /api/ar-measurements` - Retrieve measurements for a building

## Usage

### Starting AR Mode
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/ar-building-explorer');
```

### Analyzing a Building
```typescript
import arBuildingService from '@/services/arBuildingService';

const analysis = await arBuildingService.analyzeBuilding(
  imageUri,
  location
);
```

### Getting Nearby Buildings
```typescript
const buildings = await arBuildingService.getNearbyBuildings(
  latitude,
  longitude,
  5 // radius in km
);
```

### Measuring Buildings
```typescript
await arBuildingService.saveMeasurement({
  buildingId: 'building_123',
  type: 'height',
  value: 45.5,
  unit: 'meters'
});
```

## Permissions Required

- **Camera**: Required for AR view
- **Location**: Required for positioning and nearby building detection
- **Storage**: Optional for saving AR captures

## Dependencies

### Mobile App
- `expo-camera` - Camera access
- `expo-location` - GPS and heading tracking
- `react-native-view-shot` - AR view capture
- `@react-native-async-storage/async-storage` - Local storage

### Backend
- `@google-cloud/vision` - Building analysis
- `prisma` - Database access

## Future Enhancements

1. **3D Building Models**: Render 3D models of buildings in AR
2. **Historical Timeline**: Show building evolution over time
3. **Indoor AR**: Navigate inside buildings with AR
4. **Social Features**: Real-time collaboration and shared AR experiences
5. **AI Predictions**: Predict building maintenance needs
6. **Property Analytics**: Real estate market data integration
7. **Accessibility**: Voice-guided AR navigation
8. **Offline Mode**: Cached building data for offline use

## Performance Optimization

- Efficient AR marker rendering
- Throttled location updates
- Lazy loading of building data
- Image compression for analysis
- Cached API responses

## Testing

### Test AR Building Explorer
1. Open mobile app
2. Navigate to AR Building Explorer
3. Grant camera and location permissions
4. Point camera at buildings
5. Tap markers to view details
6. Switch between AR modes
7. Test measurement tool
8. Capture and save AR views

### API Testing
```bash
# Test building analysis
curl -X POST https://ssabiroad.vercel.app/api/ar-building-analysis \
  -F "image=@building.jpg" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"

# Test nearby buildings
curl "https://ssabiroad.vercel.app/api/nearby-buildings?latitude=40.7128&longitude=-74.0060&radius=5"
```

## Troubleshooting

### Camera Not Working
- Check camera permissions in device settings
- Ensure app has camera access granted
- Restart app if camera view is black

### Buildings Not Appearing
- Verify location permissions are granted
- Check GPS signal strength
- Ensure buildings exist in database within radius

### AR Markers Misaligned
- Calibrate device compass
- Move to area with better GPS signal
- Reset AR view by closing and reopening

## Support

For issues or questions:
- Check mobile app logs
- Review API error responses
- Contact development team
