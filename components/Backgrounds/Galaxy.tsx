// components/Backgrounds/Galaxy.tsx — WebGL galaxy via OGL (enhanced v2)
// Cinematic deep-space default: nebula fog, star parallax, cosmic dust, glow halos
import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

const vertex = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragment = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
uniform bool uMobile;
varying vec2 vUv;

// ── Constants ───────────────────────────────────────────────────────────────
#define NUM_LAYER_DESKTOP  6.0
#define NUM_LAYER_MOBILE   3.0
#define NUM_DUST   40.0
#define STAR_COLOR_CUTOFF 0.25
#define MAT45      mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD     3.0

// ── Hash / Noise helpers ────────────────────────────────────────────────────
float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Smooth value noise — used for nebula fog
float ValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep
  float a = Hash21(i);
  float b = Hash21(i + vec2(1.0, 0.0));
  float c = Hash21(i + vec2(0.0, 1.0));
  float d = Hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion — layered noise for organic nebula clouds
float FBM(vec2 p, bool mobile) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  int iterations = mobile ? 2 : 4;
  for (int i = 0; i < 4; i++) {
    if (i >= iterations) break;
    val += amp * ValueNoise(p * freq);
    freq *= 2.1;
    amp  *= 0.48;
  }
  return val;
}

// ── Colour helpers ───────────────────────────────────────────────────────────
float tri(float x)   { return abs(fract(x) * 2.0 - 1.0); }
float tris(float x)  { float t = fract(x); return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0)); }
float trisn(float x) { float t = fract(x); return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0; }

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// ── Star ─────────────────────────────────────────────────────────────────────
float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.06 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1200.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1200.0));
  m += rays * 0.35 * flare * uGlowIntensity;
  // Soft halo — adds "bloom" impression without an extra texture
  m += (0.015 * uGlowIntensity) / (d * d + 0.008);
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

// ── Single star layer ───────────────────────────────────────────────────────
vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv  = fract(uv) - 0.5;
  vec2 id  = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed  = Hash21(si);
      float size  = fract(seed * 345.32);
      float gloss = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flare = smoothstep(0.88, 1.0, size) * gloss;

      // RGB star colour with brand-palette bias (purple / pink / gold / white)
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(
        tris(seed * 34.0 + uTime * uSpeed / 10.0),
        tris(seed * 38.0 + uTime * uSpeed / 30.0)
      ) - 0.5;
      float star = Star(gv - offset - pad, flare);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      col += star * size * base;
    }
  }
  return col;
}

// ── Nebula fog ───────────────────────────────────────────────────────────────
vec3 NebulaFog(vec2 uv, float t, bool mobile) {
  // Layer two FBM passes offset in time for slow organic drift
  float n1 = FBM(uv * 1.8 + vec2(t * 0.04, t * 0.025), mobile);
  float n2 = FBM(uv * 3.1 + vec2(-t * 0.03, t * 0.055) + 4.2, mobile);
  float fog = n1 * n2;

  // Brand-colour palette: purple (270°) → magenta (290°) → pink (320°)
  float hueA = 270.0 + sin(t * 0.07) * 14.0;
  float hueB = 320.0 + cos(t * 0.05) * 10.0;
  float nebulaHue = mix(hueA, hueB, fog);
  float nebulaSat = mix(0.55, 0.80, n2);
  float nebulaVal = mix(0.12, 0.28, fog);

  return hsv2rgb(vec3(nebulaHue / 360.0, nebulaSat, nebulaVal)) * fog * 0.9;
}

