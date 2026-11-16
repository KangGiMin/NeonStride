import { RULES } from "../../config/rules.js";
import { isPit } from "../../game/obstacles/catalog.js";
import { runnerPhase, runnerPose } from "../../animation/pose.js";
import { runnerBodyPoint } from "../../animation/body-transform.js";
import { runnerFallPose } from "../../animation/fall.js";
import { seeded } from "../shared.js";
import { drawBoot } from "./boots.js";
import { drawArm } from "./arms.js";
import { drawLegs } from "./legs.js";
import { drawTorso } from "./torso.js";
import { drawHead } from "./head.js";
import { drawSlide } from "./slide.js";

export function character(scene, game, time, preview) {
  const c = scene.ctx,
    fall =
      (game.status === "falling" || game.status === "over") &&
      isPit(game.reason);
  const fallTime = game.fallTime || 0;
  if (fall && fallTime >= RULES.fallDuration) return;
  const y = game.y;
  const slide = !fall && game.sliding;
  const airborne = fall || game.y > 0.02;
  const fallDepth = fall ? fallTime * 2.3 : 0;
  if (fall) {
    // The near road edge occludes the body as it drops into the opening.
    const pit = game.obstacles.find(
      (o) =>
        isPit(o.type) &&
        o.position <= game.distance &&
        o.position + o.length >= game.distance,
    );
    const nearEdge = scene.project(
      0,
      0,
      pit ? pit.position - game.distance : 0,
    ).y;
    c.save();
    c.beginPath();
    c.rect(0, 0, scene.w, Math.min(scene.h, nearEdge));
    c.clip();
    c.globalAlpha = Math.max(0, 1 - Math.max(0, fallTime - 0.35) / 0.5);
  }
  // Cadence follows travelled distance as speed rises; paused poses stay frozen.
  const phase = preview
    ? time * 11.4
    : runnerPhase(game.distance, fall ? game.elapsed : time);
  const elapsed =
    scene.lastPoseTime === undefined
      ? 0
      : Math.max(0, Math.min(0.05, time - scene.lastPoseTime));
  if (scene.lastPoseTime === undefined || time < scene.lastPoseTime || slide)
    scene.airBlend = 0;
  scene.lastPoseTime = time;
  scene.airBlend +=
    ((airborne ? 1 : 0) - scene.airBlend) * (1 - Math.exp(-elapsed * 18));
  const pose = fall
    ? runnerFallPose(phase, fallTime)
    : runnerPose(phase, scene.airBlend);
  const p = (x, dy, z = 0) => {
    const point = slide
      ? { x, y: dy, z }
      : runnerBodyPoint(pose, { x, y: dy, z });
    return scene.project(point.x, point.y + y, point.z + fallDepth);
  };
  const shadow = scene.project(0, 0, fallDepth);
  c.save();
  c.globalAlpha = fall ? 0 : 0.5 / (1 + Math.max(0, y) * 0.8);
  c.fillStyle = "#01090f";
  c.beginPath();
  c.ellipse(
    shadow.x,
    shadow.y + 3,
    shadow.k * (slide ? 0.65 : 0.5),
    shadow.k * 0.12,
    0,
    0,
    Math.PI * 2,
  );
  c.fill();
  c.restore();

  if (slide) {
    drawSlide(scene, y, shadow, p);
    return;
  }
  const joint = (point) =>
    scene.project(point.x, point.y + y, point.z + fallDepth);
  const paintBoot = (leg) => drawBoot(scene, leg, joint, shadow);
  const paintArm = (arm) => drawArm(scene, arm, p, shadow);
  const farArm = (arm) => arm.elbow.z + arm.hand.z > arm.shoulder.z * 2;
  drawLegs(scene, pose, joint, shadow, paintBoot);
  for (const arm of pose.arms.filter(farArm)) paintArm(arm);
  drawTorso(scene, p, shadow);
  for (const arm of pose.arms.filter((arm) => !farArm(arm))) paintArm(arm);
  for (const leg of pose.legs.filter((leg) => leg.lift >= 0.5)) paintBoot(leg);
  drawHead(scene, pose, y, fallDepth, shadow);
  if (airborne && !fall) {
    for (let i = 0; i < 4; i++) {
      const pp = p((seeded(i + 15) - 0.5) * 0.5, -0.2 - i * 0.18, -0.1);
      c.fillStyle = `rgba(169,255,184,${0.35 - i * 0.07})`;
      c.fillRect(pp.x, pp.y, 2, 6);
    }
  }
  if (preview) {
    const pp = scene.project(0, 0.02, 0);
    c.strokeStyle = "#93f3d944";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(pp.x, pp.y, shadow.k * 0.8, shadow.k * 0.15, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (fall) c.restore();
}
