// The living mind field: thousands of points that drift like breath, shy away from the cursor,
// and fold between four shapes as you scroll: a nebula, an orb, a calm wave, and a mirror ring.

import * as THREE from "three";

const VERT = /* glsl */ `
  attribute vec3 aNebula; attribute vec3 aOrb; attribute vec3 aWave; attribute vec3 aRing;
  attribute float aSeed;
  uniform float uTime; uniform float uMorph; uniform float uIntro; uniform vec2 uMouse;
  uniform float uPixel; uniform float uPulse; uniform float uSize;
  varying float vSeed; varying float vGlow; varying vec3 vPos;

  // cheap smooth noise
  vec3 hash3(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6)));
    return fract(sin(p)*43758.5453)*2.0-1.0; }
  vec3 drift(vec3 p, float t){
    return vec3(sin(p.y*1.7+t*0.6+aSeed*6.0), cos(p.z*1.3+t*0.5+aSeed*4.0), sin(p.x*1.5+t*0.7+aSeed*5.0));
  }
  vec3 pick(float m){
    vec3 a = aNebula; vec3 b = aOrb; vec3 c = aWave; vec3 d = aRing;
    float s1 = smoothstep(0.0,1.0,clamp(m,0.0,1.0));
    float s2 = smoothstep(0.0,1.0,clamp(m-1.0,0.0,1.0));
    float s3 = smoothstep(0.0,1.0,clamp(m-2.0,0.0,1.0));
    float s4 = smoothstep(0.0,1.0,clamp(m-3.0,0.0,1.0));
    vec3 p = mix(a,b,s1); p = mix(p,c,s2); p = mix(p,d,s3); p = mix(p,b,s4);
    return p;
  }
  void main(){
    // each point moves with its own small delay, so shapes pour instead of snapping
    vec3 p = pick(uMorph - aSeed*0.35 + 0.175);
    float t = uTime;
    p += drift(p, t) * (0.05 + 0.04*aSeed);
    // breathing
    p *= 1.0 + 0.025*sin(t*0.9) + uPulse*0.22*(0.6+aSeed*0.8);
    // intro: everything pours out from the centre
    p = mix(p*0.02 + drift(p*3.0,t)*0.05, p, uIntro);

    vec4 mv = modelViewMatrix * vec4(p,1.0);
    vec4 clip = projectionMatrix * mv;
    // push away from the cursor in screen space
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    float r = length(d);
    float push = smoothstep(0.32, 0.0, r);
    ndc += normalize(d + 1e-4) * push * 0.12;
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    vGlow = push;
    vSeed = aSeed;
    vPos = p;
    gl_PointSize = uSize * uPixel * (0.6 + aSeed*1.1 + push*1.5) * (4.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
  varying float vSeed; varying float vGlow; varying vec3 vPos;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    float k = 0.5 + 0.5*sin(vPos.y*1.4 + vPos.x*0.8 + uTime*0.4);
    vec3 col = mix(uA, uB, k);
    col = mix(col, uC, smoothstep(0.75, 1.0, vSeed));
    col += vGlow * 0.6;
    float tw = 0.65 + 0.35*sin(uTime*2.0 + vSeed*40.0);
    gl_FragColor = vec4(col, a * tw * 0.9);
  }
`;

