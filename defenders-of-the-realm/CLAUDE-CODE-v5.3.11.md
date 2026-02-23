# Claude Code Prompt — v5.3.11 Hero Modal Redesign

## OVERVIEW
Redesign all hero-related modals to use a parchment board game aesthetic with consistent typography. Bump version to 5.3.11.

## CRITICAL: CORRECT FILE LOCATIONS
The previous attempt modified the WRONG file. Here is where the modals ACTUALLY live:

| Modal | File | Function/Location |
|-------|------|-------------------|
| Hero Selection | `js/ui/setup.js` | `renderSetupScreen()` ~line 130 |
| Hero List | `js/ui/map-render.js` | Heroes modal list rendering ~line 1417 |
| Card Tooltip | `js/ui/map-render.js` | `showHeroCardsInModal()` ~line 1556 |
| Quest Cards | `js/ui/map-render.js` | `showHeroQuestCardsModal()` |
| Modal containers | `index.html` | `#setup-modal`, `#heroes-modal`, `#hero-detail-modal` |
| All styling | `css/styles.css` | `.hero-select`, `.hero-card`, `.hero-name`, etc. |
| Hero data | `js/data/heroes.js` | Hero color values |

**DO NOT modify `js/ui/turn-modals.js`** — that file handles Day/Evening/Night phase modals which are NOT part of this redesign.

## REFERENCE MOCKUP
The file `all-hero-modals-mockup.jsx` is the **authoritative visual reference**. Match it exactly.

---

## 1. GOOGLE FONTS — `index.html`

Add in `<head>` (if not already present):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

Also in `index.html`, change the setup modal title from "Game Setup" to use the new style:
```html
<h2 class="modal-heading" style="color: #d4af37; margin: 0; font-size: 1.2em;">⚔️ Hero Selection</h2>
```

---

## 2. CSS — `css/styles.css`

The parchment typography classes were already added correctly (`.hero-banner-name`, `.hero-ability-text strong`, `.hero-ability-text-select strong`, `.hero-section-label`, `.modal-heading`). Keep those.

**UPDATE `.hero-card`** (currently gray gradient — change to parchment):
```css
.hero-card {
    background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%);
    border: 3px solid #8b7355;
    border-radius: 10px;
    overflow: hidden;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3);
    margin-bottom: 10px;
}

.hero-card.active {
    border-color: #d4af37;
    box-shadow: 0 0 16px rgba(212,175,55,0.5), inset 0 0 0 1px rgba(139,115,85,0.3);
}
```

**UPDATE `.hero-name`**:
```css
.hero-name {
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 5px;
}
```

**UPDATE `.stat`** for parchment theme:
```css
.stat {
    background: rgba(139,115,85,0.15);
    border: 1px solid rgba(139,115,85,0.3);
    padding: 2px 7px;
    border-radius: 4px;
    color: #3d2b1f;
}
```

**UPDATE `.hero-detail-card`** to parchment:
```css
.hero-detail-card {
    background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%);
    border: 3px solid #8b7355;
    border-radius: 10px;
    overflow: hidden;
    padding: 0;
}
```

---

## 3. HERO COLORS — `js/data/heroes.js`

Update the `color` field for each hero:

| Hero | Color |
|------|-------|
| Paladin | `#6d28a8` |
| Cleric | `#1e3a7a` |
| Wizard | `#c2410c` |
| Sorceress | `#fbbf24` |
| Eagle Rider | `#6b7b8d` |
| Rogue | `#b91c1c` |
| Dwarf | `#b45309` (unchanged) |
| Ranger | `#15803d` (unchanged) |

---

## 4. HERO SELECTION — `js/ui/setup.js` → `renderSetupScreen()`

Replace the hero card HTML template (around line 149-157). Each card should render as:

