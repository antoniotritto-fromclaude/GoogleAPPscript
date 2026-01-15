@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     🎯 CRM Antonio Tritto - Installazione                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Verifica Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js non trovato!
    echo.
    echo Scarica e installa Node.js da: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo ✅ Node.js %NODE_VER% trovato

:: Installa dipendenze
echo.
echo 📦 Installazione dipendenze...
call npm install

:: Inizializza database
echo.
echo 🗄️  Inizializzazione database...
call npm run seed

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     ✅ Installazione completata!                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Per avviare l'applicazione:
echo.
echo   npm start
echo.
echo Poi apri nel browser: http://localhost:3000
echo.
pause