// ── Cosmic dust ─────────────────────────────────────────────────────────────
float Dust(vec2 uv, float t) {
  vec2 id = floor(uv * NUM_DUST);
  float d = Hash21(id);
  if (d > 0.88) return 0.0; // sparse: only ~12% of cells have a particle
  vec2 local = fract(uv * NUM_DUST);
  vec2 center = vec2(0.5) + vec2(
    sin(t * (0.3 + d) + d * 6.28) * 0.25,
    cos(t * (0.2 + d * 0.8) + d * 9.42) * 0.25
  );
  float dist = length(local - center);
  float brightness = (0.3 + d * 0.7) * sin(t * (0.5 + d) + d * 12.56) * 0.5 + 0.5;
  return smoothstep(0.15, 0.0, dist) * brightness * 0.55;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  // Mouse interaction — gentle parallax shift
  vec2 mouseNorm = uMouse - vec2(0.5);
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    uv += mouseNorm * 0.1 * uMouseActiveFactor;
  }

  // Auto-rotation
  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(
    cos(autoRotAngle), -sin(autoRotAngle),
    sin(autoRotAngle),  cos(autoRotAngle)
  );
  uv = autoRot * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  // ── 1. Deep space base ──────────────────────────────────────────────────
  vec3 col = vec3(0.0);

  // ── 2. Nebula fog — slow-drifting organic cloud layer ──────────────────
  col += NebulaFog(uv * 0.6 + vec2(uTime * 0.008, uTime * 0.005), uTime, uMobile);

  // ── 3. Star parallax layers ──────────
  float layers = uMobile ? NUM_LAYER_MOBILE : NUM_LAYER_DESKTOP;
  for (float i = 0.0; i < 1.0; i += 1.0 / 6.0) {
    if (i >= layers / 6.0) break;
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(22.0 * uDensity, 0.4 * uDensity, depth);
    float fade  = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  // ── 4. Cosmic dust — tiny drifting specks for atmosphere ────────────────
  if (!uMobile) {
    col += vec3(0.75, 0.55, 1.0) * Dust(uv * 1.2 + vec2(uTime * 0.012), uTime);
  }

  // ── 5. Vignette — darker edges focus attention on centre ───────────────
  vec2 vigUv = vUv - 0.5;
  float vignette = 1.0 - smoothstep(0.38, 0.85, length(vigUv * vec2(1.0, 1.3)));
  col *= mix(0.55, 1.0, vignette);

  // ── 6. Subtle centre glow — adds depth, feels like you're inside space ──
  float centreGlow = smoothstep(0.8, 0.0, length(vigUv)) * 0.08;
  col += vec3(0.35, 0.15, 0.55) * centreGlow;

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.25, alpha);
    gl_FragColor = vec4(col, min(alpha, 1.0));
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

export default function Galaxy({ reducedMotion }: { reducedMotion?: boolean }) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const [ctxVersion, setCtxVersion] = useState(0);

  useEffect(() => {
    if (!ctnRef.current) return;
    const ctn = ctnRef.current;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Clamp DPR to 1.0 on mobile to save GPU fill rate (huge performance gain)
    const dpr = isMobile ? 1.0 : window.devicePixelRatio;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      dpr: dpr
    });

    const gl = renderer.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const geometry = new Triangle(gl);
    const speed = reducedMotion ? 0.2 : 1.0;
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime:               { value: 0 },
        uResolution:        { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uFocal:              { value: new Float32Array([0.5, 0.5]) },
        uRotation:           { value: new Float32Array([1.0, 0.0]) },
        uStarSpeed:          { value: 0.5 },
        uDensity:            { value: 1.8 },  // deeper field
        uHueShift:           { value: 262 },  // purple
        uSpeed:              { value: speed },
        uMouse:              { value: new Float32Array([0.5, 0.5]) },
        uGlowIntensity:     { value: 0.8 },  // richer bloom
        uSaturation:         { value: 0.90 }, // punchier colours
        uMouseRepulsion:     { value: true },
        uTwinkleIntensity:   { value: 0.7 },  // livelier twinkle
        uRotationSpeed:      { value: 0.06 },
        uRepulsionStrength:  { value: 1.5 },
        uMouseActiveFactor:  { value: 0.0 },
        uAutoCenterRepulsion:{ value: 0 },
        uTransparent:        { value: true },
        uMobile:             { value: isMobile },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;

    function resize() {
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height
      );
    }
    window.addEventListener('resize', resize);
    resize();
    const mouse = { x: 0.5, y: 0.5 };
    let mouseActive = 0;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      if (document.hidden) return;
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uStarSpeed.value = (t * 0.001 * 0.5) / 10.0;
      const m = program.uniforms.uMouse.value as Float32Array;
      m[0] += (mouse.x - m[0]) * 0.05;
      m[1] += (mouse.y - m[1]) * 0.05;
      program.uniforms.uMouseActiveFactor.value +=
        (mouseActive - program.uniforms.uMouseActiveFactor.value) * 0.05;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animateId);
    };
    const onContextRestored = () => setCtxVersion(v => v + 1);
    gl.canvas.addEventListener('webglcontextlost', onContextLost);
    gl.canvas.addEventListener('webglcontextrestored', onContextRestored);

    const handleMove = (e: MouseEvent) => {
      const rect = ctn.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      mouseActive = 1.0;
    };
    const handleLeave = () => { mouseActive = 0.0; };
    ctn.addEventListener('mousemove', handleMove);
    ctn.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      ctn.removeEventListener('mousemove', handleMove);
      ctn.removeEventListener('mouseleave', handleLeave);
      gl.canvas.removeEventListener('webglcontextlost', onContextLost);
      gl.canvas.removeEventListener('webglcontextrestored', onContextRestored);
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reducedMotion, ctxVersion]);

  return (
    <div
      ref={ctnRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
}