```javascript
selection.innerHTML = visibleHeroes.map(({hero, originalIndex}) => `
    <div class="hero-select" onclick="game.toggleHeroSelection(${originalIndex})" id="hero-select-${originalIndex}">
        <div style="background: linear-gradient(135deg, ${hero.color}cc 0%, ${hero.color}99 100%); padding: 6px 14px; border-bottom: 2px solid #8b7355; display: flex; align-items: center; justify-content: space-between;">
            <div class="hero-banner-name">${hero.symbol} ${hero.name}</div>
            <div style="font-size: 0.85em; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.6); font-weight: bold;">❤️ ${hero.maxHealth}</div>
        </div>
        <div style="padding: 10px 14px;">
            <div class="hero-ability-text-select" style="font-size: 0.75em; color: #3d2b1f; line-height: 1.5; font-family: 'Comic Sans MS', 'Comic Sans', cursive;">${hero.ability}</div>
        </div>
    </div>
`).join('');
```

Key points:
- Hero color banner with gradient
- `hero-banner-name` class on name (Cinzel 900, white, text-shadow)
- Simple `❤️ {maxHealth}` text — NO SVG heart, NO current health
- Ability text in Comic Sans 0.75em, normal weight
- Skill titles (inside `<strong>` tags in `hero.ability`) styled by `.hero-ability-text-select strong` CSS
- NO actions counter, NO location

---

## 5. HERO LIST — `js/ui/map-render.js` → heroes modal list rendering (~line 1417-1486)

This currently renders ALL heroes. Change it to show ONE hero at a time with selector buttons below.

Replace the hero list rendering. The key structural changes:

**A) Track selected hero** — add `this._heroListSelectedIndex` (default to `this.currentPlayerIndex`)

**B) Render single hero card** with parchment styling:
- Hero color banner with `hero-banner-name` class
- Health display: `❤️ {health}/{maxHealth}`
- Stats: ONLY `🎴 {cards.length}` (clickable) and `📜 {questCount}` (clickable, color `#8b0000`) — NO ⚡ actions, NO 📍 location
- Completed quest badges: Cinzel 900, 0.75em, parchment colors (`rgba(139,115,85,0.1)` bg, `rgba(139,115,85,0.3)` border, `#2c1810` text)
- Ability text: Comic Sans 0.75em, normal weight, class `hero-ability-text`
- Keep existing Eagle Rider attack style badge and Sorceress shapeshifter badge logic

**C) Selector buttons below** — one per hero, all filled with hero color:
```html
<button onclick="game._heroListSelectedIndex = ${i}; game.updateHeroesModal();" class="hero-banner-name" style="
    padding: 5px 10px; border-radius: 6px; cursor: pointer;
    background: ${h.color};
    color: #fff; font-size: 0.75em;
    border: ${isSelected ? '3px solid #d4af37' : '2px solid rgba(0,0,0,0.3)'};
    text-shadow: 0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5);
    -webkit-text-stroke: none;
    box-shadow: ${isSelected ? '0 0 12px rgba(212,175,55,0.5), 0 2px 6px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.4)'};
">${h.symbol} ${h.name}</button>
```

**D) Ensure `updateHeroesModal()`** method exists to re-render when selector buttons are clicked. This may need to be a new function or the existing rendering code extracted into a reusable method.

**E) Re-attach event listeners** after rendering for card-stat hover and quest-stat click (same as current code but only for the single displayed hero).

---

## 6. FACTION COLOR MAP

Use this wherever card colors are needed (card items, dice boxes, card detail):

```javascript
const cardColorMap = {
    red:   { bg: "rgba(220,38,38,0.12)", border: "#dc2626", text: "#dc2626", dice: "#dc2626" },
    blue:  { bg: "rgba(59,130,246,0.12)", border: "#3b82f6", text: "#3b82f6", dice: "#3b82f6" },
    green: { bg: "rgba(22,163,74,0.12)", border: "#16a34a", text: "#16a34a", dice: "#16a34a" },
    black: { bg: "rgba(55,65,81,0.12)", border: "#374151", text: "#374151", dice: "#374151" },
    any:   { bg: "rgba(109,40,168,0.12)", border: "#6d28a8", text: "#6d28a8", dice: "#6d28a8" },
};
```

**IMPORTANT:** Undead (black) uses `#374151` consistently — NOT `#6b7280`.

---

## 7. GENERAL DATA (for Card Detail)

