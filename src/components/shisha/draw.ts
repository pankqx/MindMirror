// Canvas versions of the shisha, for fields with hundreds of mirrors.
// Each thread colour is stitched once into a small sprite; the glint is drawn live on top,
// so mirrors can turn towards the pointer for almost nothing.

const sprites = new Map<string, HTMLCanvasElement>();
const SPRITE = 96; // px, at 2x for crisp mirrors at ~48 css px

/** A stitched mirror (mirror + buttonhole ring + chain halo) in one thread colour. */
export function mirrorSprite(thread: string): HTMLCanvasElement {
  const hit = sprites.get(thread);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = SPRITE;
  const g = c.getContext("2d")!;
  const m = SPRITE / 2;
  const R = SPRITE * 0.22;
  g.translate(m, m);
  g.lineCap = "round";
  // chain halo
  g.strokeStyle = thread;
  g.lineWidth = 1.3;
  const chainR = R * 1.55;
  const loops = Math.round((Math.PI * 2 * chainR) / 7);
  for (let i = 0; i < loops; i++) {
    const a = (i / loops) * Math.PI * 2;
    g.save();
    g.translate(Math.cos(a) * chainR, Math.sin(a) * chainR);
    g.rotate(a + Math.PI / 2);
    g.beginPath();
    g.ellipse(0, 0, 3.2, 1.8, 0, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  // buttonhole stitches
  g.lineWidth = 2.2;
  const ticks = 26;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a) * (R + 1), Math.sin(a) * (R + 1));
    g.lineTo(Math.cos(a) * (R + 8), Math.sin(a) * (R + 8));
    g.stroke();
  }
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, R + 1.4, 0, Math.PI * 2);
  g.stroke();
  // the mirror
  const grad = g.createLinearGradient(-R, -R, R, R);
  grad.addColorStop(0, "#fbfcfd");
  grad.addColorStop(0.42, "#cdd3da");
  grad.addColorStop(0.58, "#8e97a4");
  grad.addColorStop(1, "#e3e7ec");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 1;
  g.strokeStyle = "#4b5260";
  g.stroke();
  sprites.set(thread, c);
  return c;
}

/** Draw a stitched mirror centred at x,y with mirror radius r, its glint facing `angle`. */
export function drawMirror(ctx: CanvasRenderingContext2D, thread: string, x: number, y: number, r: number, angle: number, alpha = 1, shine = 0) {
  const s = mirrorSprite(thread);
  const scale = r / (SPRITE * 0.22);
  const w = SPRITE * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(s, x - w / 2, y - w / 2, w, w);
  // glint
  ctx.strokeStyle = `rgba(255,255,255,${0.75 + shine * 0.25})`;
  ctx.lineWidth = Math.max(1, r * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.64, angle - 0.55, angle + 0.35);
  ctx.stroke();
  if (shine > 0.02) {
    // a flash of reflected light
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
    g.addColorStop(0, `rgba(255,255,255,${0.55 * shine})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
