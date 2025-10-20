export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rnd = (a, b) => a + Math.random() * (b - a);
export const choice = (arr) => arr[(Math.random() * arr.length) | 0];
export const sanitizeBet = (v) => parseFloat(String(v).replace(",", "."));
