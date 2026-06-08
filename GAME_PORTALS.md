# Game Portal Submission Guide

## itch.io
- **URL**: https://itch.io/game/new
- **Title**: Don't Touch Purple
- **Kind**: HTML
- **Upload**: Just provide game URL (hosted externally)
- **Game URL**: https://game.mscarabia.com
- **Classification**: Everyone
- **Category**: Arcade / Reflex
- **Price**: Free
- **Description**: See `.github/LAUNCH.md` > "itch.io Description"
- **Screenshots**: `dist/screenshots/` (add your own)

## CrazyGames
- **URL**: https://developer.crazygames.com
- **SDK**: Requires CrazyGames SDK integration
- **Build**: Need to add `CrazyGames` SDK for leaderboard/ad support
- **TODO**: Integrate CrazyGames SDK, create separate build

## Poki
- **URL**: https://developer.poki.com
- **SDK**: Requires Poki SDK for ads/data
- **Build**: Need Poki SDK wrapper
- **TODO**: Integrate Poki SDK, create separate build

## Newgrounds
- **URL**: https://www.newgrounds.com/upload/game
- **Format**: Upload zip or provide URL
- **Medals**: Can wire up Newgrounds Medals API
- **TODO**: Create Newgrounds Medals, provide game URL

## What's Ready Now (no SDK changes needed)
- **itch.io**: Game URL + description from `LAUNCH.md`
- **Newgrounds**: Game URL works as external embed
