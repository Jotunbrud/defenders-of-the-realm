# Defenders of the Realm — Architecture Guide

## Overview
Board game adaptation of "Defenders of the Realm" (2012 rules). Previously a single 21K-line HTML file, now modularized into 23+ files using `Object.assign(game, {...})` pattern. Deployed via Netlify, source on GitHub with development branches.

## Module Pattern
All game methods use `this` to reference the central `game` object. Each system/UI file extends it:
```javascript
Object.assign(game, {
    methodName() {
        this.someState = ...;  // 'this' = game object
    },
});
```

---

## File Structure

### Core (index.html, css/, js/game.js, js/splash.js)
| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~906 | HTML shell, modals, script load order |
| `css/styles.css` | ~1622 | All CSS styles, parchment aesthetics, Cinzel font, gold (#d4af37) color scheme |
| `js/game.js` | ~64 | Core game state object + window exposure |
| `js/splash.js` | ~80 | Splash screen particles + dismissal |

### Data (js/data/) — Pure data, no methods
| File | Lines | Exports | Used By |
|------|-------|---------|---------|
| `locations.js` | ~124 | `LOCATION_COORDS`, `LOCATION_CONNECTIONS` | game.js (state), setup.js (map) |
| `heroes.js` | ~115 | `HEROES_DATA` (8 hero classes) | game.js (deep copies for state) |
| `generals.js` | ~13 | `GENERALS_DATA` (4 generals) | game.js (deep copies for state) |
| `cards.js` | ~179 | `HERO_DECK_DATA` (81 cards), `DARKNESS_DECK_DATA` (53 cards) | setup.js |
| `quests.js` | ~454 | `createQuestDeck()` function (19 quest cards) | setup.js |

### Systems (js/systems/) — Game logic
| File | Lines | Key Methods |
|------|-------|-------------|
| `setup.js` | ~773 | `init()`, `startGame()`, `createDarknessDeck()`, `createHeroDeckFromDiscard()`, `renderSetupScreen()`, `setupDragAndDrop()`, `renderMap()` |
| `quest-system.js` | ~2441 | Fireball, special cards, quest UI, quest completion, quest rewards, faction hunter tracking, scout general, Crystal of Light taint removal |
| `special-effects.js` | ~1981 | Battle Strategy, Battle Fury, King's Guard, Cavalry Sweep, Dark Visions, militia/strong defenses/spy, general wounds |
| `combat-general.js` | ~2113 | General combat, group attacks, Noble Steed, Eagle Flight, gate/horse/eagle movement |
| `movement.js` | ~2232 | Movement clicks, movement cards, reachable locations, hero detail modal, quest detail view, release notes, tips, Elven Archers |
| `combat-minion.js` | ~2415 | Location actions, minion combat, general combat rolls, combat results, re-rolls, hero defeated penalties |
| `actions.js` | ~895 | Heal, draw card, rumors, crafty, general reward modal, victory modal |
| `land-turns.js` | ~2207 | Heal land, build gate, taint removal, hero death/respawn, end turn, darkness phase (preview/resolve), darkness card interventions |
| `darkness-ai.js` | ~1294 | Minion placement, overrun, general movement pathfinding, darkness effects on map |
| `hero-abilities.js` | ~585 | Eagle attack style, ShapeShifter, ability bonuses, Turn Undead modal |
| `game-status.js` | ~358 | Info modals, game over, win/lose conditions, war status, settings |

### UI (js/ui/) — Rendering and display
| File | Lines | Key Methods |
|------|-------|-------------|
| `map-render.js` | ~1548 | Location/general/card tooltips, token rendering, hero pixel art, `renderHeroes()` |
| `panels.js` | ~1079 | Map pan/zoom, movement buttons, action buttons, minion tracker, hero overlay, turn tracker |
| `turn-modals.js` | ~1051 | Daytime/Evening/Hand Limit modals, `proceedToNightPhase()`, darkness event rendering |

---

## Script Load Order (Critical!)
Scripts must load in this exact order in index.html:
1. Data modules (locations → heroes → generals → cards → quests)
2. Core game state (game.js)
3. Systems (setup → quest-system → special-effects → combat-general → movement → combat-minion → actions → land-turns → darkness-ai → hero-abilities → game-status)
4. UI (map-render → panels → turn-modals)
5. Initialization script (`game.init()`)

---

## Key Game Concepts

### Factions & Generals
| Color | Faction | General | Minion Name | Hit Req | Combat Skill |
|-------|---------|---------|-------------|---------|--------------|
| Red | Demons | Balazarg | Demons | 4+ | Demonic Curse (roll per card, discard on 1s) |
| Green | Orcs | Gorgutt | Orcs | 3+ | Parry (eliminates hits for each 1 rolled) |
| Black | Undead | Varkolak | Undead | 4+ | No Rerolls (blocks all re-rolls and special skills) |
| Blue | Dragons | Sapphire | Dragonkin | 5+ | Regeneration (full health if not killed in one combat) |

### Heroes (8 classes)
Paladin, Cleric, Wizard, Sorceress, Druid, Eagle Rider, Dwarf, Ranger

### Turn Flow
```
Start Turn → Actions (move/attack/heal/quest/special) → End Turn
  → Step 1: Daytime (damage from minions, draw hero cards)
  → Step 2: Evening (hand limit check)
  → Step 3: Night Phase (Darkness Spreads cards — draw, preview with interventions, resolve)
```

### Win/Lose
- **Win**: Defeat all 4 generals
- **Lose**: General reaches Monarch City, 5+ overruns, all taint crystals placed, hero deck exhausted, all heroes defeated

---

## Quest System (19 cards)

### Quest Mechanic Types

| Type | Count | Completion Trigger | Key Properties |
|------|-------|--------------------|----------------|
| `dice_roll` | 6 | At quest location, spend action, roll dice | `location`, `diceCount`, `successOn`, `successCount`, `failDiscard` |
| `variable_dice_roll` | 1 | At quest location, choose 1-3 actions for dice | `location`, `dicePerAction`, `maxActions` |
| `build_gate_red` | 1 | At any red location without gate, with matching card | `location: null` (dynamic) |
| `multi_location_visit` | 1 | Visit 3 specific tavern locations (no action cost) | `locations: {}` with visited flags |
| `multi_location_action` | 1 | Spend action at 3 specific locations | `locations: {}` with organized flags |
| `defeat_faction_minions` | 4 | Kill N minions of matching faction in combat | `faction`, `requiredKills`, `currentKills` |
| `scout_general` | 4 | Travel to general's current location, spend 1 action | `generalName`, `faction` |

### Quest Reward Types

| rewardType | Behavior | Used By |
|------------|----------|---------|
| `quest_magic_item` | Passive +1 to all combat dice | Amulet of the Gods |
| `bonus_actions` | Passive +N actions per turn | Boots of Speed |
| `bonus_hero_card` | Passive +N card draws at end of turn | Helm of Power |
| `ignore_hero_defeated` | Passive immunity to general defeat penalties | War Banner of Valor |
| `unicorn_steed` | Horse movement + combat re-roll | Unicorn Steed |
| `draw_hero_cards` | Immediate: draw N cards on completion | Rumors |
| `use_quest_card_anytime` | Held after completion, used during darkness phase | Find Magic Gate, Organize Militia, 4× Faction Hunters |
| `scout_draw_card` | Immediate: search deck for matching color card | 4× Scout the General |
| `placeholder` | No reward (not yet implemented) | Talisman of Warding |

### Quest Card Catalog

**Standard Dice Roll Quests (5 + 1 placeholder)**
- Amulet of the Gods — Dark Woods — 3 dice, 4+ — Passive: +1 combat dice
- Boots of Speed — Mountains of Mist — 4 dice, 5+ — Passive: +2 actions/turn
- Helm of Power — Ancient Ruins — 3 dice, 5+ — Passive: +1 hero card draw
- War Banner of Valor — Fire River — 4 dice, 5+ — Passive: ignore general defeat penalties
- Talisman of Warding — Cursed Plateau — 4 dice, 6+ — Placeholder (no reward)

**Special Mechanic Quests (4)**
- Find Magic Gate — any red location — build gate with matching card — Use: +2 bonus dice in combat
- Unicorn Steed — Unicorn Forest — variable dice (1-3 actions) — Passive: horse movement + re-roll
- Rumors — visit 3 taverns (no action) — Immediate: draw 4 hero cards
- Organize Militia — spend action at 3 locations — Use: block general advance on darkness card

**Faction Hunter Quests (4) — defeat_faction_minions**
- Orc Hunter — defeat 6 green minions — Use: block 1 green minion placement
- Demon Hunter — defeat 4 red minions — Use: block 1 red minion placement
- Dragon Hunter — defeat 3 blue minions — Use: block 1 blue minion placement
- Undead Hunter — defeat 4 black minions — Use: block 1 black minion placement

**Scout the General Quests (4) — scout_general**
- Scout the General (Balazarg) — travel to Balazarg, spend 1 action — search deck for first Red card
- Scout the General (Gorgutt) — travel to Gorgutt, spend 1 action — search deck for first Green card
- Scout the General (Sapphire) — travel to Sapphire, spend 1 action — search deck for first Blue card
- Scout the General (Varkolak) — travel to Varkolak, spend 1 action — search deck for first Black card

**Use-Anytime Quests (2)**
- Crystal of Light — dice roll at Enchanted Glade — Use: remove taint crystal from any tainted location
- Ancient Tree of Magic — dice roll at Wyvern Forest — Use: remove taint crystal from any tainted location

### Quest Lifecycle
```
Draw from questDeck → hero.questCards[] (max 3 per hero)
  → In progress (mechanic tracks progress)
  → completed = true (auto or via completeQuestAction)
  → For use-anytime: stays on hero until used during darkness phase
  → discarded = true via _retireQuest() (keeps in questCards for history)
  → questDiscardPile++ (counter only)
```

### Quest Tracking Hooks (Cross-File)
Kill tracking for `defeat_faction_minions` quests fires from multiple combat paths:
- `combat-minion.js:1119` — `_trackQuestMinionDefeats(colorResults)` after standard minion combat
- `quest-system.js:165` — same hook after fireball kills
- `movement.js:324` — `_trackQuestMinionDefeatsRaw(color, count)` in Elven Archers
- `movement.js:434` — same in Battle Strategy minion clearing
- **Note**: Cavalry Sweep and Turn Undead pickers (in non-uploaded files) may need the same hook

---

## Darkness Phase Interventions

During Step 3 Night Phase card preview, several quest/special cards can intervene:

| Intervention | State Variable | Button Location | Finder Function |
|--------------|---------------|-----------------|-----------------|
| Militia Secures Area | `militiaSecuredSlot` (1 or 2) | land-turns.js preview | `_findMilitiaSecuresCard()` (special-effects.js) |
| Strong Defenses | `strongDefensesActive` | land-turns.js preview | `_findStrongDefensesCard()` (special-effects.js) |
| Organize Militia (quest) | `organizeMilitiaActive` | land-turns.js preview | `_findOrganizeMilitiaQuestCard()` (quest-system.js) |
| Faction Hunter (quest) | `factionHunterBlockedSlot` (1 or 2) | land-turns.js preview | `_findFactionHunterQuestCard(faction)` (quest-system.js) |
| Wizard's Wisdom | `wizardWisdomRedraw` | land-turns.js preview | inline check for Wizard |

All intervention states reset per card in `drawNextDarknessCard()` and per turn in `_executeEndTurn()`.

### Faction Hunter Button Details
- Buttons use CSS class `faction-hunter-dynamic-btn` for DOM cleanup
- DOM cleanup happens at: `_executeEndTurn`, `showDarknessCardPreview`, before button creation, `showDarknessCardResults`
- Button text format: `📜 {Quest Name} — {Location}`
- State: `factionHunterBlockedSlot` (slot 1 or 2), `_factionHunterUsedQuestName` (for results display)
- Results event type: `faction_hunter_blocked` with `questName` property

---

## Hero Card Deck
- `this.heroDeck` — array of card objects, draw from end (`.pop()`)
- Each card has: `name`, `color` (red/green/blue/black), `special` (boolean for purple special cards)
- `hero.cards` — hero's hand (array of card objects)
- Card colors map: `{ red: '#dc2626', green: '#16a34a', blue: '#3b82f6', black: '#6b7280' }`
- Special cards: purple `#9333ea`
- Reshuffle: `this.heroDeck = this.createHeroDeckFromDiscard()` (setup.js)

---

## End-of-Turn Modal Flow

The end-of-turn modal (`#end-of-turn-modal`) transitions through 3 steps:

```
Step 1 (Daytime) — showDaytimeModal()
  → Minion damage, draw hero cards, quest checks
  
Step 2 (Evening) — showEveningModal() / showHandLimitModal()
  → Hand limit enforcement (discard down to limit)
  
Step 3 (Night) — proceedToNightPhase() → darknessPhase() → drawNextDarknessCard()
  → showDarknessCardPreview() — card preview with intervention buttons
    → resolveDarknessCard() — processes placements/movement
    → showDarknessCardResults() — shows results with events
  → Loop for additional cards (mid/late war = 2-3 cards)
  → "End Night Phase" advances to next player
```

### Modal Mode Guard
Intervention buttons (Militia, Strong Defenses, Organize Militia, Faction Hunters) are wrapped in:
```javascript
if (this._endOfTurnModalMode === 'darkness_card') { ... }
```
This prevents them from appearing during Step 1/Step 2.

### Darkness Card Event Types (for results rendering)
**Minion Events**: `spawn`, `taint`, `overrun`, `patrol`, `militia_secured`, `faction_hunter_blocked`, `general_only_notice`, `monarch_city_special`
**General Events**: `advance`, `general_move`, `general_defeated`, `advance_failed`, `movement_blocked`, `major_wound_blocked`, `strong_defenses`, `organize_militia`, `no_generals`
**Other Events**: `deck_reshuffle`, `all_quiet`

---

## Visual Design Conventions
- **Font**: Cinzel (headings/labels), Georgia (body)
- **Color scheme**: Gold (#d4af37) headings, parchment backgrounds, dark brown (#2c1810) text
- **Faction colors**: Red #dc2626, Green #16a34a, Blue #3b82f6, Black/Gray #6b7280 (minions), #1f2937 (Varkolak)
- **Purple**: #9333ea (special cards, taint crystals, Monarch City)
- **Modal style**: Parchment box with `_parchmentBoxOpen(title)` / `_parchmentBoxClose()` helpers
- **Status labels**: Cinzel font, 900 weight, small caps aesthetic
- **Buttons**: `.phase-btn` class, gradient backgrounds, 2px borders

---

## Development Workflow
1. **Upload only the module(s)** you're editing per conversation
2. **For cross-module changes**: upload the relevant modules + describe the interfaces
3. **State variables**: defined in `js/game.js` — add new state properties there
4. **New methods**: add to the most relevant system/UI file via `Object.assign`
5. **Always syntax-check**: `node --check filename.js` before delivering — a single syntax error in any module breaks the entire game
6. **Quest additions**: update `quests.js` (data), `quest-system.js` (_getCompletableQuest + execution), `movement.js` (progress display in quest detail + hero detail)

### Files Most Frequently Modified Together
- `quests.js` + `quest-system.js` — quest definitions + mechanics
- `quest-system.js` + `combat-minion.js` + `movement.js` — kill tracking hooks
- `land-turns.js` + `quest-system.js` — darkness phase interventions
- `panels.js` + `movement.js` — action buttons + movement UI

### Known Gaps / TODOs
- Cavalry Sweep and Turn Undead (in special-effects.js / hero-abilities.js) may need `_trackQuestMinionDefeatsRaw` hooks for faction hunter quest tracking
- 1 placeholder quest remaining: Talisman of Warding (Cursed Plateau)
- Scout the General quests: if general is already defeated when quest is drawn, quest cannot be completed (shown in red in quest detail)
