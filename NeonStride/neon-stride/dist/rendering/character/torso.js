export function drawTorso(scene, p, shadow) {
  // Back view of one runner: armored jacket, cyan seams, lime energy spine.
  const torso = [p(-0.28, 1.42), p(0.28, 1.42), p(0.21, 0.93), p(-0.21, 0.93)];
  scene.poly(torso, "#263d4e", "#6b9aa777");
  scene.poly(
    [p(-0.28, 1.42), p(-0.14, 1.38), p(-0.1, 1.0), p(-0.21, 0.93)],
    "#3b5a67",
  );
  scene.poly(
    [p(0.28, 1.42), p(0.14, 1.38), p(0.1, 1.0), p(0.21, 0.93)],
    "#162b40",
  );
  scene.line(
    [p(-0.23, 1.34), p(0, 1.22), p(0.23, 1.34)],
    "#a9ff8b",
    shadow.k * 0.025,
    6,
  );
  scene.line([p(0, 1.31), p(0, 1.01)], "#c1ff91", shadow.k * 0.045, 8);
  scene.box(
    0,
    0.93,
    -0.04,
    0.45,
    0.12,
    0.16,
    ["#162a3b", "#112132", "#344d57"],
    "#72a6ae66",
    p,
  );
}
