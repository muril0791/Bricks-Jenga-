import { initRender, startRender, resizeCanvas } from "./render.js";
import { buildTower, layoutView, setPhase, placeBet, cashOut, randomPick, newRound,
         backgroundGoldenTick, onCanvasMouseMove, onCanvasLeave, onCanvasClick } from "./logic.js";
import { els, refreshHUD } from "./ui.js";
import { game } from "./state.js";
import { PHASE } from "./config.js";

function boot() {
  initRender(els.stageEl);

  
  els.stageEl.addEventListener("mousemove", onCanvasMouseMove);
  els.stageEl.addEventListener("mouseleave", onCanvasLeave);
  els.stageEl.addEventListener("click", onCanvasClick);

 
  els.btnPlaceBet.addEventListener("click", placeBet);
  els.btnCashOut.addEventListener("click", cashOut);
  els.btnRandomPick.addEventListener("click", randomPick);
  els.btnNewRound.addEventListener("click", newRound);

  els.currencySel.addEventListener("change", () => { game.currency = els.currencySel.value; refreshHUD(game.phase); });
  els.langSel.addEventListener("change", () => { game.lang = els.langSel.value; refreshHUD(game.phase); });
  els.betInput.addEventListener("change", () => {
    
    refreshHUD(game.phase);
  });

 
  resizeCanvas(els.stageEl);
  buildTower();
  setPhase(PHASE.IDLE);
  refreshHUD(game.phase);
  startRender();

  
  setInterval(backgroundGoldenTick, 1600);

  
  const ro = new ResizeObserver(() => { layoutView(); });
  ro.observe(els.stageEl);
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
