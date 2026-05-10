# DTP v6.2 — Architecture & Implementation Roadmap
# For implementation by Qwen / DeepSeek / Grok + opencode
# Each task is self-contained. Read the CONTEXT block before writing any code.
# All code is TypeScript unless noted. Follow existing conventions in the codebase.

---

## TASK INDEX

| # | Task | Priority | Effort | Risk |
|---|------|----------|--------|------|
| T1 | TickProcessor extraction from GameEngine | High | Large | Medium |
| T2 | BotController extraction from GameEngine | Medium | Medium | Low |
| T3 | score-validator.js → TypeScript (Cloudflare Worker) | Medium | Small | Low |
| T4 | useSafeRaf migration for background components | Low | Medium | Low |
| T5 | Firebase token refresh (short-lived tokens) | High | Small | Low |
| T6 | i18n: locale selector gating + type safety | Low | Small | Low |
| T7 | Achievement unlock telemetry guard | Medium | Small | Low |
| T8 | GameEngine: remove dead public API | Low | Small | Low |

---

## T1 — TickProcessor: Extract processTick() from GameEngine

### CONTEXT
`GameEngine.processTick()` is currently ~250 lines handling six distinct concerns:
delta timers, rare mode lifecycle, per-player cell expiry/damage, hold cell expiry,
bot assist in-tick logic, shuffle/bomb/boss triggers, survival bonus, and session save.
Goal: extract these into a `TickProcessor` class so `processTick()` becomes an
orchestrator of ~20 lines. GameEngine keeps all state; TickProcessor receives a
read/write context object each tick.

### FILES TO CREATE
- `engine/subsystems/TickProcessor.ts` (new)

### FILES TO MODIFY
- `engine/GameEngine.ts` (replace `processTick()` body, add `_ticker` field)

### SHARED TYPES (add to `engine/types.ts`)
```typescript
// Add to engine/types.ts
export interface TickContext {
  // Read/write engine state passed into TickProcessor each tick
  phase:              'playing' | 'paused' | 'gameover' | 'humanlimit';
  mode:               GameMode;
  numPlayers:         NumPlayers;
  tickCount:          number;
  evolveTick:         number;
  spinLevel:          number;
  rng:                () => number;
  rareMode:           RareColorMode;
  bossEvent:          BossEvent | null;
  _bossActive:        boolean;
  _isInverted:        boolean;
  nextBossTriggerScore: number;
  nextShuffleTick:    number;
  cellShape:          CellShape;
  devGodMode:         boolean;
  devForcedPwr:       string | null;
  botAssistActive:    { 1: boolean; 2: boolean };
  config:             GameConfig;
  p1:                 PlayerState;
  p2:                 PlayerState;
  dirty:              boolean;
  // Callbacks back into GameEngine (avoid circular refs by using lambdas)
  emit:               GameEngine['emit'];
  triggerGameOver:    GameEngine['triggerGameOver'];
  triggerBossEvent:   GameEngine['triggerBossEvent'];
  tryShuffleCells:    GameEngine['tryShuffleCells'];
  trySpawnBomb:       GameEngine['trySpawnBomb'];
  checkStageProgress: GameEngine['checkStageProgress'];
  autoSaveSession:    () => void;
}
```