```javascript
const colorToGeneral = {
    red:   { name: "Balazarg", icon: "👹", faction: "Demon" },
    blue:  { name: "Sapphire", icon: "🐉", faction: "Dragon" },
    green: { name: "Gorgutt", icon: "👺", faction: "Orc" },
    black: { name: "Varkolak", icon: "💀", faction: "Undead" },
    any:   { name: "Any General", icon: "⚔️", faction: "any" },
};
```

---

## 8. CARD ITEMS IN HERO DETAIL

When rendering individual card items (in `showHeroCardsInModal` or hero detail), each card row should show:
- Card icon + name (Cinzel 900, faction-colored text)
- Special card description (Comic Sans 0.75em, NOT italic)
- Dice boxes on right (colored squares matching faction)
- Clickable to open card detail

Dice boxes HTML:
```html
<span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: ${diceColor}; border-radius: 4px; font-size: 0.8em; border: 1.5px solid rgba(0,0,0,0.3);">🎲</span>
```

Special card icons should ALL be ✨ (sparkle).

---

## 9. CARD DETAIL VIEW

When a card is clicked for detail, show:

**Normal cards:**
- Parchment card, faction-colored banner with card name
- General icon + name centered (Cinzel, faction color, text-shadow)
- Dice boxes centered below
- NO target box, NO location box, NO roll text, NO travel type badge

**Special cards:**
- Purple banner with card name (✨ icon)
- "Special" label (Cinzel, bold, purple `#6d28a8`, NO icon) + description text
- General icon + name centered below
- Dice boxes centered below
- NO usage box

---

## 10. QUEST DISPLAY IN HERO DETAIL

Quest rows:
- Quest name LEFT-aligned: Cinzel, weight 900
- Status badges RIGHT-aligned:
  - Completed: `rgba(22,163,74,0.15)` bg / `#16a34a` border / `#15803d` text
  - In Progress: `rgba(202,138,4,0.15)` bg / `#ca8a04` border / `#a16207` text
  - Discarded: `rgba(220,38,38,0.15)` bg / `#dc2626` border / `#b91c1c` text
- All badges: Cinzel font, weight 900
- Clickable — opens quest detail

---

## 11. QUEST DETAIL VIEW

When a quest is clicked:
- Parchment card, red banner (`#b91c1c`) with `📜 {quest name}`
- Description text (Comic Sans 0.75em, `#3d2b1f`) — NO box around it, NO title
- "Reward:" inline (Cinzel 900, 0.75em, red `#b91c1c`) + description (Comic Sans 0.75em, `#3d2b1f`) — NO box, NO icon
- Status badges centered below (Completed/In Progress/Discarded)

---

## 12. UNIVERSAL SELECTOR BUTTON STYLE

All selector buttons (hero list, hero detail, card detail, quest detail) use:
```
class="hero-banner-name"
padding: 5px 10px;
border-radius: 6px;
background: {itemColor}; /* always filled */
color: #fff;
font-size: 0.75em;
border: {isSelected ? '3px solid #d4af37' : '2px solid rgba(0,0,0,0.3)'};
text-shadow: 0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5);
box-shadow: {isSelected ? '0 0 12px rgba(212,175,55,0.5), 0 2px 6px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.4)'};
```

---

## 13. DO NOT CHANGE

- `js/ui/turn-modals.js` (Day/Evening/Night modals — NOT hero modals)
- Faction minion colors on the map
- Darkness deck border styling
- Eagle Rider attack styles (keep existing badge logic)
- Fireball button styling
- `js/systems/darkness-ai.js` gold highlights
- Any game logic, combat, movement, or AI systems
- Map rendering coordinates

---

## 14. FILES TO MODIFY (CORRECTED)

| File | Changes |
|------|---------|
| `index.html` | Google Fonts link, setup modal title |
| `css/styles.css` | Update `.hero-card`, `.hero-name`, `.stat`, `.hero-detail-card` to parchment |
| `js/data/heroes.js` | Update hero color values |
| `js/ui/setup.js` | Hero Selection card template in `renderSetupScreen()` |
| `js/ui/map-render.js` | Hero List rendering, Card tooltip/detail, Quest detail |

## 15. VERSION BUMP
Update version to `5.3.11` wherever it appears.
