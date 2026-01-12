@echo off
echo Installing boto3 for S3 access...
pip install boto3==1.34.34
echo.
echo Installation complete!
echo.
echo Now restart the ML service with: python app.py
pause
