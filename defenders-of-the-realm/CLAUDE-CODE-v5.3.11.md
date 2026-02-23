# Claude Code Prompt — v5.3.11 Hero Modal Redesign

## OVERVIEW
Redesign all hero-related modals (Hero Selection, Hero List, Hero Detail, Card Detail, Quest Detail) to use a parchment board game aesthetic with consistent typography and styling. Bump version to 5.3.11.

## REFERENCE MOCKUP
The file `all-hero-modals-mockup.jsx` in the project root (or outputs folder) is the **authoritative visual reference**. Every styling decision below was validated in that mockup. When in doubt, match the mockup.

---

## 1. GOOGLE FONTS — Add to `index.html`

Add these Google Font imports in the `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

---

## 2. CSS CHANGES — `css/styles.css`

Add these CSS classes:

```css
/* Parchment modal typography */
.hero-banner-name {
  font-family: 'Cinzel', Georgia, serif;
  font-weight: 900;
  font-size: 1.05em;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5);
}

.hero-ability-text strong {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1em;
  color: #1a0f0a;
  display: inline;
  font-weight: 900;
}

.hero-ability-text-select strong {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1em;
  color: #1a0f0a;
  display: inline;
  font-weight: 900;
}

.hero-section-label {
  font-family: 'Cinzel', Georgia, serif;
  font-weight: 900;
}

.modal-heading {
  font-family: 'Cinzel', Georgia, serif;
}
```

---

## 3. HERO COLOR PALETTE — `js/data/heroes.js`

Update hero colors to match official board game palette:

| Hero | Color |
|------|-------|
| Paladin | `#6d28a8` (purple) |
| Cleric | `#1e3a7a` (navy) |
| Wizard | `#c2410c` (burnt orange) |
| Sorceress | `#fbbf24` (yellow) |
| Eagle Rider | `#6b7b8d` (steel) |
| Rogue | `#b91c1c` (deep red) |
| Dwarf | `#b45309` (unchanged) |
| Ranger | `#15803d` (unchanged) |

---

## 4. HERO SELECTION MODAL — `js/ui/setup.js`

**Title:** Change from "Game Setup" to "⚔️ Hero Selection" using `modal-heading` class.

**Card structure:** Each hero card uses parchment background:
- Background: `linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)`
- Border: `3px solid #8b7355` (gold border `3px solid #d4af37` when selected)
- Border radius: 10px
- Box shadow: `0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)`

**Hero color banner:**
- Background: `linear-gradient(135deg, ${heroColor}cc 0%, ${heroColor}99 100%)`
- Border bottom: `2px solid #8b7355`
- Hero name: Use `hero-banner-name` class (Cinzel 900, NO text stroke)
- Health display: Simple text `❤️ {maxHealth}` (white, text-shadow, bold) — NO SVG heart, NO current/max counter

**Ability description area:**
- Font: Comic Sans MS (`fontFamily: "'Comic Sans MS', 'Comic Sans', cursive"`)
- Size: `0.75em`
- Color: `#3d2b1f`
- Weight: normal (NOT bold)
- Line height: 1.5
- Use class `hero-ability-text-select`

**Skill titles** (the `<strong>` tags in ability HTML):
- Font: Cinzel, weight 900
- Size: 1em (same as container — will appear visually larger than Comic Sans at same em)
- Color: `#1a0f0a`
- Normal case (NOT uppercase)
- These are controlled by `.hero-ability-text-select strong` CSS class

---

## 5. HERO LIST MODAL — `js/ui/turn-modals.js`

**Behavior:** Shows ONE hero at a time (not all heroes). Hero selector buttons at bottom to switch between heroes. Only heroes that were selected during Hero Selection appear.

**Title:** "👥 Heroes" using `modal-heading` class with X close button.

**Card structure:** Same parchment style as Hero Selection. Gold border on current/active hero.

**Banner:** Same as Hero Selection — hero color gradient, `hero-banner-name` class, `❤️ {health}/{maxHealth}`.

