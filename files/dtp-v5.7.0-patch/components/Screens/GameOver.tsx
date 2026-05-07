import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { GameMode, Winner } from "../../engine/types";

// ─── End-screen messages ──────────────────────────────────────────
const MESSAGES: { min: number; max: number; texts: string[] }[] = [
  { min: 0,   max: 4,   texts: ["Bro couldn't avoid ONE color. 💀","The grid had 12 safe colors. You still lost. 🫠","Have you considered... not touching purple?","A goldfish would've scored higher. Scientifically.","Congratulations on finding the worst possible score.","Purple: 1. You: somehow less than 1.","Even accidentally tapping would've been better.","Did you mean to play a different game? 🙃"] },
  { min: 5,   max: 9,   texts: ["Single digits. Your fingers need a firmware update.","That was painful to watch. 😬","You tapped purple like it was the goal.","Somewhere, a purple cell is laughing at you.","Basic difficulty called. It wants a refund.","Bold strategy. Terrible execution.","The tutorial is embarrassed on your behalf."] },
  { min: 10,  max: 19,  texts: ["Double digits. The minimum bar cleared. Barely.","You made it to double digits. The grid is unimpressed.","10+ — technically not a complete disaster.","Your thumbs are getting warmed up, apparently.","Progress! You avoided purple... some of the time.","Not bad for your first conscious attempt.","The grid acknowledges your existence. Faintly."] },
  { min: 20,  max: 34,  texts: ["Now we're cooking. Medium rare. 🔥","The grid is starting to take you seriously.","20+ — you have actual reflexes. Interesting.","You're in the zone. Stay there.","Your thumbs are having a moment.","The purple is slightly nervous. Good.","Something resembling skill detected."] },
  { min: 35,  max: 49,  texts: ["Serious reflexes detected. 🔥","35+? Tell your friends. Brag a little.","Your fingers are professionally trained, apparently.","The grid didn't see that coming.","Almost 50. The threshold of greatness.","You tapped so fast the purple forgot its job.","We're getting somewhere. Keep going."] },
  { min: 50,  max: 74,  texts: ["FIFTY. You're a natural. 🏆","Half-century! Legendary energy.","50+ means fast hands and questionable hobbies.","The grid can't stop you. It's accepted this.","Your mom would be proud. Probably.","50+ and counting. You're becoming the grid.","Genuine talent spotted. Finally."] },
  { min: 75,  max: 99,  texts: ["75+ is elite territory. 👑","Approaching triple digits. A god awakens.","Your fingers are a biological miracle.","The purple filed a formal complaint. About you.","At this point just go pro.","75+ — researchers want to study your hands.","The grid is scared. Keep it scared."] },
  { min: 100, max: 149, texts: ["TRIPLE DIGITS. Frame this. 🤯","100+. You've transcended the average human.","The game is genuinely afraid of you now.","Are you using one hand?? Impressive.","100+ — this score belongs in a museum.","The grid has filed for emotional damages.","Absolute specimen. This is real now."] },
  { min: 150, max: 999, texts: ["ARE YOU HUMAN?? 👾","150+ — we need to talk about your reflexes.","Legend. Myth. Tap god. You.","The purple has retired. Because of you.","Scientists want to study your nervous system.","You broke the intended difficulty curve. Congratulations.","This score should not be possible. And yet.","GOAT status confirmed. No debate."] },
];

export function getMessage(score: number): string {
  const bucket = MESSAGES.find(b => score >= b.min && score <= b.max) ?? MESSAGES[MESSAGES.length - 1];
  return bucket.texts[Math.floor(Math.random() * bucket.texts.length)];
}

