import type { GameConfig } from "../config/types";
import { getUpgradeRank, type GameState } from "../engine/state";
import { canAffordUpgrade, getUpgradeCost, isUpgradeUnlocked } from "../engine/upgrades";

export function UpgradeSheet({
  config,
  state,
  onBuy,
  onClose,
}: {
  config: GameConfig;
  state: GameState;
  onBuy: (upgradeId: string) => void;
  onClose: () => void;
}) {
  return (
    <section className="sheet" aria-label="Upgrades">
      <div className="sheet-header">
        <div>
          <p className="eyebrow">Citadel Systems</p>
          <h2>Upgrades</h2>
        </div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="upgrade-list">
        {config.upgrades.map((upgrade) => {
          const rank = getUpgradeRank(state, upgrade.id);
          const cost = getUpgradeCost(upgrade, rank);
          const maxed = rank >= upgrade.maxRank;
          const unlocked = isUpgradeUnlocked(config, state, upgrade.id);
          return (
            <article className="upgrade-card" key={upgrade.id}>
              <div>
                <h3>{upgrade.name}</h3>
                <p>{upgrade.description}</p>
                <small>{unlocked ? `Rank ${rank} / ${upgrade.maxRank}` : "Locked"}</small>
              </div>
              <button
                type="button"
                disabled={!unlocked || maxed || !canAffordUpgrade(config, state, upgrade.id)}
                onClick={() => onBuy(upgrade.id)}
              >
                {!unlocked ? "Locked" : maxed ? "Maxed" : Object.entries(cost).map(([id, amount]) => `${amount} ${id}`).join(" / ")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
