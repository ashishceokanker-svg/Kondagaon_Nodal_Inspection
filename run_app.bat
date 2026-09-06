@echo off
title Nodal Officer Mobile Inspection & Goswara Portal
echo ======================================================================
echo    Nodal Officer Mobile Inspection & Goswara Portal
echo    जिला प्रशासन, कोण्डागांव (छ०ग०)
echo ======================================================================
echo.
echo Starting Server on port 5000...
cd server
start cmd /k "node server.js"
timeout /t 2 >nul
echo Opening Web Portal in Default Browser...
start http://localhost:5000
echo.
echo App is now running at: http://localhost:5000
echo You can also open this link on mobile within the same Wi-Fi network!
echo.
pause
