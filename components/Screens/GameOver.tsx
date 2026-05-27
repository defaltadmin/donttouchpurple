import React from "react";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import type { GameMode, Winner } from "../../engine/types";
import { useTranslation } from "../../hooks/useTranslation";
import { Icon } from "../UI/Icon";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const MESSAGES: { min: number; max: number; texts: string[] }[] = [
  { min: 0,   max: 4,   texts: ["Bro couldn't avoid ONE color. 💀","The grid had 12 safe colors. You still lost. 🫠","Have you considered... not touching purple?","A goldfish would've scored higher. Scientifically.","Congratulations on finding the worst possible score.","Purple: 1. You: somehow less than 1.","Even accidentally tapping would've been better.","Did you mean to play a different game? 🙃"] },
  { min: 5,   max: 9,   texts: ["Single digits. Your fingers need a firmware update.","That was painful to watch. 😬","You tapped purple like it was the goal.","Somewhere, a purple cell is laughing at you.","Basic difficulty called. It wants a refund.","Bold strategy. Terrible execution.","The tutorial is embarrassed on your behalf."] },
  { min: 10,  max: 19,  texts: ["Double digits. The minimum bar cleared. Barely.","You made it to double digits. The grid is unimpressed.","10+ — technically not a complete disaster.","Your thumbs are getting warmed up, apparently.","Progress! You avoided purple... some of the time.","Not bad for your first conscious attempt.","The grid acknowledges your existence. Faintly."] },
  { min: 20,  max: 34,  texts: ["Now we're cooking. Medium rare. 🔥","The grid is starting to take you seriously.","20+ — you have actual reflexes. Interesting.","You're in the zone. Stay there.","Your thumbs are having a moment.","The purple is slightly nervous. Good.","Something resembling skill detected."] },
  { min: 35,  max: 49,  texts: ["Serious reflexes detected. 🔥","35+? Tell your friends. Brag a little.","Your fingers are professionally trained, apparently.","The grid didn't see that coming.","Almost 50. The threshold of greatness.","You tapped so fast the purple forgot its job.","We're getting somewhere. Keep going."] },
  { min: 50,  max: 74,  texts: ["FIFTY. You're a natural. 🏆","Half-century! Legendary energy.","50+ means fast hands and questionable hobbies.","The grid can't stop you. It's accepted this.","Your mom would be proud. Probably.","50+ and counting. You're becoming the grid.","Genuine talent spotted. Finally."] },
  { min: 75,  max: 99,  texts: ["75+ is elite territory. 👑","Approaching triple digits. A god awakens.","Your fingers are a biological miracle.","The purple filed a formal complaint. About you.","At this point just go pro.","75+ — researchers want to study your hands.","The grid is scared. Keep it scared."] },
  { min: 100, max: 149, texts: ["TRIPLE DIGITS. Frame this. 🤯","100+. You've transcended the average human.","The game is genuinely afraid of you now.","Are you using one hand?? Impressive.","100+ — this score belongs in a museum.","The grid has filed for emotional damages.","Absolute specimen. This is real now."] },
  { min: 150, max: 9999, texts: ["ARE YOU HUMAN?? 👾","150+ — we need to talk about your reflexes.","Legend. Myth. Tap god. You.","The purple has retired. Because of you.","Scientists want to study your nervous system.","You broke the intended difficulty curve. Congratulations.","This score should not be possible. And yet.","GOAT status confirmed. No debate."] },
];

export function getMessage(score: number): string {
  const bucket = MESSAGES.find(b => score >= b.min && score <= b.max) ?? MESSAGES[MESSAGES.length - 1];
  return bucket.texts[Math.floor(Math.random() * bucket.texts.length)];
}

function NewBestBanner() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { scale: 0, opacity: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "var(--font-game)",
        fontSize: 14, letterSpacing: 3, textTransform: "uppercase" as const,
        background: "linear-gradient(90deg, #f9bd22, #f59e0b, #f9bd22)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 0 12px rgba(249,189,34,0.8))",
        animation: "humanLimitPulse 1s ease-in-out infinite, goldShimmer 2s linear infinite",
        backgroundSize: "200% 100%",
      }}
    >
      ✨ {t('gameover.new_best')} ✨
    </div>
  );
}