// ─── Share card ───────────────────────────────────────────────────
function ShareCard({ score, mode, gameSeed, onClose }: {
  score: number; mode: GameMode; gameSeed: number; onClose: () => void
}) {
  const [copied, setCopied] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);

  const url        = "https://game.mscarabia.com";
  const modeLabel  = mode === "classic" ? "Classic" : "Evolve";
  const shareText  = `🎮 I scored ${score} in Don't Touch the Purple — ${modeLabel} Mode!\nSeed: ${gameSeed}\nCan you beat me? 👇\n${url}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const waUrl      = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Generate canvas image card on mount
  useEffect(() => {
    try {
      const W = 600, H = 315;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0d0820"); bg.addColorStop(1, "#1e0a46");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Purple glow
      const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 220);
      glow.addColorStop(0, "rgba(192,38,211,0.18)"); glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      // Border
      ctx.strokeStyle = "rgba(192,38,211,0.5)"; ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W-2, H-2);
      // Game title
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DON'T TOUCH THE", W/2, 60);
      ctx.fillStyle = "#c026d3"; ctx.font = "bold 26px system-ui, sans-serif";
      ctx.fillText("PURPLE", W/2, 92);
      // Score
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 88px system-ui, sans-serif";
      ctx.fillText(String(score), W/2, 200);
      // Mode label
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "16px system-ui, sans-serif";
      ctx.fillText(`${modeLabel} Mode · Seed ${gameSeed}`, W/2, 235);
      // CTA
      ctx.fillStyle = "rgba(192,38,211,0.9)"; ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillText("Can you beat this? → game.mscarabia.com", W/2, 285);
      setImgUrl(canvas.toDataURL("image/png"));
    } catch { /* canvas not available */ }
  }, [score, mode, gameSeed]);

  const copy = useCallback(() => {
    const tryFallback = () => {
      const el = document.createElement("textarea");
      el.value = shareText; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
      }).catch(tryFallback);
    } else { tryFallback(); }
  }, [shareText]);

  const downloadImg = useCallback(() => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl; a.download = `dtp-score-${score}.png`; a.click();
  }, [imgUrl, score]);

  return (
    <div className="share-card">
      {imgUrl && (
        <div className="share-preview">
          <img src={imgUrl} alt="Score card" className="share-preview-img" />
        </div>
      )}
      <div className="share-inner">
        <div className="share-logo">Don't Touch the <span style={{ color: "#c026d3" }}>Purple</span></div>
        <div className="share-score">{score}</div>
        <div className="share-mode">{modeLabel} Mode</div>
        <div className="share-invite">Think you can beat that? 👀</div>
        <div className="share-url">{url}</div>
      </div>
      <div className="share-btns">
        <a className="share-social share-social--x" href={twitterUrl} target="_blank" rel="noopener">
          <span className="share-social-icon">𝕏</span> Post on X
        </a>
        <a className="share-social share-social--wa" href={waUrl} target="_blank" rel="noopener">
          <span className="share-social-icon">📱</span> WhatsApp
        </a>
        {imgUrl && (
          <button className="share-social share-social--img" onClick={downloadImg}>
            <span className="share-social-icon">🖼️</span> Save Card
          </button>
        )}
        <button className="share-social share-social--copy" onClick={copy}>
          <span className="share-social-icon">{copied ? "✓" : "📋"}</span> {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
      <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={onClose}>← Back</button>
    </div>
  );
}

// ─── New Best banner ──────────────────────────────────────────────
function NewBestBanner() {
  return (
    <div style={{
      fontFamily: "var(--font-game)",
      fontSize: 12,
      letterSpacing: 3,
      textTransform: "uppercase" as const,
      color: "#fbbf24",
      textShadow: "0 0 12px rgba(251,191,36,0.8)",
      animation: "humanLimitPulse 1s ease-in-out infinite",
    }}>
      ✨ New Personal Best!
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────
export interface GameOverProps {
  p1Score:       number;
  p2Score:       number;
  best:          number;
  winner:        Winner;
  mode:          GameMode;
  is2P:          boolean;
  shareMsg:      string;
  gameSeed:      number;
  tick:          number;
  p1:            { gridStage: number; patternIdx: number; health: number; streak: number; alive: boolean };
  onPlay:        () => void;
  onLeaderboard: () => void;
  onMenu:        () => void;
  spinLevel:     number;
  isHumanLimit?: boolean;
  dustEarned?:   number;
  objectiveProgress?: number;
}

// ─── GameOver ─────────────────────────────────────────────────────
export function GameOver({
  p1Score, p2Score, best, winner, mode, is2P,
  shareMsg, gameSeed, tick, p1,
  onPlay, onLeaderboard, onMenu, spinLevel,
  isHumanLimit, dustEarned,
  objectiveProgress = 0,
}: GameOverProps) {
  const [showShare, setShowShare] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const isNewBest = !is2P && p1Score > 0 && p1Score >= best;

  // Animated score counter on mount
  useEffect(() => {
    if (is2P || p1Score === 0) { setDisplayScore(p1Score); return; }
    let start: number | null = null;
    const duration = Math.min(1200, 400 + p1Score * 8);
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * p1Score));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [p1Score, is2P]);

  if (showShare) {
    return <ShareCard score={p1Score} mode={mode} gameSeed={gameSeed} onClose={() => setShowShare(false)} />;
  }

  const bugHref = `mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${gameSeed})`)}&body=${encodeURIComponent(
    `Score: ${p1Score}\nMode: ${mode}\nSeed: ${gameSeed}\nTick: ${tick}\nHealth: ${p1.health}\nSpin: ${spinLevel}\nStreak: ${p1.streak}\n\nUA: ${navigator.userAgent}\nURL: ${window.location.href}\nScreen: ${window.innerWidth}×${window.innerHeight}\n\n(describe what happened)\n`
  )}`;

  return (
    <>
      <div className="go-eyebrow">{is2P ? "ROUND OVER" : "GAME OVER"}</div>

      {is2P ? (
        <>
          <div className="go-winner">
            {winner === "p1" ? "🏆 P1 Wins!" : winner === "p2" ? "🏆 P2 Wins!" : "🤝 Tie!"}
          </div>
          <div className="go-pair">
            <div className="go-col"><div className="go-plbl" style={{ color: "#60a5fa" }}>P1</div><div className="go-score">{p1Score}</div></div>
            <div className="go-sep" />
            <div className="go-col"><div className="go-plbl" style={{ color: "#f472b6" }}>P2</div><div className="go-score">{p2Score}</div></div>
          </div>
        </>
      ) : (
        <>
          {isHumanLimit && <div className="go-humanlimit">HUMAN LIMIT</div>}
          {isNewBest && <NewBestBanner />}

          <div className="go-score-row">
            <div className={`go-num go-num--anim${isNewBest ? " hud-val--pb" : ""}`}>
              {displayScore}
            </div>
            {(dustEarned ?? 0) > 0 && (
              <div className="go-dust-inline">+{dustEarned} 💜</div>
            )}
          </div>

          <div className="go-msg">"{shareMsg}"</div>

          <div className="go-objective-progress">
            <div className="go-objective-header">
              <span>Daily Objective</span>
              <span>{Math.round(objectiveProgress * 100)}%</span>
            </div>
            <div className="go-progress-track">
              <div 
                className="go-progress-fill" 
                style={{ width: `${Math.min(1, objectiveProgress) * 100}%` }} 
              />
            </div>
          </div>
        </>
      )}

      <div className="go-btns">
        <button className="btn-primary" onClick={onPlay}>▶ Again</button>
        <button className="btn-ghost" onClick={() => setShowShare(true)}>📤 Share</button>
        <button className="btn-ghost" onClick={onLeaderboard}>🏆 Board</button>
        <button className="btn-ghost" onClick={onMenu}>🏠 Menu</button>
      </div>

      <a className="go-bug-icon" href={bugHref} target="_blank" rel="noopener" title="Report a bug">
        🐛
      </a>
    </>
  );
}
