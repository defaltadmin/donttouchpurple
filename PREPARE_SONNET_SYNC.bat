@echo off
echo Updating SONNET_BRIDGE.md with latest project state...

echo # Sonnet ^<^=^> Gemini Bridge > SONNET_BRIDGE.md
echo. >> SONNET_BRIDGE.md
echo ## 🔄 SONNET -> GEMINI (Apply these changes) >> SONNET_BRIDGE.md
echo *Sonnet: Write instructions here for Gemini CLI to execute.* >> SONNET_BRIDGE.md
echo. >> SONNET_BRIDGE.md
echo --- >> SONNET_BRIDGE.md
echo. >> SONNET_BRIDGE.md
echo ## 🔄 GEMINI -> SONNET (Context for planning) >> SONNET_BRIDGE.md
echo. >> SONNET_BRIDGE.md
echo ### Latest History >> SONNET_BRIDGE.md
git log -n 3 --oneline >> SONNET_BRIDGE.md
echo. >> SONNET_BRIDGE.md
echo ### Latest Git Diff >> SONNET_BRIDGE.md
echo ```diff >> SONNET_BRIDGE.md
git diff HEAD~1 >> SONNET_BRIDGE.md
echo ``` >> SONNET_BRIDGE.md
echo. >> SONNET_BRIDGE.md
echo ### Current Status >> SONNET_BRIDGE.md
echo - **Last Sync:** %date% %time% >> SONNET_BRIDGE.md
git status --short >> SONNET_BRIDGE.md

echo Done! Upload SONNET_BRIDGE.md to Sonnet.
pause