### TickProcessor.ts — FULL IMPLEMENTATION SPEC
```typescript
// engine/subsystems/TickProcessor.ts
// PURPOSE: Encapsulates all per-tick logic extracted from GameEngine.processTick().
// GameEngine.processTick() will call TickProcessor.run(ctx) and nothing else.
// RULE: TickProcessor MUST NOT import GameEngine (would create circular dependency).
//       All engine state is passed via TickContext.

import { pickCellShape, pickPattern, spawnActive, activeToCellsP } from '../DifficultyScaler';
import { EVOLVE_PATTERNS, RARE_COLORS, GAME } from '../constants';
import { rhythmFeedback } from '../../utils/rhythm';
import { haptics } from '../../utils/haptics';
import { shouldTriggerShieldBoss } from './EventOrchestrator';
import { bossEngine } from '../../utils/boss-engine';
import type { TickContext, ActiveCell, PlayerState } from '../types';

export class TickProcessor {
  run(ctx: TickContext): void {
    // Delegate to private methods in logical order matching original processTick
    this._advanceRareMode(ctx);
    this._processPlayers(ctx);
    this._processBotAssist(ctx);
    this._processEvolveExtras(ctx);         // shuffle, bomb, boss trigger
    this._processShieldBoss(ctx);
    this._advanceTickCounters(ctx);         // tickCount++, autoSave, survival bonus, sound
  }

  // ── Rare mode lifecycle (evolve only) ─────────────────────────
  private _advanceRareMode(ctx: TickContext): void {
    // IMPLEMENT: copy rare mode block from processTick lines ~495–520
    // Decrement turnsLeft, reset on expiry, pre-warn at RARE_TRIGGER_INTERVAL - 3,
    // trigger new rare color at score milestones
  }

  // ── Per-player: cell expiry, hold expiry, spawn next batch ────
  private _processPlayers(ctx: TickContext): void {
    const players = [
      { ref: ctx.p1, pi: 0 as const },
      { ref: ctx.p2, pi: 1 as const },
    ];
    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && ctx.numPlayers === 1)) continue;
      this._processPendingStageUpdate(ctx, ref, pi);
      this._expireMissedCells(ctx, ref, pi);
      if (!ref.alive) continue;
      this._expireHoldCells(ctx, ref, pi);
      this._spawnNextBatch(ctx, ref, pi);
    }
  }

  private _processPendingStageUpdate(ctx: TickContext, ref: PlayerState, pi: 0 | 1): void {
    // IMPLEMENT: copy pendingStageUpdate block from processTick lines ~522–533
  }

  private _expireMissedCells(ctx: TickContext, ref: PlayerState, pi: 0 | 1): void {
    // IMPLEMENT: copy the ref.active.forEach miss-detection block lines ~543–575
    // KEY: use the v6.1 DDA shield fix — dda.recordAttempt(false, 0, died) where
    // died=false when shield absorbs, died=true when health is lost
  }

  private _expireHoldCells(ctx: TickContext, ref: PlayerState, pi: 0 | 1): void {
    // IMPLEMENT: copy hold cell expiry block lines ~580–605
  }

  private _spawnNextBatch(ctx: TickContext, ref: PlayerState, pi: 0 | 1): void {
    // IMPLEMENT: copy spawnActive / activeToCellsP / devForcedPwr / pwr-drop anim
    // block lines ~606–642
  }

  // ── Bot assist in-tick path (low-accuracy secondary path) ─────
  private _processBotAssist(ctx: TickContext): void {
    // IMPLEMENT: copy bot assist block lines ~644–680
    // NOTE: The timer-based bot (startBot/stopBot) stays in GameEngine.
    //       This in-tick path is the secondary low-accuracy sweep.
  }

  // ── Evolve extras: shuffle, bomb, boss trigger ─────────────────
  private _processEvolveExtras(ctx: TickContext): void {
    if (ctx.mode !== 'evolve') return;
    // IMPLEMENT: copy storm shuffle, boss trigger score check, bomb spawn
    // block lines ~682–718
  }

  // ── Shield boss ────────────────────────────────────────────────
  private _processShieldBoss(ctx: TickContext): void {
    // IMPLEMENT: copy shouldTriggerShieldBoss block lines ~720–724
    if (shouldTriggerShieldBoss(ctx.p1.score, ctx._bossActive, ctx.bossEvent !== null, ctx.mode, ctx.rng)) {
      ctx._bossActive = true;
      bossEngine.activate(5 + Math.floor(ctx.rng() * 3));
    }
  }

  // ── Tick counters, auto-save, survival bonus, sound ───────────
  private _advanceTickCounters(ctx: TickContext): void {
    ctx.tickCount += 1;
    if (ctx.tickCount % 10 === 0) ctx.autoSaveSession();
    if (ctx.phase === 'playing' && ctx.tickCount >= GAME.HUMAN_LIMIT_TICK) {
      ctx.phase = 'humanlimit';
      ctx.emit({ type: 'phaseChange', phase: 'humanlimit' });
    }
    if (ctx.tickCount > GAME.SURVIVAL_BONUS_START_TICK && ctx.tickCount % 20 === 0) {
      const bonus     = ctx.tickCount > 200 ? 5 : ctx.tickCount > 120 ? 3 : 2;
      const multBonus = Math.round(bonus * rhythmFeedback.state.multiplier);
      if (ctx.p1.alive) ctx.p1.score += multBonus;
      if (ctx.numPlayers === 2 && ctx.p2.alive) ctx.p2.score += multBonus;
      ctx.emit({ type: 'toast', message: `🔥 Survival +${multBonus}!` });
    }
    ctx.dirty = true;
    // tickSoundCounter stays in GameEngine — emit sound every 4 ticks
  }
}

export const tickProcessor = new TickProcessor();
```

