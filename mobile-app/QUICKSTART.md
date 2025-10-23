# Pic2Nav Mobile - Quick Start

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Start the App
```bash
npm start
```

### 3. Open on Your Device
- Install **Expo Go** from App Store or Play Store
- Scan the QR code displayed in terminal

## 📱 Features Overview

### Scanner Tab
- **Take Photo**: Capture with camera
- **Upload Photo**: Select from gallery
- Automatic location detection
- GPS data extraction

### Tools Tab
- **EXIF Editor**: Edit photo metadata in bulk
- **GPS Geotagging**: Add location data to photos

### History Tab
- View past scanned locations
- Access saved results

### Settings Tab
- Configure app preferences
- Manage account

## 🔧 Configuration

Update API endpoint in `services/api.ts`:
```typescript
const API_URL = 'http://YOUR_IP:3000/api';
```

Replace `YOUR_IP` with your computer's local IP address (not localhost).

## 📝 Notes

- Ensure backend server is running
- Grant camera and location permissions
- Use same network for device and backend

## 🆘 Need Help?

Check `SETUP.md` for detailed instructions.
