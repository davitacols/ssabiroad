# Declare Media Permissions in Google Play Console

## ⚠️ CRITICAL: Undeclared Permissions Error

Google Play detected these permissions in your app:
- `android.permission.READ_MEDIA_IMAGES`
- `android.permission.READ_MEDIA_VIDEO`

You MUST declare these in the Data Safety form.

---

## 📋 How to Declare in Play Console

### Go to: Policy → App content → Data safety → Manage

### 1. Photos and Videos Section

Click **"Does your app collect or share any of the required user data types?"** → YES

#### Select Data Types:

**Photos**
- ✅ Check this box
- Click on "Photos" to configure

**Configuration for Photos:**
```
Is this data collected, shared, or both?
→ Select: "Collected"

Is this data processed ephemerally?
→ Select: "Yes"

Is collection of this data required or optional?
→ Select: "Required for app functionality"

Why is this user data collected? (Select all that apply)
→ ✅ App functionality

Provide additional context (optional but recommended):
"Pic2Nav requires access to photos to extract GPS coordinates from EXIF metadata and analyze building features using AI for location identification. Photos are processed temporarily and not stored permanently on our servers. This is the core functionality of our app."
```

**Videos**
- ✅ Check this box (even though you don't actively use videos, the permission is present)
- Click on "Videos" to configure

**Configuration for Videos:**
```
Is this data collected, shared, or both?
→ Select: "Collected"

Is this data processed ephemerally?
→ Select: "Yes"

Is collection of this data required or optional?
→ Select: "Optional"

Why is this user data collected? (Select all that apply)
→ ✅ App functionality

Provide additional context:
"The READ_MEDIA_VIDEO permission is included by Android SDK dependencies but videos are not actively collected or processed by our app. If a user selects a video file, it would be processed ephemerally for metadata extraction only."
```

---

## 🔍 Why These Permissions Exist

### READ_MEDIA_IMAGES
- **Source:** expo-media-library, expo-image-picker
- **Purpose:** Access photos from device gallery
- **Usage:** Core functionality - extract GPS from photos

### READ_MEDIA_VIDEO
- **Source:** expo-media-library (includes video support by default)
- **Purpose:** Access videos from device gallery
- **Usage:** Not actively used, but permission exists in manifest

---

## ✅ Complete Data Safety Declaration

Here's what you need to declare:

### Data Types to Declare:

1. **Location** ✅ (Already done)
   - Precise location
   - Approximate location

2. **Photos** ✅ (MUST ADD)
   - Collected: YES
   - Ephemeral: YES
   - Required: YES
   - Purpose: App functionality

3. **Videos** ✅ (MUST ADD)
   - Collected: YES
   - Ephemeral: YES
   - Required: NO (Optional)
   - Purpose: App functionality

4. **Files and docs** ✅ (Already done)
   - EXIF metadata

---

## 📝 Exact Text to Use in Play Console

### For Photos:

**Why do you collect photos?**
```
Pic2Nav's core functionality is identifying locations from photos. We collect photos to:

1. Extract GPS coordinates from EXIF metadata
2. Analyze building features and architectural elements using AI
3. Identify landmarks and locations through computer vision

Photos are processed temporarily on our secure servers for analysis and are NOT stored permanently. The analysis results (location data) are returned to the user, and the photo is immediately deleted from our servers.

This is essential for our app's primary purpose and cannot be made optional.
```

### For Videos:

**Why do you collect videos?**
```
The READ_MEDIA_VIDEO permission is included in our app through Android SDK dependencies (expo-media-library). While our app is designed for photo analysis, the permission allows users to select media files from their device.

Videos are not actively collected or processed by our app. If a user were to select a video file, it would only be processed ephemerally to extract metadata (such as GPS coordinates from video EXIF data), similar to photo processing.

This permission is optional and not required for core app functionality.
```

---

## 🎯 Step-by-Step in Play Console

1. **Login to Google Play Console**
2. **Select your app** (Pic2Nav)
3. **Go to:** Policy → App content → Data safety
4. **Click:** "Start" or "Manage" (if already started)
5. **Question:** "Does your app collect or share any of the required user data types?"
   - Answer: **YES**
6. **Select data types:**
   - ✅ Location (already selected)
   - ✅ **Photos** (ADD THIS)
   - ✅ **Videos** (ADD THIS)
   - ✅ Files and docs (already selected)
7. **Click on "Photos"** and fill out:
   - Collected: YES
   - Shared: NO
   - Ephemeral: YES
   - Required: YES
   - Purpose: App functionality
   - Add context (use text above)
8. **Click on "Videos"** and fill out:
   - Collected: YES
   - Shared: NO
   - Ephemeral: YES
   - Required: NO
   - Purpose: App functionality
   - Add context (use text above)
9. **Review** all sections
10. **Save** and **Submit**

---

## ⚠️ Important Notes

### Why "Ephemeral" for Photos?
- Photos are processed temporarily
- Not stored permanently on servers
- Deleted immediately after analysis
- This is the correct classification

### Why Videos are "Optional"?
- Not core functionality
- Permission exists but not actively used
- User can use app without selecting videos
- Only photos are required

### Why Both Must Be Declared?
- Google Play scans your APK/AAB
- Detects ALL permissions in manifest
- Even unused permissions must be declared
- Failure to declare = rejection

---

## 🚀 After Declaring

1. **Save** all changes in Data Safety form
2. **Review** the preview to ensure accuracy
3. **Submit** the updated data safety information
4. **Resubmit** your app for review (if already submitted)

The error should be resolved once you declare both permissions.

---

## ✅ Checklist

- [ ] Declared "Photos" in Data Safety form
- [ ] Set Photos as "Collected" and "Ephemeral"
- [ ] Set Photos as "Required"
- [ ] Added context for Photos
- [ ] Declared "Videos" in Data Safety form
- [ ] Set Videos as "Collected" and "Ephemeral"
- [ ] Set Videos as "Optional"
- [ ] Added context for Videos
- [ ] Saved all changes
- [ ] Reviewed preview
- [ ] Submitted data safety form

---

## 📞 If Still Rejected

If Google Play still shows undeclared permissions:

1. **Check manifest:** Ensure no other media permissions
2. **Rebuild app:** `eas build --platform android`
3. **Re-declare:** Go through Data Safety form again
4. **Contact support:** Use Play Console support if issue persists

---

**This will resolve the undeclared permissions error!** ✅