### GameEngine.ts — REPLACEMENT processTick()
```typescript
// engine/GameEngine.ts — replace the entire processTick() body with:
private processTick(): void {
  try {
    if (this.phase !== 'playing') return;

    // Delta timer flush (stays here — too tightly coupled to timing)
    const now   = performance.now();
    const delta = Math.min(now - this._lastTickTs, 100);
    this._lastTickTs = now;
    this._deltaTimers = this._deltaTimers.filter(timer => {
      timer.remaining -= delta;
      if (timer.remaining <= 0) { timer.callback(); return false; }
      return true;
    });
    this._flushTapBuffer(1);
    if (this.config.numPlayers === 2) this._flushTapBuffer(2);

    // All game logic delegated to TickProcessor
    tickProcessor.run(this._buildTickContext());

    // Sound counter (reads tickCount after TickProcessor incremented it)
    this._tickSoundCounter++;
    if (this._tickSoundCounter % 4 === 0) this.emit({ type: 'sound', name: 'tick' });

  } catch (err) {
    logError('[GameEngine] processTick crashed:', err);
    errorTracker.capture(err instanceof Error ? err : new Error(String(err)), {
      phase: 'processTick', tick: this.tickCount,
    });
    this.emit({ type: 'toast', message: '⚠️ Engine error — game ended' });
  }
}

// Add this private method to GameEngine:
private _buildTickContext(): TickContext {
  return {
    phase:              this.phase,
    mode:               this.config.mode,
    numPlayers:         this.config.numPlayers,
    tickCount:          this.tickCount,
    evolveTick:         this.evolveTick,
    spinLevel:          this.spinLevel,
    rng:                this.rng,
    rareMode:           this.rareMode,
    bossEvent:          this.bossEvent,
    _bossActive:        this._bossActive,
    _isInverted:        this._isInverted,
    nextBossTriggerScore: this.nextBossTriggerScore,
    nextShuffleTick:    this.nextShuffleTick,
    cellShape:          this.cellShape,
    devGodMode:         this.devGodMode,
    devForcedPwr:       this.devForcedPwr,
    botAssistActive:    this.botAssistActive,
    config:             this.config,
    p1:                 this.p1,
    p2:                 this.p2,
    dirty:              this.dirty,
    emit:               this.emit.bind(this),
    triggerGameOver:    this.triggerGameOver.bind(this),
    triggerBossEvent:   this.triggerBossEvent.bind(this),
    tryShuffleCells:    this.tryShuffleCells.bind(this),
    trySpawnBomb:       this.trySpawnBomb.bind(this),
    checkStageProgress: this.checkStageProgress.bind(this),
    autoSaveSession:    this.autoSaveSession.bind(this),
  };
}
// After tickProcessor.run(), sync mutated fields back:
// ctx is passed by reference for objects (p1, p2, rareMode) so they auto-sync.
// Primitive fields mutated by TickProcessor (tickCount, evolveTick, etc.)
// need explicit sync — either pass a wrapper object or use a post-run sync:
// this.tickCount   = ctx.tickCount;
// this.evolveTick  = ctx.evolveTick;
// this.spinLevel   = ctx.spinLevel;
// this._bossActive = ctx._bossActive;
// this.phase       = ctx.phase;
// this.dirty       = ctx.dirty;
// this.devForcedPwr = ctx.devForcedPwr;
```