export interface GameOverProps {
  p1Score: number; p2Score: number; best: number;
  winner: Winner; mode: GameMode; is2P: boolean;
  shareMsg: string; gameSeed: number; tick: number;
  p1: { gridStage: number; patternIdx: number; health: number; streak: number; alive: boolean };
  onAgain: () => void; onLeaderboard: () => void; onMenu: () => void;
  spinLevel: number; isHumanLimit?: boolean;
  dustEarned?: number; objectiveProgress?: number;
}

export function GameOver({
  p1Score, p2Score, best, winner, mode, is2P,
  shareMsg, gameSeed, tick, p1,
  onAgain, onLeaderboard, onMenu, spinLevel,
  isHumanLimit, dustEarned, objectiveProgress = 0,
}: GameOverProps) {
  const { t } = useTranslation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTrapRef = useFocusTrap<HTMLDivElement>(showShareModal);
  const finalScoreRef = useRef(p1Score);
  useEffect(() => { finalScoreRef.current = p1Score; }, [p1Score]); // BUG-NEW-001: keep ref in sync
  const [displayScore, setDisplayScore] = useState(0);
  const isNewBest = !is2P && p1Score > 0 && p1Score >= best;
  const actionsRef = useRef<HTMLDivElement>(null);
  const scoreObj = useRef({ val: 0 });

  useEffect(() => {
    const score = finalScoreRef.current;
    if (is2P || score === 0) { setDisplayScore(score); return; }

    const ctx = gsap.context(() => {
      // Score count-up
      scoreObj.current.val = 0;
      gsap.to(scoreObj.current, {
        val: score,
        duration: Math.min(1.2, 0.4 + score * 0.008),
        ease: "power3.out",
        snap: { val: 1 },
        onUpdate: () => setDisplayScore(Math.round(scoreObj.current.val)),
      });

      // Button stagger entrance
      if (actionsRef.current) {
        const buttons = actionsRef.current.querySelectorAll(".btn-primary, .btn-ghost, .go-small-actions");
        gsap.from(buttons, {
          opacity: 0, y: 20,
          duration: 0.4,
          stagger: 0.08,
          ease: "back.out(1.5)",
          delay: 0.2,
        });
      }
    });

    return () => ctx.revert();
  }, [is2P]);

  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);

  const bugHref = React.useMemo(() => `mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${gameSeed})`)}&body=${encodeURIComponent(
    `Score: ${p1Score}\nMode: ${mode}\nSeed: ${gameSeed}\nTick: ${tick}\nHealth: ${p1.health}\nSpin: ${spinLevel}\nStreak: ${p1.streak}\n\nUA: ${navigator.userAgent}\nURL: ${window.location.pathname}\nScreen: ${window.innerWidth}×${window.innerHeight}\n\n(describe what happened)\n`
  )}`, [p1Score, mode, gameSeed, tick, p1.health, spinLevel, p1.streak]);

  return (
    <>
      <div className="go-eyebrow">{is2P ? t('gameover.round_over') : t('gameover.game_over')}</div>

      {is2P ? (
        <>
          <div className="go-winner">
            {winner === "p1" ? t('gameover.p1_wins') : winner === "p2" ? t('gameover.p2_wins') : t('gameover.tie')}
          </div>
          <div className="go-pair">
            <div className="go-col"><div className="go-plbl" style={{ color: "#60a5fa" }}>P1</div><div className="go-score">{p1Score}</div></div>
            <div className="go-sep" />
            <div className="go-col"><div className="go-plbl" style={{ color: "#f472b6" }}>P2</div><div className="go-score">{p2Score}</div></div>
          </div>
        </>
      ) : (
        <>
          {isHumanLimit && <div className="go-humanlimit">{t('gameover.human_limit')}</div>}
          {isNewBest && <NewBestBanner />}
          <div className="go-score-row">
            <div className={`go-num go-num--anim${isNewBest ? " hud-val--pb" : ""}`}>{displayScore}</div>
            {(dustEarned ?? 0) > 0 && <div className="go-dust-inline">+{dustEarned} 💜</div>}
          </div>
          <div className="go-msg">&ldquo;{shareMsg}&rdquo;</div>
          <div className="go-objective-progress">
            <div className="go-objective-header">
              <span>Daily</span>
              <span>{Math.round(objectiveProgress * 100)}%</span>
            </div>
            <div className="go-progress-track">
              <div className="go-progress-fill" style={{ width: `${Math.min(1, objectiveProgress) * 100}%` }} />
            </div>
          </div>
        </>
      )}

      <div className="go-actions" ref={actionsRef}>
        <button
          className="btn-primary btn-large"
          onClick={onAgain}
        >▶ {t('gameover.again')}</button>
        <button
          className="btn-ghost"
          onClick={() => setShowShareModal(true)}
        >🔗 {t('gameover.share')}</button>
        <div className="go-small-actions">
          <button className="btn-icon" onClick={onLeaderboard}><Icon name="trophy" size={20} /></button>
          <button className="btn-icon" onClick={onMenu}>☰</button>
        </div>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)} onKeyDown={e => { if (e.key === 'Escape') setShowShareModal(false); }} role="dialog" aria-modal="true" aria-label={t('gameover.share_title')} tabIndex={-1} ref={shareTrapRef}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{t('gameover.share_title')}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn-ghost" onClick={() => {
                const text = `I just scored ${p1Score} in Don't Touch Purple (${mode})! 🔥\nCan you beat me?\nSeed: ${gameSeed}\nhttps://dont-touch-purple.web.app`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}><Icon name="share" size={16} /> WhatsApp</button>
              <button className="btn-ghost" onClick={() => {
                const text = `Just dropped ${p1Score} in Don't Touch Purple (${mode.toUpperCase()}) 🔥 Beat my seed? ${gameSeed}\nhttps://dont-touch-purple.web.app`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}>𝕏 {t('gameover.challenge')}</button>
              <button className="btn-ghost" onClick={() => {
                try {
                  const W = 600, H = 315;
                  const canvas = document.createElement("canvas");
                  canvas.width = W; canvas.height = H;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const bg = ctx.createLinearGradient(0, 0, W, H);
                  bg.addColorStop(0, "#151028"); bg.addColorStop(1, "#1e0a46");
                  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
                  const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 220);
                  glow.addColorStop(0, "rgba(192,38,211,0.18)"); glow.addColorStop(1, "transparent");
                  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
                  ctx.strokeStyle = "rgba(192,38,211,0.5)"; ctx.lineWidth = 2;
                  ctx.strokeRect(1, 1, W-2, H-2);
                  ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px system-ui, sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText("DON'T TOUCH THE", W/2, 60);
                  ctx.fillStyle = "#c026d3"; ctx.font = "bold 26px system-ui, sans-serif";
                  ctx.fillText("PURPLE", W/2, 92);
                  ctx.fillStyle = "#ffffff"; ctx.font = "bold 88px system-ui, sans-serif";
                  ctx.fillText(String(p1Score), W/2, 200);
                  const ml = mode === "classic" ? "Classic" : "Evolve";
                  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "16px system-ui, sans-serif";
                  ctx.fillText(`${ml} Mode · Seed ${gameSeed}`, W/2, 235);
                  ctx.fillStyle = "rgba(192,38,211,0.9)"; ctx.font = "bold 14px system-ui, sans-serif";
                  ctx.fillText("Can you beat this? → game.mscarabia.com", W/2, 285);
                  // UX-001: Use toBlob for async non-blocking PNG encoding
                  canvas.toBlob((blob) => {
                    if (!blob) return;
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `dtp-score-${p1Score}.png`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }, "image/png");
                } catch { /* canvas not available */ }
              }}>🖼️ Save Card</button>
              <button className="btn-ghost" onClick={() => {
                const url = `https://dont-touch-purple.web.app/?seed=${gameSeed}&mode=${mode}`;
                navigator.clipboard.writeText(`I scored ${p1Score} in Don't Touch Purple! Can you beat me?\n${url}`).then(() => {
                  setCopied(true);
                  if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
                  copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
                }).catch(() => {});
              }}>{copied ? "✓ Copied!" : "📋 Copy Link"}</button>
              <button className="btn-ghost" onClick={() => setShowShareModal(false)}>{t('ui.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <a className="go-bug-icon" href={bugHref} target="_blank" rel="noopener noreferrer" title="Report a bug">🐛</a>
    </>
  );
}
