import { useGameController } from "./app/useGameController";
import { DeployBar } from "./components/DeployBar";
import { ResourceStrip } from "./components/ResourceStrip";
import { RunOutcomeDialog } from "./components/RunOutcomeDialog";
import { RunStatusPanel } from "./components/RunStatusPanel";
import { SettingsSheet } from "./components/SettingsSheet";
import { UpgradeSheet } from "./components/UpgradeSheet";
import { PixiStage } from "./render/PixiStage";

export function App() {
  const controller = useGameController();

  return (
    <main className="app-shell">
      <section className="map-layer" aria-label="Ash Citadel map">
        <PixiStage config={controller.config} state={controller.state} onDeploy={controller.deploy} />
      </section>
      <ResourceStrip config={controller.config} state={controller.state} />
      <RunStatusPanel config={controller.config} state={controller.state} />
      <DeployBar
        units={controller.unlockedUnits}
        state={controller.state}
        selectedUnitId={controller.selectedUnitId}
        onSelect={controller.setSelectedUnitId}
        onOpenUpgrades={() => controller.setSheet("upgrades")}
        onOpenSettings={() => controller.setSheet("settings")}
      />
      {controller.sheet === "upgrades" && (
        <UpgradeSheet
          config={controller.config}
          state={controller.state}
          onBuy={controller.buyUpgrade}
          onClose={() => controller.setSheet(null)}
        />
      )}
      {controller.sheet === "settings" && (
        <SettingsSheet
          exportSave={controller.exportCurrentSave}
          importSave={controller.importEncodedSave}
          importError={controller.importError}
          onClose={() => controller.setSheet(null)}
        />
      )}
      <RunOutcomeDialog
        config={controller.config}
        state={controller.state}
        onOpenUpgrades={() => controller.setSheet("upgrades")}
        onRestart={controller.restartZone}
      />
    </main>
  );
}
