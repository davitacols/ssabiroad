@echo off
echo ========================================
echo Daily Nigeria Data Collection
echo ========================================
echo.

cd /d D:\ssabiroad

echo [%date% %time%] Starting collection...
node scripts/data-collection/collect-daily.js

echo.
echo [%date% %time%] Starting upload...
node scripts/data-collection/train-daily.js

echo.
echo [%date% %time%] Complete!
echo ========================================