**Stats row:** Show ONLY:
- `🎴 {cards.length}` — clickable (underlined), opens cards in hero detail
- `📜 {activeQuests.length}` — clickable (underlined, color `#8b0000`)
- **NO** ⚡ actions counter
- **NO** 📍 location

**Completed quest badges:**
- Font: Cinzel, weight 900, size 0.75em
- Background: `rgba(139,115,85,0.1)`, border: `1px solid rgba(139,115,85,0.3)`, color: `#2c1810`
- Matches the Hero Detail quest row styling

**Ability text:** IDENTICAL to Hero Selection:
- Font: Comic Sans MS, 0.75em, normal weight, color `#3d2b1f`, line height 1.5
- Class: `hero-ability-text`
- Skill titles via `.hero-ability-text strong`: Cinzel, weight 900

**Hero selector buttons at bottom:** Match card detail button style:
- Class: `hero-banner-name`
- Always filled with hero color background
- Font size: 0.75em
- Selected: `3px solid #d4af37` border + gold glow `0 0 12px rgba(212,175,55,0.5)`
- Unselected: `2px solid rgba(0,0,0,0.3)` border
- Text shadow: `0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)`
- Box shadow: `0 2px 6px rgba(0,0,0,0.4)`
- Only show heroes selected in Hero Selection

---

## 6. HERO DETAIL MODAL — `js/ui/turn-modals.js`

**Title:** "🛡️ Hero Details" using `modal-heading` class with X close button.

**Card structure:** Same parchment style. Banner with hero color, name, health.

**NO** ⚡ actions counter, **NO** 📍 location.

**Cards section:**
- Section title: "🎴 Cards ({count})" using `hero-section-label` class (Cinzel 900, 0.85em)
- Each card item:
  - Background/border uses faction color map (see below)
  - Card name: Cinzel, weight 900
  - Special card description: Comic Sans, 0.75em (not italic)
  - Dice boxes on right: colored squares matching faction
  - **Clickable** — opens Card Detail modal for that card

**Quests section:**
- Section title: "📜 Quests" using `hero-section-label` class
- Each quest row:
  - Quest name LEFT-aligned: Cinzel, weight 900
  - Status badges RIGHT-aligned:
    - Completed: green bg/border/text (`rgba(22,163,74,0.15)` / `#16a34a` / `#15803d`)
    - In Progress: yellow bg/border/text (`rgba(202,138,4,0.15)` / `#ca8a04` / `#a16207`)
    - Discarded: red bg/border/text (`rgba(220,38,38,0.15)` / `#dc2626` / `#b91c1c`)
  - All badges: Cinzel font, weight 900
  - Row uses `display: flex; justify-content: space-between; flex-wrap: wrap`
  - **Clickable** — opens Quest Detail modal for that quest

**Hero selector buttons at bottom:** Same style as Hero List (see section 5). Only selected heroes.

---

## 7. CARD DETAIL MODAL — `js/ui/turn-modals.js`

**Container:** Dark modal wrapper with gold border (same as other modals). Title "🎴 Card Detail" with X close.

**Card structure:** Parchment background, faction-colored banner (or purple `#6d28a8` for special cards).

**Banner:**
- Card name with icon using `hero-banner-name` class
- **NO** X button inside the card (the modal wrapper has one)

**Body for NORMAL cards:**
- General icon + name centered (e.g. "🐉 Sapphire") using `hero-banner-name` class with faction color text + text shadow
- Dice boxes below, centered
- **NO** target box, **NO** location box, **NO** "Roll X dice" text, **NO** travel type badge

**Body for SPECIAL cards:**
- Special box first: label "Special" (Cinzel, bold, purple `#6d28a8`, NO icon), description text
- General icon + name centered below
- Dice boxes below
- **NO** usage box

**Special card icons:** ALL special cards use ✨ sparkle icon (not unique icons per card)

**Dice boxes:**
- Use faction dice color that matches the banner color
- Special cards with "any" color: purple `#6d28a8`

