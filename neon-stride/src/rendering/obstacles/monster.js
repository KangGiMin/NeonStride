import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "../../config/difficulties.js";
import { monsterAttackPose } from "../../animation/monster-attack.js";
import { drawMonsterBody } from "./monster-body.js";
import { drawBatTrail, drawMonsterBat } from "./monster-bat.js";

export function monster(scene, obstacle, z, progress, time, game) {
  if (progress <= 0) return;
  const config = DIFFICULTIES[game?.difficulty ?? DEFAULT_DIFFICULTY];
  const lead = config.eventLead;
  const phase =
    progress + (z < 0 ? -z / ((game?.speed ?? config.initialSpeed) * lead) : 0);
  const pose = monsterAttackPose(phase, lead);
  drawBatTrail(scene, z, phase, lead);
  drawMonsterBody(scene, z, pose);
  drawMonsterBat(scene, z, pose);
}
