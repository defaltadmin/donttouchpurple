// components/Backgrounds/ElasticWarp.tsx — exact NebulaCanvas shader, purple colors only
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
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uSpeed;

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
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = uv * vec2(aspect, 1.0);

  vec2 mouse = uMouse * vec2(aspect, 1.0);
  float mouseDist = length(p - mouse);
  float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;

  float t = uTime * 0.08 * uSpeed;

  float n1 = fbm(p * 2.0 + vec2(t * 0.3, t * 0.2) + mouseInfluence);
  float n2 = fbm(p * 3.0 - vec2(t * 0.2, t * 0.4) - mouseInfluence * 0.5);
  float n3 = fbm(p * 1.5 + vec2(t * 0.15, -t * 0.1));

  vec3 col1 = vec3(0.65, 0.05, 0.95);
  vec3 col2 = vec3(0.90, 0.15, 0.70);
  vec3 col3 = vec3(0.45, 0.10, 0.85);

  vec3 color = mix(col1, col2, n1);
  color = mix(color, col3, n2 * 0.5);

  float centerGlow = smoothstep(0.8, 0.0, length(uv - vec2(0.5, 0.4))) * 0.4;
  color += vec3(0.55, 0.0, 0.65) * centerGlow;

  float stars = 0.0;
  for (float i = 1.0; i < 4.0; i += 1.0) {
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

  float intensity = n3 * 0.45 + 0.35 + centerGlow * 0.5;
  color *= intensity;

  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
  color *= vignette * 0.5 + 0.5;

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
