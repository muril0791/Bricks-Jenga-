import { COLORS } from "./colors.js";
import { ISO } from "./iso.js";
import { game } from "./state.js";

let canvas, ctx, fxCanvas, fxCtx;

export function initRender(stageEl) {
  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d", { alpha: true });
  stageEl.appendChild(canvas);

  fxCanvas = document.createElement("canvas");
  fxCanvas.style.pointerEvents = "none";
  fxCanvas.style.position = "absolute";
  fxCanvas.style.inset = "0";
  fxCtx = fxCanvas.getContext("2d", { alpha: true });
  stageEl.appendChild(fxCanvas);

  resizeCanvas(stageEl);
  window.addEventListener("resize", () => resizeCanvas(stageEl));
}

export function resizeCanvas(stageEl) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = stageEl.clientWidth || 1280;
  const h = stageEl.clientHeight || 720;

  for (const c of [canvas, fxCanvas]) {
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function screenToIso(px, py) {
  return {
    x: (px - game.offsetX) / game.scale,
    y: (py - game.offsetY) / game.scale,
  };
}

export function sortForRender(a, b) {
  const da = a.x + a.y + a.z * 2;
  const db = b.x + b.y + b.z * 2;
  return da - db;
}

function drawPoly(points, fill, stroke, lw = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0].sx, points[0].sy);
  for (let i = 1; i < points.length; i++)
    ctx.lineTo(points[i].sx, points[i].sy);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw / game.scale;
    ctx.stroke();
  }
}

export function drawIsoBlock(b, highlighted) {
  const { x, y, z, len: L, dep: D, hgt: H, rot90 } = b;
  const BL = rot90 ? D / 2 : L / 2;
  const BD = rot90 ? L / 2 : D / 2;

  const p000 = ISO.project(x - BL, y - BD, z);
  const p100 = ISO.project(x + BL, y - BD, z);
  const p110 = ISO.project(x + BL, y + BD, z);
  const p010 = ISO.project(x - BL, y + BD, z);
  const p001 = ISO.project(x - BL, y - BD, z + H);
  const p101 = ISO.project(x + BL, y - BD, z + H);
  const p111 = ISO.project(x + BL, y + BD, z + H);
  const p011 = ISO.project(x - BL, y + BD, z + H);

  ctx.save();

  if (typeof b.alpha === "number") ctx.globalAlpha = b.alpha;

  drawPoly([p011, p111, p110, p010], COLORS.left[b.class], COLORS.edge);

  drawPoly([p101, p111, p110, p100], COLORS.right[b.class], COLORS.edge);

  drawPoly([p001, p101, p111, p011], COLORS.top[b.class], COLORS.edge);

  if (highlighted && b.clickable) {
    drawPoly([p001, p101, p111, p011], null, COLORS.hi, 2);
  }
  ctx.restore();
}

function drawTableShadow() {
  const w = canvas.clientWidth || 1280;
  const h = canvas.clientHeight || 720;
  const r = 160 * game.scale;
  const cx = w / 2,
    cy = h * 0.92 + 6;
  ctx.save();
  ctx.fillStyle = COLORS.tableShadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function startRender() {
  function frame() {
    const w = canvas.clientWidth || 1280;
    const h = canvas.clientHeight || 720;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    drawTableShadow();
    ctx.save();
    ctx.translate(game.offsetX, game.offsetY);
    ctx.scale(game.scale, game.scale);

    const toDraw = game.blocks
      .filter((b) => !b.removed)
      .slice()
      .sort(sortForRender);
    for (const b of toDraw) drawIsoBlock(b, b.id === game.hovered);

    ctx.restore();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function spawnConfettiAtBlock(block) {
  const base = ISO.project(block.x, block.y, block.z + block.hgt + 10);
  const sx = base.sx * game.scale + game.offsetX;
  const sy = base.sy * game.scale + game.offsetY;

  const parts = [];
  for (let i = 0; i < 28; i++) {
    parts.push({
      x: sx,
      y: sy,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * -3 - 1.5,
      life: 0,
      max: 40 + Math.random() * 24,
      s: 2 + Math.random() * 2,
    });
  }
  function tick() {
    let alive = false;
    fxCtx.save();
    fxCtx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      if (p.life++ < p.max) {
        alive = true;
        p.x += p.vx;
        p.y += p.vy + p.life * 0.02;
        fxCtx.fillStyle = ["#fff", "#f59e0b", "#7aa0ff", "#16a34a", "#ef4444"][
          p.life % 5
        ];
        fxCtx.fillRect(p.x, p.y, p.s, p.s);
      }
    }
    fxCtx.restore();
    if (alive) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export { canvas, fxCanvas };
