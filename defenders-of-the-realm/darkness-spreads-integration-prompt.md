# Darkness Spreads Modal — Integration Prompt

Use `special-cards-v8.html` as the design reference mockup. It is a standalone interactive prototype showing exactly how the Darkness Spreads card modal should look and behave across all 5 card types × 2 phases (draw/resolve). Integrate these designs into the actual game files: `styles.css`, `turn-modals.js`, `darkness-ai.js`, and `land-turns.js`.

## What the mockup demonstrates

The mockup has a control panel (type selector, phase toggle, mechanic buttons) that is NOT part of the game — it's just for testing. The actual game content is inside the `modal-frame` div. Toggle the mechanic buttons on/off and switch between Draw Card / Resolve Card phases and the 5 card types (Next Loc, Patrols, War Party, Standard, Monarch) to see all variations.

---

## DESIGN RULES TO IMPLEMENT

### 1. Draw Phase — Card Display

The draw phase shows the card's locations and general path visually.

**General path chain:** On draw cards that have a general, show the full "Next Location" path as overlapping 60px location rings. Do NOT highlight any ring on the draw phase — all rings are plain. Label the chain "Next Location" below.

**Minion locations:** Show as 90px location rings with minion dots beside them in `darkness-loc-card` boxes.

### 2. Resolve Phase — Card Display

Same card display as draw, EXCEPT:
- The general path chain is shown with the destination ring HIGHLIGHTED (outline glow matching faction color, e.g. `outline:3px solid #3b82f6; outline-offset:2px; box-shadow:...`).
- Both draw and resolve show the full path chain — resolve does NOT simplify to a single ring.

### 3. Draw Phase — Darkness Spreads Effects Notifications

Below the card display, show slim `fx-note` notification bars under "Darkness Spreads Effects" heading:

- **Overrun:** `Overrun will be triggered → Location` (red text, `color:#b91c1c`)
- **Taint:** `Taint Crystal will be placed → Location` (purple text, `color:#7e22ce`)
- **General advances:** `General will advance → Location` (red text, `color:#dc2626`, NO checkmark icon)
- **General blocked:** `General Will Not Advance → Location` (muted text, `color:#8b7355`)
- **Monarch "No minions":** `No minions adjacent → Monarch City` (uses arrow format, not "— nothing placed")
- **Monarch generals:** `No Generals Will Advance` (always visible, not toggled)
- **5th minion (Monarch):** `5th minion will be placed → Monarch City` (overrun-red styling)

### 4. Resolve Phase — Minion Movement

Nested hierarchy inside `results-divider`:

```
Minion Movement (section title)
  [Faction box] (colored border/bg matching faction)
    Header: dot(s) + Faction Name → Location
    [If overrun triggered — CRITICAL LOGIC:]
      First minion placed (header shows 1 dot, location)
      Second minion NOT PLACED → same location
      Taint Crystal Placed → same location (nested taint-box)
      Overrun Triggered → Location (nested overrun-box)
        Spread destinations: Faction → Adjacent Loc 1, 2, 3...
        Any NOT PLACED spreads + their Taint Crystals
```

**CRITICAL OVERRUN LOGIC:** When 2 minions are to be placed and the location is at max (triggers overrun):
1. The faction box header shows ONLY 1 dot (first minion placed)
2. Second minion shown as `NOT PLACED → Location`
3. Taint Crystal nests immediately after the NOT PLACED line
4. Overrun box is a sibling below the taint, showing spread destinations
5. Any spread destination that is also full → `NOT PLACED → Destination` with its own nested Taint Crystal

This pattern MUST be consistent between minion movement and general movement sections. See the Standard (general) resolve card in the mockup — both its minion section (Undead → Dark Woods) and general section (Varkolak → Father Oak Forest) follow this identical pattern.

**NOT PLACED formatting:**
- NO strikethrough on faction name or location
- Order: `Faction` → `NOT PLACED` label (red, 0.75em) → `→ Location`
- The NOT PLACED label sits between the faction and the arrow-location

### 5. Resolve Phase — General Movement

When general advances:
```
General Movement (section title)
  [General box] (red-tinted border)
    General token + name → Location
    GENERAL ADVANCES (red text, NO checkmark)
    [Nested minion placement box] (faction-colored)
      Same overrun/taint nesting logic as minion movement
```

When general blocked:
```
General Movement (section title)
  General Will Not Advance → Location (fx-note blocked style)
  No minions placed → Location (fx-note blocked style)
```

### 6. War Party Special Structure

The Orc War Party resolve card lists individual placement lines inside one faction box. The location that triggers overrun gets its OWN nested faction box containing the overrun:

