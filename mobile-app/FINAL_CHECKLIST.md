# Final Google Play Submission Checklist

## 🚨 CRITICAL: Must Complete Before Submission

### 1. Declare Media Permissions in Play Console ⚠️
**Location:** Policy → App content → Data safety

You MUST declare these permissions that Google detected:

#### Photos (READ_MEDIA_IMAGES)
- [x] Collected: YES
- [x] Ephemeral: YES
- [x] Required: YES
- [x] Purpose: App functionality
- [x] Context: "Extract GPS from EXIF metadata and analyze building features"

#### Videos (READ_MEDIA_VIDEO)
- [x] Collected: YES
- [x] Ephemeral: YES
- [x] Required: NO (Optional)
- [x] Purpose: App functionality
- [x] Context: "Permission exists in SDK but not actively used"

**See:** `DECLARE_MEDIA_PERMISSIONS.md` for exact text to copy

---

### 2. Declare Foreground Service
**Location:** Policy → App content → Foreground service

- [x] Service Type: Location
- [x] Declaration text ready in `GOOGLE_PLAY_DATA_SAFETY.md`

---

### 3. Build Production APK
```bash
cd mobile-app
npm install
eas build --platform android --profile production
```

**Note:** Expo notifications warning is development-only (see `EXPO_NOTIFICATIONS_NOTE.md`)

---

## ✅ Quick Checklist

- [ ] Declared Photos in Data Safety
- [ ] Declared Videos in Data Safety
- [ ] Declared Foreground Service
- [ ] Built production AAB
- [ ] Uploaded to Play Console
- [ ] Submitted for review

---

## 📋 All Requirements Met

✅ Privacy policy comprehensive  
✅ Permission descriptions detailed  
✅ Foreground service documented  
✅ Version incremented (1.0.1)  
✅ Media permissions documented  

**Ready to submit after declaring media permissions in Play Console!**
