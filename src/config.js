export const PHASE = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  RESOLVING: "RESOLVING",
  ENDED: "ENDED",
};

export const MATH = {
  models: {
    safe:    { failure: 0.20, multiplier: { min: 1.0,  max: 1.5 } },
    risky:   { failure: 0.40, multiplier: { min: 2.0,  max: 5.0 } },
    critical:{ failure: 0.90, multiplier: { min: 10.0, max: 10.0, fixed: true } },
    golden:  { failure: 0.55, multiplier: { min: 0,    max: 0 } }, 
  },
  golden: {
    spawnMin: 1,
    spawnMax: 3,
    tickChance: 0.05,           
    bonusPctRange: { min: 0.05, max: 0.25 } 
  },
  
  RTP_TARGET: 0.97,
  MAX_EXPOSURE: 10000
};

export const CONFIG = {
  TIERS: 12,                   
  BLOCKS_PER_ROW: 3,

  BL_LEN: 100,
  BL_DEP: 30,
  BL_HGT: 20,

  GAP: 0.0,
  ROW_GAP: 0,
  VIEWPORT_PAD: 0.90,

  BET_MIN: 0.10,
  BET_MAX: 100.00,

  PULL_TIME_MS: 320,
  COLLAPSE_TIME_MS: 1400,     
};
