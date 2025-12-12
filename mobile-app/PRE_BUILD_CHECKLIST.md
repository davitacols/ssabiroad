# Pre-Build Checklist - Issues Found

## ⚠️ Issues That Need Attention

### 1. Missing google-services.json (Optional but Recommended)
**Status:** Not critical for basic build, but needed for Firebase features

**Current:** Referenced in app.json but file doesn't exist
```json
"googleServicesFile": "./google-services.json"
```

**Options:**
- **Option A:** Remove reference if not using Firebase
- **Option B:** Add google-services.json if using Firebase notifications

**Fix Option A (Recommended for now):**
Remove this line from app.json:
```json
"googleServicesFile": "./google-services.json"
```

---

### 2. Package.json Version Mismatch
**Status:** Minor inconsistency

**Issue:** 
- app.json version: 1.0.1
- package.json version: 1.0.0

**Fix:** Update package.json version to match

---

## ✅ What's Already Good

- [x] Version code incremented (2)
- [x] Target SDK 35 (latest)
- [x] All permissions declared
- [x] Detailed permission descriptions
- [x] expo-build-properties configured
- [x] EAS configuration correct
- [x] Deprecated notification API fixed

---

## 🔧 Quick Fixes Needed

### Fix 1: Remove google-services.json reference
Since you're not using Firebase push notifications (using Expo notifications instead), remove the reference.

### Fix 2: Sync package.json version
Update to match app.json version.

---

## 📋 After Fixes - Build Command

```bash
cd mobile-app
npm install
eas build --platform android --profile production
```

---

## 🎯 Google Play Console - Still Required

After building, you MUST declare in Play Console:
1. **Photos** (READ_MEDIA_IMAGES) - See DECLARE_MEDIA_PERMISSIONS.md
2. **Videos** (READ_MEDIA_VIDEO) - See DECLARE_MEDIA_PERMISSIONS.md
3. **Foreground Service** - See GOOGLE_PLAY_DATA_SAFETY.md

---

## Summary

**Critical:** None - app will build
**Recommended:** Remove google-services.json reference
**Minor:** Sync package.json version
**Required:** Declare media permissions in Play Console
