import React from "react";
import type { GameSnapshot, GameMode } from "../../engine/types";
import { PwrBar } from "./PwrBar";
import { PlayerPanel } from "./PlayerPanel";
import { GridErrorBoundary } from "./GridErrorBoundary";
import { ShieldDrop } from "../Animations/ShieldDrop";
import { FreezeDrop } from "../Animations/FreezeDrop";
import { EnergyDrop } from "../Animations/EnergyDrop";
import { GameOver } from "../Screens/GameOver";

interface GameAreaProps {
  snapshot: GameSnapshot;
  screen: string;
  gameMode: GameMode;
  is2P: boolean;
  numPlayers: number;
  isPlaying: boolean;
  reducedMotion: boolean;
  screenShake: boolean;
  shakeGrid1: boolean;
  shakeGrid2: boolean;
  heartAnimP1: boolean;
  heartAnimP2: boolean;
  best1: number;
  best2: number;
  engineWinner: any;
  shareMsg: string;
  gameSeedState: number;
  dust: number;
  dustAtStart: number;
  gameOverProgress: number;
  p1Keys: any;
  p2Keys: any;
  inputMode: string;
  pressing1: Set<number>;
  pressing2: Set<number>;
  cbActive: boolean;
  cbFilter: string;
  shopData: any;
  pwrToastP1: string | null;
  pwrToastP2: string | null;
  levelUpBadge: string | null;
  practiceMode: boolean;
  botAssistActive: { 1: boolean; 2: boolean };
  botTapHighlights: { 1: Record<number, number>; 2: Record<number, number> };
  scoreFloats: { id: number; player: 1 | 2; idx: number; amount: number }[];
  isFS: boolean;
  devHeatmap: Record<number, number>;
  onRestart: () => void;
  onStartGame: () => void;
  onTap: (player: 1 | 2, idx: number) => void;
  onHoldStart: (player: 1 | 2, idx: number) => void;
  onHoldEnd: (player: 1 | 2, idx: number) => void;
  onPause: () => void;
  onLeaderboard: () => void;
  onMenu: () => void;
  onShare: (score: number, health: number, tick: number) => void;
  onCopyChallenge: () => void;
  onActivateFreeze: (player: 1 | 2) => void;
  onActivateShield: (player: 1 | 2) => void;
  onToggleBot: (player: 1 | 2) => void;
}

