import { PHASE } from "./config.js";

/** @typedef {"safe"|"risky"|"critical"|"golden"|"disabled"} BlockClass */

/** @type {{
  currency: "USD"|"CAD",
  lang: "en"|"pt-BR"|"fr-CA",
  bet: number,
  phase: string,
  resolving: boolean,
  multiplier: number,
  bank: number,
  blocks: Array<any>,
  hovered: string|null,
  scale: number,
  offsetX: number,
  offsetY: number,
}} */
export const game = {
  currency: "USD",
  lang: "en",
  bet: 1.0,
  phase: PHASE.IDLE,
  resolving: false,
  multiplier: 1.0,
  bank: 0,
  blocks: [],
  hovered: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};