### IMPLEMENTATION NOTES FOR AI
1. Copy each block from the original `processTick()` verbatim into the matching private method.
2. Replace `this.xxx` with `ctx.xxx` throughout.
3. The `dda` field is NOT in TickContext — pass it via the emit/callback pattern OR add
   `dda: GameEngine['dda']` to TickContext (preferred — just add the field).
4. After `tickProcessor.run(ctx)`, sync all primitive fields back from `ctx` to `this`.
5. Run `tsc --noEmit` after implementation. The test suite has coverage for processTick behaviour.

---

## T2 — BotController: Extract bot logic from GameEngine

### CONTEXT
`startBot()`, `stopBot()`, `isBotActive()`, and related fields (`botIntervalRef`,
`botActive`, `dustSpentTotal`, `botAssistActive`) currently live in GameEngine (~90 lines).
Goal: extract into `BotController` which receives callbacks to read/write engine state.

### FILES TO CREATE
- `engine/subsystems/BotController.ts` (new)

### FILES TO MODIFY
- `engine/GameEngine.ts` (replace bot fields + methods with `_bot: BotController`)

### BotController.ts — FULL IMPLEMENTATION SPEC
```typescript
// engine/subsystems/BotController.ts
import { logger } from '../../utils/logger';

export interface BotConfig {
  getDust:     () => number;
  spendDust:   (amount: number) => void;
  getAccuracy: () => number;
}

export interface BotCallbacks {
  // Called to read current danger color (rare mode aware)
  getDangerColor:  () => string;
  // Called to check if inversion boss is active
  isInverted:      () => boolean;
  // Called to simulate a tap (routes through engine handleTap)
  handleTap:       (player: 1 | 2, idx: number) => void;
  // Called to broadcast events
  emit:            (event: { type: string; [k: string]: unknown }) => void;
  // Called to read p1 active cells
  getActiveCells:  (player: 1 | 2) => import('../types').ActiveCell[];
  // Called to check if phase is 'playing'
  isPlaying:       () => boolean;
}

export class BotController {
  private _active:        { 1: boolean; 2: boolean } = { 1: false, 2: false };
  private _intervalRef:   ReturnType<typeof setInterval> | null = null;
  private _dustSpentTotal = 0;
  private _rng:           (() => number) | null = null;

  constructor(private callbacks: BotCallbacks) {}

  /** Call once on GameEngine.start() to wire the seeded RNG */
  setRng(rng: () => number) { this._rng = rng; }

  start(mode: string, config?: BotConfig): void {
    if (mode !== 'evolve') return;
    this._stop();

    const botCfg: BotConfig = config ?? {
      getDust:     () => 9999,
      spendDust:   () => {},
      getAccuracy: () => 1,
    };

    this._active[1]    = true;
    this._dustSpentTotal = 0;

    this._intervalRef = setInterval(() => {
      if (!this._active[1] || !this.callbacks.isPlaying()) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const dust = botCfg.getDust();
      if (dust < 30) {
        this._active[1] = false;
        this.callbacks.emit({ type: 'toast', message: '🤖 Bot off — low dust!' });
        return;
      }

      const delay      = Math.max(80, 200 - this._dustSpentTotal * 0.5);
      const accuracy   = botCfg.getAccuracy();
      const danger     = this.callbacks.getDangerColor();
      const costPerTap = 3;
      const rng        = this._rng ?? Math.random;

      for (const cell of this.callbacks.getActiveCells(1)) {
        if (cell.clicked) continue;
        if ((cell.type as string) === 'void') continue;
        if (cell.type === danger) continue;
        if (cell.type === 'hold' || cell.type === 'ice') continue;
        if (rng() > accuracy) continue;

        const dustNow = botCfg.getDust();
        if (dustNow < costPerTap) break;

        botCfg.spendDust(costPerTap);
        this._dustSpentTotal += costPerTap;
        this.callbacks.emit({ type: 'dustConsumed', amount: costPerTap });

        const idx = cell.idx;
        setTimeout(() => {
          if (!this._active[1] || !this.callbacks.isPlaying()) return;
          this.callbacks.handleTap(1, idx);
          this.callbacks.emit({ type: 'botTap', player: 1, idx, dustCost: costPerTap });
        }, delay);
      }
    }, 1000);
  }

  private _stop(): void {
    if (this._intervalRef) {
      clearInterval(this._intervalRef);
      this._intervalRef = null;
    }
  }

  stop(): void {
    this._active[1] = false;
    this._stop();
  }

  isActive(): boolean { return this._active[1]; }

  setAssist(player: 1 | 2, enabled: boolean): void {
    this._active[player] = enabled;
    if (player === 1) {
      // Mode check is caller's responsibility
      if (enabled) logger.info('BotController: assist enabled for P1');
      else this.stop();
    }
  }

  getAssistState(): { 1: boolean; 2: boolean } {
    return { ...this._active };
  }

  /** Must be called on engine stop/reset to clear the interval. */
  dispose(): void { this._stop(); this._active = { 1: false, 2: false }; }
}
```

