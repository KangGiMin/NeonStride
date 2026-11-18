import { hazardProgress } from "../../game/obstacles/catalog.js";
import { monster } from "./monster.js";
import { fallingTrees } from "./trees.js";
import { steelCollapse } from "./collapse.js";
import { fireBar } from "./fire.js";
import { gate } from "./gate.js";
import { barrier } from "./barrier.js";
import { energyBeam } from "./energy.js";
import { empZone } from "./emp.js";
import { patrol } from "./patrol.js";
import { shutter } from "./shutter.js";
import { airstrike } from "./airstrike.js";

const renderers = {
  monster,
  trees: fallingTrees,
  collapse: steelCollapse,
  fire: (scene, o, z, progress, time) => fireBar(scene, z, time),
  bar: gate,
  gap: () => {},
  energy: energyBeam,
  emp: empZone,
  patrol,
  shutter,
  airstrike,
};
export function obstacle(scene, o, distance, time, game) {
  const z = o.position - distance;
  const behind = o.type === "monster" ? game.speed * 0.23 + 3 : 3;
  if (z + o.length < -behind || z > 200) return;
  const progress = hazardProgress(o, distance, game.speed, game.difficulty);
  (renderers[o.type] || barrier)(scene, o, z, progress, time, game);
}
