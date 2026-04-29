import React from "react";
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
import { useState, useEffect, useRef } from "react";

function ShareCard({ score, mode, gameSeed, onClose }: { score: number; mode: GameMode; gameSeed: number; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup copied timer on unmount
  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);
  const url        = "https://game.mscarabia.com";
  const modeLabel  = mode === "classic" ? "Classic" : "Evolve";
  const shareText  = `🎮 I scored ${score} in Don't Touch the Purple — ${modeLabel} Mode!\nSeed: ${gameSeed}\nCan you beat me? 👇\n${url}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const waUrl      = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copy = () => {
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
  };

  const copySeed = () => {
    try {
      navigator.clipboard?.writeText(gameSeed.toString());
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    } catch {}
  };

  return (
    <div className="share-card">
      <div className="share-inner">
        <div className="share-logo">Don't Touch the <span style={{ color: "#c026d3" }}>Purple</span></div>
        <div className="share-score">{score}</div>
        <div className="share-mode">{modeLabel} Mode</div>
        <div className="share-seed-row">
          <span className="share-seed-label">Seed:</span>
          <span className="share-seed-val">{gameSeed}</span>
          <button className="share-seed-copy" onClick={copySeed} title="Copy seed">{copiedSeed ? "✓" : "📋"}</button>
        </div>
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
        <button className="share-social share-social--copy" onClick={copy}>
          <span className="share-social-icon">{copied ? "✓" : "📋"}</span> {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
      <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={onClose}>← Back</button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────
export interface GameOverProps {
  p1Score:        number;
  p2Score:        number;
  best:           number;
  winner:         Winner;
  mode:           GameMode;
  is2P:           boolean;
  shareMsg:       string;
  gameSeed:       number;
  tick:           number;
  p1:             { gridStage: number; patternIdx: number; health: number; streak: number; alive: boolean; spinLevel?: number };
  initialsEntered: boolean;
  initials:       string;
  onInitialsChange: (v: string) => void;
  onSubmitScore:  () => void;
  onPlay:         () => void;
  onLeaderboard:  () => void;
  onMenu:         () => void;
  spinLevel:      number;
  isHumanLimit?:  boolean;
}

// ─── GameOver ─────────────────────────────────────────────────────
export function GameOver({
  p1Score, p2Score, best, winner, mode, is2P,
  shareMsg, gameSeed, tick, p1,
  initialsEntered, initials, onInitialsChange, onSubmitScore,
  onPlay, onLeaderboard, onMenu, spinLevel,
  isHumanLimit,
}: GameOverProps) {
  const [showShare, setShowShare] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Animated score counter on mount
  useEffect(() => {
    if (is2P || p1Score === 0) { setDisplayScore(p1Score); return; }
    let start: number | null = null;
    const duration = Math.min(1200, 400 + p1Score * 8);
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
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
          <div className="go-num go-num--anim">{displayScore}</div>
          <div className="go-best">Best: {best}</div>
          {p1.streak >= 5 && <div className="go-streak">🔥 {p1.streak} streak</div>}
          <div className="go-msg">"{shareMsg}"</div>
          {p1Score > 0 && <div className={`go-dust-earned${isHumanLimit ? " go-dust-earned--hl" : ""}`}>
            +{p1Score} 💜 dust earned!
          </div>}
          {!initialsEntered ? (
            <div className="go-lb-form">
              <input className="go-input" maxLength={8} placeholder="Your name"
                value={initials}
                onChange={e => onInitialsChange(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, "").slice(0, 8))}
                onKeyDown={e => e.key === "Enter" && onSubmitScore()} />
              <button className="btn-primary btn-sm" onClick={onSubmitScore}>Save</button>
            </div>
          ) : <div className="go-lb-saved">✓ Saved!</div>}
        </>
      )}
      <div className="go-btns">
        <button className="btn-primary" onClick={onPlay}>▶ Again</button>
        <button className="btn-ghost" onClick={() => setShowShare(true)}>📤 Share</button>
        <button className="btn-ghost" onClick={onLeaderboard}>🏆 Board</button>
        <button className="btn-ghost" onClick={onMenu}>🏠 Menu</button>
      </div>
      <a className="go-bug-btn"
        href={`mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${gameSeed})`)}&body=${encodeURIComponent(
          `GAME STATE\n-----------\nScore: ${p1Score}\nMode: ${mode}\nSeed: ${gameSeed}\nTick: ${tick}\nGrid Stage: ${p1.gridStage}\nPattern Idx: ${p1.patternIdx}\nHealth: ${p1.health}\nSpin Level: ${spinLevel}\nStreak: ${p1.streak}\nAlive: ${p1.alive}\n\nDEVICE\n------\nUA: ${navigator.userAgent}\nURL: ${window.location.href}\nScreen: ${window.innerWidth}×${window.innerHeight}\n\nBUG DESCRIPTION\n---------------\n(describe what happened)\n`
        )}`}
        target="_blank" rel="noopener">
        🐛 Report a Bug
      </a>
    </>
  );
}