### GameEngine.ts — WIRING SPEC
```typescript
// engine/GameEngine.ts — replace bot fields with _bot instance

// REMOVE these fields:
//   private botAssistActive: { 1: boolean; 2: boolean } = { 1: false, 2: false };
//   private botIntervalRef: ReturnType<typeof setInterval> | null = null;
//   private botActive = false;
//   private dustSpentTotal = 0;

// ADD field:
private _bot: BotController;

// In constructor, after existing init:
this._bot = new BotController({
  getDangerColor:  () => this.rareMode.active ? this.rareMode.color : 'purple',
  isInverted:      () => this.bossEvent?.type === 'inversion' && Date.now() < (this.bossEvent?.endsAt ?? 0),
  handleTap:       (player, idx) => this.handleTap(player, idx),
  emit:            (event) => this.emit(event as any),
  getActiveCells:  (player) => (player === 1 ? this.p1 : this.p2).active,
  isPlaying:       () => this.phase === 'playing',
});

// In start():
this._bot.setRng(this.rng);

// In stop() and safeReset():
this._bot.dispose();

// REPLACE public methods:
startBot(): void   { this._bot.start(this.config.mode, this.config.botAssist); }
stopBot(): void    { this._bot.stop(); }
isBotActive(): boolean { return this._bot.isActive(); }
setBotAssist(player: 1 | 2, enabled: boolean): void {
  this._bot.setAssist(player, enabled);
  if (player === 1 && enabled) this._bot.start(this.config.mode, this.config.botAssist);
}
getBotAssistActive(): { 1: boolean; 2: boolean } { return this._bot.getAssistState(); }

// In TickContext (_buildTickContext), replace:
//   botAssistActive: this.botAssistActive,
// with:
//   botAssistActive: this._bot.getAssistState(),
```

---

## T3 — score-validator.js → TypeScript (Cloudflare Worker)

### CONTEXT
`workers/score-validator.js` is plain JS in a TypeScript project.
Migrate to TypeScript using wrangler types. Replace static `FIREBASE_ACCESS_TOKEN`
env var with short-lived token via Google's OAuth2 token endpoint.

### FILES TO CREATE
- `workers/score-validator.ts` (new — replaces .js)
- `workers/wrangler.toml` update (add `main = "score-validator.ts"`)

