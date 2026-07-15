@echo off
echo ======================================================================
echo   Stopping AntiFraud Monitoring System Containers...
echo ======================================================================
echo.

docker compose down

echo.
echo ======================================================================
echo   System stopped and cleaned up.
echo ======================================================================
pause
