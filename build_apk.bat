@echo off
setlocal
echo ==============================================================================
echo [1/4] Building Web Application...
echo ==============================================================================
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo [2/4] Syncing Assets with Capacitor Android...
echo ==============================================================================
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo [3/4] Compiling Standalone Android APK...
echo ==============================================================================
cd android
set JAVA_HOME=C:\Program Files\Java\jdk-21
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gradle APK build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo [4/4] Copying APK to root directory...
echo ==============================================================================
cd ..\..
copy /Y "client\android\app\build\outputs\apk\debug\app-debug.apk" "Kondagaon_Nodal_Inspection.apk"
if not exist "apk" mkdir apk
copy /Y "client\android\app\build\outputs\apk\debug\app-debug.apk" "apk\Kondagaon_Nodal_Inspection.apk"

echo.
echo ==============================================================================
echo [SUCCESS] APK Successfully Created:
echo  - F:\Website\Nodel\Kondagaon_Nodal_Inspection.apk
echo  - F:\Website\Nodel\apk\Kondagaon_Nodal_Inspection.apk
echo ==============================================================================
pause
