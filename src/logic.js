import { CONFIG, MATH, PHASE } from "./config.js";
import { ISO, pointInPoly } from "./iso.js";
import { clamp, rnd, choice, sanitizeBet } from "./utils.js";
import { game } from "./state.js";
import { screenToIso, sortForRender } from "./render.js";
import { els, setButtons, refreshHUD, flashStatus } from "./ui.js";
import { money, t } from "./i18n.js";


export function buildTower() {
  game.blocks.length = 0;
  const { BL_LEN: L, BL_DEP: D, BL_HGT: H, GAP, ROW_GAP } = CONFIG;

  for (let tier = 0; tier < CONFIG.TIERS; tier++) {
    const rot90 = tier % 2 === 1;
    const z = tier * (H + ROW_GAP);

    for (let i = 0; i < CONFIG.BLOCKS_PER_ROW; i++) {
      const id = `${tier}-${i}`;
      const klass = i === 1 ? "risky" : "safe";
      const sideOffset = (i - 1) * (D + GAP);
      const x = rot90 ? sideOffset : 0;
      const y = rot90 ? 0 : sideOffset;

      game.blocks.push({
        id, tier, index: i,
        class: klass, golden: false, removed: false,
        x, y, z, len: L, dep: D, hgt: H, rot90,
        alpha: 1, clickable: true,
      });
    }
  }
  sprinkleGoldenOnSpawn();
  layoutView();
}

function sprinkleGoldenOnSpawn() {
  const count = Math.floor(rnd(MATH.golden.spawnMin, MATH.golden.spawnMax + 1));
  const cands = game.blocks.filter(b => !b.removed && b.class !== "disabled");
  for (let n = 0; n < count; n++) {
    const b = choice(cands);
    if (!b) break;
    b.golden = true;
    b.class = "golden";
  }
}

export function layoutView() {
  let minSX = Infinity, maxSX = -Infinity, minSY = Infinity, maxSY = -Infinity;

  for (const b of game.blocks) {
    if (b.removed) continue;
    const { x, y, z, len: L, dep: D, hgt: H, rot90 } = b;
    const BL = rot90 ? D / 2 : L / 2;
    const BD = rot90 ? L / 2 : D / 2;
    const corners = [
      [x - BL, y - BD, z],[x + BL, y - BD, z],[x + BL, y + BD, z],[x - BL, y + BD, z],
      [x - BL, y - BD, z + H],[x + BL, y - BD, z + H],[x + BL, y + BD, z + H],[x - BL, y + BD, z + H],
    ];
    for (const [px, py, pz] of corners) {
      const { sx, sy } = ISO.project(px, py, pz);
      minSX = Math.min(minSX, sx); maxSX = Math.max(maxSX, sx);
      minSY = Math.min(minSY, sy); maxSY = Math.max(maxSY, sy);
    }
  }

  const w = els.stageEl.clientWidth || 1280;
  const h = els.stageEl.clientHeight || 720;
  const towerW = maxSX - minSX;
  const towerH = maxSY - minSY;
  game.scale = CONFIG.VIEWPORT_PAD * Math.min(w / towerW, h / towerH);

  const centerSX = (minSX + maxSX) / 2;
  const baseSY = maxSY;
  game.offsetX = w / 2 - centerSX * game.scale;
  game.offsetY = h * 0.92 - baseSY * game.scale;
}

function oddsFor(block) {
  if (block.class === "disabled") return { failure: 1, multiplier: {min:0,max:0} };
  return MATH.models[block.class];
}

