// components/Backgrounds/ElasticWarp.tsx — NebulaCanvas adapted for game background
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Geometry, Vec2 } from 'ogl';

const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * aspect;

  vec2 mouse = uMouse * aspect;
  float mouseDist = length(p - mouse);
  float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;

  float t = uTime * 0.08;

  float n1 = fbm(p * 2.0 + vec2(t * 0.3, t * 0.2) + mouseInfluence);
  float n2 = fbm(p * 3.0 - vec2(t * 0.2, t * 0.4) - mouseInfluence * 0.5);
  float n3 = fbm(p * 1.5 + vec2(t * 0.15, -t * 0.1));

  vec3 col1 = vec3(0.75, 0.15, 1.0);
  vec3 col2 = vec3(1.0, 0.4, 0.67);
  vec3 col3 = vec3(0.27, 0.55, 1.0);

  vec3 color = mix(col1, col2, n1);
  color = mix(color, col3, n2 * 0.5);

  float centerGlow = smoothstep(0.8, 0.0, length(uv - vec2(0.5, 0.4))) * 0.4;
  color += vec3(0.75, 0.06, 0.78) * centerGlow;

  float stars = 0.0;
  for (float i = 1.0; i < 4.0; i++) {
    vec2 starUV = uv * (200.0 * i);
    vec2 starCell = floor(starUV);
    float starHash = hash(starCell + i * 100.0);
    if (starHash > 0.97) {
      vec2 starPos = fract(starUV) - 0.5;
      float starDist = length(starPos);
      float twinkle = sin(uTime * (2.0 + starHash * 3.0) + starHash * 6.28) * 0.5 + 0.5;
      stars += smoothstep(0.05, 0.0, starDist) * twinkle * (1.0 / i);
    }
  }
  color += stars * vec3(0.9, 0.8, 1.0);

  float intensity = n3 * 0.3 + 0.15 + centerGlow * 0.5;
  color *= intensity;

  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
  color *= vignette * 0.8 + 0.2;

  float edgeFade = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
  color *= edgeFade;

  gl_FragColor = vec4(color, 1.0);
}`;

export default function ElasticWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const renderer = new Renderer({ canvas, alpha: true, antialias: false });
    const gl = renderer.gl;

    // Clear inline styles OGL sets — CSS class handles sizing
    gl.canvas.style.removeProperty('width');
    gl.canvas.style.removeProperty('height');

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    });

    const mouse = new Vec2(0.5, 0.5);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uResolution: { value: new Vec2(1, 1) },
        uTime: { value: 0 },
        uMouse: { value: mouse },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      gl.canvas.width = w * dpr;
      gl.canvas.height = h * dpr;
      gl.viewport(0, 0, w * dpr, h * dpr);
      program.uniforms.uResolution.value.set(w * dpr, h * dpr);
      // Clear inline styles so CSS class controls visual size
      gl.canvas.style.width = '';
      gl.canvas.style.height = '';
    }

    function onMouseMove(e: MouseEvent) {
      mouse.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
    }

    let rafId: number;
    const start = performance.now();

    function loop() {
      if (document.hidden) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    resize();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="background-canvas"
      aria-hidden="true"
    />
  );
}
