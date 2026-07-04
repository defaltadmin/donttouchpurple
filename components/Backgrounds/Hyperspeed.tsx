// components/Backgrounds/Hyperspeed.tsx — OGL speed lines effect (adapted from React Bits)
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
uniform float uSpeed;
varying vec2 vUv;

#define PI 3.14159265358979

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float t = uTime * uSpeed;

  vec3 col = vec3(0.0);

  // Speed lines radiating from center
  for (int i = 0; i < 56; i++) {
    float fi = float(i);
    float angle = hash(vec2(fi, 0.0)) * PI * 2.0;
    float speed = 0.3 + hash(vec2(fi, 1.0)) * 0.7;
    float len = 0.02 + hash(vec2(fi, 2.0)) * 0.08;
    float width = 0.003 + hash(vec2(fi, 3.0)) * 0.005;

    float lineT = fract(t * speed + hash(vec2(fi, 4.0)));
    float dist = mix(0.1, 1.5, lineT);

    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 linePos = dir * dist;
    vec2 toPoint = uv - linePos;
    float along = dot(toPoint, dir);
    float perp = length(toPoint - dir * along);

    float line = smoothstep(len, 0.0, abs(along)) * smoothstep(width, 0.0, perp);
    line *= smoothstep(0.0, 0.2, lineT) * smoothstep(1.0, 0.8, lineT);

    // On-brand blend: electric magenta -> cotton-candy pink -> cyan
    float h = hash(vec2(fi, 5.0));
    vec3 magenta = vec3(0.75, 0.15, 0.83);
    vec3 pink    = vec3(0.95, 0.68, 1.0);
    vec3 cyan    = vec3(0.0, 0.8, 1.0);
    vec3 lineCol = h < 0.5
      ? mix(magenta, pink, h * 2.0)
      : mix(pink, cyan, (h - 0.5) * 2.0);
    col += line * lineCol * 0.8;
  }

  // Center bloom — richer, on-brand magenta core
  float glow = 0.028 / (length(uv) + 0.045);
  col += glow * vec3(0.6, 0.1, 0.85) * 0.45;

  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

export default function Hyperspeed({ reducedMotion }: { reducedMotion?: boolean }) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const [ctxVersion, setCtxVersion] = useState(0);

  useEffect(() => {
    if (!ctnRef.current) return;
    const ctn = ctnRef.current;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const dpr = isMobile ? 1.0 : window.devicePixelRatio;

    const renderer = new Renderer({
      alpha: isMobile ? false : true,
      premultipliedAlpha: false,
      dpr: dpr
    });
    const gl = renderer.gl;

    if (!isMobile) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      // Opaque background #151028 for mobile to save compositor blending
      gl.clearColor(0.08, 0.04, 0.16, 1.0);
    }

    const geometry = new Triangle(gl);
    const speed = reducedMotion ? 0.3 : 1.0;
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uSpeed: { value: speed },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;
    let lastHyperspeedFrame = 0;
    const TARGET_MS = isMobile ? 33.3 : 0; // 30fps cap on mobile

    function resize() {
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height
      );
    }
    window.addEventListener('resize', resize);
    resize();

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      if (document.hidden) return;

      // Mobile frame-skip to hit 30fps target
      if (isMobile && t - lastHyperspeedFrame < TARGET_MS) return;
      lastHyperspeedFrame = t;

      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    const onContextLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(animateId); };
    const onContextRestored = () => setCtxVersion(v => v + 1);
    gl.canvas.addEventListener('webglcontextlost', onContextLost);
    gl.canvas.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      gl.canvas.removeEventListener('webglcontextlost', onContextLost);
      gl.canvas.removeEventListener('webglcontextrestored', onContextRestored);
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reducedMotion, ctxVersion]);

  return (
    <div ref={ctnRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
  );
}
