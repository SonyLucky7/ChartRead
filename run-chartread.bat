@echo off
echo Starting ChartRead Desktop Application...
cd /d "%~dp0runtime"
start "" "%~dp0runtime\ChartRead.exe" %*
