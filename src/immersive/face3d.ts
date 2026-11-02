// Mira: a face made of light. A real face scan with 52 expressions (ARKit blendshapes),
// drawn as glass with a glowing rim plus a dust of sparkling points that move with every expression.
// Model: "facecap" by Face Cap (bannaflak.com), from the three.js examples.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Phase } from "../lib/converse";

export interface Face {
  update(phase: Phase, level: number): void;
  dispose(): void;
}

function matcap(inner: string, rim: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(118, 110, 10, 128, 128, 128);
  r.addColorStop(0, inner);
  r.addColorStop(0.7, inner);
  r.addColorStop(0.9, rim);
  r.addColorStop(1, "#ffffff");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  // warm light from below-right, so she feels alive rather than cold
  const w = g.createRadialGradient(220, 230, 0, 220, 230, 170);
  w.addColorStop(0, "rgba(255,170,130,0.55)");
  w.addColorStop(1, "rgba(255,170,130,0)");
  g.globalCompositeOperation = "lighter";
  g.fillStyle = w;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft glowing iris painted across the eyeball's UVs (the iris sits in the middle of the map). */
function irisTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c9cdf5";
  g.fillRect(0, 0, 256, 256);
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 52);
  r.addColorStop(0, "#05060c");
  r.addColorStop(0.32, "#05060c");
  r.addColorStop(0.38, "#6b4a7a");
  r.addColorStop(0.8, "#e3a07f");
  r.addColorStop(1, "#c9cdf5");
  g.fillStyle = r;
  g.beginPath();
  g.arc(128, 128, 52, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.beginPath();
  g.arc(114, 142, 7, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Scatter points over the head's surface; each point keeps its triangle's expression deltas. */
function dust(head: THREE.Mesh, count: number) {
  const src = head.geometry;
  const pos = src.attributes.position;
  const idx = src.index!;
  const tris = idx.count / 3;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  // pick triangles by area, so the dust is even
  const areas = new Float32Array(tris);
  let total = 0;
  for (let t = 0; t < tris; t++) {
    a.fromBufferAttribute(pos, idx.getX(t * 3));
    b.fromBufferAttribute(pos, idx.getX(t * 3 + 1));
    c.fromBufferAttribute(pos, idx.getX(t * 3 + 2));
    total += b.sub(a).cross(c.sub(a)).length() / 2;
    areas[t] = total;
  }
  const pick = new Uint32Array(count * 3);
  const bary = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.random() * total;
    let lo = 0, hi = tris - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (areas[m] < r) lo = m + 1; else hi = m; }
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    pick.set([idx.getX(lo * 3), idx.getX(lo * 3 + 1), idx.getX(lo * 3 + 2)], i * 3);
    bary.set([1 - u - v, u, v], i * 3);
  }
  const mix = (attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 3; k++) {
        const v = pick[i * 3 + k], w = bary[i * 3 + k];
        out[i * 3] += attr.getX(v) * w;
        out[i * 3 + 1] += attr.getY(v) * w;
        out[i * 3 + 2] += attr.getZ(v) * w;
      }
    }
    return new THREE.BufferAttribute(out, 3);
  };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", mix(pos));
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = Math.random();
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.morphAttributes.position = (src.morphAttributes.position ?? []).map(mix);
  geo.morphTargetsRelative = src.morphTargetsRelative;
  return geo;
}

