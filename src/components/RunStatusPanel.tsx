import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function RunStatusPanel({ config, state }: { config: GameConfig; state: GameState }) {
  const zone = config.zones.find((item) => item.id === state.currentZoneId) ?? config.zones[0];
  const zoneName = zone.name.replace(/^Block \d+: /, "");
  const enemiesRemaining = state.entities.filter((entity) => entity.side === "enemy").length;
  const scrapEarned = Math.floor(state.runStats.earned.scrap ?? 0);
  const title =
    state.runStatus === "cleared"
      ? `${zoneName} Secured`
      : state.runStatus === "failed"
        ? "Push Failed"
        : `Break the ${zoneName}`;
  const detail =
    state.runStatus === "active"
      ? `${enemiesRemaining} hostiles remain`
      : `${scrapEarned} scrap recovered`;

  return (
    <section className="run-status-panel" aria-label="Run status">
      <p className="eyebrow">{zone.name}</p>
      <h1>{title}</h1>
      <p>{detail}</p>
    </section>
  );
}
