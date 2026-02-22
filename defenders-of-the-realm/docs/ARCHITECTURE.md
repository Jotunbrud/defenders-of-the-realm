# Defenders of the Realm - Architecture Guide

## Overview
Board game adaptation of "Defenders of the Realm" (2012 rules). Previously a single 21K-line HTML file, now modularized into 23 files using `Object.assign(game, {...})` pattern.

## Module Pattern
All game methods use `this` to reference the central `game` object. Each system/UI file extends the game object:
```javascript
Object.assign(game, {
    methodName() {
        this.someState = ...;  // 'this' = game object
    },
});
```

## File Structure

### Core (index.html, css/, js/game.js, js/splash.js)
| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~906 | HTML shell, modals, script load order |
| `css/styles.css` | ~879 | All CSS styles |
| `js/game.js` | ~64 | Core game state object + window exposure |
| `js/splash.js` | ~80 | Splash screen particles + dismissal |

### Data (js/data/) — Pure data, no methods
| File | Lines | Exports | Used By |
|------|-------|---------|---------|
| `locations.js` | ~124 | `LOCATION_COORDS`, `LOCATION_CONNECTIONS` | game.js (state), setup.js (map) |
| `heroes.js` | ~115 | `HEROES_DATA` (8 hero classes) | game.js (deep copies for state) |
| `generals.js` | ~13 | `GENERALS_DATA` (4 generals) | game.js (deep copies for state) |
| `cards.js` | ~179 | `HERO_DECK_DATA` (81 cards), `DARKNESS_DECK_DATA` (53 cards) | setup.js |
| `quests.js` | ~200 | `createQuestDeck()` function (24 quest cards) | setup.js |

### Systems (js/systems/) — Game logic
| File | Lines | Key Methods |
|------|-------|-------------|
| `setup.js` | ~773 | `init()`, `startGame()`, `createDarknessDeck()`, `createHeroDeckFromDiscard()`, `renderSetupScreen()`, `setupDragAndDrop()`, `renderMap()` |
| `quest-system.js` | ~1408 | `wizardFireball()`, `executeFireball()`, `showSpecialCardsModal()`, `playSpecialCard()`, quest card UI, `completeQuestAction()`, `_rollQuestDice()` |
| `special-effects.js` | ~1981 | `executeBattleStrategy()`, `executeBattleFury()`, `executeKingsGuard()`, `executeCavalrySweep()`, `executeDarkVisions()`, militia/strong defenses/spy, general wounds |
| `combat-general.js` | ~2113 | `useSpecialSkill()`, `useNobleSteed()`, `useEagleFlight()`, `attackGeneralFromMap()`, `initiateGroupAttack()`, group combat, `moveToLocation()`, gate/horse/eagle movement |
| `movement.js` | ~1522 | `handleMovementClick()`, `completeMovement()`, `cancelMovement()`, `getReachableLocations()`, `showHeroesModal()`, `showHeroDetail()`, `showReleaseNotes()`, `showTips()` |
| `combat-minion.js` | ~2184 | `showLocationActions()`, `renderGenerals()`, `engageMinions()`, `rollMinionCombat()`, `rollGeneralCombat()`, `_finalizeSoloCombat()`, `showCombatResults()`, `closeCombatResults()` |
| `actions.js` | ~895 | `healAction()`, `drawCard()`, `rumorsAction()`, `craftyAction()`, `showGeneralRewardModal()`, `showVictoryModal()` |
| `land-turns.js` | ~1619 | `healLandCrystal()`, `buildMagicGate()`, `heroDefeated()`, `heroRespawn()`, `endTurn()`, `darknessPhase()`, `showDarknessCardPreview()` |
| `darkness-ai.js` | ~1294 | `resolveDarknessCard()`, `processMinionPlacement()`, `processGeneralMovement()`, `getPathTowardMonarchCity()`, `showDarknessEffectsOnMap()` |
| `hero-abilities.js` | ~585 | `showEagleAttackStyleModal()`, `_checkShapeShifterTurnStart()`, ability bonuses, `showTurnUndeadModal()` |
| `game-status.js` | ~358 | `showInfoModal()`, `showGameOver()`, `checkWinCondition()`, `checkLoseConditions()`, `updateWarStatus()`, `showSettings()` |

### UI (js/ui/) — Rendering and display
| File | Lines | Key Methods |
|------|-------|-------------|
| `map-render.js` | ~1548 | `showLocationTooltip()`, `showGeneralTooltip()`, `showHeroCardsTooltip()`, `renderTokens()`, `getHeroPixelArt()`, `renderHeroes()` |
| `panels.js` | ~1243 | `showMap()`, `initializeMapPanZoom()`, `updateMovementButtons()`, `updateActionButtons()`, `renderMinionTracker()`, `engageMinionsFromMap()` |
| `turn-modals.js` | ~1051 | `showDaytimeModal()`, `showEveningModal()`, `showHandLimitModal()`, `proceedToNightPhase()`, `renderDarknessEvents()` |

## Script Load Order (Critical!)
Scripts must load in this exact order in index.html:
1. Data modules (locations → heroes → generals → cards → quests)
2. Core game state (game.js)
3. Systems (setup → quest-system → special-effects → combat-general → movement → combat-minion → actions → land-turns → darkness-ai → hero-abilities → game-status)
4. UI (map-render → panels → turn-modals)
5. Initialization script (`game.init()`)

## Development Workflow
1. **Add these docs to Claude Project** as reference context
2. **Upload only the module(s)** you're editing per conversation
3. **For cross-module changes**: upload the relevant modules + describe the interfaces
4. **State variables**: defined in `js/game.js` — add new state properties there
5. **New methods**: add to the most relevant system/UI file via `Object.assign`

## Key Game Concepts
- **4 Factions**: Red (Demons/Balazarg), Green (Orcs/Gorgutt), Black (Undead/Varkolak), Blue (Dragons/Sapphire)
- **8 Heroes**: Paladin, Cleric, Wizard, Sorceress, Druid, Eagle Rider, Dwarf, Ranger
- **Turn Flow**: Start Turn → Actions (move/attack/heal/quest) → End Turn → Day Phase → Evening Phase → Night Phase (Darkness Spreads)
- **Win**: Defeat all 4 generals
- **Lose**: General reaches Monarch City, 5+ overruns, all taint crystals placed, hero deck exhausted, all heroes defeated