export async function createFace(canvas: HTMLCanvasElement, url: string): Promise<Face> {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.set(0, 0.05, 4.6);

  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  const head = root.getObjectByName("mesh_2") as THREE.Mesh | undefined
    ?? (root.getObjectByName("head")?.children[0] as THREE.Mesh);
  const teeth = root.getObjectByName("teeth");
  const eyeL = root.getObjectByName("grp_eyeLeft");
  const eyeR = root.getObjectByName("grp_eyeRight");
  if (!head?.morphTargetDictionary || !head.morphTargetInfluences) throw new Error("face model has no expressions");
  const dict = head.morphTargetDictionary;
  const inf = head.morphTargetInfluences;

  // glass with a glowing rim
  const glass = new THREE.MeshMatcapMaterial({ matcap: matcap("#07080f", "#7d86ff") });
  const eyeMat = new THREE.MeshBasicMaterial({ map: irisTexture() });
  const eyes: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (m === head) { m.material = glass; return; }
    m.material = eyeMat;
    eyes.push(m);
  });
  if (teeth) teeth.visible = false;

  // the sparkling dust that rides on the skin
  const small = window.innerWidth < 700;
  const dustGeo = dust(head, small ? 12000 : 26000);
  const dustMat = new THREE.PointsMaterial({
    size: small ? 0.012 : 0.009, sizeAttenuation: true, color: new THREE.Color("#ffe3d6"),
    transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  dustMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = timeU;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aSeed; uniform float uTime; varying float vTw;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvTw = 0.45 + 0.55 * sin(uTime * 2.2 + aSeed * 60.0);");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vTw;")
      .replace("#include <premultiplied_alpha_fragment>", "gl_FragColor.a *= vTw;\n#include <premultiplied_alpha_fragment>");
  };
  const timeU = { value: 0 };
  const points = new THREE.Points(dustGeo, dustMat);
  points.morphTargetInfluences = inf; // share the face's expressions
  points.morphTargetDictionary = dict;
  head.add(points);

  // centre and size the face
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  root.position.sub(center);
  pivot.add(root);
  pivot.scale.setScalar((window.innerWidth < 700 ? 1.7 : 2.05) / size.y);
  scene.add(pivot);

  // Paint the iris on the side of each eyeball that faces the viewer
  // (the scan's own UVs relied on a texture transform we dropped with its textures).
  scene.updateMatrixWorld(true);
  for (const m of eyes) {
    const g = m.geometry;
    g.computeBoundingSphere();
    const { center, radius } = g.boundingSphere!;
    const inv = new THREE.Matrix4().copy(m.matrixWorld).invert();
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(inv);
    const up0 = new THREE.Vector3(0, 1, 0).transformDirection(inv);
    const right = new THREE.Vector3().crossVectors(up0, fwd).normalize();
    const up = new THREE.Vector3().crossVectors(fwd, right).normalize();
    const p = g.attributes.position;
    const uv = new Float32Array(p.count * 2);
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).sub(center).divideScalar(radius);
      const k = v.dot(fwd) > 0 ? 0.5 : 2;
      uv[i * 2] = 0.5 + v.dot(right) * k * 0.5;
      uv[i * 2 + 1] = 0.5 + v.dot(up) * k * 0.5;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }

  const set = (name: string, v: number, k = 0.25) => {
    const i = dict[name];
    if (i !== undefined) inf[i] += (v - inf[i]) * k;
  };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < h ? 5.6 : 4.6;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);
  const mouse = new THREE.Vector2();
  const onMove = (e: PointerEvent) => mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  window.addEventListener("pointermove", onMove);

  const clock = new THREE.Clock();
  let nextBlink = 1.5, blink = 0, smile = 0;
  let phase: Phase = "idle", level = 0, lvl = 0;
  let raf = 0;
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    timeU.value = t;
    lvl += (level - lvl) * Math.min(1, dt * (level > lvl ? 22 : 10));

    // look at you, with a little life of its own
    const lx = mouse.x * 0.42 + Math.sin(t * 0.35) * 0.05;
    const ly = mouse.y * 0.22 + Math.sin(t * 0.5) * 0.03;
    pivot.rotation.y += (lx - pivot.rotation.y) * Math.min(1, dt * 2.5);
    pivot.rotation.x += (-ly - pivot.rotation.x) * Math.min(1, dt * 2.5);
    const tilt = phase === "listening" ? 0.09 : Math.sin(t * 0.4) * 0.025;
    pivot.rotation.z += (tilt - pivot.rotation.z) * Math.min(1, dt * 2);
    pivot.position.y = Math.sin(t * 0.9) * 0.015;
    for (const e of [eyeL, eyeR]) {
      if (!e) continue;
      e.rotation.y += (mouse.x * 0.35 - e.rotation.y) * 0.2;
      e.rotation.x += (-mouse.y * 0.25 - e.rotation.x) * 0.2;
    }

    // blink every few seconds
    nextBlink -= dt;
    if (nextBlink <= 0) { blink = 1; nextBlink = 2 + Math.random() * 3.5; }
    blink = Math.max(0, blink - dt * 7);
    const b = Math.sin(blink * Math.PI);
    set("eyeBlink_L", b, 1);
    set("eyeBlink_R", b, 1);

    // expressions by state
    const talking = phase === "speaking";
    smile += ((phase === "idle" ? 0.38 : phase === "speaking" ? 0.22 : 0.12) - smile) * 0.05;
    set("mouthSmile_L", smile + (talking ? lvl * 0.1 : 0));
    set("mouthSmile_R", smile + (talking ? lvl * 0.1 : 0));
    set("cheekSquint_L", smile * 0.4);
    set("cheekSquint_R", smile * 0.4);
    set("browInnerUp", phase === "listening" ? 0.45 : talking ? 0.15 + lvl * 0.3 : 0.08);
    set("eyeWide_L", phase === "listening" ? 0.2 : 0);
    set("eyeWide_R", phase === "listening" ? 0.2 : 0);
    set("eyeLookUp_L", phase === "thinking" ? 0.5 : 0, 0.08);
    set("eyeLookUp_R", phase === "thinking" ? 0.5 : 0, 0.08);
    set("eyeLookOut_L", phase === "thinking" ? 0.3 : 0, 0.08);
    set("eyeLookIn_R", phase === "thinking" ? 0.3 : 0, 0.08);
    set("mouthPress_L", phase === "thinking" ? 0.35 : 0, 0.1);
    set("mouthPress_R", phase === "thinking" ? 0.35 : 0, 0.1);
    // the mouth follows the voice
    set("jawOpen", talking ? Math.min(0.55, lvl * 0.75) : 0, 0.5);
    set("mouthFunnel", talking ? Math.max(0, Math.sin(t * 7.3)) * lvl * 0.35 : 0, 0.4);
    set("mouthLowerDown_L", talking ? lvl * 0.35 : 0, 0.5);
    set("mouthLowerDown_R", talking ? lvl * 0.35 : 0, 0.5);
    set("mouthUpperUp_L", talking ? lvl * 0.15 : 0, 0.5);
    set("mouthUpperUp_R", talking ? lvl * 0.15 : 0, 0.5);

    dustMat.opacity = 0.6 + lvl * 0.4 + (phase === "listening" ? 0.15 : 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    update(p, l) { phase = p; level = l; },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      dustGeo.dispose(); dustMat.dispose(); glass.dispose(); eyeMat.dispose();
      renderer.dispose();
    },
  };
}
