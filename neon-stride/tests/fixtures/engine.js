import { Runner } from "../../src/engine.js";

const advance = (g, time) => {
  for (let t = 0; t < time - 1e-8; t += 1 / 120)
    g.update(Math.min(1 / 120, time - t));
};
const empty = () => {
  const g = new Runner(() => 0.5);
  g.start();
  g.obstacles = [];
  g.nextPosition = 1e9;
  g.corners = [];
  g.nextCorner = 1e9;
  return g;
};
const obstacle = (g, type, z = 3, length = 1.25) => {
  g.obstacles = [
    { type, position: g.distance + z, length, id: 0, passed: false },
  ];
};

export { advance, empty, obstacle };
