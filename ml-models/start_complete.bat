@echo off
echo ============================================================
echo SSABIRoad ML Models - Complete Setup and Start
echo ============================================================
echo.

echo [1/4] Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo.

echo [2/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/4] Running quick start setup...
python quick_start.py
if errorlevel 1 (
    echo ERROR: Setup failed
    pause
    exit /b 1
)
echo.

echo [4/4] Starting ML server...
echo Server will start at http://localhost:8000
echo API docs available at http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python start_server.py
