# OpenClaude Launch Script - Groq Free Tier Only
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$settingsPath = Join-Path $scriptDir ".openclaude-agents.json"

Write-Host "Launching OpenClaude (GROQ FREE TIER)..." -ForegroundColor Cyan
Write-Host "  Fast:   Groq llama-3.1-8b-instant" -ForegroundColor Gray
Write-Host "  Strong: Groq llama-3.3-70b-versatile" -ForegroundColor Gray
Write-Host "  Config: $settingsPath" -ForegroundColor Gray
Write-Host "  Permissions: auto-bypass enabled" -ForegroundColor Green
Write-Host ""

openclaude --settings $settingsPath
