export type Formula =
  | { type: "constant"; value: number }
  | { type: "linear"; base: number; perRank: number }
  | { type: "exponential"; base: number; multiplier: number }
  | { type: "additivePercent"; percentPerRank: number }
  | { type: "multiplicativePercent"; multiplierPerRank: number };

export type UnlockCondition =
  | { type: "always" }
  | { type: "upgradeRank"; upgradeId: string; rank: number }
  | { type: "resourceTotal"; resourceId: string; amount: number }
  | { type: "zoneCompleted"; zoneId: string };

export type ResourceConfig = {
  id: string;
  name: string;
  icon?: string;
  startingValue: number;
  cap?: number;
  passiveRate?: Formula;
  resetOnRun?: boolean;
};

export type UnitConfig = {
  id: string;
  name: string;
  role: "fighter" | "collector" | "heavy";
  cost: Record<string, number>;
  health: Formula;
  damage: Formula;
  attackRate: Formula;
  speed: Formula;
  targetPriority: "nearest" | "weakest" | "strongest";
  unlock: UnlockCondition;
};

export type EnemyConfig = {
  id: string;
  name: string;
  health: Formula;
  damage: Formula;
  attackRate: Formula;
  speed: Formula;
  rewards: Record<string, number>;
  behavior: "melee" | "ranged" | "stationary";
};

export type ZoneConfig = {
  id: string;
  name: string;
  size: { width: number; height: number };
  base: { x: number; y: number };
  enemyClusters: Array<{ enemyId: string; count: number; x: number; y: number; radius: number }>;
  unlock: UnlockCondition;
  completion: { type: "allEnemiesDefeated" };
};

export type UpgradeEffect =
  | { type: "statMultiplier"; target: string; value: Formula }
  | { type: "resourcePassiveRate"; resourceId: string; value: Formula }
  | { type: "resourceStartingValue"; resourceId: string; value: Formula }
  | { type: "unlock"; targetId: string };

export type UpgradeConfig = {
  id: string;
  name: string;
  description: string;
  cost: Record<string, Formula>;
  effect: UpgradeEffect;
  maxRank: number;
  unlock: UnlockCondition;
};

export type GameConfig = {
  game: {
    id: string;
    title: string;
    version: number;
    theme: { background: string; panel: string; accent: string };
  };
  resources: ResourceConfig[];
  units: UnitConfig[];
  enemies: EnemyConfig[];
  zones: ZoneConfig[];
  upgrades: UpgradeConfig[];
};
