# Mobile Optimization Audit Packet — v7.9.1

## Context
- **Project**: Don't Touch Purple (DTP)
- **Target Device**: Samsung Galaxy Note 20 (and similar Android devices)
- **Platform**: Capacitor (WebView-based wrapper)
- **Tech Stack**: React 18, TypeScript, OGL (WebGL), CSS Grid
- **Current Issue**: Frame stutters and input lag when running on mobile.

## Recent Optimizations Applied
1. **WebGL**: Limited `devicePixelRatio` to 1.0 on mobile. Reduced star layers and noise loops in `Galaxy.tsx`.
2. **React**: Capped engine state updates to 30 FPS on mobile in `GameEngine.ts`.
3. **Component Memoization**: Implemented custom `React.memo` with deep comparison for Cells to prevent unnecessary re-renders when the engine clones the state object.
4. **Canvas Management**: Disabled per-cell "Spark" canvas contexts on mobile (previously creating 25 contexts).
5. **Android Native**: Enabled `largeHeap="true"` and Hardware Acceleration in `AndroidManifest.xml`.
6. **CSS Performance**: Stripped blurred orbs and complex gradients on mobile in `performance.css`.

## Audit Request
Please review the attached core files for further optimization opportunities, specifically focusing on:
- **Main Thread Janks**: Any remaining React reconciliation bottlenecks.
- **GPU Fill Rate**: Further shader simplifications or compositing optimizations.
- **Garbage Collection**: Identifying frequent object allocations in the tick loop.
- **Input Latency**: Bridge overhead between native touch and WebView events.

---

## 1. Engine Core (`engine/GameEngine.ts`)
```typescript
/**
 * startSnapshotRaf capped to 30fps on mobile to reduce React reconciliation load.
 */
  private startSnapshotRaf(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.lastFrameTime = performance.now();
    let lastEmitTime = 0;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const minEmitInterval = isMobile ? 32 : 16; // 30fps cap on mobile

    const loop = (timestamp: number) => {
      if (this.rafId === null) return;
      if (document.hidden) { this.rafId = requestAnimationFrame(loop); return; }
      
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        if (this.phase === "playing") {
          this.updatePerformanceMetrics(frameTime);
        }
      }
      this.lastFrameTime = timestamp;

      if (this.dirty && this.phase !== "gameover") {
        const now = performance.now();
        if (now - lastEmitTime >= minEmitInterval) {
          this.dirty = false;
          lastEmitTime = now;
          this.emitSnapshot();
        }
      }

      if (this.phase !== "gameover") {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }
```

## 2. Tick Processor (`engine/subsystems/TickProcessor.ts`)
```typescript
// (Handles the heavy lifting of state mutation every tick)
// Uses Map caches for pattern slots and pre-computed constant sets for types.
```

## 3. WebGL Background (`components/Backgrounds/Galaxy.tsx`)
```typescript
/**
 * Optimized for mobile with DPR clamping and loop branching.
 */
export default function Galaxy({ reducedMotion }: { reducedMotion?: boolean }) {
  // ...
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Clamp DPR to 1.0 on mobile to save GPU fill rate (huge performance gain)
    const dpr = isMobile ? 1.0 : window.devicePixelRatio;

    const renderer = new Renderer({ 
      alpha: true, 
      premultipliedAlpha: false,
      dpr: dpr
    });
    // ...
  }, [reducedMotion]);
}

// Fragment Shader uses #define NUM_LAYER_MOBILE 3.0 instead of 6.0
// FBM noise iterations are halved on mobile.
```

## 4. Grid Container (`components/HUD/PlayerPanel.tsx`)
```typescript
/**
 * Pre-builds active cell maps for O(1) lookup instead of O(n) find per cell.
 */
{React.useMemo(() => {
  const activeMap = new Map(ps.active.map(c => [c.idx, c]));
  return Array.from({ length: gridTotal }, (_, i) => {
    // ... cell rendering logic
  });
}, [/* deps... */])}
```

## 5. Individual Cell (`components/Cell/index.tsx`)
```typescript
/**
 * Custom React.memo with deep comparison to handle engine state cloning.
 */
export default React.memo(CellContent, (prev, next) => {
  return prev.cell.idx === next.cell.idx &&
         prev.cell.type === next.cell.type &&
         prev.cell.clicked === next.cell.clicked &&
         prev.isPressing === next.isPressing &&
         prev.botPulse === next.botPulse &&
         prev.colorblindMode === next.colorblindMode &&
         prev.showKeyLabel === next.showKeyLabel &&
         prev.keyLabel === next.keyLabel &&
         Math.abs((prev.bombFuse ?? 0) - (next.bombFuse ?? 0)) < 100;
});

// ClickSpark canvas disabled on mobile.
```

## 6. CSS Performance (`styles/performance.css`)
```css
/* GPU Containment & Layout Isolation */
.dtp-btn, .cell, .gpanel {
  contain: layout style paint;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Mobile-Specific Performance Strip (Extreme) */
@media (max-width: 768px) {
  .orb, .bg-pulse { display: none !important; }
  body { background: #151028 !important; background-image: none !important; }
  .gpanel { backdrop-filter: none !important; background: rgba(13, 8, 32, 0.8) !important; }
  .hud-card { backdrop-filter: none !important; background: #1e1838 !important; }
}
```
