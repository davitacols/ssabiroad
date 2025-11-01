# Pre-Submission Checklist for Google Play Store

## 🔴 CRITICAL - Must Complete Before Submission

### Legal & Compliance
- [ ] **Privacy Policy hosted online** at https://ssabiroad.com/privacy
- [ ] **Terms of Service hosted online** at https://ssabiroad.com/terms
- [ ] **Privacy Policy URL added to app.json** ✅ DONE
- [ ] **Content rating questionnaire completed** in Play Console
- [ ] **Data safety form filled out** in Play Console

### Permissions (CRITICAL - Google will reject without this)
- [ ] **Camera permission requested** before camera access
- [ ] **Location permission requested** before location access
- [ ] **Media library permission requested** before photo access
- [ ] **Notification permission requested** (Android 13+)
- [ ] **All permissions have clear explanations** in dialogs
- [ ] **"Open Settings" option** provided when permission denied
- [ ] **Tested on Android 13+** (new permission model)

### App Configuration
- [ ] **App icon displays correctly** on home screen (test on device)
- [ ] **Adaptive icon configured** properly
- [ ] **Splash screen works** ✅ DONE (per Barack)
- [ ] **Package name correct**: com.ssabiroad.pic2nav ✅ DONE
- [ ] **Version code incremented**: Currently 2 ✅ DONE

### Features & Functionality
- [ ] **AI Search 404 error fixed** (currently broken)
- [ ] **Bottom navigation persists** on all screens
- [ ] **All features tested** on physical device
- [ ] **Geofencing notifications** working and not spamming
- [ ] **Compare Location feature** working or documented
- [ ] **Batch Process feature** working or documented
- [ ] **Collections feature** working or documented

## 🟡 IMPORTANT - Should Complete

### Play Store Assets
- [ ] **Feature graphic created** (1024 x 500 px)
- [ ] **Screenshots taken** (minimum 2, recommended 4-8)
  - [ ] Scan Location screen
  - [ ] Location results with intel
  - [ ] Nearby places map
  - [ ] Professional tools (EXIF editor)
- [ ] **App icon** (1024 x 1024) ✅ DONE
- [ ] **Short description written** (80 chars max)
- [ ] **Full description written** (up to 4000 chars)

### Store Listing Content
- [ ] **App name**: Pic2Nav ✅ DONE
- [ ] **Category selected**: Tools or Photography
- [ ] **Contact email**: support@ssabiroad.com
- [ ] **Website URL**: https://ssabiroad.com
- [ ] **Release notes written** for version 1.0.0

### Testing
- [ ] **Tested on Android 13+** device
- [ ] **Tested on Android 11-12** device
- [ ] **Tested with GPS enabled**
- [ ] **Tested with GPS disabled**
- [ ] **Tested with no internet**
- [ ] **Tested all permission flows**
- [ ] **Tested permission denial scenarios**
- [ ] **No crashes or ANRs** (Application Not Responding)

## 🟢 NICE TO HAVE - Optional Improvements

### User Experience
- [ ] **Onboarding tutorial** for first-time users
- [ ] **Feature tooltips** for complex features
- [ ] **Help/FAQ section** in app
- [ ] **"Report Incorrect Location"** feature
- [ ] **Confidence score explanation** for users
- [ ] **Notification settings** page (frequency, types)

### Documentation
- [ ] **README updated** with latest features
- [ ] **FEATURES.md updated**
- [ ] **Screenshots in README**
- [ ] **Demo video created** (optional but helpful)

## 📋 Play Console Setup Steps

### 1. App Information
- [ ] App name: Pic2Nav
- [ ] Default language: English (United States)
- [ ] App or game: App
- [ ] Free or paid: Free

### 2. Store Listing
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App icon uploaded
- [ ] Feature graphic uploaded
- [ ] Screenshots uploaded (2-8)
- [ ] Category: Tools
- [ ] Tags: location, GPS, EXIF, photo, metadata

### 3. Content Rating
- [ ] Questionnaire completed
- [ ] Expected: ESRB Everyone, PEGI 3

### 4. App Content
- [ ] Privacy policy URL: https://ssabiroad.com/privacy
- [ ] Ads: No (unless you have ads)
- [ ] In-app purchases: No (unless you have IAP)
- [ ] Target audience: 18+

### 5. Data Safety
Declare what data you collect:
- [ ] Location data (precise and approximate)
  - Purpose: App functionality
  - Shared: No
- [ ] Photos and videos
  - Purpose: App functionality
  - Shared: No
- [ ] Device or other IDs
  - Purpose: Analytics
  - Shared: No

### 6. App Access
- [ ] All features accessible without special access
- [ ] Or provide test account if needed

### 7. Production Release
- [ ] AAB file uploaded ✅ DONE
- [ ] Release name: Version 1.0.0
- [ ] Release notes written
- [ ] Countries: All countries (or select specific)
- [ ] Rollout: 100% or staged rollout

## 🚨 Common Rejection Reasons to Avoid

1. **Missing Privacy Policy** - Must be hosted online and accessible
2. **Permissions without explanation** - Must request at runtime with clear reason
3. **Misleading description** - Must accurately describe app functionality
4. **Low-quality screenshots** - Must be clear and show actual app
5. **Incomplete Data Safety** - Must declare all data collection
6. **Broken features** - All advertised features must work
7. **Crashes on startup** - Must be stable
8. **Missing content rating** - Must complete questionnaire

## 📱 Final Testing Checklist

Test on physical device:
- [ ] App installs successfully
- [ ] App icon appears on home screen
- [ ] Splash screen displays
- [ ] Permissions requested before feature access
- [ ] Camera scanning works
- [ ] Photo upload works
- [ ] Location detection works
- [ ] Nearby places loads
- [ ] AI Search works (currently 404)
- [ ] EXIF editor works
- [ ] GPS geotagging works
- [ ] Geofencing works
- [ ] Notifications work
- [ ] No crashes
- [ ] No ANRs (app freezing)
- [ ] Back button works correctly
- [ ] Bottom nav persists

## 🔧 Quick Fixes Needed (From Barack's Feedback)

### HIGH PRIORITY
1. **Add permission requests** - Use utils/permissions.ts
2. **Fix AI Search 404** - Debug endpoint
3. **Verify app icon** - Test on device

### MEDIUM PRIORITY
4. **Fix bottom nav** - Ensure persistence
5. **Add feature tutorials** - For complex features
6. **Limit geofence notifications** - Add throttling

### LOW PRIORITY
7. **Improve location accuracy** - ML model tuning
8. **Add manual correction** - For wrong locations

## 📞 Support Contacts

- **Technical Issues**: support@ssabiroad.com
- **Privacy Questions**: privacy@ssabiroad.com
- **Play Console**: https://play.google.com/console

## 🎯 Submission Timeline

1. **Fix critical issues**: 1-2 days
2. **Create Play Store assets**: 1 day
3. **Host privacy policy/terms**: 1 day
4. **Final testing**: 1 day
5. **Submit to Play Store**: 1 hour
6. **Google review**: 1-7 days

**Total estimated time**: 4-5 days + Google review time

---

## ✅ When Ready to Submit

```bash
# Build production AAB (already done)
eas build --platform android --profile production

# Option 1: Manual upload
# Download AAB and upload to Play Console

# Option 2: Automated (after service account setup)
eas submit --platform android --profile production
```

---

**Last Updated**: January 2025
**Current Status**: Build complete, critical fixes needed before submission
