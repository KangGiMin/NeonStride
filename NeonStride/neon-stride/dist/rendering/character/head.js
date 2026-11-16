import { runnerBodyPoint } from "../../animation/body-transform.js";

export function drawHead(scene, pose, y, fallDepth, shadow) {
  const headPose = {
    ...pose,
    roll: pose.roll * 0.35,
    twist: pose.twist * 0.5,
    pelvisHeight: pose.pelvisHeight - pose.bob * 0.55,
  };
  const headPoint = (x, dy, z = 0) => {
    const point = runnerBodyPoint(headPose, { x, y: dy, z });
    return scene.project(point.x, point.y + y, point.z + fallDepth);
  };
  scene.box(
    0,
    1.34,
    -0.03,
    0.17,
    0.13,
    0.2,
    ["#182d3d", "#132b3b", "#3b5d68"],
    undefined,
    headPoint,
  );
  scene.box(
    0,
    1.43,
    -0.13,
    0.35,
    0.34,
    0.35,
    ["#283f50", "#15283e", "#789097"],
    "#86b8bc66",
    headPoint,
  );
  scene.line(
    [headPoint(-0.175, 1.58, -0.14), headPoint(0.175, 1.58, -0.14)],
    "#6aeef0",
    shadow.k * 0.025,
    6,
  );
  scene.line(
    [headPoint(-0.08, 1.74, -0.15), headPoint(0.09, 1.74, -0.15)],
    "#b5ff8f",
    shadow.k * 0.025,
    4,
  );
}
