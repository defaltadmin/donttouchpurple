// components/Backgrounds/Lightning.tsx — WebGL electric bolt effect (adapted from React Bits)
import { useEffect, useRef, useState, useCallback } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';

export default function Lightning({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctxVersion, setCtxVersion] = useState(0);
  const rafRef = useRef<number>(0);
  const renderRef = useRef<(() => void) | null>(null);
  const { register } = useBackgroundController(true);

  const pause = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
  }, []);

  const resume = useCallback(() => {
    if (!rafRef.current && renderRef.current) rafRef.current = requestAnimationFrame(renderRef.current);
  }, []);

  useEffect(() => {
    const unregister = register({ pause, resume });
    return unregister;
  }, [register, pause, resume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uSpeed;

      #define OCTAVE_COUNT 10

      vec3 hsv2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
        p = fract(p * .1031);
        p *= p + 33.33;
        p *= p + p;
        return fract(p);
      }

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
        float c = cos(theta);
        float s = sin(theta);
        return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        float a = hash12(ip);
        float b = hash12(ip + vec2(1.0, 0.0));
        float c = hash12(ip + vec2(0.0, 1.0));
        float d = hash12(ip + vec2(1.0, 1.0));
        vec2 t = smoothstep(0.0, 1.0, fp);
        return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < OCTAVE_COUNT; ++i) {
          value += amplitude * noise(p);
          p *= rotate2d(0.45);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        uv = 2.0 * uv - 1.0;
        uv.x *= iResolution.x / iResolution.y;

        uv += 2.0 * fbm(uv * 1.5 + 0.8 * iTime * uSpeed) - 1.0;

        float dist = abs(uv.x);
        // Purple hue for DTP theme
        vec3 baseColor = hsv2rgb(vec3(0.75, 0.7, 0.8));
        vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0);
        float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
        gl_FragColor = vec4(col, a);
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iResLoc = gl.getUniformLocation(program, 'iResolution');
    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed');

    const speed = reducedMotion ? 0.3 : 1.0;
    const startTime = performance.now();

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      if (document.hidden) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(iResLoc, canvas.width, canvas.height);
      gl.uniform1f(iTimeLoc, (performance.now() - startTime) / 1000.0);
      gl.uniform1f(uSpeedLoc, speed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    renderRef.current = render;
    rafRef.current = requestAnimationFrame(render);

    const onContextLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(rafRef.current); rafRef.current = 0; };
    const onContextRestored = () => setCtxVersion(v => v + 1);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      renderRef.current = null;
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reducedMotion, ctxVersion]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: 'block' }}
    />
  );
}