### score-validator.ts — FULL IMPLEMENTATION SPEC
```typescript
// workers/score-validator.ts
import type { ExportedHandler, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  RATE_LIMIT_KV:        KVNamespace;
  FIREBASE_PROJECT_ID:  string;
  // Replace FIREBASE_ACCESS_TOKEN with service account credentials:
  GCP_SERVICE_ACCOUNT_EMAIL:  string;
  GCP_SERVICE_ACCOUNT_KEY_B64: string;  // base64 PEM private key
}

interface ScorePayload {
  score:     number;
  initials:  string;
  mode:      'classic' | 'evolve';
  badge?:    string;
  date?:     string;
  tick:      number;      // required since v6.1
  sessionId: string;      // required since v6.1
}

// ── Token cache (in-memory, reused across requests within same isolate) ──────
let _cachedToken: string | null = null;
let _tokenExpiry  = 0;

async function getFirebaseToken(env: Env): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;

  // Build JWT for Google OAuth2
  const now    = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim  = btoa(JSON.stringify({
    iss:   env.GCP_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }));

  // Import PEM key (base64 decoded from env)
  const pemStr = atob(env.GCP_SERVICE_ACCOUNT_KEY_B64);
  const pemBody = pemStr.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)).buffer;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
  const toSign    = new TextEncoder().encode(`${header}.${claim}`);
  const sigBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, toSign);
  const sig       = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
  const jwt       = `${header}.${claim}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json<{ access_token: string; expires_in: number }>();
  _cachedToken = json.access_token;
  _tokenExpiry  = Date.now() + json.expires_in * 1000;
  return _cachedToken;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST')
      return json({ error: 'Method Not Allowed' }, 405);

    try {
      const data = await request.json<ScorePayload>();
      const ip   = request.headers.get('cf-connecting-ip') ?? 'unknown';

      // ── Rate limiting ──────────────────────────────────────────
      const rateKey = `rate:${ip}:${(data.initials ?? 'anon').toLowerCase()}`;
      const now     = Date.now();
      let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
      attempts = attempts.filter(ts => now - ts < 60_000);
      if (attempts.length >= 8) return json({ error: 'Rate limit exceeded' }, 429);
      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 90 });

      // ── Validation ─────────────────────────────────────────────
      if (typeof data.score !== 'number' || data.score < 0 || data.score > 9999)
        return json({ error: 'Invalid score' }, 400);
      if (!data.initials || typeof data.initials !== 'string' || data.initials.length > 8)
        return json({ error: 'Invalid initials' }, 400);
      if (!data.mode || !['classic', 'evolve'].includes(data.mode))
        return json({ error: 'Invalid mode' }, 400);
      if (typeof data.tick !== 'number' || data.tick < 0)
        return json({ error: 'Missing tick' }, 400);
      if (data.score > data.tick * 15 + 300)
        return json({ error: 'Impossible score' }, 400);
      if (typeof data.sessionId !== 'string' || data.sessionId.length < 8)
        return json({ error: 'Missing session' }, 400);

      // ── Firebase write (short-lived token) ────────────────────
      const token       = await getFirebaseToken(env);
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/lb_global`;

      const payload = {
        fields: {
          score:     { integerValue: data.score.toString() },
          initials:  { stringValue: data.initials },
          mode:      { stringValue: data.mode },
          badge:     { stringValue: data.badge ?? '' },
          date:      { stringValue: data.date ?? new Date().toISOString().split('T')[0] },
          ts:        { timestampValue: new Date().toISOString() },
          sessionId: { stringValue: data.sessionId },
        },
      };

      const fbRes = await fetch(`${firebaseUrl}?documentId=auto`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!fbRes.ok) {
        console.error('Firebase write failed:', await fbRes.text());
        return json({ error: 'Database error' }, 502);
      }

      return json({ success: true, score: data.score });

    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Internal server error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### wrangler.toml — UPDATE
```toml
# workers/wrangler.toml — update main entry:
main = "score-validator.ts"

