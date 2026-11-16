import { CanvasSurface } from "./canvas-surface.js";
import { sky } from "./world/sky.js";
import { buildings } from "./world/buildings.js";
import { road } from "./world/road.js";
import { obstacle } from "./obstacles/index.js";
import { character } from "./character/index.js";
import { render } from "./composition.js";

export class Scene extends CanvasSurface {
  sky(time) {
    sky(this, time);
  }
  buildings(distance) {
    buildings(this, distance);
  }
  road(...args) {
    road(this, ...args);
  }
  obstacle(...args) {
    obstacle(this, ...args);
  }
  character(...args) {
    character(this, ...args);
  }
  render(...args) {
    render(this, ...args);
  }
}
