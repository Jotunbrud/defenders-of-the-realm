# Claude Code — v5.3.11 Bug Fixes

## REFERENCE
Use `all-hero-modals-mockup.jsx` as the visual reference for how things should look.

---

## Bug 1: Modal background color not applied

The outer modal containers (`#heroes-modal .modal-content`, `#hero-detail-modal .modal-content`, and any new card/quest detail modal containers) need a dark navy background with gold border:

```css
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
border: 2px solid #d4af37;
border-radius: 12px;
padding: 20px;
box-shadow: 0 8px 32px rgba(0,0,0,0.6);
```

This is the OUTER wrapper around the parchment cards, not the parchment cards themselves. Check `css/styles.css` for `.modal-content` rules and update them, or apply inline styles on the specific modal containers in `index.html`.

---

## Bug 2: Hero List missing line separator

In the Hero List card (in `js/ui/map-render.js`), there should ALWAYS be a line separator (`border-top: 1px solid rgba(139,115,85,0.3); padding-top: 8px;`) above the ability/special skills text section. Currently it only appears when completed quests are shown. The separator should be on the ability text wrapper div regardless of whether quest badges exist above it.

---

## Bug 3: Hero List click handlers wrong

In `js/ui/map-render.js`, the Hero List has two clickable stat badges:

**🎴 Cards click** — Currently opens hero detail modal. It should instead open the Card Detail view showing the hero's cards. If a standalone card detail modal doesn't exist yet, it should show the hero's cards in a tooltip/detail view, NOT open the hero detail modal.

**📜 Quest click** — Currently opens the OLD quest card modal (`showHeroQuestCardsModal`). It should open the NEW parchment-styled Quest Detail view instead. The old quest modal code should be replaced or the click handler should point to the new implementation.

---

## Bug 4: Hero Detail modal issues

**Missing line separator** — Add `border-top: 1px solid rgba(139,115,85,0.3); padding-top: 8px;` between the Cards section and the Quests section.

**Modal wrapper padding** — The title ("🛡️ Hero Details") and X close button are pushed down from the top. Check the modal container for extra padding-top, a nested `.modal-content` wrapper, or a `<button>` close element above the title that's creating extra space. The title and X should be at the very top of the modal with no gap above them.

---

## Bug 5: Card Detail nested in another modal

The Card Detail view is being rendered INSIDE the existing hero detail modal, causing double close buttons (a red X from the parent modal + a gray X from the card detail).

**Fix:** Card Detail should either:
- Replace the hero detail content entirely (hide hero detail, show card detail in the same modal container), OR
- Be its own standalone modal that opens on top

It should NOT be nested inside another modal. There should be ONE title ("🎴 Card Detail") and ONE close button (gray X). The parchment card with the card info should be the only content below.

---

## Bug 6: Quest Detail nested in another modal

Same issue as Bug 5. The Quest Detail is rendering inside another modal, showing double titles.

**Fix:** Same approach — Quest Detail should replace the content or be standalone. ONE title ("📜 Quest Details") and ONE close button. The parchment card with quest info should be the only content below.

---

## IMPLEMENTATION APPROACH for Bugs 3, 5, 6

The cleanest approach: Use the existing `#hero-detail-modal` container and swap its content based on what view is active. Track a view state:

```javascript
// On the game object or map-render
this._heroDetailView = 'hero'; // 'hero' | 'card' | 'quest'
this._heroDetailCardData = null; // selected card for card detail
this._heroDetailQuestData = null; // selected quest for quest detail
```

When rendering `#hero-detail-content`:
- If view is `'hero'`: show the hero detail parchment card with cards/quests sections
- If view is `'card'`: show the card detail parchment card with card selector buttons
- If view is `'quest'`: show the quest detail parchment card with quest selector buttons

The close X should go back: card/quest → hero, hero → close modal.

This prevents nesting modals inside modals.

---

## FILES TO CHECK/MODIFY

| File | What to fix |
|------|-------------|
| `css/styles.css` | Bug 1: modal background colors |
| `index.html` | Bug 1: modal container styles, Bug 4: extra wrapper padding |
| `js/ui/map-render.js` | Bugs 2-6: all hero list and detail rendering |
