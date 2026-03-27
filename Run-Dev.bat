@echo off
echo =========================================
echo    Starting Akdeniz HumanOrAI (Dev Mode)
echo =========================================

echo.
echo [1/2] Starting Backend server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo [2/2] Starting Frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================
echo   Both servers are starting!
echo.
echo   Local:   http://localhost:5173
echo   Phone:   Open the "Network" URL shown
echo            in the Frontend window
echo.
echo   Keep both CMD windows open.
echo =========================================
echo.
pause
