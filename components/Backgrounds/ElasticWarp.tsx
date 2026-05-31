// components/Backgrounds/ElasticWarp.tsx — OGL elastic warp with mouse-reactive distortion
import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Color, Triangle, Vec2 } from 'ogl';

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uSpeed;
in vec2 vUv;
out vec4 fragColor;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(.1031,.11369,.13787));
  p3 += dot(p3, p3.yxz+19.19);
  return -1.0+2.0*fract(vec3(p3.x+p3.y, p3.x+p3.z, p3.y+p3.z)*p3.zyx);
}

float snoise3(vec3 p) {
  const float F3 = 0.3333333, G3 = 0.1666667;
  vec3 s = floor(p + dot(p, vec3(F3)));
  vec3 x = p - s + dot(s, vec3(G3));
  vec3 e = step(vec3(0.0), x - x.yzx);
  vec3 i1 = e*(1.0-e.zxy);
  vec3 i2 = 1.0-e.zxy*(1.0-e);
  vec3 x1 = x - i1 + G3, x2 = x - i2 + 2.0*G3, x3 = x - 1.0+3.0*G3;
  vec4 w = max(0.6-vec4(dot(x,x),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  w *= w; w *= w;
  return dot(w, vec4(dot(hash33(s),x),dot(hash33(s+i1),x1),dot(hash33(s+i2),x2),dot(hash33(s+1.0),x3)))*52.0;
}

float snoise(vec2 p) {
  return snoise3(vec3(p, 0.0));
}

float fbm2(vec2 p, int it) {
  float val = 0.0, amp = 0.5;
  for (int i = 0; i < 12; i++) {
    if (i >= it) break;
    val += amp * snoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

vec3 domain(vec2 z, float t) {
  z *= 1.2; // slightly zoomed out for more coverage
  return vec3(
    fbm2(z - vec2(1.0-sin(t*0.2)*0.3, 1.0+cos(t*0.3)*0.3), 12),
    fbm2(z + vec2(1.0+cos(t*0.1)*0.2, 1.0-sin(t*0.15)*0.2), 12),
    fbm2(z + vec2(2.0+sin(t*0.25)*0.2, 2.0-cos(t*0.2)*0.2), 12)
  );
}

vec3 colour(float t) {
  vec3 a = vec3(0.5,0.5,0.5);
  vec3 b = vec3(0.5,0.5,0.5);
  vec3 c = vec3(1.0,1.0,0.5);
  vec3 d = vec3(0.80,0.90,0.30);
  return a + b * cos(6.28318 * (c*t+d));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.015 * uSpeed;

  // Mouse warp influence
  vec2 mouseUv = uMouse;
  float mouseDist = length(uv - mouseUv);
  float warp = smoothstep(0.4, 0.0, mouseDist) * 0.08;
  vec2 warpOffset = normalize(uv - mouseUv + 0.001) * warp;

  vec2 z = uv * 3.0 + warpOffset;
  vec3 n = domain(z, t);
  vec3 c = colour(n.x + n.y + n.z + t*0.1);

  // Mouse glow
  c += vec3(0.2,0.04,0.24) * smoothstep(0.2, 0.0, mouseDist) * 0.6;

  fragColor = vec4(c, 1.0);
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
