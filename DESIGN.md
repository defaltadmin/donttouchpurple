---
name: Hyper-Juice Arcade
colors:
  surface: '#151028'
  surface-dim: '#151028'
  surface-bright: '#3b3650'
  surface-container-lowest: '#0f0a22'
  surface-container-low: '#1d1830'
  surface-container: '#211c35'
  surface-container-high: '#2c2640'
  surface-container-highest: '#36314b'
  on-surface: '#e7deff'
  on-surface-variant: '#d7c0d3'
  inverse-surface: '#e7deff'
  inverse-on-surface: '#322d47'
  outline: '#9f8a9d'
  outline-variant: '#524151'
  surface-tint: '#fda9ff'
  primary: '#fda9ff'
  on-primary: '#580063'
  primary-container: '#c026d3'
  on-primary-container: '#fffafa'
  inverse-primary: '#a400b7'
  secondary: '#f3aeff'
  on-secondary: '#4e155d'
  secondary-container: '#6a3178'
  on-secondary-container: '#e4a0f0'
  tertiary: '#f9bd22'
  on-tertiary: '#402d00'
  tertiary-container: '#936d00'
  on-tertiary-container: '#fffaf6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd6fb'
  primary-fixed-dim: '#fda9ff'
  on-primary-fixed: '#36003d'
  on-primary-fixed-variant: '#7d008c'
  secondary-fixed: '#fcd6ff'
  secondary-fixed-dim: '#f3aeff'
  on-secondary-fixed: '#340042'
  on-secondary-fixed-variant: '#682f76'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#151028'
  on-background: '#e7deff'
  surface-variant: '#36314b'
typography:
  display-lg:
    fontFamily: Fredoka One
    fontSize: 76px
    fontWeight: '900'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fredoka One
    fontSize: 42px
    fontWeight: '900'
    lineHeight: 44px
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Fredoka One
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  body-base:
    fontFamily: Nunito
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-bold:
    fontFamily: Nunito
    fontSize: 15px
    fontWeight: '800'
    lineHeight: 22px
  label-caps:
    fontFamily: Nunito
    fontSize: 10px
    fontWeight: '900'
    lineHeight: 12px
    letterSpacing: 0.15em
  headline-lg-mobile:
    fontFamily: Fredoka One
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  margin-mobile: 10px
  margin-desktop: 24px
  gutter: 8px
---

## Brand & Style

The design system embodies a **Dark-Cyberpunk Synthwave** aesthetic, characterized by high-intensity visual feedback and "hyper-juice" arcade energy. It is designed to sustain rapid cognitive processing through high-contrast elements and tactile physical metaphors.

The brand personality is high-tension, fast-paced, and visceral. It balances a moody, cosmic cyberspace atmosphere with a playful, neon-drenched vibrancy. The UI should evoke a sense of physical hardware being manipulated in a digital void.

### Key Visual Pillars
- **Glassmorphism:** Deep translucent layers with heavy backdrop blurs (20px+) and crystalline hairline borders.
- **Tactile 3D Depth:** Elements aren't just flat shapes; they are "acrylic plastic" buttons with physical 3D bevels, glossy light reflections, and responsive Z-axis movement.
- **High-Contrast Hazards:** A clear visual distinction between "Safe" (White/Blue/Gold) and "Forbidden" (Electric Purple) states.
- **Micro-interactions:** Constant movement via pulsing glows, shimmer sweeps, and spring-based scaling animations that react to every user input.

## Colors

The palette is split between a deep "Space Indigo" foundation and "Forbidden" neon accents.

- **Primary (Forbidden Purple):** Used for hazards and core brand identity. In dark mode, it is an electric magenta; in light mode, it shifts to a deep violet.
- **Secondary (Accent Glow):** A soft cotton-candy pink used for highlights, scoring, and level-up indicators.
- **Tertiary (Cyberpunk Gold):** Reserved for high streaks, achievements, and premium rewards.
- **Neutral:** A deep cosmic indigo for backgrounds and a crystalline lilac for typography.

