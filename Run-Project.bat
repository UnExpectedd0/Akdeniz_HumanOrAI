@echo off
echo =========================================
echo    Starting Akdeniz HumanOrAI
echo =========================================

echo.
echo [1/3] Installing backend dependencies...
cd backend
call npm install --production
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Building frontend...
cd ..\frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Starting server...
cd ..\backend
echo.
echo =========================================
echo   Server is running on port 5000
echo   Open http://localhost:5000 in browser
echo.
echo   Keep this window open!
echo =========================================
echo.
node index.js
pause