**Card selector buttons at bottom:**
- Always filled with faction color
- Cinzel font (`hero-banner-name` class), 0.75em
- Text shadow: `0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)`
- Selected: `3px solid #d4af37` gold border + gold glow
- Unselected: `2px solid rgba(0,0,0,0.3)`
- Box shadow: `0 2px 6px rgba(0,0,0,0.4)`

---

## 8. QUEST DETAIL MODAL — `js/ui/turn-modals.js`

**Container:** Dark modal wrapper. Title "📜 Quest Details" with X close.

**Card structure:** Parchment background, red banner (`#b91c1c`).

**Banner:** Quest name with 📜 icon using `hero-banner-name` class. **NO** status badges in banner.

**Body:**
1. **Description** — NO box/border. Just Comic Sans 0.75em, color `#3d2b1f`. **NO** "📖 Quest" title/icon.
2. **Reward** — NO box/border. Inline format: **Reward:** title then description beside it (like skill title + description)
   - "Reward:" in Cinzel 900, 0.75em, red `#b91c1c`
   - Description in Comic Sans 0.75em, color `#3d2b1f`
   - **NO** 🏆 icon
3. **Status badges** below reward, centered:
   - Completed/In Progress + Discarded
   - Cinzel font, weight 900, 0.8em
   - Same colors as Hero Detail quest badges

**NO** location section.

**Quest selector buttons at bottom:** Red `#b91c1c` filled, same gold border style for selected.

---

## 9. FACTION COLOR MAP (for cards & dice)

```javascript
const cardColorMap = {
  red:   { bg: "rgba(220,38,38,0.12)", border: "#dc2626", text: "#dc2626", dice: "#dc2626" },
  blue:  { bg: "rgba(59,130,246,0.12)", border: "#3b82f6", text: "#3b82f6", dice: "#3b82f6" },
  green: { bg: "rgba(22,163,74,0.12)", border: "#16a34a", text: "#16a34a", dice: "#16a34a" },
  black: { bg: "rgba(55,65,81,0.12)", border: "#374151", text: "#374151", dice: "#374151" },
  any:   { bg: "rgba(109,40,168,0.12)", border: "#6d28a8", text: "#6d28a8", dice: "#6d28a8" },
};
```

**IMPORTANT:** Undead (black) uses `#374151` consistently for banner, dice, card items, and selector buttons — NOT `#6b7280`.

---

## 10. GENERAL DATA (for Card Detail)

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

## 11. SELECTOR BUTTON STYLE (universal pattern)

All selector buttons across Hero List, Hero Detail, Card Detail, and Quest Detail use the SAME style:

```javascript
{
  className: "hero-banner-name",
  padding: "5px 10px",
  borderRadius: 6,
  background: itemColor,  // always filled
  color: "#fff",
  fontSize: "0.75em",
  border: isSelected ? "3px solid #d4af37" : "2px solid rgba(0,0,0,0.3)",
  textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)",
  WebkitTextStroke: "none",
  boxShadow: isSelected
    ? "0 0 12px rgba(212,175,55,0.5), 0 2px 6px rgba(0,0,0,0.4)"
    : "0 2px 6px rgba(0,0,0,0.4)",
}
```

---

## 12. DO NOT CHANGE

- Faction minion colors on the map
- Darkness deck border styling
- Eagle Rider attack styles
- Fireball button styling
- darkness-ai.js gold highlights
- Any game logic, combat, movement, or AI systems
- Map rendering coordinates

---

## 13. FILES TO MODIFY

| File | Changes |
|------|---------|
| `index.html` | Add Google Fonts link |
| `css/styles.css` | Add Cinzel/Comic Sans CSS classes |
| `js/data/heroes.js` | Update hero color values |
| `js/ui/setup.js` | Hero Selection modal redesign |
| `js/ui/turn-modals.js` | Hero List, Hero Detail, Card Detail, Quest Detail modals |

## 14. VERSION BUMP

Update version string to `5.3.11` wherever it appears.
