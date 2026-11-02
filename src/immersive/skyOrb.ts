// The voice-mode orb: a small piece of sky with slow clouds, breathing with your voice and with the reply.

import * as THREE from "three";

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform float uLevel; uniform float uThink; uniform vec2 uRes; uniform float uScale;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i=0;i<6;i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }

  void main(){
    vec2 p = (vUv - 0.5) * uRes / min(uRes.x, uRes.y);
    float t = uTime;
    float R = 0.2 * uScale * (1.0 + uLevel*0.28 + 0.02*sin(t*1.3) - uThink*0.04*(1.0+sin(t*5.0)));
    // the rim wobbles softly with the voice
    float ang = atan(p.y, p.x);
    float wob = (sin(ang*3.0 + t*2.0) + sin(ang*5.0 - t*1.7)) * 0.006 * (uLevel*3.0 + uThink);
    float d = length(p) - R - wob;

    // sky inside: deep blue top, pale bottom, clouds drifting
    vec2 q = p / R;
    float swirl = uThink * 1.4 + 0.15;
    float c = cos(t*0.1*swirl + length(q)*swirl*0.6), s = sin(t*0.1*swirl + length(q)*swirl*0.6);
    vec2 cq = mat2(c,-s,s,c) * q;
    float clouds = fbm(cq*1.6 + vec2(t*0.08, -t*0.05) + fbm(cq*2.4 - t*0.06)*1.3);
    clouds = smoothstep(0.42, 0.85, clouds + q.y*-0.18 + uLevel*0.15);
    vec3 top = vec3(0.23, 0.33, 0.98);
    vec3 bottom = vec3(0.62, 0.74, 1.0);
    vec3 sky = mix(bottom, top, smoothstep(-1.0, 1.0, q.y + 0.3));
    vec3 col = mix(sky, vec3(1.0), clouds*0.9);
    // inner light, like sun through cloud
    col += vec3(0.25,0.28,0.4) * smoothstep(0.9, 0.0, length(q - vec2(-0.3, 0.45))) * 0.35;

    float inside = smoothstep(0.004, -0.004, d);
    // halo
    float halo = exp(-max(d,0.0)*18.0) * (0.18 + uLevel*0.5 + uThink*0.15);
    vec3 outC = vec3(0.35,0.45,1.0) * halo;
    vec3 final = mix(outC, col, inside);
    gl_FragColor = vec4(final, max(inside, halo));
  }
`;

export interface SkyOrb {
  set(level: number, thinking: boolean): void;
  dispose(): void;
}

export function createSkyOrb(canvas: HTMLCanvasElement): SkyOrb {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 }, uLevel: { value: 0 }, uThink: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) }, uScale: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, fragmentShader: FRAG,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
    uniforms.uScale.value = w < 700 ? 1.35 : 1;
  };
  resize();
  window.addEventListener("resize", resize);

  let level = 0, target = 0, think = 0, thinkT = 0, raf = 0;
  const clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value = clock.elapsedTime;
    level += (target - level) * Math.min(1, dt * (target > level ? 18 : 6));
    think += (thinkT - think) * Math.min(1, dt * 3);
    uniforms.uLevel.value = level;
    uniforms.uThink.value = think;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    set(l, t) { target = l; thinkT = t ? 1 : 0; },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      mat.dispose();
      renderer.dispose();
    },
  };
}
