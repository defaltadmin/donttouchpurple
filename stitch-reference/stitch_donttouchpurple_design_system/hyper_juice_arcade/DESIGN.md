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