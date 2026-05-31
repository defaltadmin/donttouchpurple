// components/Backgrounds/ElasticWarp.tsx — OGL elastic warp with mouse-reactive distortion
import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Color, Triangle, Vec2 } from 'ogl';

const vertex = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

const fragment = `
precision highp float;
uniform vec3 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uSpeed;
varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 6; i++) {
    v += a * snoise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 0.5);
  vec3 d = vec3(0.80, 0.90, 0.30);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.015 * uSpeed;

  // Mouse warp
  vec2 mouseDist = uv - uMouse;
  float mDist = length(mouseDist);
  float warp = smoothstep(0.35, 0.0, mDist) * 0.06;
  vec2 warpDir = normalize(mouseDist + 0.001);
  uv += warpDir * warp;

  // Domain warping
  vec2 q = vec2(fbm(uv * 3.0 + vec2(0.0, 0.0) + t * 0.3),
                fbm(uv * 3.0 + vec2(5.2, 1.3) - t * 0.2));
  vec2 r = vec2(fbm(uv * 3.0 + q * 4.0 + vec2(1.7, 9.2) + t * 0.15),
                fbm(uv * 3.0 + q * 4.0 + vec2(8.3, 2.8) - t * 0.12));
  float f = fbm(uv * 3.0 + r * 2.0);

  // Color from cosine palette
  vec3 color = palette(f * 0.5 + 0.3);

  // Boost brightness
  color *= 1.2;

  // Mouse glow
  color += vec3(0.3, 0.05, 0.35) * smoothstep(0.2, 0.0, mDist);

  gl_FragColor = vec4(color, 1.0);
}`;

export default function ElasticWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const [ctxVersion, setCtxVersion] = useState(0);

  useEffect(() => {
    if (!ctnRef.current) return;
    const ctn = ctnRef.current;

    const renderer = new Renderer({ alpha: false, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const geometry = new Triangle(gl);
    const speed = reducedMotion ? 0.3 : 1.0;
    const mouse = new Vec2(0.5, 0.5);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uMouse: { value: mouse },
        uSpeed: { value: speed },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;

    function resize() {
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.uResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }

    function onPointerMove(e: PointerEvent) {
      mouse.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
      );
    }

    function onPointerLeave() {
      mouse.set(0.5, 0.5);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave, { passive: true });
    resize();

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      if (document.hidden) return;
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });

    const onContextLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(animateId); };
    const onContextRestored = () => setCtxVersion(v => v + 1);
    gl.canvas.addEventListener('webglcontextlost', onContextLost);
    gl.canvas.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      gl.canvas.removeEventListener('webglcontextlost', onContextLost);
      gl.canvas.removeEventListener('webglcontextrestored', onContextRestored);
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reducedMotion, ctxVersion]);

  return (
    <div
      ref={ctnRef}
      className="background-canvas"
      aria-hidden="true"
    />
  );
}
