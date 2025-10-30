@echo off
echo ========================================
echo Pic2Nav Android Play Store Submission
echo ========================================
echo.

echo Step 1: Building production AAB...
call eas build --platform android --profile production

echo.
echo ========================================
echo Build complete!
echo.
echo Next steps:
echo 1. Download the AAB from Expo dashboard
echo 2. Go to https://play.google.com/console
echo 3. Upload the AAB file
echo 4. Complete store listing
echo 5. Submit for review
echo.
echo OR use automated submission:
echo   eas submit --platform android --profile production
echo.
echo See PLAY_STORE_SUBMISSION.md for detailed guide
echo ========================================
pause
