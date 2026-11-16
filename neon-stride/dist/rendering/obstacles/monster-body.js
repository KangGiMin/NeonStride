import { monsterBodyPoint } from "../../animation/monster-attack.js";

export function drawMonsterBody(scene, z, pose) {
  const world = (point) => {
    const p = monsterBodyPoint(pose, point);
    return { ...p, z: p.z + z };
  };
  const project = (x, y, depth) => {
    const p = world({ x, y, z: depth });
    return scene.project(p.x, p.y, p.z);
  };
  scene.box(
    0,
    0.65,
    0,
    0.95,
    1.25,
    0.65,
    ["#536349", "#293d34", "#78816a"],
    "#8eac6f",
    project,
  );
  for (const side of [-1, 1]) {
    scene.worldLine(
      [
        world({ x: side * 0.29, y: 0.85, z: 0.2 }),
        world({ x: side * 0.42, y: 0.05, z: -0.12 }),
      ],
      "#344239",
      0.3,
    );
  }
  scene.box(
    -0.13,
    1.93,
    -0.1,
    0.84,
    0.68,
    0.65,
    ["#788963", "#384d3e", "#9daa7e"],
    "#bad18a",
    project,
  );
  for (const x of [-0.36, 0.04]) {
    scene.box(
      x,
      2.29,
      -0.13,
      0.15,
      0.08,
      0.02,
      ["#ff544e", "#861d21", "#ffc47e"],
      "#ffb077",
      project,
    );
    scene.worldLine(
      [
        world({ x: x - 0.04, y: 2.46, z: -0.15 }),
        world({ x: x + 0.17, y: 2.4, z: -0.15 }),
      ],
      "#344239",
      0.06,
    );
  }
  scene.worldLine(
    [
      world({ x: -0.46, y: 2.05, z: -0.14 }),
      world({ x: 0.19, y: 2.05, z: -0.14 }),
    ],
    "#101b17",
    0.1,
  );
  for (const x of [-0.34, -0.13, 0.08])
    scene.worldLine(
      [world({ x, y: 2.1, z: -0.15 }), world({ x, y: 1.99, z: -0.15 })],
      "#e5d7a7",
      0.045,
    );
  for (const arm of pose.arms) {
    scene.worldLine(
      [arm.shoulder, arm.elbow, arm.hand].map((point) => ({
        ...point,
        z: point.z + z,
      })),
      "#788b60",
      0.23,
    );
  }
}
