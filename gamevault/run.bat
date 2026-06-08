@echo off
title Game Vault Server
cd /d "%~dp0"

echo.
echo  [Game Vault] Starting local server...
echo.

:: Try python first, then npx, then node
where python >nul 2>nul
if %errorlevel%==0 (
    echo  Server starting at http://localhost:8080
    echo  ^(bookmark this URL^)
    echo.
    start http://localhost:8080
    python -m http.server 8080
    goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo  Server starting at http://localhost:3000
    echo  ^(bookmark this URL^)
    echo.
    start http://localhost:3000
    npx serve . -p 3000 --no-clipboard
    goto :eof
)

echo [ERROR] No python or node found. Open index.html directly.
pause
