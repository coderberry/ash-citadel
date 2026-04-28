import type { UnitConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function DeployBar({
  units,
  state,
  selectedUnitId,
  onSelect,
  onOpenUpgrades,
  onOpenSettings,
}: {
  units: UnitConfig[];
  state: GameState;
  selectedUnitId: string;
  onSelect: (unitId: string) => void;
  onOpenUpgrades: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <nav className="deploy-bar" aria-label="Deployment controls">
      <button type="button" className="icon-command" onClick={onOpenUpgrades}>
        Upgrades
      </button>
      <div className="unit-row">
        {units.map((unit) => {
          const affordable = Object.entries(unit.cost).every(([resourceId, amount]) => (state.resources[resourceId] ?? 0) >= amount);
          return (
            <button
              type="button"
              key={unit.id}
              className={unit.id === selectedUnitId ? "unit-button active" : "unit-button"}
              disabled={!affordable}
              onClick={() => onSelect(unit.id)}
            >
              <span>{unit.name}</span>
              <small>{Object.entries(unit.cost).map(([id, amount]) => `${amount} ${id}`).join(" / ")}</small>
            </button>
          );
        })}
      </div>
      <button type="button" className="icon-command" onClick={onOpenSettings}>
        Save
      </button>
    </nav>
  );
}
