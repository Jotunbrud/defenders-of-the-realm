# Defenders of the Realm - AI Assistant Guide

## Project Overview

Browser-based board game adaptation of "Defenders of the Realm" (2012 rules). A cooperative fantasy game where 1-4 heroes defend Monarch City against 4 enemy generals and their minion armies. Built as a pure client-side web app (vanilla HTML/CSS/JS) with no build system, no bundler, no framework, and no server.

**Current version:** v5.3.11

## Quick Start

Open `defenders-of-the-realm/index.html` in a browser. No install or build step required.

## Repository Structure

```
defenders-of-the-realm/          # Root (git repo)
├── CLAUDE.md                    # This file
├── LICENSE
├── README.md
├── index.html                   # Redirect to game directory
└── defenders-of-the-realm/      # Game application
    ├── index.html               # Main HTML (modals, layout, script tags) ~900 lines
    ├── css/styles.css           # All styles (~1600 lines)
    ├── images/                  # map-background.jpg, splash-screen.jpg
    ├── docs/ARCHITECTURE.md     # Detailed architecture reference
    ├── js/
    │   ├── game.js              # Core game state object (65 lines)
    │   ├── splash.js            # Splash screen with particle effects
    │   ├── data/                # Pure data modules (no methods)
    │   │   ├── locations.js     # LOCATION_COORDS, LOCATION_CONNECTIONS (45 locations)
    │   │   ├── heroes.js        # HEROES_DATA (9 hero classes)
    │   │   ├── generals.js      # GENERALS_DATA (4 enemy generals)
    │   │   ├── cards.js         # HERO_DECK_DATA (81+16 cards), DARKNESS_DECK_DATA (53 cards)
    │   │   └── quests.js        # createQuestDeck() function (21 quest cards)
    │   ├── systems/             # Game logic modules
    │   │   ├── setup.js         # init(), startGame(), deck creation, drag/drop
    │   │   ├── actions.js       # heal, draw card, rumors/inn, crafty (Rogue)
    │   │   ├── movement.js      # handleMovementClick(), foot/horse/eagle/gate movement
    │   │   ├── combat-minion.js # Minion combat, location actions, renderGenerals()
    │   │   ├── combat-general.js# General combat, group attacks, special skills
    │   │   ├── quest-system.js  # Quest UI, wizard fireball, special card play
    │   │   ├── special-effects.js # Battle Strategy, Battle Fury, King's Guard, etc.
    │   │   ├── land-turns.js    # Heal land, build gates, end turn, darkness phase
    │   │   ├── darkness-ai.js   # Darkness card resolution, minion/general AI
    │   │   ├── hero-abilities.js# Eagle Rider styles, Sorceress shapeshift, Turn Undead
    │   │   └── game-status.js   # Info modals, win/lose checks, war status, settings
    │   └── ui/                  # Rendering and display modules
    │       ├── map-render.js    # SVG map rendering, tooltips, hero tokens, pixel art
    │       ├── panels.js        # Map modal, pan/zoom, movement/action button bars
    │       └── turn-modals.js   # Day/Evening/Night phase modal rendering
    ├── all-modals-mockup.jsx    # Visual mockup reference (not executed)
    ├── hero-colors-mockup.jsx   # Hero color reference (not executed)
    ├── game-board-mockup.html   # Board layout mockup
    ├── special-cards-v8.html    # Special card reference
    ├── BUGFIX-v5.3.11.md        # Bugfix notes
    ├── CLAUDE-CODE-v5.3.11.md   # Previous Claude Code prompt (historical)
    └── darkness-spreads-integration-prompt.md  # Design doc
```

## Architecture Pattern

### Module System: `Object.assign(game, { ... })`

There is **one central `game` object** defined in `js/game.js`. Every other module extends it:

```javascript
// js/systems/actions.js
Object.assign(game, {
    healAction() {
        if (this.actionsRemaining <= 0) { ... }
        const hero = this.heroes[this.currentPlayerIndex];
        ...
    },
});
```

All methods use `this` which resolves to the `game` object. The game object is also exposed globally via `window.game` for `onclick` handlers in HTML templates.

### Script Load Order (Critical)

Scripts in `defenders-of-the-realm/index.html` **must** load in this exact order:

1. **Data modules:** locations -> heroes -> generals -> cards -> quests
2. **Core state:** game.js
3. **Systems:** setup -> quest-system -> special-effects -> combat-general -> movement -> combat-minion -> actions -> land-turns -> darkness-ai -> hero-abilities -> game-status
4. **UI:** map-render -> panels -> turn-modals
5. **Initialization:** inline `<script>game.init()</script>`

Adding a new script file requires inserting a `<script src="...">` tag in the correct position within `index.html`.

## Key Game Concepts

### Factions (4 colors)
| Color | Faction | General | Hit Req | Combat Skill |
|-------|---------|---------|---------|--------------|
| Red | Demons | Balazarg | 4+ | Demonic Curse (discard cards before battle) |
| Green | Orcs | Gorgutt | 3+ | Parry (eliminates hits for each 1 rolled) |
| Black | Undead | Varkolak | 4+ | No Rerolls allowed |
| Blue | Dragons | Sapphire | 5+ | Regeneration |

### Heroes (9 classes, max 4 per game)
Paladin, Cleric, Wizard, Sorceress, Druid (hidden), Eagle Rider, Dwarf, Ranger, Rogue

