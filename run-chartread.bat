@echo off
echo Starting ChartRead Desktop Application...
cd /d "%~dp0"
start "" "%~dp0runtime\ChartRead.exe" "%~dp0." %*
