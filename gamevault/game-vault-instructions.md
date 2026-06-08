# Original Game Vault Instructions

## Synchronizing Library Data

### Option A: Seeding Data from Playnite Export
To load extensive cross-platform library information into the dashboard, execute this script inside Playnite's PowerShell Script Console (Tools > Script Console):

```powershell
$OutputPath = "C:\Users\$env:USERNAME\Documents\PlayniteLibrary.json"
$PlayniteApi.Database.Games | Select-Object Name, Source, ReleaseDate, Playtime, IsInstalled | ConvertTo-Json -Depth 5 | Out-File $OutputPath -Encoding utf8
```

Upload the resulting PlayniteLibrary.json file using the dashboard file picker input to build the baseline collection.

### Option B: Seeding Data Directly via LLM Context
Alternatively, feed a hardcoded array directly into the gamesData variable at the top of the script blocks within the dashboard. Copy individual lists or paste the raw game contents explicitly to bypass manual updates entirely.

## UI/UX Modification Rules
- Keep layout strictly single-file HTML/CSS/JS.
- Maintain the glassmorphism aesthetic styling utilizing dark background tones (rgba borders and blurred backdrops).
- Preserve browser local storage mapping rules keyed precisely to game.Name.
- Ensure that adjustments to filter selectors or metadata schemas dynamically cascade to all views.
