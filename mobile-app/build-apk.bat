@echo off
echo ========================================
echo Building Pic2Nav APK with Expo
echo ========================================
echo.

cd /d "%~dp0"

echo Checking EAS CLI installation...
call npx eas-cli --version >nul 2>&1
if errorlevel 1 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
)

echo.
echo Logging into Expo account...
call eas login

echo.
echo Building APK (Preview Build)...
call eas build --platform android --profile preview

echo.
echo ========================================
echo Build complete!
echo Download your APK from the link above
echo ========================================
pause