```
Orc War Party (header: "3 locations")
  Orcs → Raven Forest (simple line)
  Orcs → Father Oak Forest (simple line)
  [Nested box] Orcs → Dancing Stone
    Overrun Triggered → Dancing Stone
      Spread lines...
      NOT PLACED + Taint
```

### 7. Intervention Buttons (Draw Phase Only)

Between the card area and the Resolve button, show action buttons for hero skills, special cards, and quests that can affect darkness spreads. These are separate from the card — NOT inside the parchment box.

**Button styling:** Full-width buttons with gradient backgrounds, white text, matching the Resolve button aesthetic:
- **Hero Skills:** Gray gradient (`#4b5563` → `#6b7280`), icon: ⚔️ (crossed swords)
- **Special Cards:** Purple gradient (`#6d28d9` → `#7c3aed`), icon: ✨ (star glow)
- **Quests:** Red gradient (`#b91c1c` → `#dc2626`), icon: 📜 (scroll)

Each button has:
- Icon + Name (Cinzel bold) on left
- Description (Comic Sans, smaller) below the name
- NO section titles or separators between buttons

**Selection:** Clicking a button toggles a gold highlight (`outline:3px solid #d4af37` with glow). Multiple can be selected. Selections persist through the Resolve transition but clear when drawing next card or switching card types.

**Visibility:** Buttons only appear during draw phase and only when the relevant intervention is available (controlled by game state — skills the active hero has, special cards in hand, completed quest rewards).

### 8. Intervention Effects on Resolve Cards

When interventions are selected on draw phase, their effects appear on the resolve card as `fx-note blocked` style notifications (identical to "General Will Not Advance" or "No minions placed" — same font, color `#8b7355`, size).

**NO icons** on the resolve card effect messages.

**Placement — contextual, below what they affect:**
- **Holy Shield** → after Minion Movement section: `Holy Shield → 1 minion placement prevented`
- **Sanctified Ground** → after Minion Movement section: `Sanctified Ground → Taint Crystal placement prevented`
- **Divine Intervention** → after General Movement section: `Divine Intervention → General advance cancelled`
- **Eagle Eye** → after General Movement section: `Eagle Eye → Next card scouted`
- **Elven Foresight** → after General Movement section: `Elven Foresight → 1 card removed from deck`

These use the CSS class `iv-effect` with `display:none` by default, toggled to `display:block` when `active` class is added based on which interventions were selected.

### 9. Monarch City Resolve — Special Cases

- Minion Movement title always present (even for "No minions adjacent" message)
- "No minions adjacent → Monarch City" uses arrow format
- "No Generals Will Advance" always shown (not toggled)
- "No Generals Move" subtitle above results

---

## CSS CLASSES REFERENCE (from mockup)

Key classes to add/update in `styles.css`:
- `fx-note`, `fx-note.advance`, `fx-note.overrun`, `fx-note.taint`, `fx-note.blocked` — notification bars
- `overrun-box` — red-bordered nested box for overrun details
- `taint-box` — purple-bordered nested box for taint crystal
- `sl` (spread line), with color variants `.green`, `.gray`, `.blue`, `.purple`, `.red`
- `not-placed-label` — red "NOT PLACED" text (NO strikethrough on siblings)
- `iv-effect` / `iv-effect.active` — intervention effect visibility
- `intervene-btn`, `.hero-skill`, `.special-card`, `.quest` — draw phase buttons
- `intervene-btn.selected` — gold highlight outline
- `intervene-area` — container for intervention buttons
- `location-ring` highlight style — outline + glow for resolve phase destination

---

## FILES TO MODIFY

1. **styles.css** — Add all new CSS classes from the mockup's `<style>` block
2. **turn-modals.js** — Update `renderDarknessEvents()` and `_darknessLocationCardHTML()` to generate HTML matching the mockup patterns. Add intervention button rendering for draw phase.
3. **darkness-ai.js** — Update `resolveDarknessCard()`, `processMinionPlacement()`, `processGeneralMovement()` to track NOT PLACED minions, taint crystal triggers, and overrun spread with the correct nesting logic.
4. **land-turns.js** — Update `showDarknessCardPreview()` / `drawNextDarknessCard()` to show draw phase effects and intervention buttons. Wire up intervention selection flow.

## IMPORTANT

- The mockup's control panel (type selector, phase toggle, mechanic buttons) is for TESTING ONLY — do not add these to the game
- The mockup's card type names map to game types: "Next Loc" = standard darkness card, "Patrols" = orc patrol card, "War Party" = orc war party card, "Standard" = general next location card, "Monarch" = monarch city card
- All fonts: Cinzel for titles/labels, Comic Sans for descriptions/body
- All resolve card logic must handle both the "general advances" and "general blocked" paths
