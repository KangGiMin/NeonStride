const STRIDE_KEYS = [
  { t: 0, y: 0.055, z: 0.3, pitch: -0.13, dy: 0, dz: -1.5, dp: 1.3 },
  { t: 0.38, y: 0.055, z: -0.34, pitch: 0.6, dy: 0, dz: -1.6, dp: 2.0 },
  { t: 0.52, y: 0.42, z: -0.44, pitch: 0.95, dy: 1.2, dz: 0.1, dp: 0 },
  { t: 0.7, y: 0.5, z: -0.06, pitch: 0.4, dy: -0.3, dz: 2.5, dp: -3 },
  { t: 0.88, y: 0.25, z: 0.32, pitch: -0.2, dy: -2.5, dz: 0.8, dp: 0 },
  { t: 1, y: 0.055, z: 0.3, pitch: -0.13, dy: 0, dz: -1.5, dp: 1.3 },
];
export function sampleStride(cycle) {
  const index = STRIDE_KEYS.findIndex((key, i) => i > 0 && cycle <= key.t);
  const a = STRIDE_KEYS[index - 1],
    b = STRIDE_KEYS[index];
  const duration = b.t - a.t,
    u = (cycle - a.t) / duration;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1,
    h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2,
    h11 = u ** 3 - u ** 2;
  const interpolate = (value, tangent) =>
    h00 * a[value] +
    h10 * duration * a[tangent] +
    h01 * b[value] +
    h11 * duration * b[tangent];
  return {
    y: interpolate("y", "dy"),
    z: interpolate("z", "dz"),
    pitch: interpolate("pitch", "dp"),
  };
}
