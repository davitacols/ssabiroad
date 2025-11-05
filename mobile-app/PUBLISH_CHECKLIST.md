# Android Publishing Checklist

## Pre-Build
- [ ] Update version in `app.json` (currently 1.0.0)
- [ ] Test app thoroughly on physical device
- [ ] Verify all permissions are necessary
- [ ] Check API keys are configured
- [ ] Review privacy policy and terms of service

## Build AAB
```bash
cd mobile-app
eas build --platform android --profile production
```
- [ ] Build completes successfully
- [ ] Download .aab file from EAS

## Play Console Setup
- [ ] Create app in Google Play Console
- [ ] Complete store listing
- [ ] Upload graphics (icon, feature graphic, screenshots)
- [ ] Set app category: Travel & Local
- [ ] Add contact details

## Compliance
- [ ] Complete content rating questionnaire
- [ ] Fill out data safety form
- [ ] Declare ad presence (No)
- [ ] Set target audience (13+)
- [ ] Accept all declarations

## Release
- [ ] Upload .aab to Production
- [ ] Write release notes
- [ ] Review all sections (green checkmarks)
- [ ] Submit for review

## Post-Submission
- [ ] Monitor email for review status
- [ ] Check Play Console dashboard
- [ ] Prepare for user feedback
- [ ] Set up crash reporting monitoring

## Quick Commands

**Build AAB:**
```bash
eas build --platform android --profile production
```

**Check build status:**
```bash
eas build:list
```

**Auto-submit (if configured):**
```bash
eas submit --platform android --profile production
```

## Key Info
- **Package**: com.ssabiroad.pic2nav
- **Version**: 1.0.0
- **Version Code**: Auto-incremented by EAS
- **Category**: Travel & Local
- **Price**: Free
