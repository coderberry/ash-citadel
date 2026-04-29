import { shortZoneName } from "../config/display";
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function RunOutcomeDialog({
  config,
  state,
  nextZoneName,
  onAdvance,
  onOpenUpgrades,
  onRestart,
}: {
  config: GameConfig;
  state: GameState;
  nextZoneName?: string;
  onAdvance: () => void;
  onOpenUpgrades: () => void;
  onRestart: () => void;
}) {
  if (state.runStatus === "active") return null;

  const zone = config.zones.find((item) => item.id === state.currentZoneId) ?? config.zones[0];
  const cleared = state.runStatus === "cleared";
  const scrapEarned = Math.floor(state.runStats.earned.scrap ?? 0);

  return (
    <section className="zone-dialog" role="dialog" aria-label={cleared ? "District cleared" : "Push failed"}>
      <p className="eyebrow">{cleared ? "District Secured" : "Crews Lost"}</p>
      <h2>{cleared ? `${shortZoneName(zone.name)} Cleared` : "Push Failed"}</h2>
      <p>{scrapEarned} scrap recovered from this push.</p>
      <div className="dialog-actions">
        {cleared && nextZoneName && (
          <button type="button" onClick={onAdvance}>
            {`Advance to ${shortZoneName(nextZoneName)}`}
          </button>
        )}
        <button type="button" onClick={onRestart}>
          {cleared ? "Run Block Again" : "Retry Push"}
        </button>
        <button type="button" onClick={onOpenUpgrades}>
          Open Upgrades
        </button>
      </div>
    </section>
  );
}
