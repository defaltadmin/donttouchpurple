# Backgrounds

Don't Touch Purple features 12 GPU-accelerated animated backgrounds. Each is a unique visual effect rendered on a full-screen canvas.

## Available Backgrounds

| Background | Type | Description |
|------------|------|-------------|
| Galaxy | OGL/WebGL | Star field with nebula colors |
| Silk | OGL/WebGL | Flowing silk fabric simulation |
| Hyperspeed | OGL/WebGL | Speed lines flying past |
| Lightning | OGL/WebGL | Electric bolts in the sky |
| Nebula | OGL/WebGL | Deep space nebula clouds |
| Aurora Borealis | Canvas2D | Northern lights effect |
| Purple Rain | Canvas2D | Falling purple particles |
| Digital Rain | Canvas2D | Matrix-style falling characters |
| Void Tunnel | Canvas2D | Endless tunnel effect |
| Star Warp | Canvas2D | Warping star field |
| Grid Pulse | CSS/DOM | Animated grid lines |
| Glitch Grid | CSS/DOM | Glitchy grid effects |

## Unlocking

Backgrounds are unlocked using Dust currency earned from:
- Playing games
- Unlocking achievements
- Daily check-in rewards
- Daily/weekly challenges

## Technical Details

- Canvas2D backgrounds use `requestAnimationFrame` for smooth 60fps rendering
- OGL/WebGL backgrounds use GPU shaders for high-performance effects
- All backgrounds pause when the browser tab is hidden (visibility API)
- Reduced motion mode disables decorative animations
- Lite mode disables particle layers and canvas effects on low-end devices
