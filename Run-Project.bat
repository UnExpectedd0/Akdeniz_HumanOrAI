@echo off
echo =========================================
echo    Starting Akdeniz HumanOrAI Project
echo =========================================

echo.
echo Starting Backend server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo Starting Frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting! 
echo Keep the two new CMD windows open while you are working.
echo.
pause
