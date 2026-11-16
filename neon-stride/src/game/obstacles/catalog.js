import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "../../config/difficulties.js";
import { RULES } from "../../config/rules.js";
import { MONSTER } from "../../config/monster.js";

export const OBSTACLES = Object.freeze({
  low: { kind: "jump", height: RULES.lowHeight },
  high: { kind: "jump", height: RULES.highHeight },
  bar: { kind: "slide", bottom: 1, top: 2.5 },
  gap: { kind: "gap" },
  monster: { kind: "slide", bottom: MONSTER.hitBottom, top: MONSTER.hitTop },
  trees: { kind: "jump", height: 0.84 },
  collapse: { kind: "gap" },
  fire: { kind: "slide", bottom: 1, top: 2.5 },
});
export const isPit = (type) => OBSTACLES[type]?.kind === "gap";
export function obstacleSpec(o) {
  const spec = OBSTACLES[o.type];
  return o.type === "trees"
    ? { ...spec, height: o.variant === 2 ? 1.65 : 0.84 }
    : spec;
}

export function hazardProgress(
  o,
  distance,
  speed,
  difficulty = DEFAULT_DIFFICULTY,
) {
  const lead = DIFFICULTIES[difficulty].eventLead;
  return Math.max(0, Math.min(1, 1 - (o.position - distance) / (speed * lead)));
}

export const OBSTACLE_SEQUENCE = [
  "low",
  "monster",
  "trees",
  "fire",
  "collapse",
  "bar",
  "high",
  "gap",
];
