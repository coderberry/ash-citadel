import { Application, Container } from "pixi.js";
import { useEffect, useRef } from "react";
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";
import { drawScene } from "./drawScene";

export function PixiStage({
  config,
  state,
  onDeploy,
}: {
  config: GameConfig;
  state: GameState;
  onDeploy: (point: { x: number; y: number }) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      if (!hostRef.current || appRef.current) return;

      const app = new Application();
      await app.init({
        resizeTo: hostRef.current,
        backgroundColor: 0x181512,
        antialias: false,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (disposed || !hostRef.current) {
        app.destroy();
        return;
      }

      const world = new Container();
      app.stage.addChild(world);
      app.canvas.className = "pixi-canvas";
      hostRef.current.appendChild(app.canvas);
      appRef.current = app;
      worldRef.current = world;
    }

    void boot();

    return () => {
      disposed = true;
      appRef.current?.destroy(true);
      appRef.current = null;
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!worldRef.current) return;
    drawScene(worldRef.current, config, state);
  }, [config, state]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const zone = config.zones.find((item) => item.id === state.currentZoneId) ?? config.zones[0];
    onDeploy({
      x: ((event.clientX - bounds.left) / bounds.width) * zone.size.width,
      y: ((event.clientY - bounds.top) / bounds.height) * zone.size.height,
    });
  }

  return <div ref={hostRef} className="pixi-host" onPointerDown={handlePointerDown} />;
}
