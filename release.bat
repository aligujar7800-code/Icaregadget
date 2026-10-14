@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo             ICARE GADGET - RELEASE TO GITHUB
echo ========================================================
echo.

:: Get commit message from argument or prompt user
set "commit_msg=%~1"

if "%commit_msg%"=="" (
    set /p "commit_msg=Enter commit message (Press Enter for auto-date): "
)

if "%commit_msg%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "dt=%%I"
    if defined dt (
        set "commit_msg=Release update: !dt:~0,4!-!dt:~4,2!-!dt:~6,2! !dt:~8,2!:!dt:~10,2!"
    ) else (
        set "commit_msg=Release update: %date% %time%"
    )
)

echo.
echo [1/3] Staging changes...
git add .
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git add failed.
    goto :fail
)

echo [2/3] Committing changes with message: "!commit_msg!"
git commit -m "!commit_msg!"
if %ERRORLEVEL% neq 0 (
    echo [NOTE] Nothing to commit or working tree clean.
)

echo [3/3] Pushing changes to GitHub (origin main)...
git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================================
    echo  [ERROR] Push failed. Check your internet or git credentials.
    echo ========================================================
    goto :fail
)

echo.
echo ========================================================
echo  [SUCCESS] Code successfully pushed to GitHub main branch!
echo ========================================================
echo.
pause
exit /b 0

:fail
echo.
echo ========================================================
echo  [FAILED] Release failed. Please inspect the messages above.
echo ========================================================
echo.
pause
exit /b 1
