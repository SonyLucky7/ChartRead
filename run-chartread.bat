@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   ChartRead Desktop - Easy Launcher
echo ============================================

:: 1. Use bundled portable runtime if present
if exist "%~dp0runtime\ChartRead.exe" (
    echo Launching ChartRead...
    start "" "%~dp0runtime\ChartRead.exe" %*
    exit /b 0
)

:: 2. Verify Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js ^(LTS^) from: https://nodejs.org/
    echo Then double-click run-chartread.bat again.
    echo.
    pause
    exit /b 1
)

:: 3. Auto-install Electron on first run
if not exist "%~dp0node_modules\.bin\electron.cmd" (
    echo.
    echo First-time setup: installing ChartRead runtime ^(Electron^)...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo [ERROR] Installation failed. Check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo Launching ChartRead...
if exist "%~dp0node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." %*
) else (
    call "%~dp0node_modules\.bin\electron.cmd" "%~dp0." %*
)
exit /b 0
