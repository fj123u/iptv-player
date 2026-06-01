@echo off
title IPTV Player
echo ========================================
echo        IPTV Player - Demarrage
echo ========================================
echo.

:: Tuer les anciens processus node sur les ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [1/2] Demarrage du backend (port 3001)...
start "IPTV Backend" /min cmd /c "cd /d %~dp0backend && node src/index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du frontend (port 5173)...
start "IPTV Frontend" /min cmd /c "cd /d %~dp0frontend && npx vite --port 5173 --strictPort"

timeout /t 4 /nobreak >nul

echo.
echo ========================================
echo   Application prete !
echo   URL: http://localhost:5173
echo ========================================
echo.

start http://localhost:5173

echo Appuyez sur une touche pour ARRETER les serveurs...
pause >nul

:: Nettoyage
taskkill /fi "WINDOWTITLE eq IPTV Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq IPTV Frontend" /f >nul 2>&1
