$ErrorActionPreference = 'SilentlyContinue'
$base = (Get-Location).Path
$zipPath = "$base\dtp-claude-review-v7.5.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$files = @(
  'App.tsx','main.tsx','CHANGELOG.md','package.json','vite.config.ts','tsconfig.json',
  'firestore.rules','index.html',
  'public\sw.js','public\manifest.json',
  'engine\GameEngine.ts','engine\DifficultyScaler.ts','engine\types.ts',
  'engine\subsystems\TickProcessor.ts','engine\subsystems\BotController.ts',
  'engine\subsystems\EventOrchestrator.ts','engine\subsystems\ScoreTracker.ts',
  'engine\subsystems\SessionPersistor.ts',
  'hooks\useGameEngine.ts','hooks\useScreenStateMachine.ts',
  'hooks\useInputHandler.ts','hooks\useBackground.ts','hooks\useOffsetCursor.ts',
  'config\difficulty.ts','config\gridPatterns.ts','config\powerupWeights.ts',
  'config\dailyObjective.ts','config\gameBalance.ts','config\keybindings.ts','config\tutorial.ts',
  'services\firebase.ts','services\leaderboard.ts','services\metrics.ts','services\errorLogger.ts',
  'utils\featureGates.ts','utils\score-sync.ts','utils\idb.ts','utils\pendingScoresDb.ts',
  'utils\challenge-link.ts','utils\seed-manager.ts','utils\state-guard.ts','utils\session.ts',
  'utils\audio.ts','utils\achievements.ts','utils\analytics.ts','utils\dda.ts',
  'utils\storage.ts','utils\settings.ts','utils\i18n.ts','utils\i18n-keys.ts',
  'utils\visual-a11y.ts','utils\web-vitals.ts','utils\game-config.ts','utils\logger.ts',
  'utils\privacy.ts','utils\haptics.ts','utils\gestures.ts','utils\orientation.ts',
  'utils\feedback-rhythm.ts','utils\boss-engine.ts','utils\error-tracker.ts',
  'utils\dustAnimation.ts','utils\score-card.ts','utils\seed-challenge.ts','utils\device.ts',
  'utils\cleanup-pattern.ts','utils\lazy-hydrate.tsx','utils\preloader.ts','utils\preloader-v2.ts',
  'components\Screens\StartScreen.tsx','components\Screens\GameOver.tsx',
  'components\Screens\LoadingScreen.tsx','components\Screens\HowToPlay.tsx',
  'components\Screens\WhatsNew.tsx','components\Screens\RewardsHub.tsx',
  'components\Screens\LoginStreakPopup.tsx','components\Screens\DailyChallengesPopup.tsx',
  'components\Screens\EvolveTutorial.tsx','components\Screens\PrivacyBanner.tsx',
  'components\Screens\FirstRunOverlay.tsx',
  'components\HUD\PlayerPanel.tsx','components\HUD\Hearts.tsx','components\HUD\PwrBar.tsx',
  'components\HUD\EnergyBar.tsx','components\HUD\DustWidget.tsx','components\HUD\Toasts.tsx',
  'components\HUD\GridErrorBoundary.tsx','components\HUD\PwrBadges.tsx',
  'components\Cell\index.tsx',
  'components\Shop\ShopPanel.tsx',
  'components\Leaderboard\LeaderboardPanel.tsx',
  'components\Settings\SettingsDrawer.tsx','components\Settings\KeyBinder.tsx',
  'components\Settings\DevOverlay.tsx','components\Settings\BuildDeploySection.tsx',
  'components\Layout\BackgroundController.tsx','components\LazyPanels.tsx',
  'components\Animations\ShieldDrop.tsx','components\Animations\FreezeDrop.tsx',
  'components\Animations\EnergyDrop.tsx',
  'styles\game.css','styles\enhancements.css','styles\performance.css','styles\base.css',
  'workers\score-validator.ts','workers\wrangler.toml',
  'functions\src\index.ts',
  'e2e\smoke.spec.ts','playwright.config.ts',
  '__tests__\GameEngine.test.ts','__tests__\DifficultyScaler.test.ts',
  '__tests__\configIntegrity.test.ts','__tests__\leaderboard.test.ts',
  '__tests__\metrics.test.ts','__tests__\gameBalance.test.ts',
  '__tests__\dda.test.ts','__tests__\ScoreTracker.test.ts',
  'locales\en.json','locales\es.json','locales\fr.json','locales\ja.json','locales\pt.json',
  '.env.example','.eslintrc.json','.prettierrc','test\setup.ts'
)

$existing = $files | Where-Object { Test-Path "$base\$_" } | ForEach-Object { "$base\$_" }
Compress-Archive -Path $existing -DestinationPath $zipPath -Force
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
$count = (Get-ChildItem $zipPath | Select-Object -ExpandProperty Length)
Write-Output "Created: dtp-claude-review-v7.5.zip | Files: $($existing.Count) | Size: ${sizeMB}MB"