/** TRY PULL (com correção do sentido) */
export async function tryPull(block) {
  if (game.phase !== PHASE.RUNNING || game.resolving || block.removed || block.class === "disabled") return;
  game.resolving = true;
  setPhase(PHASE.RESOLVING);

  const odds = oddsFor(block);
  const failed = Math.random() < odds.failure;

  await animatePull(block);

  if (failed) {
    await animateCollapse();
    flashStatus(t(game.lang, "busted"), 1600);
    setPhase(PHASE.ENDED);
    game.resolving = false;
    setTimeout(newRound, 1200);
    return;
  }

  if (block.class === "golden") {
    const bonus = game.bet * rnd(MATH.golden.bonusPctRange.min, MATH.golden.bonusPctRange.max);
    game.bank += bonus;
    flashStatus(`+ ${money(bonus, game.currency, game.lang)} bonus`, 1400);
    
  } else {
    const inc = odds.multiplier.fixed ? odds.multiplier.min : rnd(odds.multiplier.min, odds.multiplier.max);
    game.multiplier *= inc;
    flashStatus(`${t(game.lang, "success")} (+${inc.toFixed(2)}×)`, 1200);
    
  }

  block.removed = true;
  block.alpha = 0.3;
  block.clickable = false;

  reclassifyRowAfterRemoval(block);
  maybeTickGolden();

  setPhase(PHASE.RUNNING);
  game.resolving = false;
  refreshHUD(game.phase);
}

function reclassifyRowAfterRemoval(removed) {
  const sameRow = game.blocks.filter(x => x.tier === removed.tier && !x.removed);
  if (sameRow.length === 2) {
    if (removed.index === 1) {
      for (const x of sameRow) x.class = "risky";
    } else {
      for (const x of sameRow) x.class = x.index === 1 ? "critical" : "risky";
    }
  } else if (sameRow.length === 1) {
    const last = sameRow[0];
    last.class = "disabled";
    last.alpha = 0.6;
    last.clickable = false;
  }
}

function maybeTickGolden() {
  if (Math.random() < MATH.golden.tickChance) {
    const c = game.blocks.filter(b => !b.removed && b.class !== "disabled" && !b.golden);
    const b = choice(c);
    if (b) { b.golden = true; b.class = "golden"; }
  }
}


