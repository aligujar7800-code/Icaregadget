@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo             ICARE GADGET - RELEASE TO GITHUB
echo ========================================================
echo.

:: 1. Ensure we are in a Git repository
git rev-parse --is-inside-work-tree >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Not inside a git repository.
    goto :fail
)

:: 2. Get current active branch (defaults to main)
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "current_branch=%%b"
if "%current_branch%"=="" set "current_branch=main"
echo [INFO] Active branch: %current_branch%

:: 3. Prompt for commit message (or auto-timestamp)
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
echo [1/4] Staging ALL local changes (new, edited, deleted)...
git add -A
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to stage changes.
    goto :fail
)

:: 4. Secret Safety Check (prevents GitHub Push Protection block)
git diff --cached | findstr /i "sk-or-v1- ghp_" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  [SECURITY ALERT] Hardcoded API key detected in code!
    echo ========================================================
    echo  Found a token pattern like 'sk-or-v1-' in your staged files.
    echo  GitHub Push Protection will reject this push.
    echo  Please keep API keys in .env, not in source code!
    echo ========================================================
    echo.
    set /p "abort_key=Abort release to remove key? (Y/n): "
    if /i "!abort_key!" neq "n" goto :fail
)

echo [2/4] Committing local changes...
git diff-index --quiet HEAD -- 2>nul
if %ERRORLEVEL% neq 0 (
    git commit -m "!commit_msg!"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Commit failed.
        goto :fail
    )
    echo [OK] Changes committed successfully.
) else (
    echo [NOTE] Working tree already clean (no new file edits to commit).
)

echo [3/4] Syncing with GitHub (origin %current_branch%)...
:: Pull latest remote changes first to prevent non-fast-forward rejection
git pull --rebase origin %current_branch% >nul 2>&1

:: Push all commits to GitHub
echo Pushing all commits to GitHub...
git push origin %current_branch%
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================================
    echo  [ERROR] Push failed!
    echo  Possible causes:
    echo   1. GitHub Push Protection blocked a secret/token
    echo   2. Internet connection or authentication issue
    echo   3. Remote has conflicting commits
    echo ========================================================
    goto :fail
)

echo [4/4] Verifying 100%% sync status...
set "unpushed_count=0"
for /f "tokens=*" %%c in ('git rev-list --count origin/%current_branch%..HEAD 2^>nul') do set "unpushed_count=%%c"

set "dirty_files=0"
for /f "tokens=*" %%s in ('git status --porcelain 2^>nul') do set "dirty_files=1"

echo.
if "!unpushed_count!"=="0" (
    if "!dirty_files!"=="0" (
        echo ========================================================
        echo  [SUCCESS] 100%% IN SYNC WITH GITHUB!
        echo ========================================================
        echo  * Unpushed local commits: 0
        echo  * Uncommitted local files: 0
        echo  * Every single line of code is safely pushed to GitHub.
        echo ========================================================
    ) else (
        echo [WARNING] All commits pushed, but some untracked files remain.
    )
) else (
    echo ========================================================
    echo  [WARNING] You still have !unpushed_count! commit(s) ahead of GitHub!
    echo ========================================================
)
echo.
pause
exit /b 0

:fail
echo.
echo ========================================================
echo  [FAILED] Release incomplete. Code was not fully pushed.
echo ========================================================
echo.
pause
exit /b 1