export const GameArea = React.memo(function GameArea({
  snapshot, screen, gameMode, is2P, numPlayers, isPlaying, reducedMotion,
  screenShake, shakeGrid1, shakeGrid2, heartAnimP1, heartAnimP2,
  best1, best2, engineWinner, shareMsg, gameSeedState,
  dust, dustAtStart, gameOverProgress,
  p1Keys, p2Keys, inputMode, pressing1, pressing2,
  cbActive, cbFilter, shopData, pwrToastP1, pwrToastP2,
  levelUpBadge, practiceMode, botAssistActive, botTapHighlights,
  scoreFloats, isFS, devHeatmap,
  onRestart, onStartGame, onTap, onHoldStart, onHoldEnd, onPause,
  onLeaderboard, onMenu, onShare, onCopyChallenge,
  onActivateFreeze, onActivateShield, onToggleBot,
}: GameAreaProps) {
  return (
    <div className="game-area">
      <GridErrorBoundary onRestart={() => { onMenu(); setTimeout(onStartGame, 100); }}>
        {snapshot?.isBlackout && screen === "playing" && (
          <div className="blackout-overlay" />
        )}
        <PwrBar ps={snapshot.p1} rareMode={snapshot.rareMode} />

        {screen === "gameover" && (
          <div className="go-overlay">
            <GameOver
              p1Score={snapshot.p1.score}
              p2Score={snapshot.p2?.score || 0}
              best={gameMode === "classic" ? best1 : best2}
              winner={engineWinner}
              mode={gameMode}
              is2P={numPlayers === 2}
              shareMsg={shareMsg}
              gameSeed={gameSeedState || 0}
              tick={snapshot.tick}
              p1={snapshot.p1}
              onAgain={onStartGame}
              onLeaderboard={onLeaderboard}
              onMenu={onMenu}
              spinLevel={snapshot.spinLevel}
              isHumanLimit={snapshot.phase === "humanlimit"}
              dustEarned={isNaN(dust - dustAtStart) ? 0 : dust - dustAtStart}
              objectiveProgress={gameOverProgress}
            />
            <button className="dtp-icon-btn" onClick={() => onShare(snapshot.p1.score, snapshot.p1.health, snapshot.tick)} title="Share Score" style={{marginTop:8}}>Share Score</button>
            <button className="dtp-icon-btn" onClick={onCopyChallenge} title="Copy challenge link" aria-label="Share score & challenge friends" style={{marginTop:8}}>Challenge</button>
          </div>
        )}

        <ShieldDrop active={pwrToastP1?.includes("Shield") ?? false} />
        <FreezeDrop active={pwrToastP1?.includes("Freeze") ?? false} />
        <EnergyDrop active={pwrToastP1?.includes("⚡") ?? false} />
        {is2P && <ShieldDrop active={pwrToastP2?.includes("Shield") ?? false} />}
        {is2P && <FreezeDrop active={pwrToastP2?.includes("Freeze") ?? false} />}
        {is2P && <EnergyDrop active={pwrToastP2?.includes("⚡") ?? false} />}

        <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim}
          onTap={i => { onTap(1, i); }}
          onHoldStart={i => onHoldStart(1, i)} onHoldEnd={i => onHoldEnd(1, i)}
          keyLabels={p1Keys} showKeys={inputMode === "keyboard"} pressing={pressing1}
          label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
          colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={screenShake && !reducedMotion && shakeGrid1}
          cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
          onPause={onPause} isFS={isFS}
          equippedSkin={shopData.equippedSkin} snapshot={snapshot}
          pwrToast={pwrToastP1}
          levelUpBadge={levelUpBadge}
          storedFreezeCharges={snapshot.p1.storedFreezeCharges}
          storedShieldCharges={snapshot.p1.storedShieldCharges}
          onActivateFreeze={() => onActivateFreeze(1)}
          onActivateShield={() => onActivateShield(1)}
          showStoredPwr={screen === "playing"}
          practiceMode={practiceMode}
          onToggleBotAssist={() => onToggleBot(1)}
          showBotAssist={screen === "playing"}
          isBotActive={botAssistActive[1]}
          botTapHighlights={botTapHighlights[1]}
          dust={dust}
          scoreFloats={scoreFloats.filter(f => f.player === 1)} />
        {is2P && (
          <PlayerPanel ps={snapshot.p2} anim={snapshot.p2.anim}
            onTap={i => { onTap(2, i); }}
            onHoldStart={i => onHoldStart(2, i)} onHoldEnd={i => onHoldEnd(2, i)}
            keyLabels={p2Keys} showKeys={inputMode === "keyboard"} pressing={pressing2}
            label="P2" heartAnim={heartAnimP2} mode={gameMode}
            colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={screenShake && !reducedMotion && shakeGrid2}
            cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
            onPause={onPause} isFS={isFS}
            equippedSkin={shopData.equippedSkin} snapshot={snapshot}
            pwrToast={pwrToastP2}
            storedFreezeCharges={snapshot.p2.storedFreezeCharges}
            storedShieldCharges={snapshot.p2.storedShieldCharges}
            onActivateFreeze={() => onActivateFreeze(2)}
            onActivateShield={() => onActivateShield(2)}
            showStoredPwr={screen === "playing"}
            practiceMode={practiceMode}
            onToggleBotAssist={() => onToggleBot(2)}
            showBotAssist={screen === "playing" && is2P}
            isBotActive={botAssistActive[2]}
            botTapHighlights={botTapHighlights[2]}
            dust={dust} />
        )}
      </GridErrorBoundary>
    </div>
  );
});
