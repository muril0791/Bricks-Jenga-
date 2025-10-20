import { game } from "./state.js";
import { money, t } from "./i18n.js";

export const els = {
  stageEl: document.querySelector("#stage"),
  betInput: /** @type {HTMLInputElement} */(document.querySelector("#betInput")),
  currencySel: /** @type {HTMLSelectElement} */(document.querySelector("#currency")),
  langSel: /** @type {HTMLSelectElement} */(document.querySelector("#lang")),
  btnPlaceBet: /** @type {HTMLButtonElement} */(document.querySelector("#placeBet")),
  btnCashOut: /** @type {HTMLButtonElement} */(document.querySelector("#cashOut")),
  btnRandomPick: /** @type {HTMLButtonElement} */(document.querySelector("#randomPick")),
  btnNewRound: /** @type {HTMLButtonElement} */(document.querySelector("#newRound")),
  multiplierEl: document.querySelector("#multiplier"),
  potentialEl: document.querySelector("#potential"),
  statusEl: document.querySelector("#status"),
  tooltip: /** @type {HTMLElement} */(document.querySelector("#tooltip")),
};

let statusTimer = null;
let statusOverride = null;

export function setButtons({ canBet, canCash, canRandom, canNewRound }) {
  els.btnPlaceBet.disabled = !canBet;
  els.betInput.disabled = !canBet;
  els.btnCashOut.disabled = !canCash;
  els.btnRandomPick.disabled = !canRandom;
  els.btnNewRound.disabled = !canNewRound;
}

export function refreshHUD(phase) {
  els.multiplierEl.textContent = `×${game.multiplier.toFixed(2)}`;
  els.potentialEl.textContent =
    phase === "RUNNING" ? money(game.bet * game.multiplier, game.currency, game.lang) : "—";

  if (statusOverride) {
    els.statusEl.textContent = statusOverride;
  } else {
    els.statusEl.textContent =
      phase === "IDLE" ? t(game.lang, "waiting")
      : phase === "RUNNING" ? t(game.lang, "choose")
      : t(game.lang, "waiting");
  }
}

export function flashStatus(msg, ms = 1400) {
  if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
  statusOverride = msg;
  els.statusEl.textContent = msg;
  statusTimer = setTimeout(() => {
    statusOverride = null;
    statusTimer = null;
    refreshHUD(game.phase);
  }, ms);
}
