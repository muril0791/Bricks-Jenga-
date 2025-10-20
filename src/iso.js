export const ISO = {
  cos: Math.sqrt(3) / 2,
  sin: 0.5,
  project(x, y, z) {
    return { sx: (x - y) * this.cos, sy: (x + y) * this.sin - z };
  },
};

export function pointInPoly(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].sx, yi = poly[i].sy, xj = poly[j].sx, yj = poly[j].sy;
    const inter = yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi || 1e-6) + xi;
    if (inter) c = !c;
  }
  return c;
}