function animatePull(block) {
  return new Promise((resolve) => {
    const start = performance.now();
    const side = block.rot90 ? "y" : "x";
    const startPos = block[side];

    
    const sign = block.index === 0 ? -1 : (block.index === 2 ? 1 : (Math.random() < 0.5 ? -1 : 1));
    const dist = 80 * sign;

    function step(t) {
      const dt = Math.min(1, (t - start) / CONFIG.PULL_TIME_MS);
      block[side] = startPos + dist * dt;
      block.alpha = 1 - Math.min(dt, 1) * 0.6;
      if (dt < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}


function animateCollapse() {
  return new Promise((resolve) => {
    let last = performance.now();
    const pieces = game.blocks.filter(b => !b.removed);
    for (const p of pieces) {
      p._vx = rnd(-120, 120);
      p._vy = rnd(-90, -30);
      p._vz = rnd(140, 220);
    }
    const duration = CONFIG.COLLAPSE_TIME_MS / 1000;

    function step(now) {
      const dt = Math.min(0.05, (now - last) / 1000); 
      last = now;

      for (const p of pieces) {
        p.x += p._vx * dt;
        p.y += p._vy * dt;
        p.z = Math.max(0, p.z - p._vz * dt);
        p.alpha = Math.max(0, p.alpha - dt * 0.85);
      }
      // usamos um timer acumulado implícito via alpha média
      const alive = pieces.some(p => p.alpha > 0.05);
      if (alive) requestAnimationFrame(step);
      else {
        for (const p of pieces) p.removed = true;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}


export function hitBlockTop(px, py) {
  const pt = { x: px, y: py };
  const list = game.blocks.filter(b => !b.removed).slice().sort(sortForRender);
  for (let k = list.length - 1; k >= 0; k--) {
    const b = list[k];
    const BL = b.rot90 ? b.dep / 2 : b.len / 2;
    const BD = b.rot90 ? b.len / 2 : b.dep / 2;
    const p001 = ISO.project(b.x - BL, b.y - BD, b.z + b.hgt);
    const p101 = ISO.project(b.x + BL, b.y - BD, b.z + b.hgt);
    const p111 = ISO.project(b.x + BL, b.y + BD, b.z + b.hgt);
    const p011 = ISO.project(b.x - BL, b.y + BD, b.z + b.hgt);
    if (pointInPoly(pt, [p001, p101, p111, p011])) return b;
  }
  return null;
}

/** Fase + HUD/botões */
export function setPhase(next) {
  game.phase = next;
  setButtons({
    canBet: next === PHASE.IDLE,
    canCash: next === PHASE.RUNNING,
    canRandom: next === PHASE.RUNNING,
    canNewRound: !(next === PHASE.RUNNING || next === PHASE.RESOLVING),
  });
  for (const b of game.blocks) {
    b.clickable = next === PHASE.RUNNING && !b.removed && b.class !== "disabled";
  }
  refreshHUD(game.phase);
}

/** Ações da UI */
export function placeBet() {
  const v = sanitizeBet(els.betInput.value);
  game.bet = clamp(isNaN(v) ? 1.0 : v, CONFIG.BET_MIN, CONFIG.BET_MAX);
  els.betInput.value = game.bet.toFixed(2);
  game.multiplier = 1.0;
  buildTower();
  setPhase(PHASE.RUNNING);
}

export function cashOut() {
  if (game.phase !== PHASE.RUNNING || game.resolving) return;
  const win = game.bet * game.multiplier;
  game.bank += win;
  flashStatus(`${t(game.lang, "cashed")} ${money(win, game.currency, game.lang)}`, 1400);
  setPhase(PHASE.ENDED);
  setTimeout(newRound, 1200);
}

export function randomPick() {
  if (game.phase !== PHASE.RUNNING || game.resolving) return;
  const avail = game.blocks.filter(b => !b.removed && b.class !== "disabled");
  if (!avail.length) return;
  tryPull(choice(avail));
}

export function newRound() {
  game.phase = PHASE.IDLE;
  game.resolving = false;
  game.multiplier = 1.0;
  buildTower();
  setPhase(PHASE.IDLE);
}

export function backgroundGoldenTick() {
  if (game.phase !== PHASE.RUNNING || game.resolving) return;
  if (Math.random() < MATH.golden.tickChance) {
    const c = game.blocks.filter(b => !b.removed && b.class !== "disabled" && !b.golden);
    const b = choice(c);
    if (b) { b.golden = true; b.class = "golden"; }
  }
}

/** Mouse handlers (tooltip + click) */
export function onCanvasMouseMove(e) {
  const r = e.currentTarget.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const iso = screenToIso(sx, sy);
  const b = hitBlockTop(iso.x, iso.y);
  if (b && b.clickable) {
    game.hovered = b.id;
    const m = oddsFor(b);
    const fail = Math.round(m.failure * 100);
    const multText =
      b.class === "golden" ? "Instant Bonus" :
      m.multiplier.fixed ? `${m.multiplier.min.toFixed(1)}×` :
      `${m.multiplier.min.toFixed(1)}× – ${m.multiplier.max.toFixed(1)}×`;
    els.tooltip.textContent = `${b.class.toUpperCase()} • Fail ${fail}% • +${multText}`;
    els.tooltip.style.left = `${sx + 12}px`;
    els.tooltip.style.top = `${sy + 12}px`;
    els.tooltip.style.display = "block";
  } else {
    game.hovered = null;
    els.tooltip.style.display = "none";
  }
}

export function onCanvasLeave() {
  game.hovered = null;
  els.tooltip.style.display = "none";
}

export function onCanvasClick(e) {
  if (game.phase !== PHASE.RUNNING || game.resolving) return;
  const r = e.currentTarget.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const iso = screenToIso(sx, sy);
  const b = hitBlockTop(iso.x, iso.y);
  if (b && b.clickable) tryPull(b);
}