### Color Modes
- **Dark (Default):** Deep space gradients (#0d0820 to #2d1060) with neon glowing overlays.
- **Light (Alternative):** A "Lavender Mist" aesthetic (#f5f0ff) using soft pastel gradients and dark violet typography.

## Typography

The system uses two fonts to distinguish between the "Game Engine" and the "Functional UI."

- **The Display Engine (Fredoka One):** Used for scores, headers, and menu titles. It is bubbly, heavy, and playful. Large numerical headings must use **tabular figures** to prevent layout thrashing during rapid score updates.
- **The Functional Interface (Nunito):** A clean, geometric humanist sans-serif used for settings, instructions, and HUD labels.

### Styling Rules
- **Display Text:** Often uses background gradient clipping to overlay neon gradients or golds onto the glyphs.
- **HUD Labels:** Use extreme letter-spacing (0.15em) and all-caps to maintain legibility at very small sizes (8px-11px).

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for high-intensity, one-handed mobile interaction.

- **Game Grid:** The core gameplay container uses a dynamic grid with a default 8px gap. Columns and rows scale based on difficulty, but the primary container is capped at **520px** to ensure thumb-reach on mobile.
- **Responsive Behavior:** 
    - **Mobile (<600px):** Tight margins (10px) and large touch targets (min 44px).
    - **Desktop (1024px+):** Centered layout with expanded margins (24px) and larger cell sizing (up to 128px).
- **Safe Areas:** Use environment variables (`safe-area-inset`) to ensure floating HUD elements do not collide with notches or dynamic islands.

## Elevation & Depth

Visual hierarchy is established through **Physical Layering** and **Light Reflection**.

- **Tonal Layers:** Deep cosmic backgrounds sit behind translucent "glass" panels. These panels use `backdrop-filter: blur(20px)` and a `1px` white hairline border to simulate an inset light reflection.
- **3D Bevels:** Interactive elements (buttons/cells) use a thick 4px solid bottom shadow that matches the element's hue but at a darker value. This creates a "pressed" vs "floating" state.
- **Atmospheric Glows:** Use radial gradients and drop shadows with high-saturation colors (Magenta/Cyan) to create a "bloom" effect around active scores and power-ups.
- **Micro-Elevations:** On hover, elements should translate `-3px` on the Y-axis. On click, they should translate `+5px` to simulate the collapse of the 3D shadow.

## Shapes

The shape language is consistently "Soft-Geometric."

- **Standard Elements:** Use a `14px` (rounded-xl) radius for buttons and grid cells, creating a friendly yet structured "squircle" look.
- **Container Panels:** Use a larger `28px` radius to frame internal content softly.
- **Interactive Toggles:** Use a "Pill" (full) radius for toggle tracks and thumbs to emphasize their sliding motion.
- **Feedback:** When cells are tapped, use scale transforms rather than changing the shape to maintain the physical arcade feel.

## Components

### Buttons
- **Primary Buttons:** High-contrast gradients with a 4px bottom bevel shadow. Must include a diagonal "shimmer" animation and a light-source glare at the top left.
- **Pulsing Action Button:** Large circular button (120px) with a continuous scaling pulse (1.0 to 1.05) and heavy glow.

### Cards & Panels
- **Glass Panels:** Semi-transparent containers (`rgba(255,255,255,0.05)`) with heavy blurring. Use internal inset shadows to create a "liquid glass" edge.

### Grid Cells
- **Safe Cells:** Linear gradients (White to Blue) with matched bevels.
- **Hazard Cells:** The "Purple" cells. Use a vibrant magenta gradient.
- **Specialty Cells:** 
  - **Ice:** Frozen white-blue gradients with fracture line overlays.
  - **Bomb:** Radial orange-red gradients with a rotating SVG ring timer.

### HUD & Feedback
- **Stat Cards:** Compact glass panels with 14px corners. Point updates trigger a "bloom" animation where the text scales up by 12% and casts a temporary neon shadow.
- **Toggles:** Dark glass tracks with 3D capsule thumbs that use spring transitions (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

## Elevation Tiers (z-index)

| Tier | z-index | Usage | Examples |
|------|---------|-------|---------|
| L0 Background | 0 | Full-screen canvas layers | Galaxy, Silk, Hyperspeed backgrounds |
| L1 Game Content | 1-10 | Grid, HUD elements | Game grid, score display, hearts, energy bar |
| L2 Floating UI | 10-100 | Floating panels, tooltips | Settings drawer, quick settings, gamepad badge |
| L3 Overlay | 100-1000 | Modal overlays | Pause overlay, energy popup, shop panel, GameMaster |
| L4 Toast | 200 | Boss intro Lottie overlay | Boss event intro animations |
| L5 System | 9999-10001 | System-level toasts | Daily badge, achievement toast stack |

## Do's and Don'ts

### Animation
- **Do** use `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring transitions on interactive elements
- **Do** use `will-change: transform` on animated layers to promote GPU compositing
- **Do** check `reducedMotion` before adding any new animation
- **Do** use CSS keyframes for ambient/looping motion (pulses, shimmers, glows)
- **Do** use GSAP for complex imperative sequences (score count-up, staggered entrances)
- **Do** use framer-motion for React mount/unmount transitions (modals, overlays)
- **Do** use dotlottie-web for pre-made animated assets (achievements, boss intros)
- **Don't** animate `box-shadow` on mobile — use pseudo-elements or opacity instead
- **Don't** add a 5th animation library — 4 systems (CSS, GSAP, framer-motion, dotlottie) is the ceiling
- **Don't** run RAF when CSS handles the effect (fade/transition) — triggers expensive subtree re-renders

### Accessibility
- **Do** respect `prefers-reduced-motion` — disable decorative animations, keep functional transitions
- **Do** respect `prefers-reduced-data: reduce` — skip loading Lottie/animation assets
- **Do** use `aria-live="polite"` on dynamic content (toasts, score updates)
- **Do** maintain 4.5:1 minimum contrast ratio for text on backgrounds
- **Do** ensure touch targets are minimum 44x44px on mobile

### Performance
- **Do** use `React.lazy` + `Suspense` for heavy components (shop, backgrounds, leaderboard)
- **Do** use `React.memo` on components rendered in expensive contexts (grid cells, HUD elements)
- **Do** use the manual chunk strategy in vite.config.ts — keep lottie, gsap, framer-motion in separate chunks
- **Don't** import from `engine/` inside React components — use `hooks/useGameEngine` bridge
- **Don't** import full libraries when a single function suffices (e.g., `lodash/get` not `lodash`)

## Responsive Behavior

| Breakpoint | Width | Layout | Cell Size | Margins |
|------------|-------|--------|-----------|---------|
| Mobile Small | < 375px | Single column, full bleed | 64-80px | 8px |
| Mobile | 375-599px | Single column, compact | 80-96px | 10px |
| Tablet | 600-1023px | Centered, wider grid | 96-112px | 16px |
| Desktop | 1024px+ | Centered, max 520px | 112-128px | 24px |

- **Safe Areas:** All floating UI respects `env(safe-area-inset-*)` for notches and dynamic islands
- **Thumb Zone:** Primary actions (tap, swipe) stay in the lower 60% of the viewport on mobile
- **Grid Scaling:** Grid cells scale proportionally with viewport width, capped at 520px container

## Motion & Animation Systems

| System | Use For | Don't Use For |
|--------|---------|---------------|
| **CSS @keyframes** | Ambient loops (pulse, shimmer, glow), simple state transitions | Complex sequences, physics-based motion |
| **GSAP** | Score count-up, staggered button entrances, pointer-following, timeline choreography | Mount/unmount transitions, declarative state changes |
| **framer-motion** | Modal enter/exit, layout animations, spring physics for React components | Ambient loops, imperative sequences, canvas animations |
| **dotlottie-web** | Pre-made animated assets (achievement celebrations, boss intros, loading ambiance) | Code-driven interactive animations, procedural effects |

- **Reduced Motion Override:** When `settings.reducedMotion` is true, all decorative animations stop. Functional transitions (screen slides, button feedback) remain but use `duration: 0`.
- **Lite Mode:** On low-end devices, disable particle layers, background canvas effects, and Lottie animations.

## Agent Prompt Guide

When modifying this codebase, follow these rules:

1. **Engine isolation:** Never import React in `engine/` files. Use `hooks/useGameEngine` to bridge.
2. **Animation selection:** CSS for ambient loops, GSAP for imperative sequences, framer-motion for React transitions, dotlottie for pre-made assets. No 5th library.
3. **i18n:** All user-facing strings must use `useTranslation()` hook with typed `I18nKey` strings. No hardcoded text.
4. **Settings:** Check `reducedMotion` before adding any animation. Check `prefers-reduced-data` before loading assets.
5. **Performance:** Use `React.memo` for grid cells and HUD elements. Use `React.lazy` for shop, backgrounds, leaderboard.
6. **Tokens:** Use CSS custom properties from `styles/game.css` and motion tokens from `styles/fx-enhancements.css`. Don't hardcode colors or timing values.
7. **Testing:** Run `pnpm typecheck && pnpm lint --max-warnings=0 && pnpm test` before any commit.