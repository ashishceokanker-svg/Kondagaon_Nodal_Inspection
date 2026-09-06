@echo off
setlocal
echo ==============================================================================
echo GitHub Push Script - Kondagaon Nodal Inspection Portal
echo ==============================================================================
echo.
echo Please enter your GitHub Repository URL.
echo Example: https://github.com/ashishceokanker-svg/kondagaon-nodal.git
echo.
set /p REPO_URL="Enter GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL entered. Exiting...
    pause
    exit /b 1
)

echo.
echo Adding remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Pushing code to GitHub (main branch)...
git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo Now you can connect this repository to Vercel for 1-click deployment.
    echo ==============================================================================
) else (
    echo.
    echo [ERROR] Push failed. Please check your GitHub permissions or sign-in credentials.
)
pause
