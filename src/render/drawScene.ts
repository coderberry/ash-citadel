import { Container, Graphics } from "pixi.js";
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function drawScene(stage: Container, config: GameConfig, state: GameState): void {
  stage.removeChildren();
  const zone = config.zones.find((item) => item.id === state.currentZoneId) ?? config.zones[0];

  const background = new Graphics();
  background.rect(0, 0, zone.size.width, zone.size.height).fill(0x292524);
  background.rect(40, 60, 170, 90).fill(0x3f3f46);
  background.rect(620, 160, 120, 180).fill(0x44403c);
  background.rect(420, 460, 220, 80).fill(0x3b2f25);
  stage.addChild(background);

  const base = new Graphics();
  base.circle(zone.base.x, zone.base.y, 44).fill(0x92400e).stroke({ color: 0xfbbf24, width: 4 });
  stage.addChild(base);

  for (const entity of state.entities) {
    const shape = new Graphics();
    if (entity.side === "unit") {
      shape.circle(entity.x, entity.y, entity.configId === "siege-rig" ? 15 : 10).fill(0x84cc16);
    } else {
      const color = entity.configId === "auto-turret" ? 0xf97316 : entity.configId === "mutant" ? 0x7c3aed : 0xef4444;
      shape.circle(entity.x, entity.y, entity.configId === "auto-turret" ? 14 : 10).fill(color);
    }
    stage.addChild(shape);

    const bar = new Graphics();
    const width = 24;
    const pct = Math.max(0, entity.health / entity.maxHealth);
    bar.rect(entity.x - width / 2, entity.y - 19, width, 3).fill(0x111111);
    bar.rect(entity.x - width / 2, entity.y - 19, width * pct, 3).fill(entity.side === "unit" ? 0x84cc16 : 0xef4444);
    stage.addChild(bar);
  }
}
