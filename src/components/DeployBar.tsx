import type { UnitConfig } from "../config/types";
import type { GameState } from "../engine/state";

function missingCost(unit: UnitConfig | undefined, state: GameState): string {
  if (!unit) return "";

  return Object.entries(unit.cost)
    .map(([resourceId, amount]) => [resourceId, Math.max(0, amount - (state.resources[resourceId] ?? 0))] as const)
    .filter(([, amount]) => amount > 0)
    .map(([resourceId, amount]) => `${Math.ceil(amount)} ${resourceId}`)
    .join(" / ");
}

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
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const missing = missingCost(selectedUnit, state);
  const deployHint =
    state.runStatus !== "active"
      ? "Run ended."
      : !selectedUnit
        ? "Select a crew."
        : missing
          ? `Need ${missing} to deploy ${selectedUnit.name}.`
          : `Tap district to deploy ${selectedUnit.name}.`;

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
              disabled={state.runStatus !== "active" || !affordable}
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
      <p className="deploy-hint" role="status" aria-label="Deployment hint">
        {deployHint}
      </p>
    </nav>
  );
}
