# Ash Citadel Mobile PWA Design

Date: 2026-04-28
Status: Ready for user review

## Goal

Build `incremancer-mobile` as a new mobile-first installable web game, not as a direct fork of the current Incremancer AngularJS bundle.

The long-term product is a reusable idle-combat game engine where different config files can launch meaningfully different games. The first shipped config will be an original post-apocalyptic game called `Ash Citadel`.

## Source Context

The existing Incremancer repo at `~/Code/github.com/coderberry/incremancer` is useful as a mechanics reference. It is a static browser game built with AngularJS, Pixi, HTML templates, CSS, sprite assets, and a compiled `dist/bundle.js`.

The mobile project should not depend on editing that compiled bundle. The original game informs mechanics, pacing, and interaction patterns, while `incremancer-mobile` gets a clean TypeScript foundation.

## Approved Direction

- Target platform for the first milestone: installable mobile web app/PWA.
- Future packaging with Capacitor for iOS/Android is allowed, but not part of the first milestone.
- Technical stack: TypeScript + Pixi + React PWA.
- First playable theme: `Ash Citadel`.
- First implementation style: tight playable vertical slice that proves the config-driven engine through real gameplay.

## Product Concept

`Ash Citadel` is a post-apocalyptic idle-combat game about expanding a fortified settlement into hostile city blocks.

The player deploys squads, drones, salvagers, and heavy vehicles from the citadel. These units fight raiders, mutants, and old-world defenses, gather resources, and unlock upgrades. Clearing a block completes a zone and pushes progression forward.

The first playable should feel like a complete small loop:

1. Start in `Block 01: Broken Market`.
2. Generate power over time.
3. Tap the map to deploy units.
4. Units fight enemies and collect rewards.
5. Spend resources on upgrades.
6. Clear the zone.
7. Reload the app and continue from the saved state.

## Architecture

### Game Engine

The engine owns the deterministic simulation:

- resource ticking
- unit spawning
- enemy behavior
- combat resolution
- rewards
- zone completion
- unlock evaluation
- upgrade effects
- persistence-friendly state transitions

The engine should not know about `Ash Citadel` names, art, or copy. It consumes validated game config and runtime save state.

### Renderer

Pixi renders the active zone:

- map background
- citadel/base
- deployable units
- enemies
- simple obstacles or ruins
- projectiles/effects where useful
- camera movement and zoom
- tap-to-deploy input

The renderer should be a view over engine state, not the owner of game rules.

### UI Shell

React owns mobile UI:

- top resource strip
- bottom deploy/action bar
- upgrade bottom sheet
- zone-complete screen
- settings/import/export screen
- install/offline affordances where supported

The first screen should be the game itself, not a landing page.

### Config Layer

TypeScript config files define the available game content. They are still config files, but TypeScript gives type checking for IDs, references, and formulas during early development.

Config defines what exists and how it scales. Engine code defines how simulation runs.

### Persistence

Save state is separate from static config. A save stores:

- selected game config ID and config version
- current zone
- resources
- purchased upgrade ranks
- unlocked units/systems
- run state
- long-term progression hooks

Local persistence is required for the first milestone. Import/export should be included early enough to avoid save-loss risk during development.

## Config Model

The first config model should include these sections:

### Game

- `id`
- `title`
- `version`
- theme colors
- icon and asset paths
- display labels

### Resources

Initial `Ash Citadel` resources:

- `Power`: regenerating deploy/action resource
- `Scrap`: primary upgrade currency
- `Rations`: sustain/population-style cap or soft limit
- `Intel`: higher-tier unlock currency

Resource config should support:

- display name
- icon
- starting value
- optional cap
- optional passive rate
- storage upgrade hooks

### Units

Initial units:

- `Militia Squad`: basic deployable combat unit
- `Scrap Drone`: collector/support unit
- `Siege Rig`: expensive heavy unit

Unit config should support:

- cost by resource
- health
- damage
- attack rate
- movement speed
- targeting preference
- unlock condition
- role tags

### Enemies

Initial enemies:

- `Raider`
- `Mutant`
- `Auto Turret`

Enemy config should support:

- health
- damage
- attack rate
- movement behavior
- reward drops
- spawn group membership

### Zones

Initial zone:

- `Block 01: Broken Market`

Zone config should support:

- map dimensions
- background/tileset reference
- base/citadel position
- enemy clusters
- obstacle hints
- completion condition
- unlock requirement
- reward summary

### Upgrades

Initial upgrade categories:

- unit health
- unit damage
- power regeneration
- scrap yield
- starting rations
- unlock `Scrap Drone`
- unlock `Siege Rig`

Upgrade config should support:

- cost formula
- rank cap
- effect formula
- affected stat or system
- unlock condition
- display copy

### Automation

Automation exists in the config model but can remain thin in the first playable. Candidate future systems:

- auto-deploy
- salvage crews
- passive scrap generation
- drone assignment
- auto-zone restart

### Prestige

Prestige is part of the long-term engine contract but does not need the full UI in the first playable. The config should reserve a place for:

- reset scope
- permanent currency
- permanent upgrade effects
- unlock timing

## Formula Model

Start with a typed expression model, not arbitrary JavaScript in config.

Supported formula types for the first version:

- constant value
- linear growth
- exponential growth
- additive percent modifier
- multiplicative percent modifier

This keeps configs flexible enough for balance while preserving debuggability, save compatibility, and validation.

## Mobile UX

The game should be designed mobile-first from the first screen:

- full-screen Pixi map
- compact resource strip at the top
- deploy/action controls at the bottom
- upgrades and settings as bottom sheets
- large tap targets
- no required hover states
- no required keyboard modifiers
- no required drag-and-drop precision

Desktop can use the same layout with wider constraints later. Desktop is not the first target.

## First Playable Scope

The first playable milestone includes:

- PWA scaffold with React, TypeScript, and Pixi
- `Ash Citadel` TypeScript config
- config validation
- engine loop for resources, units, enemies, combat, rewards, and zone completion
- one playable zone
- three unit types
- three enemy types
- core upgrades
- local save/load
- import/export save path
- installable manifest and service worker
- offline reload after first visit
- mobile viewport smoke verification

## Non-Goals For First Playable

- native iOS/Android packaging
- app store submission
- full Incremancer feature parity
- arbitrary config scripting
- multiple shipped game configs
- advanced procedural level generation
- full prestige tree
- cloud saves
- monetization

## Testing And Verification

Verification should focus on engine/config correctness and mobile usability.

Required checks:

- config validation rejects missing IDs, bad references, invalid formulas, and impossible unlocks
- simulation tests cover resource ticking, unit deployment, enemy damage, rewards, zone completion, and upgrades
- save/load tests cover reload persistence and config version handling
- PWA checks cover manifest, service worker, offline reload, and installability basics
- Playwright mobile viewport checks verify the main UI fits without overlapping controls
- Pixi smoke check verifies a nonblank canvas and tap response
- manual smoke test covers start run, deploy units, clear zone, buy upgrade, reload, and continue

## Implementation Planning Decisions

Use these defaults when writing the implementation plan:

- build tool: Vite
- config location: `src/games/ash-citadel`
- import/export: required in milestone 1
- first-pass art strategy: simple Pixi shapes and CSS/icon UI so engine and layout are proven before custom art
- mobile browser support floor: current and previous major versions of iOS Safari and Android Chrome

## Success Criteria

The design is successful when a user can install the PWA on a phone, open directly into `Ash Citadel`, play through one zone, buy upgrades, reload the app, and continue from saved progress. The implementation should also make it credible to add a second game by adding a new config rather than rewriting the engine.
