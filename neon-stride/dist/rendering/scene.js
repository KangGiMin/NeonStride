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
    this.characterSpace = true;
    this.playerX = args[0].x ?? 0;
    try {
      character(this, ...args);
    } finally {
      this.characterSpace = false;
    }
  }
  render(...args) {
    render(this, ...args);
  }
}