# Add secrets (do NOT put values here — use `wrangler secret put`):
# wrangler secret put GCP_SERVICE_ACCOUNT_EMAIL
# wrangler secret put GCP_SERVICE_ACCOUNT_KEY_B64
# wrangler secret delete FIREBASE_ACCESS_TOKEN  ← remove old static token
```

---

## T4 — useSafeRaf Migration for Background Components

### CONTEXT
All background components hand-roll their RAF pattern. The codebase already has a
`useSafeRaf` hook in `utils/cleanup-pattern.ts`. Migrate all backgrounds to use it.
This ensures consistent cleanup on unmount and reduces ~30 lines of boilerplate per file.

### FILES TO MODIFY
All of: `VoidTunnel.tsx`, `StarWarp.tsx`, `GridPulse.tsx`, `AmbientFlow.tsx`,
`PurpleCascade.tsx`, `BlockOrbit.tsx`, `DataStream.tsx`, `CellBreath.tsx`,
`WarpGate.tsx`, `PulseField.tsx`, `GlitchGrid.tsx`
(PurpleRain was already fixed in v6.1)

### MIGRATION PATTERN (apply to each file)
```typescript
// BEFORE (typical pattern in each background):
const animationRef = useRef<number | null>(null);

useEffect(() => {
  const animate = (time: number) => {
    // ... draw logic ...
    animationRef.current = requestAnimationFrame(animate);
  };
  animationRef.current = requestAnimationFrame(animate);
  return () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };
}, []);

// AFTER — using useSafeRaf from cleanup-pattern.ts:
import { useSafeRaf } from '../../utils/cleanup-pattern';

const { start, stop } = useSafeRaf((time) => {
  // ... draw logic (same as animate body, but no recursive rAF call needed) ...
});

// In the register() call:
const unregister = register({ pause: stop, resume: start });

useEffect(() => {
  start();
  return stop;
}, [start, stop]);
```

### NOTES FOR AI
- Check the actual signature of `useSafeRaf` in `cleanup-pattern.ts` before implementing.
- The hook should return `{ start, stop }` — if it doesn't, propose an update.
- Each background's animation state (particles, droplets, etc.) stays in refs as before.
- Frame-rate throttling (`lastFrameRef` pattern) should be preserved inside the callback.

---

## T5 — Firebase Token Refresh

### CONTEXT
`FIREBASE_ACCESS_TOKEN` in the Cloudflare Worker env is a static long-lived token.
If leaked, it provides indefinite write access to Firestore. T3 (score-validator.ts)
already includes the short-lived token implementation. This task is the deployment steps.

### DEPLOYMENT STEPS (run in terminal)
```bash
# 1. Create a service account in GCP Console with Firestore write-only role
# 2. Download JSON key, extract the private_key and client_email fields
# 3. Base64-encode the private key PEM:
cat service-account-key.pem | base64 | tr -d '\n' > key.b64

# 4. Set wrangler secrets:
wrangler secret put GCP_SERVICE_ACCOUNT_EMAIL   # paste client_email value
wrangler secret put GCP_SERVICE_ACCOUNT_KEY_B64 # paste contents of key.b64

# 5. Remove old static token:
wrangler secret delete FIREBASE_ACCESS_TOKEN

# 6. Deploy:
wrangler deploy
```

---

## T6 — i18n: Locale Selector Gating + Type Safety

### CONTEXT
`i18n.ts` exposes `getAvailable()` which returns whichever locales loaded.
The UI should only show locale options for locales that have > 0 keys loaded.
Since v6.1 all 4 locales (es/fr/ja/pt) are now populated, this is a safeguard.
Also add a type-safe key type to catch missing key additions at compile time.

### utils/i18n.ts — CHANGES
```typescript
// ADD: typed key union (generated from en.json key list)
// Put this in a separate file so it can be auto-generated:

