// components/Backgrounds/ElasticWarp.tsx — starfield with elastic mouse warp (ported from NebulaCanvas)
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

#define NUM_STARS 60.0

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(.1031, .11369, .13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float snoise(vec2 p) {
  vec2 s = vec2(1.0, 1.414213562);
  vec2 a = floor(p);
  vec2 b = fract(p);
  float k = 0.5 * (3.0 - s.x);
  float l = 0.5 * (3.0 - s.y);
  vec2 d = vec2(k * (b.x * b.x + b.y * b.y), l * ((b.x - s.x) * (b.x - s.x) + (b.y - s.y) * (b.y - s.y)));
  return clamp(d.x + d.y, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 mouseUv = uMouse;
  float t = uTime * 0.015 * uSpeed;

  vec3 accum = vec3(0.0);

  for (float i = 0.0; i < NUM_STARS; i++) {
    vec2 rand = vec2(
      fract(sin(i * 234.5 + 78.9) * 543.3),
      fract(sin(i * 123.4 + 567.8) * 901.2)
    );
    float speed = fract(sin(i * 456.7) * 321.4) * 0.5 + 0.1;
    float size = fract(cos(i * 111.1) * 543.2) * 15.0 + 5.0;

    vec2 pos = fract(rand + vec2(sin(speed * 10.0) * 0.02, -t * speed * 0.3));

    vec2 delta = uv - pos;
    delta.x *= uResolution.z;

    float dist = length(delta);
    float flowDomain = pos.y + pos.x * 0.3 + t * 0.5;
    float flowField = sin(flowDomain * 3.14159) * 0.02;

    vec2 warpDelta = uv - mouseUv;
    warpDelta.x *= uResolution.z;
    float warpDist = length(warpDelta);
    float influence = smoothstep(0.4, 0.0, warpDist);
    float angle = atan(warpDelta.y, warpDelta.x);
    float freq = 8.0;
    float wave = sin(angle * freq + uTime * 2.0) * 0.5 + 0.5;
    float morph = mix(1.0, 0.3 + 0.7 * wave, influence);
    float distFinal = dist * morph;

    float flowMask = smoothstep(0.0, 0.02, abs(delta.x - flowField));

    float core = (size * 0.0004) / distFinal;
    float glow = smoothstep(0.8, 0.0, distFinal * 12.0);
    float star = core * 0.6 + glow * 0.08;
    star *= flowMask;
    star = clamp(star, 0.0, 1.5);

    vec3 baseCol = vec3(0.55, 0.3, 0.95);
    float colVar = fract(sin(i * 789.1) * 456.7);
    if (colVar > 0.7) baseCol = vec3(1.0, 0.4, 0.67);
    else if (colVar > 0.4) baseCol = vec3(0.75, 0.15, 1.0);

    accum += baseCol * star;
  }

  float alpha = clamp(accum.r + accum.g + accum.b, 0.0, 1.0);
  vec3 col = accum * 0.9;

  float distCenter = length(uv - vec2(0.5));
  float bgMask = smoothstep(0.0, 0.2, distCenter);
  col = mix(vec3(0.05, 0.05, 0.1), col, bgMask);
  col += vec3(0.05, 0.05, 0.1) * (1.0 - alpha);

  gl_FragColor = vec4(col, 1.0);
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