function shapes(n: number) {
  const nebula = new Float32Array(n * 3), orb = new Float32Array(n * 3), wave = new Float32Array(n * 3), ring = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const g = Math.PI * (3 - Math.sqrt(5));
  const side = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    const s = Math.random();
    seed[i] = s;
    // nebula: a soft spiral galaxy
    const arm = i % 3;
    const rad = Math.pow(Math.random(), 0.6) * 3.4;
    const ang = rad * 1.6 + (arm * Math.PI * 2) / 3 + (Math.random() - 0.5) * 0.9;
    nebula.set([Math.cos(ang) * rad, (Math.random() - 0.5) * 0.35 * (3.6 - rad) * 0.5, Math.sin(ang) * rad], i * 3);
    // orb: an even sphere (Fibonacci), a few points floating just outside
    const y = 1 - (i / (n - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const th = g * i;
    const R = 1.25 * (s > 0.92 ? 1 + Math.random() * 0.5 : 1);
    orb.set([Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R], i * 3);
    // wave: a calm sea of points
    const gx = (i % side) / side - 0.5, gz = Math.floor(i / side) / side - 0.5;
    wave.set([gx * 7, Math.sin(gx * 9) * 0.25 + Math.cos(gz * 7) * 0.2 - 0.6, gz * 5], i * 3);
    // ring: a mirror, a thin torus standing up
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI * 2;
    const tube = 0.07 * Math.sqrt(Math.random());
    ring.set([(1.55 + tube * Math.cos(b)) * Math.cos(a), (1.55 + tube * Math.cos(b)) * Math.sin(a), tube * Math.sin(b) * 2], i * 3);
  }
  return { nebula, orb, wave, ring, seed };
}

export interface Field {
  /** 0 nebula, 1 orb, 2 wave, 3 ring, 4 orb again */
  setMorph(m: number): void;
  /** 0..1 extra swell, e.g. hovering a door */
  setPulse(p: number): void;
  dispose(): void;
}

export function createField(canvas: HTMLCanvasElement, opts: { count?: number } = {}): Field {
  const small = window.innerWidth < 700;
  const n = opts.count ?? (small ? 5000 : 11000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const s = shapes(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(s.orb, 3));
  geo.setAttribute("aNebula", new THREE.BufferAttribute(s.nebula, 3));
  geo.setAttribute("aOrb", new THREE.BufferAttribute(s.orb, 3));
  geo.setAttribute("aWave", new THREE.BufferAttribute(s.wave, 3));
  geo.setAttribute("aRing", new THREE.BufferAttribute(s.ring, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(s.seed, 1));

  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 0 }, uIntro: { value: 0 }, uPulse: { value: 0 },
    uMouse: { value: new THREE.Vector2(9, 9) }, uPixel: { value: dpr }, uSize: { value: small ? 7 : 6 },
    uA: { value: new THREE.Color("#7c86ff") }, uB: { value: new THREE.Color("#ffb59a") }, uC: { value: new THREE.Color("#9ff0e6") },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let target = 0, morph = 0, pulse = 0, pulseT = 0;
  const mouse = new THREE.Vector2(9, 9), mouseT = new THREE.Vector2(9, 9);
  let tilt = new THREE.Vector2();

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < h ? 8.2 : 6;
    camera.updateProjectionMatrix();
  };
  const onMove = (e: PointerEvent) => {
    mouseT.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };
  const onLeave = () => mouseT.set(9, 9);
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove);
  document.addEventListener("pointerleave", onLeave);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = reduce ? t * 0.2 : t;
    uniforms.uIntro.value = Math.min(1, uniforms.uIntro.value + dt * 0.55);
    morph += (target - morph) * Math.min(1, dt * 3);
    uniforms.uMorph.value = morph;
    pulse += (pulseT - pulse) * Math.min(1, dt * 4);
    uniforms.uPulse.value = pulse;
    if (mouseT.x > 5) mouse.lerp(mouseT, 1); else mouse.lerp(mouseT, Math.min(1, dt * 6));
    uniforms.uMouse.value.copy(mouse);
    // the whole field leans gently towards the cursor
    const lean = mouseT.x > 5 ? new THREE.Vector2() : mouseT;
    tilt = tilt.lerp(lean, Math.min(1, dt * 2));
    points.rotation.y = t * 0.06 + tilt.x * 0.35;
    // the galaxy is seen from above at first, so its arms show; it stands up as it becomes the orb
    const galaxy = 0.75 * Math.max(0, 1 - morph);
    points.rotation.x = galaxy - tilt.y * 0.2 + (morph > 1.5 && morph < 2.5 ? 0.35 : 0) * Math.sin(Math.min(Math.PI, (morph - 1.5) * Math.PI));
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setMorph: (m) => (target = m),
    setPulse: (p) => (pulseT = p),
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    },
  };
}
