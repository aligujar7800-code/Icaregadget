@echo off
setlocal enabledelayedexpansion
title Icare Gadget - Update and Deploy on RDP (Port 3009)

:: Prevent self-modification file pointer corruption during git pull
if "%~dp0" neq "%TEMP%\" (
    copy /y "%~f0" "%TEMP%\icare_update_runner.bat" >nul
    "%TEMP%\icare_update_runner.bat" "%CD%" %*
    exit /b
)

:: Set working directory back to project folder
if not "%~1"=="" cd /d "%~1"

echo ========================================================
echo        ICARE GADGET - UPDATE AND DEPLOY ON RDP
echo                   PORT: 3009
echo ========================================================
echo.

:: -----------------------------------------------------------------
:: CONFIGURATION
:: -----------------------------------------------------------------
set "BRANCH=main"
set "APP_PORT=3009"
set "PM2_APP_NAME=icaregadget"

:: Check Git
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not in PATH on this RDP.
    pause
    exit /b 1
)

:: Check Node.js / NPM
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js/NPM is not installed or not in PATH on this RDP.
    pause
    exit /b 1
)

echo.
echo [1/5] Fetching latest code and synchronizing with origin/%BRANCH%...
git fetch origin %BRANCH%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to fetch from GitHub repository. Verify your network or credentials.
    pause
    exit /b 1
)

:: Reset hard to match GitHub cleanly and avoid any merge conflicts
git reset --hard origin/%BRANCH%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to reset to origin/%BRANCH%.
    pause
    exit /b 1
)

:: Check if .env exists in project root
if not exist .env (
    echo.
    echo [WARNING] .env file not found in project root!
    echo Please make sure you have pasted your .env file into this directory.
    echo.
)

echo.
echo [2/5] Installing dependencies...
call npm install --no-audit
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install encountered an error.
    pause
    exit /b 1
)

echo.
echo [3/5] Checking / Creating MySQL database...
call node server/init-db.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] MySQL database check or initialization failed.
    echo Please verify that MySQL service is running and .env credentials are correct.
    pause
    exit /b 1
)

echo.
echo [4/5] Building production frontend (dist/)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Project build failed.
    pause
    exit /b 1
)

echo.
echo [5/5] Updating PM2 process (%PM2_APP_NAME% on Port %APP_PORT%)...
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] PM2 is not found globally. Installing pm2 globally...
    call npm install -g pm2
)

:: Start or restart process gracefully
call pm2 describe %PM2_APP_NAME% >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Process '%PM2_APP_NAME%' found. Restarting...
    call pm2 restart ecosystem.config.cjs --update-env
) else (
    echo Process '%PM2_APP_NAME%' not found. Starting with ecosystem.config.cjs...
    call pm2 start ecosystem.config.cjs
)

:: Save PM2 list so it restarts on system reboot
call pm2 save

echo.
echo PM2 Process Status:
call pm2 list

echo.
echo ========================================================
echo   [SUCCESS] Deployment complete!
echo   Application running at: http://localhost:%APP_PORT%
echo ========================================================
echo.
pause
exit /b 0