// utils/i18n-keys.ts (new — generate from en.json)
export type I18nKey =
  | 'game.title' | 'menu.play' | 'menu.resume' | 'menu.shop'
  | 'menu.leaderboard' | 'menu.settings'
  | 'hud.score' | 'hud.hearts' | 'hud.time' | 'hud.combo'
  | 'hud.survival' | 'hud.need_dust'
  | 'boss.shield' | 'boss.phase' | 'boss.defeated'
  | 'ui.pause' | 'ui.resume' | 'ui.restart' | 'ui.menu'
  | 'ui.try_theme' | 'ui.previewing' | 'ui.offset_cursor'
  | 'ui.colorblind' | 'ui.icon_mode' | 'ui.lite_mode'
  | 'ui.emergency_difficulty'
  | 'onboarding.tap_safe' | 'onboarding.avoid_danger' | 'onboarding.start'
  | 'share.copy_link' | 'share.copied'
  | 'toast.game_restored'
  | 'error.crash' | 'error.copy_debug' | 'error.retry' | 'error.try_again';

// In i18n.ts — update t() signature:
// BEFORE: t(key: string, ...
// AFTER:
import type { I18nKey } from './i18n-keys';
t(key: I18nKey, params?: Record<string, string | number>): string { ... }

// ALSO update getAvailable() to filter empty dicts:
getAvailable(): Locale[] {
  return (Object.entries(this.dicts) as [Locale, Dict][])
    .filter(([, d]) => Object.keys(d).length > 0)
    .map(([lang]) => lang);
}
```

---

## T7 — Achievement Unlock Telemetry Guard

### CONTEXT
Achievement unlocks call `achievementSystem.unlock()` which fires telemetry.
If telemetry fires before `privacyManager.getConsent()` is confirmed, it violates
the user's intent. Guard all telemetry dispatches.

### utils/achievement-system.ts — CHANGE PATTERN
```typescript
// Wherever telemetry is emitted after an unlock, wrap with consent check:

// BEFORE:
achievementSystem.on('unlock', (ach) => {
  telemetry.track('achievement_unlocked', { id: ach.id });
});

// AFTER:
achievementSystem.on('unlock', (ach) => {
  if (privacyManager.getConsent()) {
    telemetry.track('achievement_unlocked', { id: ach.id });
  }
});
```

---

## T8 — GameEngine: Remove Dead Public API

### CONTEXT
Three public methods on GameEngine are thin pass-throughs to `privacyManager`
and are not called anywhere outside the class (verified via grep).
Removing them shrinks the public API surface.

### GameEngine.ts — REMOVE THESE METHODS
```typescript
// DELETE these three methods entirely:
isTelemetryAllowed() { return privacyManager.getConsent(); }
exportUserData() { return privacyManager.getAllData(); }
wipeUserData(keepSettings: boolean) { privacyManager.deleteAll(keepSettings); }
```

### NOTE FOR AI
Before deleting, run:
```bash
grep -rn "isTelemetryAllowed\|exportUserData\|wipeUserData" src/
```
If any results exist outside GameEngine.ts, keep the method or update the caller.

---

## IMPLEMENTATION ORDER (recommended)

```
T3 → T5   (Worker migration + secrets — independent, no app changes)
T8         (trivial, reduces noise in later tasks)
T7         (trivial, privacy correctness)
T6         (i18n gating — small, build-time safety)
T2         (BotController — isolated, tests exist)
T1         (TickProcessor — largest, do last, requires T2 done first so
            TickContext doesn't need to reference old bot fields)
T4         (background RAF — many files, low risk, do in one PR)
```

---

## VERIFICATION CHECKLIST (run after each task)

```bash
tsc --noEmit                        # zero type errors
npx vitest run                      # all tests green
grep -rn "processTick\b" src/       # should only appear in GameEngine.ts after T1
grep -rn "botIntervalRef" src/      # should be zero after T2
grep -rn "FIREBASE_ACCESS_TOKEN" .  # should be zero after T3+T5
```
