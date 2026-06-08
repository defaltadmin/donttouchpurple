@echo off
setlocal
title Odysseus Launcher

:: Navigate to the Odysseus directory
cd /d "%~dp0website\odysseus"

echo Starting Odysseus...
echo This will check for Python, set up a virtual environment, and start the server.
echo.

:: Run the PowerShell launcher script
powershell -ExecutionPolicy Bypass -File .\launch-windows.ps1

if %ERRORLEVEL% neq 0 (
    echo.
    echo Odysseus failed to start.
    pause
)

popd
