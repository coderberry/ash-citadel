import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function ResourceStrip({ config, state }: { config: GameConfig; state: GameState }) {
  return (
    <header className="resource-strip">
      {config.resources.map((resource) => (
        <div className="resource-pill" key={resource.id}>
          <span>{resource.name}</span>
          <strong>{Math.floor(state.resources[resource.id] ?? 0)}</strong>
        </div>
      ))}
    </header>
  );
}
