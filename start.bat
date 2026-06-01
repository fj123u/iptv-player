@echo off
title IPTV Player
echo ========================================
echo        IPTV Player - Demarrage
echo ========================================
echo.

echo [1/2] Demarrage du backend...
start /B cmd /c "cd /d %~dp0backend && node src/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Demarrage du frontend...
start /B cmd /c "cd /d %~dp0frontend && npx vite"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Application demarree avec succes !
echo   Ouvrez: http://localhost:5173
echo ========================================
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause >nul

start http://localhost:5173
echo.
echo Pour arreter, fermez cette fenetre.
pause >nul
taskkill /f /im node.exe >nul 2>&1
