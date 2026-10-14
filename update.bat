@echo off
setlocal enabledelayedexpansion

:: Switch to script directory
cd /d "%~dp0"

echo ========================================================
echo           ICARE GADGET - RDP UPDATE & DEPLOY
echo ========================================================
echo.

:: Detect PM2 command (global pm2 or npx pm2)
set "PM2_CMD=pm2"
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    set "PM2_CMD=npx pm2"
)

echo [1/4] Pulling latest code from GitHub (origin/main)...
git pull origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Git pull failed. Please check git status or conflicts.
    goto :fail
)

:: Ensure server/.env exists on RDP
if not exist "server\.env" (
    echo [INFO] Creating server\.env with RDP MySQL credentials...
    (
        echo PORT=3009
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=AzanMalik7860
        echo DB_NAME=icare_db
        echo DB_PORT=3306
    ) > "server\.env"
)

echo.
echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install failed.
    goto :fail
)

echo.
echo [3/4] Building production frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm run build failed.
    goto :fail
)

echo.
echo [4/4] Starting / Restarting process on localhost:3009 with PM2...
call %PM2_CMD% describe icaregadget >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Process 'icaregadget' found. Restarting...
    call %PM2_CMD% restart icaregadget --update-env
) else (
    echo Process 'icaregadget' not found. Starting with ecosystem.config.cjs...
    call %PM2_CMD% start ecosystem.config.cjs
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to start/restart application with PM2.
    goto :fail
)

:: Save PM2 state for automatic reboot persistence
call %PM2_CMD% save >nul 2>&1

echo.
echo ========================================================
echo  [SUCCESS] Application successfully updated and deployed!
echo  Single URL for Frontend and Backend:
echo  http://localhost:3009
echo ========================================================
echo.
pause
exit /b 0

:fail
echo.
echo ========================================================
echo  [FAILED] Deployment failed. Please review the errors above.
echo ========================================================
echo.
pause
exit /b 1
