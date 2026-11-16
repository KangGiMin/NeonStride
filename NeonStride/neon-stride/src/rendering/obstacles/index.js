import { hazardProgress } from "../../game/obstacles/catalog.js";
import { monster } from "./monster.js";
import { fallingTrees } from "./trees.js";
import { steelCollapse } from "./collapse.js";
import { fireBar } from "./fire.js";
import { gate } from "./gate.js";
import { barrier } from "./barrier.js";

const renderers = {
  monster,
  trees: fallingTrees,
  collapse: steelCollapse,
  fire: (scene, o, z, progress, time) => fireBar(scene, z, time),
  bar: gate,
  gap: () => {},
};
export function obstacle(scene, o, distance, time, game) {
  const z = o.position - distance;
  if (z < -3 || z > 200) return;
  const progress = hazardProgress(o, distance, game.speed, game.difficulty);
  (renderers[o.type] || barrier)(scene, o, z, progress, time);
}
