@echo off
setlocal enabledelayedexpansion

:: Prevent self-modifying batch corruption when git pull modifies update.bat
if "%~1" neq "__RUNNER__" (
    copy /y "%~f0" "%TEMP%\_icare_updater.bat" >nul
    call "%TEMP%\_icare_updater.bat" __RUNNER__ "%~dp0"
    exit /b %ERRORLEVEL%
)

:: Switch to project directory
cd /d "%~2"

echo ========================================================
echo          ICARE GADGET - RDP UPDATE AND DEPLOY
echo ========================================================
echo.

:: Detect PM2 command (global pm2 or npx pm2)
set "PM2_CMD=pm2"
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    set "PM2_CMD=npx pm2"
)

echo [1/5] Pulling latest code from GitHub (origin/main)...
git pull origin main --no-rebase --no-edit --allow-unrelated-histories -X theirs
if %ERRORLEVEL% neq 0 (
    echo [RETRY] Stashing local modifications and retrying pull...
    git stash
    git pull origin main --no-rebase --no-edit --allow-unrelated-histories -X theirs
)
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Git pull failed. Please check git status or conflicts.
    goto :fail
)

:: Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found! Please paste your .env file in the root directory.
)

echo.
echo [2/5] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install failed.
    goto :fail
)

echo.
echo [3/5] Checking / Creating MySQL database...
call node server/init-db.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] MySQL database check or initialization failed.
    echo Please make sure MySQL service is running and your .env credentials are correct.
    goto :fail
)

echo.
echo [4/5] Building production frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm run build failed.
    goto :fail
)

echo.
echo [5/5] Starting / Restarting process on localhost:3009 with PM2...
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