### Turn Flow
1. **Start Turn** - Eagle Rider chooses attack style, Sorceress chooses shape
2. **Actions** (health-based: 4-6 per turn) - Move, Attack, Heal, Draw Cards, Rumors, Quest, Special Skills
3. **End Turn** - Discard to hand limit
4. **Day Phase** - Draw hero cards, draw quest card at treasure chest
5. **Evening Phase** - End-of-turn penalties (minion damage, fear, taint)
6. **Night Phase** - Darkness Spreads cards resolve (minion spawns, general movement, overruns)

### Win/Lose Conditions
- **Win:** Defeat all 4 generals
- **Lose:** General reaches Monarch City, 5+ overruns, all 12 taint crystals placed, a faction's minion pool exhausted, all heroes defeated

## Coding Conventions

### JavaScript Style
- Vanilla ES6+ JavaScript, no modules/imports/exports
- Global constants in data files (`HEROES_DATA`, `LOCATION_COORDS`, etc.)
- Methods added via `Object.assign(game, { ... })` pattern
- Internal/private-ish methods prefixed with underscore: `_checkEagleRiderTurnStart()`
- Console logging with tagged prefixes: `console.log('[MOVEMENT] ...')`
- HTML templates built with template literals and inline styles
- Event handlers via `onclick="game.methodName()"` in generated HTML

### CSS/UI Style
- Parchment board game aesthetic with medieval theme
- Fonts: Cinzel (headings, labels, bold/900) + Crimson Text (body) + Comic Sans (ability text)
- Color palette: gold (#d4af37), parchment (#f0e6d3), brown borders (#8b7355), dark text (#3d2b1f)
- Faction colors: red (#dc2626), green (#16a34a), blue (#3b82f6), black (#374151 for UI, #1f2937 for cards)
- Purple (#6d28a8) for special cards and "any color" cards
- Modal-based UI with `.active` class toggling visibility
- SVG-based game map with coordinates on 0-1000 x 0-700 grid
- Mobile-responsive design with specific breakpoints

### Game State
- All mutable state lives on the `game` object (defined in `game.js`)
- Heroes array: `game.heroes[game.currentPlayerIndex]` is the active hero
- Minions tracked by location: `game.minions['Monarch City'] = { red: 0, blue: 0, green: 0, black: 0 }`
- Taint crystals: `game.taintCrystals[locationName] = count`
- Cards are objects with `{ name, color, type, icon, dice, special?, specialAction?, description? }`
- Data is deep-copied from constants at init time: `JSON.parse(JSON.stringify(HEROES_DATA))`

### Modal System
- Modals defined as `<div>` elements in `index.html` with fixed IDs
- Shown/hidden by adding/removing `.active` CSS class
- `showInfoModal(title, contentHTML, callback)` is the general-purpose modal
- Phase modals (Day/Evening/Night) use dedicated rendering in `turn-modals.js`
- Card modals, combat results, victory/defeat all have dedicated containers

### Parchment Design System (used in modals)
Helper methods for consistent styling:
- `_parchmentBoxOpen(title)` / `_parchmentBoxClose()` - Bordered section wrappers
- `_minionDotsHTML(color, count, size)` - Colored dots representing minions
- `_inlineDotsHTML(color, count)` - Inline minion dots
- `_generalTokenHTML(color, size)` - General token badge
- `_locationRingHTML(name, color, size)` - Location indicator

## Important Development Notes

### Adding New State
Add new state properties to `game.js` in the `const game = { ... }` object.

### Adding New Methods
Add to the most relevant system/UI file using `Object.assign(game, { ... })`. The method will be accessible as `game.methodName()` or `this.methodName()` from within other game methods.

### Adding New Script Files
Insert a `<script src="...">` tag in `defenders-of-the-realm/index.html` at the correct position in the load order. Data files load first, then game.js, then systems, then UI.

### Common Patterns
```javascript
// Get current hero
const hero = this.heroes[this.currentPlayerIndex];

// Check for action points
if (this.actionsRemaining <= 0) {
    this.showInfoModal('...', '<div>No actions remaining!</div>');
    return;
}

// Cancel active movement before starting a new action
if (this.activeMovement) {
    this.clearMovementMode();
}

// Update UI after state changes
this.renderTokens();
this.renderHeroes();
this.updateGameStatus();

// Logging
this.addLog(`${hero.name} moved to ${locationName}`);
```

### Location Data
- 45 locations on the map, each with: x/y coords (SVG 0-1000, 0-700), faction color, type (normal/city/inn/general), chest flag, magicGate flag, inn flag
- Connections defined both in `LOCATION_CONNECTIONS` (adjacency list) and duplicated in `setup.js:areLocationsConnected()` and `map-render.js` (for rendering paths)

### Deck Management
- Hero deck: 81 regular cards + 16 special cards, reshuffled from discard when empty
- Darkness deck: 53 cards (46 regular + 3 All Is Quiet + 4 Patrol + 2 Orc War Party + 1 Monarch City Special)
- Quest deck: 21 cards with various mechanic types (dice_roll, multi_location_visit, defeat_faction_minions, scout_general, etc.)
- Special cards played for effects are removed from the game permanently (not reshuffled)

### Things to Watch Out For
- Location connections are duplicated in multiple files - changes must be synced
- The `game` object is massive - all methods from all modules merge into it
- Some heroes are hidden from selection (Druid, White Rabbit) via `hiddenHeroes` array in `renderSetupScreen()`
- White Rabbit is a test general that can be enabled via checkbox during setup
- Inline styles are heavily used in template literals - CSS classes exist but many elements use inline overrides
- The `.jsx` and `.html` mockup files are reference designs, not executed code
