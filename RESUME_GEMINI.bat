@echo off
REM Get the last session ID from gemini-cli history/cache if possible
REM Note: This uses the standard command to list sessions and picks the most recent one.
for /f "tokens=1" %%i in ('gemini list --limit 1') do (
    set LAST_SESSION=%%i
)

if "%LAST_SESSION%"=="" (
    echo No recent session found. Starting a new one...
    gemini
) else (
    echo Resuming session %LAST_SESSION%...
    gemini resume %LAST_SESSION%
)
pause
