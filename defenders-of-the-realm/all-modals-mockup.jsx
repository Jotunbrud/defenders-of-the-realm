import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ══════════════════════════════════════════════════════════════
const GlobalStyles = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = `
      .hero-ability-text strong, .hero-ability-text-select strong {
        font-family: 'Cinzel', Georgia, serif; font-size: 1em; color: #1a0f0a; display: inline; font-weight: 900;
      }
      .hero-banner-name {
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; color: #fff; -webkit-text-stroke: none;
        text-shadow: 0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5); letter-spacing: 1.5px; font-size: 1.05em;
      }
      .hero-section-label { font-family: 'Cinzel', Georgia, serif; font-weight: 900; }
      .modal-heading { font-family: 'Cinzel', Georgia, serif; font-weight: 700; }
      .step-indicator { font-family: 'Cinzel', Georgia, serif; font-weight: 700; }
      .flavor-text { font-family: 'Comic Sans MS', 'Comic Sans', cursive; font-size: 0.75em; color: #3d2b1f; line-height: 1.5; }
      .hi-block > div { margin-bottom: 4px; }
      .hi-block > div:last-child { margin-bottom: 0; }
      .hi-block .hi-title, .hi-title { padding-left: 1.5em; text-indent: -1.5em; }
      .hi-block .hi-cont, .hi-cont { padding-left: 1.5em; }
      .hi-block .hi-sub, .hi-sub { padding-left: 3em; text-indent: -2.5em; }
      @keyframes cardReveal { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 8px rgba(212,175,55,0.3); } 50% { box-shadow: 0 0 16px rgba(212,175,55,0.6); } }
      @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      .darkness-event { animation: slideIn 0.3s ease-out forwards; }
      @keyframes flipIn { 0% { transform: rotateY(90deg); opacity:0; } 100% { transform: rotateY(0); opacity:1; } }
      .card-flip { animation: flipIn 0.5s ease-out forwards; }
      @media (max-width: 768px) {
        * { font-family: 'Cinzel', Georgia, serif !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);
  return null;
};

// ══════════════════════════════════════════════════════════════
// SHARED DATA
// ══════════════════════════════════════════════════════════════
const sampleHeroes = [
  { name: "Cleric", symbol: "✝️", health: 6, maxHealth: 6, actions: 6, taint: 0, color: "#1e3a7a",
    cards: [
      { name: "Enchanted Glade", color: "black", type: "Magic Gate", icon: "🌀", dice: 1 },
      { name: "Wolf Pass", color: "blue", type: "Horse", icon: "🐎", dice: 1 },
      { name: "Spell of Purity", color: "red", type: "Special", icon: "🌟", dice: 2, special: true, description: "Remove all Tainted Crystals from a single location" },
    ],
    quests: [{ name: "Amulet of the Gods", completed: false, description: "Seek the amulet buried deep inside the Dark Woods. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.", reward: "Add +1 to all dice in combat against minions and Generals", location: "Dark Woods" }],
    location: "Monarch City",
    ability: `<strong>Blessed Attacks:</strong> Add +1 to each die roll in attacks against Undead and Demon minions.<br><span style="color: #b91c1c;">May not be used in combat with a General.</span><br><br><strong>Turn Undead:</strong> If ending a turn in a location with Undead, move all Undead minions to any adjacent location(s).<br><br><strong>Sanctify Land:</strong> May spend an action in a location with no enemy minions present that is Tainted to heal the land (no cards required). On a roll of 5+ remove the Tainted Crystal.` },
  { name: "Dwarf", symbol: "⛏️", health: 5, maxHealth: 5, actions: 5, taint: 0, color: "#b45309",
    cards: [
      { name: "Ghost Marsh", color: "red", type: "Horse", icon: "🐎", dice: 1 },
      { name: "Scorpion Canyon", color: "red", type: "Eagle", icon: "🦅", dice: 2 },
    ],
    quests: [], location: "Dragonsnest Mountains",
    ability: `<strong>Mountain Lore:</strong> When starting a turn in a Red location, gain 1 action for that turn.<br><br><strong>Dragon Slayer:</strong> May re-roll any failed dice in combat against Dragonkin.<br><span style="color: #b91c1c;">May be used in combat with Sapphire.</span><br><br><strong>Armor and Toughness:</strong> Ignore 1 wound from minions and Generals.` },
  { name: "Eagle Rider", symbol: "🦅", health: 4, maxHealth: 4, actions: 4, taint: 1, color: "#6b7b8d",
    cards: [
      { name: "Amarak Peak", color: "blue", type: "Eagle", icon: "🦅", dice: 2 },
      { name: "Battle Luck", color: "any", type: "Special", icon: "🌟", dice: 1, special: true, description: "Re-roll all failed dice in combat" },
      { name: "Raven Forest", color: "green", type: "Horse", icon: "🐎", dice: 1 },
    ],
    quests: [{ name: "War Banner of Valor", completed: true, discarded: false, description: "Seek the War Banner along the banks of the Fire River. Spend 1 action and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.", reward: "Ignore the wounds and other effects of losing a battle to a general.", location: "Fire River" }],
    location: "Bounty Bay",
    ability: `<strong>Eagle Flight:</strong> Spend an action to travel 4 spaces without discarding an eagle travel card<br><br><strong>Fresh Mount:</strong> If ending a turn on the ground in Monarch City or any Blue location, gain one action next turn.<br><br><strong>Attacks:</strong> <span style="color: #b91c1c;">At the beginning of turn, must choose 1 attack style and may not change it during the turn.</span><br>• <strong>Sky Attack:</strong> No end-of-turn penalties (fear, damage, or card loss).<br>• <strong>Ground Attack:</strong> Re-roll all dice once per combat (except vs Undead General).` },
  { name: "Paladin", symbol: "🛡️", health: 4, maxHealth: 5, actions: 4, taint: 1, color: "#6d28a8",
    cards: [
      { name: "Bounty Bay", color: "blue", type: "Magic Gate", icon: "🌀", dice: 1 },
      { name: "Orc Valley", color: "red", type: "Horse", icon: "🐎", dice: 1 },
      { name: "Hammer of Valor", color: "any", type: "Special", icon: "🌟", dice: 2, special: true, description: "Move any hero to any location" },
      { name: "Father Oak Forest", color: "green", type: "Horse", icon: "🐎", dice: 1 },
    ],
    quests: [{ name: "Boots of Speed", completed: true, discarded: false, description: "Seek the enchanted boots hidden in the Mountains of Mist. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.", reward: "Gain +2 actions per turn.", location: "Mountains of Mist" }, { name: "Helm of Power", completed: false, description: "Seek the legendary helm within the Ancient Ruins. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.", reward: "Draw +1 extra Hero Card each turn.", location: "Ancient Ruins" }],
    location: "Father Oak Forest",
    ability: `<strong>Noble Steed:</strong> May spend an action to travel on horseback (2 spaces) without discarding a horse travel card<br><br><strong>Bravery:</strong> If ending a turn in a location with Undead minions, do not suffer any penalties from fear<br><br><strong>Aura of Righteousness:</strong> Ignore 1 wound from minions and Generals` },
  { name: "Ranger", symbol: "🏹", health: 3, maxHealth: 5, actions: 6, taint: 2, color: "#15803d",
    cards: [
      { name: "Gryphon Forest", color: "green", type: "Eagle", icon: "🦅", dice: 2 },
      { name: "Thorny Woods", color: "green", type: "Horse", icon: "🐎", dice: 1 },
      { name: "Elven Archers", color: "green", type: "Special", icon: "🌟", dice: 1, special: true, description: "Remove all enemy minions from 2 Green locations" },
    ],
    quests: [{ name: "Find Magic Gate", completed: true, discarded: true, description: "Build a Magic Gate on any Red Location. Spend 1 action and a matching location card to build the gate.", reward: "Discard this Quest Card to add 2 dice to any combat roll, including a battle against a General.", location: null }, { name: "Unicorn Steed", completed: true, discarded: false, description: "Travel to the Unicorn Forest and entice a unicorn to become your steed. Spend 1 action per die roll. A roll of 5 or 6 succeeds.", reward: "Move as if you always have a Horse. Grants 1 re-roll of all failed dice each combat.", location: "Unicorn Forest" }],
    location: "Greenwood Forest",
    ability: `<strong>Woods Lore:</strong> Add +1 to all attack rolls when in a Green location.<br><span style="color: #b91c1c;">May be used against Generals.</span><br><br><strong>Archery:</strong> May attack enemy minions 1 space away as if they were in the same location.<br><span style="color: #b91c1c;">May not be combined with Woods Lore. May not be used against Generals.</span><br><br><strong>Elf Support:</strong> When starting a turn in a Green location, gain 1 Action for that turn.` },
  { name: "Rogue", symbol: "🗡️", health: 6, maxHealth: 6, actions: 6, taint: 0, color: "#b91c1c",
    cards: [
      { name: "Dark Woods", color: "black", type: "Horse", icon: "🐎", dice: 1 },
      { name: "Minotaur Forest", color: "green", type: "Magic Gate", icon: "🌀", dice: 1 },
      { name: "Battle Fury", color: "blue", type: "Special", icon: "🌟", dice: 2, special: true, description: "Defeat all enemy minions at your current location" },
      { name: "Blood Flats", color: "red", type: "Magic Gate", icon: "🌀", dice: 1 },
    ],
    quests: [{ name: "Rumors", completed: false, description: "Travel to 3 Inns to gather intelligence. Visit Eagle Nest Inn, Chimera Inn, and Gryphon Inn. No action required.", reward: "Draw 4 Hero Cards when Quest is completed.", location: null }],
    location: "Snoton Village",
    ability: `<strong>Hide In The Shadows:</strong> Does not suffer life token loss when in a location with enemy minions at the end of a turn.<br><span style="color: #b91c1c;">Still subject to General and Fear penalties.</span><br><br><strong>Thievery:</strong> When ending turn in a location with a treasure chest, draw 1 extra Hero Card.<br><br><strong>Crafty:</strong> As a Rumor At The Inn Action — call a color and draw 5 cards. Keep all that match the color called as well as all Special cards.<br><span style="color: #b91c1c;">Limited to 2 Inn Actions Per Turn.</span>` },
  { name: "Sorceress", symbol: "🧙‍♀️", health: 5, maxHealth: 5, actions: 5, taint: 0, color: "#fbbf24",
    cards: [
      { name: "Fire River", color: "black", type: "Magic Gate", icon: "🌀", dice: 1 },
      { name: "Pleasant Hill", color: "red", type: "Eagle", icon: "🦅", dice: 2 },
    ],
    quests: [], location: "Monarch City",
    ability: `<strong>Shape Shifter:</strong> At the start of the turn, place a minion of the shape you wish to take.<br><span style="color: #b91c1c;">May not enter Monarch City or any Inn when in enemy form.</span><br><br><strong>Ambush:</strong> If in the same shape as an enemy minion, add +2 to each die rolled against them on the first attack made.<br><span style="color: #b91c1c;">May be used against Generals but only add +1.</span><br><br><strong>Visions:</strong> Gain 1 extra die for any Quest rolls and for any Healing of Tainted Lands.`,
    shapeshiftForm: "green" },
  { name: "Wizard", symbol: "🧙‍♂️", health: 5, maxHealth: 5, actions: 5, taint: 0, color: "#c2410c",
    cards: [
      { name: "Seagaul Lagoon", color: "blue", type: "Eagle", icon: "🦅", dice: 2 },
      { name: "Cursed Plateau", color: "red", type: "Magic Gate", icon: "🌀", dice: 1 },
      { name: "Magic Gate", color: "black", type: "Special", icon: "🌟", dice: 2, special: true, description: "Place a Magic Gate on any location" },
      { name: "Golden Oak Forest", color: "green", type: "Horse", icon: "🐎", dice: 1 },
      { name: "McCorm Highlands", color: "black", type: "Magic Gate", icon: "🌀", dice: 1 },
      { name: "All Is Quiet", color: "green", type: "Special", icon: "🌟", dice: 2, special: true, description: "Do not draw any Darkness Spreads cards this turn" },
      { name: "Crystal Hills", color: "blue", type: "Horse", icon: "🐎", dice: 1 },
    ],
    quests: [{ name: "Elven Allies", completed: false, description: "Travel to Greenleaf Village and negotiate with the Elven Council. Spend 1 action and roll 3 dice. A roll of 5 or 6 on any succeeds.", reward: "All heroes gain +1 to attacks in Green locations.", location: "Greenleaf Village" }],
    location: "Wolf Pass",
    ability: `<strong>Teleport:</strong> May spend an action to move to 1 location each turn as if traveling by Magic Gate<br><br><strong>Fireball:</strong> Discard a card matching any minion color present to attack ALL minions at the location. A roll of 2+ incinerates each minion.<br><span style="color: #b91c1c;">Note: In the Middle and Late War this skill may be used for each Darkness Spreads card drawn.</span><br><br><strong>Wisdom:</strong> When drawing a Darkness Spreads card, it may be discarded and another one drawn` },
];

const cardColorMap = {
  blue: { bg: "rgba(37,99,235,0.12)", border: "#3b82f6", text: "#2563eb", faction: "🐉 Dragon" },
  red: { bg: "rgba(220,38,38,0.12)", border: "#dc2626", text: "#dc2626", faction: "🔥 Demon" },
  green: { bg: "rgba(22,163,74,0.12)", border: "#16a34a", text: "#16a34a", faction: "🌲 Orc" },
  black: { bg: "rgba(55,65,81,0.12)", border: "#374151", text: "#374151", dice: "#374151" },
  any: { bg: "rgba(109,40,168,0.12)", border: "#6d28a8", text: "#6d28a8", faction: "⭐ Any" },
};
const generalColors = { red: "#dc2626", blue: "#3b82f6", green: "#16a34a", black: "#374151", purple: "#7c3aed" };

function warningStyle(type) {
  if (type === "advance") return { border: "#ef4444", bg: "rgba(239,68,68,0.08)", color: "#b91c1c" };
  if (type === "overrun") return { border: "#ef4444", bg: "rgba(239,68,68,0.08)", color: "#b91c1c" };
  if (type === "taint") return { border: "#9333ea", bg: "rgba(147,51,234,0.08)", color: "#7e22ce" };
  return { border: "#dc2626", bg: "rgba(220,38,38,0.08)", color: "#b91c1c" };
}

function abilityToBlocks(html) {
  if (!html) return "";
  return html.split(/<br\s*\/?>/gi).filter(s => s.trim()).map(s => {
    const t = s.trim();
    const isSub = /^[•·\-]\s*<strong>/.test(t);
    const isTitle = t.startsWith("<strong>");
    const cls = isSub ? "hi-sub" : isTitle ? "hi-title" : "hi-cont";
    return `<div class="${cls}">${t}</div>`;
  }).join("");
}
const generalNames = { red: "Balazarg", blue: "Sapphire", green: "Gorgutt", black: "Varkolak" };
const factionNames = { red: "Demons", blue: "Dragonkin", green: "Orcs", black: "Undead" };
const factionIcons = { green: "🪓", black: "💀", red: "🔥", blue: "🐉" };
const colorToGeneral = { red: { name: "Balazarg", icon: "👹", faction: "Demon" }, blue: { name: "Sapphire", icon: "🐉", faction: "Dragon" }, green: { name: "Gorgutt", icon: "👺", faction: "Orc" }, black: { name: "Varkolak", icon: "💀", faction: "Undead" }, any: { name: "Any General", icon: "⚔️", faction: "any" } };
const generalPaths = {
  black: ["Dark Woods", "Windy Pass", "Sea Bird Port", "Father Oak Forest", "Monarch City"],
  red: ["Scorpion Canyon", "Raven Forest", "Angel Tear Falls", "Bounty Bay", "Monarch City"],
  green: ["Thorny Woods", "Amarak Peak", "Eagle Peak Pass", "Orc Valley", "Monarch City"],
  blue: ["Blizzard Mountains", "Heaven's Glade", "Ancient Ruins", "Greenleaf Village", "Monarch City"],
};
const locationFaction = {
  "Monarch City": "purple", "Dark Woods": "black", "Scorpion Canyon": "red", "Thorny Woods": "green", "Blizzard Mountains": "blue",
  "Father Oak Forest": "green", "Wolf Pass": "blue", "Bounty Bay": "blue", "Orc Valley": "red", "Dancing Stone": "black", "Greenleaf Village": "green",
  "Golden Oak Forest": "green", "Windy Pass": "red", "Sea Bird Port": "black", "Mountains of Mist": "blue",
  "Blood Flats": "red", "Raven Forest": "green", "Pleasant Hill": "red", "Unicorn Forest": "green", "Brookdale Village": "black",
  "Dragon's Teeth Range": "blue", "Amarak Peak": "blue", "Eagle Peak Pass": "blue", "Ghost Marsh": "red",
  "Heaven's Glade": "green", "Ancient Ruins": "red", "Whispering Woods": "green", "McCorm Highlands": "black", "Serpent Swamp": "red",
  "Cursed Plateau": "red", "Rock Bridge Pass": "blue", "Enchanted Glade": "black", "Angel Tear Falls": "black",
  "Fire River": "black", "Mermaid Harbor": "black", "Land of Amazons": "black", "Wyvern Forest": "green", "Crystal Hills": "blue",
  "Minotaur Forest": "green", "Seagaul Lagoon": "blue", "Gryphon Forest": "green", "Withered Hills": "red",
};

// ══════════════════════════════════════════════════════════════
// HERO MODAL COMPONENTS
// ══════════════════════════════════════════════════════════════
function CardItem({ card, onClick }) {
  const isSpecial = card.special;
  const cc = isSpecial ? { bg: "rgba(109,40,168,0.12)", border: "#6d28a8", text: "#6d28a8" } : (cardColorMap[card.color] || cardColorMap.any);
  const diceColor = isSpecial && card.color === "any" ? "#6d28a8" : (cardColorMap[card.color]?.dice || cardColorMap[card.color]?.border || "#6d28a8");
  return (
    <div onClick={onClick} style={{ background: cc.bg, border: `1px solid ${cc.border}`, borderRadius: 5, padding: "5px 10px", margin: "3px 0", fontSize: "0.8em", color: "#2c1810", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span>{card.icon}</span>
        <div>
          <div style={{ fontWeight: 900, color: cc.text, fontFamily: "'Cinzel', Georgia, serif" }}>{card.name}</div>
          {card.special && <div className="hi-title" style={{ fontSize: "0.75em" }}><span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#1a0f0a" }}>Special:</span> <span style={{ color: "#5c4033", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{card.description}</span></div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
        {Array.from({ length: card.dice }).map((_, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: diceColor, borderRadius: 4, fontSize: "0.8em", border: "1.5px solid rgba(0,0,0,0.3)" }}>🎲</span>
        ))}
      </div>
    </div>
  );
}

function HeroSelectCard({ hero, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: selected ? "3px solid #d4af37" : "3px solid #8b7355", borderRadius: 10, overflow: "hidden", boxShadow: selected ? "0 0 16px rgba(212,175,55,0.5), inset 0 0 0 1px rgba(139,115,85,0.3)" : "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)", cursor: "pointer", transition: "all 0.3s", marginBottom: 10 }}>
      <div style={{ background: `linear-gradient(135deg, ${hero.color}cc 0%, ${hero.color}99 100%)`, padding: "6px 14px", borderBottom: "2px solid #8b7355", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="hero-banner-name">{hero.symbol} {hero.name}</div>
        <div style={{ fontSize: "0.85em", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", fontWeight: "bold" }}>❤️ {hero.maxHealth}</div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div className="hero-ability-text-select hi-block" style={{ fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }} dangerouslySetInnerHTML={{ __html: abilityToBlocks(hero.ability) }} />
      </div>
    </div>
  );
}

function HeroListCard({ hero, isActive, onCardsClick, onQuestsClick }) {
  const completedQuests = hero.quests.filter(q => q.completed);
  const activeQuests = hero.quests.filter(q => !q.completed);
  let shapeshiftBadge = null;
  if (hero.name === "Sorceress" && hero.shapeshiftForm) {
    const formNames = { green: "Orc", black: "Undead", red: "Demon", blue: "Dragon" };
    const formColors = { green: "#16a34a", black: "#6b7280", red: "#dc2626", blue: "#3b82f6" };
    const fc = formColors[hero.shapeshiftForm];
    shapeshiftBadge = (<span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 5, fontSize: "0.78em", fontWeight: "bold", background: `${fc}22`, border: `1px solid ${fc}`, color: fc, marginRight: 4 }}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: fc, border: "1.5px solid #000", verticalAlign: "middle", marginRight: 4 }} />{formNames[hero.shapeshiftForm]} Form</span>);
  }
  return (
    <div style={{ background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: isActive ? "3px solid #d4af37" : "3px solid #8b7355", borderRadius: 10, overflow: "hidden", boxShadow: isActive ? "0 0 16px rgba(212,175,55,0.5), inset 0 0 0 1px rgba(139,115,85,0.3)" : "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)", marginBottom: 10 }}>
      <div style={{ background: `linear-gradient(135deg, ${hero.color}cc 0%, ${hero.color}99 100%)`, padding: "6px 14px", borderBottom: "2px solid #8b7355", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="hero-banner-name">{hero.symbol} {hero.name}</div>
        <div style={{ fontSize: "0.85em", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", fontWeight: "bold" }}>❤️ {hero.health}/{hero.maxHealth}</div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: "0.8em", marginBottom: 8 }}>
          <span onClick={onCardsClick} style={{ background: "rgba(139,115,85,0.15)", border: "1px solid rgba(139,115,85,0.3)", padding: "2px 7px", borderRadius: 4, color: "#3d2b1f", cursor: "pointer", textDecoration: "underline" }}>🎴 {hero.cards.length}</span>
          <span onClick={onQuestsClick} style={{ background: "rgba(139,115,85,0.15)", border: "1px solid rgba(139,115,85,0.3)", padding: "2px 7px", borderRadius: 4, color: "#8b0000", cursor: "pointer", textDecoration: "underline" }}>📜 {activeQuests.length}</span>
        </div>
        {(shapeshiftBadge || completedQuests.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(139,115,85,0.3)" }}>
            {shapeshiftBadge}
            {completedQuests.map((q, i) => (<span key={i} style={{ display: "inline-block", padding: "3px 8px", borderRadius: 5, fontSize: "0.75em", fontWeight: 900, fontFamily: "'Cinzel', Georgia, serif", background: "rgba(139,115,85,0.1)", border: "1px solid rgba(139,115,85,0.3)", color: "#2c1810" }}>📜 {q.name}</span>))}
          </div>
        )}
        <div style={{ color: "#2c1810", lineHeight: 1.5, borderTop: "1px solid rgba(139,115,85,0.3)", paddingTop: 8 }}>
          <div className="hero-ability-text hi-block" style={{ fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }} dangerouslySetInnerHTML={{ __html: abilityToBlocks(hero.ability) }} />
        </div>
      </div>
    </div>
  );
}

function HeroDetailCard({ hero, onClose, onCardClick, onQuestClick }) {
  const completedQuests = hero.quests.filter(q => q.completed);
  const activeQuests = hero.quests.filter(q => !q.completed);
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: "3px solid #8b7355", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)" }}>
        <div style={{ background: `linear-gradient(135deg, ${hero.color}cc 0%, ${hero.color}99 100%)`, padding: "6px 14px", borderBottom: "2px solid #8b7355", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="hero-banner-name">{hero.symbol} {hero.name}</div>
          <div style={{ fontSize: "0.85em", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", fontWeight: "bold" }}>❤️ {hero.health}/{hero.maxHealth}</div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ marginBottom: 8 }}>
            <div className="hero-section-label" style={{ fontWeight: "bold", color: "#2c1810", marginBottom: 6, fontSize: "0.85em" }}>🎴 Hero Cards ({hero.cards.length})</div>
            {hero.cards.length > 0 ? hero.cards.map((card, i) => (<CardItem key={i} card={card} onClick={() => onCardClick && onCardClick(card)} />)) : (<div style={{ opacity: 0.6, fontSize: "0.8em", color: "#5c4033", padding: "5px 10px" }}>No cards</div>)}
          </div>
          {hero.quests.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(139,115,85,0.3)", paddingTop: 8 }}>
              <div className="hero-section-label" style={{ fontWeight: "bold", color: "#2c1810", marginBottom: 6, fontSize: "0.85em" }}>📜 Quests</div>
              {hero.quests.map((q, i) => (
                <div key={i} onClick={() => onQuestClick && onQuestClick(q)} style={{ background: "rgba(139,115,85,0.1)", border: "1px solid rgba(139,115,85,0.3)", borderRadius: 5, padding: "5px 10px", margin: "3px 0", fontSize: "0.8em", color: "#2c1810", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900 }}>📜 {q.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: "0.8em", fontWeight: 900, fontFamily: "'Cinzel', Georgia, serif", background: q.completed ? "rgba(22,163,74,0.15)" : "rgba(202,138,4,0.15)", border: q.completed ? "1px solid #16a34a" : "1px solid #ca8a04", color: q.completed ? "#15803d" : "#a16207" }}>{q.completed ? "Completed" : "In Progress"}</span>
                    {q.discarded && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: "0.8em", fontWeight: 900, fontFamily: "'Cinzel', Georgia, serif", background: "rgba(220,38,38,0.15)", border: "1px solid #dc2626", color: "#b91c1c" }}>Discarded</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardDetailModal({ card }) {
  const isSpecial = card.special;
  const cc = isSpecial ? { bg: "rgba(109,40,168,0.12)", border: "#6d28a8", text: "#6d28a8" } : (cardColorMap[card.color] || cardColorMap.any);
  const gen = colorToGeneral[card.color] || colorToGeneral.any;
  const diceCol = isSpecial ? (card.color !== "any" ? (cardColorMap[card.color]?.border || "#6d28a8") : "#6d28a8") : (cc.dice || cc.border);
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: `3px solid ${cc.border}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)" }}>
        <div style={{ background: `linear-gradient(135deg, ${cc.border}cc 0%, ${cc.border}99 100%)`, padding: "12px 14px", borderBottom: "2px solid #8b7355", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="hero-banner-name">{card.icon} {card.name}</div>
        </div>
        <div style={{ padding: "16px" }}>
          {isSpecial && (
            <div className="hi-title" style={{ marginBottom: 14, fontSize: "0.75em", lineHeight: 1.5 }}>
              <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#1a0f0a" }}>Special:</span> <span style={{ color: "#3d2b1f", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{card.description}</span>
            </div>
          )}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <GeneralToken color={card.color === "any" ? null : card.color} />
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.8em", color: cc.text, marginTop: 4 }}>{gen.name}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            {Array.from({ length: card.dice }).map((_, i) => (<span key={i} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: diceCol, borderRadius: 6, margin: 3, fontSize: "1.3em", border: "2px solid #8b7355" }}>🎲</span>))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestDetailModal({ quest }) {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: "3px solid #b91c1c", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg, #b91c1ccc 0%, #b91c1c99 100%)", padding: "8px 14px", borderBottom: "2px solid #8b7355" }}>
          <div className="hero-banner-name">📜 {quest.name}</div>
        </div>
        <div style={{ padding: "14px" }}>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{quest.description}</div></div>
          <div style={{ marginBottom: 10 }}><span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#b91c1c", fontSize: "0.75em" }}>Reward:</span> <span style={{ fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{quest.reward}</span></div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.8em", fontWeight: 900, fontFamily: "'Cinzel', Georgia, serif", background: quest.completed ? "rgba(22,163,74,0.15)" : "rgba(202,138,4,0.15)", border: quest.completed ? "1px solid #16a34a" : "1px solid #ca8a04", color: quest.completed ? "#15803d" : "#a16207" }}>{quest.completed ? "Completed" : "In Progress"}</span>
            {quest.discarded && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.8em", fontWeight: 900, fontFamily: "'Cinzel', Georgia, serif", background: "rgba(220,38,38,0.15)", border: "1px solid #dc2626", color: "#b91c1c" }}>Discarded</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// END OF TURN SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function StepIndicator({ currentStep }) {
  const steps = [{ num: 1, icon: "☀️", label: "Daytime" }, { num: 2, icon: "🌅", label: "Evening" }, { num: 3, icon: "🌙", label: "Night" }];
  return (<div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 14 }}>
    {steps.map((s, i) => { const isActive = s.num === currentStep; const isPast = s.num < currentStep; return (<div key={s.num} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: isActive ? "rgba(212,175,55,0.25)" : isPast ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", border: isActive ? "2px solid #d4af37" : isPast ? "1.5px solid rgba(74,222,128,0.3)" : "1.5px solid rgba(255,255,255,0.1)" }}><span style={{ fontSize: "0.9em" }}>{isPast ? "✓" : s.icon}</span><span className="step-indicator" style={{ fontSize: "0.7em", letterSpacing: "0.5px", color: isActive ? "#d4af37" : isPast ? "#4ade80" : "#555" }}>{s.label}</span></div>{i < 2 && <span style={{ color: isPast ? "#4ade80" : "#333", fontSize: "0.8em" }}>→</span>}</div>); })}
  </div>);
}
function PhaseButton({ label, onClick, disabled }) {
  return (<button onClick={disabled ? undefined : onClick} style={{ width: "100%", marginTop: 14, padding: "11px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "0.95em", letterSpacing: "0.5px", fontFamily: "'Cinzel', Georgia, serif", background: disabled ? "#444" : "linear-gradient(135deg, #d4af37, #b8960c)", color: disabled ? "#888" : "#1a0f0a", border: disabled ? "2px solid #666" : "2px solid #d4af37", opacity: disabled ? 0.5 : 1 }}>{label}</button>);
}
function ParchmentBox({ children, style: s = {} }) {
  return (<div style={{ padding: 10, marginTop: 10, borderRadius: 8, background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: "2px solid #8b7355", ...s }}>{children}</div>);
}
function DamageBox({ color, bg, icon, title, children }) {
  return (<div style={{ margin: "10px 0", padding: 12, background: bg, border: `2px solid ${color}`, borderRadius: 8 }}><div style={{ fontSize: "1em", color, fontWeight: "bold", marginBottom: children ? 5 : 0, fontFamily: "'Cinzel', Georgia, serif" }}>{icon} {title}</div>{children}</div>);
}
function CardHeader({ cardNum, totalCards, generalOnly }) {
  return (<div style={{ textAlign: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(139,115,85,0.3)" }}><strong className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.85em" }}>Card {cardNum} of {totalCards}</strong><span style={{ color: generalOnly ? "#a16207" : "#15803d", fontSize: "0.8em", marginLeft: 8, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>({generalOnly ? "General Advance Only" : "Full Card"})</span></div>);
}
function PreviewRow({ color, label, text, children, strikethrough, skipLabel, warnings }) {
  return (<div style={{ padding: "8px 10px", margin: "5px 0", borderLeft: `3px solid ${color}`, background: "rgba(0,0,0,0.05)", borderRadius: 3, fontSize: "0.75em", opacity: strikethrough ? 0.4 : 1, textDecoration: strikethrough ? "line-through" : "none" }}>
    <div className="hi-title"><strong style={{ color, fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900 }}>{label}:</strong> <span style={{ color: "#3d2b1f", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{text}</span></div>
    {skipLabel && <span style={{ color: "#a16207", fontSize: "0.8em", marginLeft: 5 }}>(skipped)</span>}{children}
    {warnings && warnings.map((w, i) => { const ws = warningStyle(w.type); return (<div key={i} style={{ marginTop: 4, padding: "3px 8px", border: `1px solid ${ws.border}`, background: ws.bg, borderRadius: 3, fontSize: "0.9em", textDecoration: "none", opacity: 1, color: ws.color }}>{w.text}</div>); })}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// END OF TURN DATA
// ══════════════════════════════════════════════════════════════
const handLimitRogue = { name: "Rogue", symbol: "🗡️", health: 5, maxHealth: 6, actions: 6, taint: 0, color: "#b91c1c", location: "Snoton Village", cards: [
  { name: "Dark Woods", color: "black", type: "Horse", icon: "🐎", dice: 1 },
  { name: "Minotaur Forest", color: "green", type: "Magic Gate", icon: "🌀", dice: 1 },
  { name: "Battle Fury", color: "blue", type: "Special", icon: "🌟", dice: 2, special: true, description: "Defeat all minions at your location" },
  { name: "Blood Flats", color: "red", type: "Magic Gate", icon: "🌀", dice: 1 },
  { name: "Pleasant Hill", color: "red", type: "Eagle", icon: "🦅", dice: 2 },
  { name: "Seagaul Lagoon", color: "blue", type: "Eagle", icon: "🦅", dice: 2 },
  { name: "Ghost Marsh", color: "red", type: "Horse", icon: "🐎", dice: 1 },
  { name: "Golden Oak Forest", color: "green", type: "Horse", icon: "🐎", dice: 1 },
  { name: "Cursed Plateau", color: "red", type: "Magic Gate", icon: "🌀", dice: 1 },
  { name: "Fire River", color: "black", type: "Magic Gate", icon: "🌀", dice: 1 },
  { name: "Enchanted Glade", color: "black", type: "Horse", icon: "🐎", dice: 1 },
  { name: "Amarak Peak", color: "blue", type: "Eagle", icon: "🦅", dice: 2 },
  { name: "Scorpion Canyon", color: "red", type: "Horse", icon: "🐎", dice: 1 },
]};

const eotHeroes = [sampleHeroes[3], sampleHeroes[6], sampleHeroes[5], sampleHeroes[7]]; // Paladin, Sorceress, Rogue, Wizard
const damageScenarios = {
  minionDamage: { label: "💔 Wounds", minionDamage: 2, fearDamage: 1, fearBlocked: true, totalDamage: 1, auraReduction: 1, minions: { red: 1, black: 1 }, shadowHidden: false, skyAttackProtected: false },
  noDamage: { label: "✓ No Wounds", minionDamage: 0, fearDamage: 0, totalDamage: 0, auraReduction: 0, minions: {}, fearBlocked: false, shadowHidden: false, skyAttackProtected: false },
  absorbed: { label: "🛡️ Absorbed", minionDamage: 1, fearDamage: 0, totalDamage: 0, auraReduction: 1, minions: { green: 1 }, fearBlocked: false, shadowHidden: false, skyAttackProtected: false },
  shadowHide: { label: "🗡️ Shadow", minionDamage: 2, fearDamage: 0, totalDamage: 0, auraReduction: 0, minions: { red: 1, green: 1 }, fearBlocked: false, shadowHidden: true, skyAttackProtected: false },
  skyAttack: { label: "☁️ Sky", minionDamage: 3, fearDamage: 1, totalDamage: 0, auraReduction: 0, minions: { blue: 2, black: 1 }, fearBlocked: false, shadowHidden: false, skyAttackProtected: true },
};
const sampleDrawnCards = [{ name: "Amarak Peak", color: "blue", type: "Eagle", icon: "🦅", dice: 2 }, { name: "Battle Luck", color: "any", type: "Special", icon: "🌟", dice: 1, special: true, description: "Re-roll all failed dice in combat" }];
const sampleThieveryCard = { name: "Cursed Plateau", color: "red", type: "Magic Gate", icon: "🌀", dice: 1 };
const sampleQuestCard = { name: "McCorm Highlands", color: "black", type: "Horse", icon: "🐎", dice: 1 };
const sampleDarknessCards = {
  regular: { label: "Regular", type: "regular", faction1: "red", minions1: 1, location1: "Windy Pass", faction2: "green", minions2: 2, location2: "Raven Forest", general: "black", minions3: 2, location3: "Father Oak Forest" },
  regularWarn: { label: "Warnings", type: "regular", faction1: "green", minions1: 2, location1: "Father Oak Forest", faction2: "black", minions2: 2, location2: "Ghost Marsh", general: "green", minions3: 0, location3: "Monarch City", _warnings: { minion1: [{ type: "overrun", text: "Will trigger Overrun!" }], minion2: [{ type: "taint", text: "Taint Crystal will be placed" }], general: [{ type: "advance", text: "GENERAL WILL ADVANCE!" }, { type: "monarch", text: "1 step from Monarch City!" }] } },
  regularActions: { label: "Actions", type: "regular", faction1: "blue", minions1: 1, location1: "Crystal Hills", faction2: "red", minions2: 2, location2: "Blood Flats", general: "green", minions3: 2, location3: "Amarak Peak", _warnings: { general: [{ type: "advance", text: "GENERAL WILL ADVANCE!" }] }, _actions: [
    { id: "holy_light", type: "special", name: "Holy Light", icon: "🌟", description: "Remove all minions from one location", target: "minion" },
    { id: "elven_ward", type: "quest", name: "Elven Ward", icon: "📜", description: "Prevent general movement this turn", target: "general" },
  ] },
  nextLoc: { label: "Next Loc", type: "regular", faction1: "green", minions1: 2, location1: "Minotaur Forest", faction2: "black", minions2: 1, location2: "Land of Amazons", general: "red", minions3: 1, location3: "Next Location", _generalPosition: 1 },
  patrol: { label: "Patrol", type: "patrol", patrolName: "Orc Patrols", general: "green", minions3: 2, location3: "Next Location", _generalPosition: 1, patrolLocations: ["Father Oak Forest", "Greenleaf Village", "Golden Oak Forest", "Raven Forest", "Unicorn Forest", "Wyvern Forest", "Minotaur Forest", "Whispering Woods", "Gryphon Forest", "Heaven's Glade"] },
  orcWarParty: { label: "War Party", type: "patrol", patrolName: "Orc War Party", patrolType: "orc_war_party", general: "blue", minions3: 0, location3: "Monarch City", patrolLocations: [] },
  monarchCity: { label: "Monarch", type: "monarch_city_special", colorsPresent: ["green", "red", "black", "blue"] },
  allQuiet: { label: "Quiet", type: "all_quiet", description: "No Dark Lord Minions Spread and No Generals Move" },
};
const sampleResolvedEvents = {
  normal: {
    card: { type: "regular", faction1: "red", minions1: 1, location1: "Windy Pass", faction2: "green", minions2: 2, location2: "Raven Forest", general: "blue", minions3: 2, location3: "Crystal Hills" },
    minions: [
      { color: "red", count: 1, location: "Windy Pass" },
      { color: "green", count: 2, location: "Raven Forest" },
    ],
    general: { color: "blue", name: "Sapphire", icon: "🐉", from: "Ancient Ruins", to: "Greenleaf Village", minions: 2 },
  },
  withOverrun: {
    card: { type: "regular", faction1: "green", minions1: 2, location1: "Father Oak Forest", faction2: "black", minions2: 2, location2: "Ghost Marsh", general: "green", minions3: 0, location3: "Monarch City" },
    minions: [
      { color: "green", count: 2, location: "Father Oak Forest",
        overrun: {
          sourceTaint: { reason: "Location at max (3 minions)", wouldBeMinions: 2, minionsPlaced: 1 },
          spread: [
            { location: "Brookdale Village", color: "green" },
            { location: "Sea Bird Port", color: "green" },
            { location: "Pleasant Hill", color: "green", taint: { reason: "location at max (3 minions)" } },
            { location: "Wolf Pass", color: "green" },
          ],
        },
      },
      { color: "black", count: 2, location: "Ghost Marsh" },
    ],
    general: { color: "green", name: "Gorgutt", icon: "👺", from: "Orc Valley", to: "Monarch City", minions: 0 },
  },
  blocked: {
    card: { type: "regular", faction1: "red", minions1: 1, location1: "Scorpion Canyon", faction2: "blue", minions2: 2, location2: "Crystal Hills", general: "green", minions3: 2, location3: "Eagle Peak Pass" },
    minions: [
      { color: "red", count: 1, location: "Scorpion Canyon" },
      { color: "blue", count: 2, location: "Crystal Hills" },
    ],
    general: { color: "green", name: "Gorgutt", icon: "👺", advances: false, reason: "not next on path", nextRequired: "Amarak Peak", attemptedLocation: "Eagle Peak Pass", minions: 0 },
  },
};

// ══════════════════════════════════════════════════════════════
// EOT STEP MODALS
// ══════════════════════════════════════════════════════════════
function DaytimeModal({ hero, damageInfo, healingResults, onContinue }) {
  const hadMinions = Object.keys(damageInfo.minions).length > 0 || damageInfo.fearDamage > 0 || damageInfo.fearBlocked || damageInfo.shadowHidden || damageInfo.skyAttackProtected;
  const borderColor = damageInfo.totalDamage > 0 ? "#dc2626" : hadMinions ? "#16a34a" : "#16a34a";
  const bgColor = damageInfo.totalDamage > 0 ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)";
  const titleColor = damageInfo.totalDamage > 0 ? "#b91c1c" : "#15803d";
  return (<div><StepIndicator currentStep={1} /><div className="modal-heading" style={{ textAlign: "center", color: "#d4af37", fontSize: "1.15em", marginBottom: 12 }}>Step 1 — ☀️ Daytime</div>
    <ParchmentBox>
      <div style={{ background: "linear-gradient(135deg, #5c3d2ecc 0%, #4a2f20cc 100%)", padding: "6px 14px", marginBottom: 10, marginLeft: -10, marginRight: -10, marginTop: -10, borderRadius: "8px 8px 0 0", borderBottom: "2px solid #8b7355", textAlign: "center" }}><span className="hero-banner-name" style={{ fontSize: "0.9em", letterSpacing: "1px" }}>End of Turn</span></div>
      <div>
        <div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.85em", marginBottom: 6 }}>⚔️ Suffering Wounds</div>
        <div style={{ padding: "8px 10px", background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 6 }}>
          <span style={{ color: titleColor, fontWeight: 900, fontFamily: "'Cinzel', Georgia, serif", fontSize: "0.9em" }}>
            {!hadMinions ? "No Wounds Inflicted" : damageInfo.totalDamage > 0 ? `💔 Wounds Inflicted: ${damageInfo.totalDamage}` : "Wounds Inflicted: 0"}
          </span>
          {hadMinions && (
            <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginTop: 5 }}>
              {damageInfo.minionDamage > 0 && <div className="hi-title" style={{}}>⚔️ {damageInfo.minionDamage} from minions ({Object.entries(damageInfo.minions).map(([c,n]) => `${n} ${factionNames[c]}`).join(", ")})</div>}
              {damageInfo.fearDamage > 0 && <div className="hi-title" style={{ marginTop: 2 }}>💀 {damageInfo.fearDamage} from Undead fear (1 additional wound is inflicted)</div>}
            </div>
          )}
          {hadMinions && (damageInfo.auraReduction > 0 || damageInfo.fearBlocked || damageInfo.shadowHidden || damageInfo.skyAttackProtected) && (
            <div style={{ marginTop: 5 }}>
              {damageInfo.auraReduction > 0 && <div className="hi-sub" style={{ marginTop: 3, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", color: "#3d2b1f", fontSize: "0.75em", lineHeight: 1.5 }}>{hero.symbol} <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#1a0f0a" }}>Aura of Righteousness:</strong> Ignore {damageInfo.auraReduction} wound from minions and Generals</div>}
              {damageInfo.fearBlocked && <div className="hi-sub" style={{ marginTop: 3, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", color: "#3d2b1f", fontSize: "0.75em", lineHeight: 1.5 }}>{hero.symbol} <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#1a0f0a" }}>Bravery:</strong> Does not suffer any penalties from fear</div>}
              {damageInfo.shadowHidden && <div className="hi-sub" style={{ marginTop: 3, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", color: "#3d2b1f", fontSize: "0.75em", lineHeight: 1.5 }}>{hero.symbol} <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#1a0f0a" }}>Hide In The Shadows:</strong> Does not suffer life token loss when in a location with enemy minions</div>}
              {damageInfo.skyAttackProtected && <div className="hi-sub" style={{ marginTop: 3, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", color: "#3d2b1f", fontSize: "0.75em", lineHeight: 1.5 }}>{hero.symbol} <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#1a0f0a" }}>Sky Attack:</strong> No end-of-turn penalties (fear, damage, or card loss)</div>}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(139,115,85,0.3)" }}>
        <div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.85em", marginBottom: 6 }}>❤️ Hero Life Tokens</div>
        <div style={{ background: "rgba(139,115,85,0.1)", border: "1px solid rgba(139,115,85,0.3)", borderRadius: 5, padding: "5px 10px", color: "#2c1810", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9em" }}>
          <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900 }}>{hero.symbol} {hero.name}</span>
          <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: hero.health <= 2 ? "#b91c1c" : "#2c1810" }}>❤️ {hero.health}/{hero.maxHealth}</span>
        </div>
      </div>
      {healingResults && healingResults.filter(r => r.woundType !== null).length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(139,115,85,0.3)" }}>
          <div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.85em", marginBottom: 6 }}>🖤 General Healing</div>
          {healingResults.filter(r => r.woundType !== null).map((r, i) => (
            <div key={i} style={{ background: "rgba(139,115,85,0.1)", border: "1px solid rgba(139,115,85,0.3)", borderRadius: 5, padding: "5px 10px", color: "#2c1810", margin: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9em" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: generalColors[r.color], borderRadius: "50%", border: "2px solid rgba(0,0,0,0.4)", boxShadow: "0 1px 4px rgba(0,0,0,0.4), inset 0 0 6px rgba(255,255,255,0.15)", fontSize: "0.7em" }}>{r.icon}</span><span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: generalColors[r.color] }}>{r.general}</span></span>
                <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: r.health <= 2 ? "#b91c1c" : "#2c1810" }}>{{ green: "💚", blue: "💙", black: "🖤", red: "❤️" }[r.color] || "🖤"} {r.health}/{r.maxHealth}</span>
              </div>
              <div className="hi-title" style={{ marginTop: 4, fontSize: "0.75em", lineHeight: 1.5, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", color: "#3d2b1f" }}>
                <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "1.15em", color: "#1a0f0a" }}>{r.woundType === "major" ? "Major Wound" : "Minor Wound"}:</strong> {r.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </ParchmentBox>
    <PhaseButton label="End Daytime Phase" onClick={onContinue} /></div>);
}

function EveningModal({ hero, drawnCards, thieveryBonus, questBonus, onContinue }) {
  const allCards = [...drawnCards]; if (thieveryBonus) allCards.push(sampleThieveryCard); if (questBonus) allCards.push(sampleQuestCard);
  return (<div><StepIndicator currentStep={2} /><div className="modal-heading" style={{ textAlign: "center", color: "#d4af37", fontSize: "1.15em", marginBottom: 12 }}>Step 2 — 🌅 Evening</div>
    <ParchmentBox>
      <div style={{ background: "linear-gradient(135deg, #5c3d2ecc 0%, #4a2f20cc 100%)", padding: "6px 14px", marginBottom: 10, marginLeft: -10, marginRight: -10, marginTop: -10, borderRadius: "8px 8px 0 0", borderBottom: "2px solid #8b7355", textAlign: "center" }}><span className="hero-banner-name" style={{ fontSize: "0.9em", letterSpacing: "1px" }}>🎴 Hero Cards Drawn</span></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {allCards.map((card, idx) => { const isT = thieveryBonus && idx === 2; const isQ = questBonus && idx === allCards.length - 1 && !isT; const cc = card.special ? { border: "#6d28a8", text: "#6d28a8" } : (cardColorMap[card.color] || cardColorMap.any); const bc = isT ? "#7c3aed" : isQ ? "#dc2626" : cc.border;
          return (<div key={idx} style={{ flex: "1 1 120px", maxWidth: 160, minWidth: 100, background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: `3px solid ${bc}`, borderRadius: 8, padding: "8px 10px", textAlign: "center", boxShadow: (isT||isQ) ? `0 0 10px ${isT?"rgba(124,58,237,0.6)":"rgba(220,38,38,0.6)"}` : card.special ? "0 0 10px rgba(109,40,168,0.5)" : "0 2px 8px rgba(0,0,0,0.3)", animation: "cardReveal 0.4s ease-out forwards", animationDelay: `${idx*0.15}s`, opacity: 0 }}>
            {isT && <div style={{ fontSize: "0.65em", color: "#7c3aed", fontWeight: "bold", fontFamily: "'Cinzel', Georgia, serif" }}>🗡️ THIEVERY</div>}
            {isQ && <div style={{ fontSize: "0.65em", color: "#dc2626", fontWeight: "bold", fontFamily: "'Cinzel', Georgia, serif" }}>📜 HELM OF POWER</div>}
            {!card.special && <div style={{ fontSize: "1.4em", marginBottom: 2 }}>{card.icon}</div>}
            {card.special && <div style={{ fontSize: "1.4em", marginBottom: 2 }}>🌟</div>}
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.72em", color: cc.text }}>{card.name}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 4 }}>{Array.from({ length: card.dice }).map((_, i) => (<span key={i} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, background: cc.border, borderRadius: 3, fontSize: "0.7em", border: "1.5px solid rgba(0,0,0,0.3)" }}>🎲</span>))}</div>
          </div>); })}
      </div>
      <div style={{ textAlign: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(139,115,85,0.3)" }}><span style={{ fontSize: "0.9em", color: "#2c1810", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900 }}>🎴 Total Cards: {hero.cards.length + allCards.length}</span></div>
    </ParchmentBox>
    <PhaseButton label="End Evening Phase" onClick={onContinue} /></div>);
}

function HandLimitModal({ hero, onConfirm }) {
  const [selected, setSelected] = useState(new Set()); const excess = hero.cards.length - 10;
  const toggle = (i) => setSelected(p => { const n = new Set(p); if (n.has(i)) n.delete(i); else if (n.size < excess) n.add(i); return n; });
  const remaining = excess - selected.size;
  return (<div><StepIndicator currentStep={2} /><div className="modal-heading" style={{ textAlign: "center", color: "#d4af37", fontSize: "1.15em", marginBottom: 12 }}>✋ Hand Limit Exceeded</div>
    <ParchmentBox>
      <div style={{ background: "linear-gradient(135deg, #5c3d2ecc 0%, #4a2f20cc 100%)", padding: "8px 14px", marginBottom: 10, marginLeft: -10, marginRight: -10, marginTop: -10, borderRadius: "8px 8px 0 0", borderBottom: "2px solid #8b7355", textAlign: "center" }}>
        <span className="hero-banner-name" style={{ fontSize: "0.85em", letterSpacing: "1px" }}>
          {remaining > 0 ? `Select ${remaining} more card${remaining !== 1 ? "s" : ""} to discard` : "✓ Ready to discard!"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {hero.cards.map((card, idx) => {
          const cc = card.special ? { border: "#6d28a8", text: "#6d28a8" } : (cardColorMap[card.color] || cardColorMap.any);
          const sel = selected.has(idx);
          return (<div key={idx} onClick={() => toggle(idx)} style={{ flex: "1 1 90px", maxWidth: 120, minWidth: 80, background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)", border: `3px solid ${sel ? "#dc2626" : cc.border}`, borderRadius: 8, padding: "8px 6px", textAlign: "center", cursor: "pointer", position: "relative", opacity: sel ? 0.45 : 1, transform: sel ? "scale(0.93)" : "scale(1)", transition: "all 0.2s", boxShadow: sel ? "0 0 8px rgba(220,38,38,0.4)" : card.special ? "0 0 8px rgba(109,40,168,0.4)" : "0 2px 6px rgba(0,0,0,0.3)" }}>
            {sel && <div style={{ position: "absolute", top: -8, right: -8, background: "#dc2626", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: "bold", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>✕</div>}
            {!card.special && <div style={{ fontSize: "1.2em", marginBottom: 2 }}>{card.icon}</div>}
            {card.special && <div style={{ fontSize: "1.2em", marginBottom: 2 }}>🌟</div>}
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.62em", color: cc.text, lineHeight: 1.2 }}>{card.name}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4 }}>
              {Array.from({ length: card.dice }).map((_, i) => (<span key={i} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, background: cc.border, borderRadius: 3, fontSize: "0.65em", border: "1.5px solid rgba(0,0,0,0.3)" }}>🎲</span>))}
            </div>
          </div>);
        })}
      </div>
      <div style={{ textAlign: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(139,115,85,0.3)" }}>
        <span style={{ fontSize: "0.82em", color: "#2c1810", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900 }}>🎴 {hero.cards.length} cards (limit: 10)</span>
      </div>
    </ParchmentBox>
    <PhaseButton label={remaining > 0 ? `Discard ${selected.size}/${excess} Cards` : `✓ Discard ${excess} Cards`} onClick={() => selected.size === excess && onConfirm()} disabled={selected.size !== excess} /></div>);
}

function MinionToken({ color, count }) {
  const gc = generalColors[color] || "#888";
  return (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} style={{ display: "inline-block", width: 16, height: 16, background: gc, borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.3)", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
    ))}
  </div>);
}

function GeneralToken({ color }) {
  const gc = color ? (generalColors[color] || "#888") : "#6d28a8";
  const gen = color ? (colorToGeneral[color] || colorToGeneral.any) : colorToGeneral.any;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, background: gc, borderRadius: "50%", border: "3px solid rgba(0,0,0,0.4)", boxShadow: "0 2px 6px rgba(0,0,0,0.4), inset 0 0 8px rgba(255,255,255,0.15)", fontSize: "1.1em" }}>{gen.icon}</div>
  );
}

function LocationRing({ name, color, size, highlight }) {
  const gc = generalColors[color] || "#888";
  const s = size || 60;
  const ring = highlight ? { outline: "3px solid #7c3aed", outlineOffset: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.15), 0 0 12px rgba(124,58,237,0.6)" } : { boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.15)" };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: s, height: s, borderRadius: "50%", border: `3px solid rgba(0,0,0,0.4)`, background: gc, padding: 6, flexShrink: 0, ...ring }}>
      <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: `${s * 0.0082}em`, color: "#fff", lineHeight: 1.1, textAlign: "center", overflowWrap: "normal", wordBreak: "normal", hyphens: "none", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{name}</span>
    </div>
  );
}

function DarknessLocationCard({ location, color, count, isGeneral, generalOnly, strikethrough, warnings, highlightLocation, generalPosition }) {
  const gc = generalColors[color] || "#888";
  const gn = generalNames[color];
  if (isGeneral) {
    const isNextLoc = location === "Next Location";
    const path = isNextLoc ? (generalPaths[color] || []) : [];
    const nextIdx = isNextLoc ? Math.min((generalPosition || 0) + 1, path.length - 1) : -1;
    const pathLocs = isNextLoc ? path : []; // include starting location
    return (
      <div style={{ background: "transparent", padding: "10px 10px 40px 10px", opacity: strikethrough ? 0.4 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {count > 0 && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <MinionToken color={color} count={count} />
            </div>}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <GeneralToken color={color} />
              <div style={{ position: "absolute", top: "100%", marginTop: 2, whiteSpace: "nowrap", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.8em", color: gc }}>{gn}</div>
            </div>
          </div>
          <div style={{ fontSize: "2.5em", color: "#fff", fontWeight: 900, textShadow: "0 2px 6px rgba(0,0,0,0.6)", WebkitTextStroke: "2px rgba(0,0,0,0.25)", lineHeight: 1, flexShrink: 0 }}>→</div>
          {isNextLoc ? (
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", padding: 6 }}>
                {pathLocs.map((loc, li) => (
                  <div key={li} style={{ marginLeft: li === 0 ? 0 : -12, zIndex: path[nextIdx] === loc ? pathLocs.length + 1 : pathLocs.length - li, position: "relative" }}>
                    <LocationRing name={loc} color={locationFaction[loc] || color} size={60} highlight={path[nextIdx] === loc} />
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", top: "100%", marginTop: -2, whiteSpace: "nowrap", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.8em", color: "#7c3aed" }}>Next Location</div>
            </div>
          ) : (
            <LocationRing name={location} color={locationFaction[location] || color} size={60} highlight={highlightLocation} />
          )}
        </div>
        {warnings && warnings.map((w, i) => { const ws = warningStyle(w.type); return (<div key={i} style={{ marginTop: 6, padding: "2px 6px", border: `1px solid ${ws.border}`, background: ws.bg, borderRadius: 3, fontSize: "0.75em", color: ws.color, fontWeight: "bold", textAlign: "center", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{w.text}</div>); })}
      </div>
    );
  }
  return (
    <div style={{ flex: "1 1 120px", maxWidth: 200, minWidth: 130, padding: "8px 10px", opacity: strikethrough ? 0.4 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <MinionToken color={color} count={count} />
        </div>
        <LocationRing name={location} color={color} size={60} />
      </div>
      {strikethrough && <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.6em", color: "#a16207", marginTop: 4, textAlign: "center" }}>(skipped)</div>}
      {warnings && warnings.map((w, i) => { const ws = warningStyle(w.type); return (<div key={i} style={{ marginTop: 4, padding: "2px 6px", border: `1px solid ${ws.border}`, background: ws.bg, borderRadius: 3, fontSize: "0.75em", color: ws.color, fontWeight: "bold", textAlign: "center", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{w.text}</div>); })}
    </div>
  );
}

function DarknessDrawModal({ card, cardNum, totalCards, generalOnly, heroIsWizard, onResolve, onWisdom }) {
  const hdr = (<><StepIndicator currentStep={3} /><div className="modal-heading" style={{ textAlign: "center", color: "#d4af37", fontSize: "1.15em", marginBottom: 4 }}>Step 3 — 🌙 Night</div></>);
  const cardCounter = totalCards > 1 ? (<div style={{ textAlign: "center", marginBottom: 10 }}><strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#d4af37", fontSize: "0.85em" }}>Draw Card {cardNum} of {totalCards}</strong>{generalOnly && <span style={{ color: "#fbbf24", fontSize: "0.8em", marginLeft: 8, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>(General Advance Only)</span>}</div>) : (<div style={{ textAlign: "center", marginBottom: 10 }}><strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#d4af37", fontSize: "0.85em" }}>Draw Card</strong>{generalOnly && <span style={{ color: "#fbbf24", fontSize: "0.8em", marginLeft: 8, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>(General Advance Only)</span>}</div>);
  const banner = (<div style={{ background: "linear-gradient(135deg, #5c3d2ecc 0%, #4a2f20cc 100%)", padding: "6px 14px", marginBottom: 10, marginLeft: -10, marginRight: -10, marginTop: -10, borderRadius: "8px 8px 0 0", borderBottom: "2px solid #8b7355", textAlign: "center" }}><span className="hero-banner-name" style={{ fontSize: "0.9em", letterSpacing: "1px" }}>Darkness Spreads</span></div>);
  if (card.type === "all_quiet") return (<div>{hdr}{cardCounter}<ParchmentBox>{banner}<div style={{ padding: 15, textAlign: "center" }}><div style={{ fontSize: "1.2em", color: "#6d28a8", fontWeight: "bold", fontFamily: "'Cinzel', Georgia, serif" }}>🌅 All is Quiet</div><div style={{ color: "#3d2b1f", marginTop: 5, fontSize: "0.75em", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{card.description}</div></div></ParchmentBox><PhaseButton label={cardNum < totalCards ? "Draw Next Card" : "End Night Phase"} onClick={onResolve} /></div>);
  if (card.type === "monarch_city_special") { const minionPositions = [
    { color: "black", top: -6, left: -6 },
    { color: "green", top: -6, right: -6 },
    { color: "red", bottom: -6, left: -6 },
    { color: "blue", bottom: -6, right: -6 },
  ]; return (<div>{hdr}{cardCounter}<ParchmentBox>{banner}
    <div style={{ textAlign: "center", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "2.2em", color: "#7c3aed", marginBottom: 8 }}>Monarch City</div>
    <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <LocationRing name="Monarch City" color="purple" size={80} />
          {minionPositions.map(p => (card.colorsPresent||[]).includes(p.color) && (
            <div key={p.color} style={{ position: "absolute", top: p.top, bottom: p.bottom, left: p.left, right: p.right }}>
              <MinionToken color={p.color} count={1} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.9em", color: "#dc2626", marginBottom: 4 }}>Special</div>
        <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginBottom: 6 }}>Place 1 minion of each color that has minions adjacent to Monarch City</div>
        <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#dc2626", lineHeight: 1.4 }}>No Overrun Can Occur</div>
      </div>
    </div>
    <div style={{ textAlign: "center", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "1.9em", color: "#7c3aed", marginBottom: 2 }}>Reshuffle All Decks</div>
    <div style={{ textAlign: "center", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#dc2626", marginBottom: 10 }}>No Generals Move</div>
  </ParchmentBox><PhaseButton label="Resolve Card" onClick={onResolve} /></div>); }
  if (card.type === "patrol") { const gc = generalColors[card.general]; const gn = generalNames[card.general]; const isWarParty = card.patrolType === "orc_war_party"; const patrolDesc = isWarParty ? "Add 1 orc to each location with exactly 1 orc and no other minions" : "Add 1 green minion to each empty green location"; return (<div>{hdr}{cardCounter}<ParchmentBox>{banner}<div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.8em", marginBottom: 6 }}>{card.patrolName}</div>{!generalOnly ? (<div style={{ marginBottom: 4 }}><div style={{ fontSize: "0.75em", color: "#3d2b1f", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", marginBottom: 8 }}>{patrolDesc}</div></div>) : <div className="hi-title" style={{ fontSize: "0.75em", marginBottom: 6 }}><strong style={{ color: "#1a0f0a", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900 }}>⏭️ Skipped:</strong> <span style={{ color: "#3d2b1f", fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Patrol skipped (General Only)</span></div>}<div style={{ display: "flex", justifyContent: isWarParty ? "center" : "flex-start" }}><DarknessLocationCard location={card.location3} color={card.general} count={card.minions3} isGeneral highlightLocation generalPosition={card._generalPosition} /></div></ParchmentBox>{heroIsWizard ? <div style={{ display: "flex", gap: 10, marginTop: 14 }}><button onClick={onResolve} style={{ flex: 1, padding: 11, borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "0.9em", fontFamily: "'Cinzel', Georgia, serif", background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#1a0f0a", border: "2px solid #d4af37" }}>Resolve Card</button><button onClick={onWisdom} style={{ flex: 1, padding: 11, borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "0.9em", fontFamily: "'Cinzel', Georgia, serif", background: "linear-gradient(135deg, #c2410c, #a83808)", color: "#fff", border: "2px solid #e87040" }}>🔮 Wisdom</button></div> : <PhaseButton label="Resolve Card" onClick={onResolve} />}</div>); }
  // Regular
  const c1 = generalColors[card.faction1]; const n1 = generalNames[card.faction1]; const c2 = generalColors[card.faction2]; const n2 = generalNames[card.faction2]; const gc = generalColors[card.general]; const gn = generalNames[card.general]; const w = card._warnings || {}; const actions = card._actions || [];
  return (<div>{hdr}{cardCounter}<ParchmentBox>{banner}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      <DarknessLocationCard location={card.location1} color={card.faction1} count={card.minions1} strikethrough={generalOnly} warnings={w.minion1} />
      <DarknessLocationCard location={card.location2} color={card.faction2} count={card.minions2} strikethrough={generalOnly} warnings={w.minion2} />
    </div>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <DarknessLocationCard location={card.location3} color={card.general} count={card.minions3} isGeneral warnings={w.general} generalPosition={card._generalPosition} />
    </div>
    {actions.length > 0 && (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(139,115,85,0.3)" }}>
        <div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.8em", marginBottom: 6 }}>Available Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {actions.map((a, i) => {
            const isSpecial = a.type === "special";
            const isQuest = a.type === "quest";
            const btnBg = isSpecial ? "linear-gradient(135deg, #6d28a8, #5b21b6)" : "linear-gradient(135deg, #b45309, #92400e)";
            const btnBorder = isSpecial ? "#7c3aed" : "#d97706";
            return (
              <button key={i} onClick={() => alert(`${a.name} activated!`)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: btnBg, border: `2px solid ${btnBorder}`, boxShadow: `0 2px 8px rgba(0,0,0,0.3)` }}>
                <span style={{ fontSize: "1.3em" }}>{a.icon}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.8em", color: "#fff" }}>{a.name}</div>
                  <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.65em", color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>{a.description}</div>
                </div>
                <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.6em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{a.type}</span>
              </button>
            );
          })}
        </div>
      </div>
    )}
  </ParchmentBox>{heroIsWizard ? <div style={{ display: "flex", gap: 10, marginTop: 14 }}><button onClick={onResolve} style={{ flex: 1, padding: 11, borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "0.9em", fontFamily: "'Cinzel', Georgia, serif", background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#1a0f0a", border: "2px solid #d4af37" }}>Resolve Card</button><button onClick={onWisdom} style={{ flex: 1, padding: 11, borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "0.9em", fontFamily: "'Cinzel', Georgia, serif", background: "linear-gradient(135deg, #c2410c, #a83808)", color: "#fff", border: "2px solid #e87040" }}>🔮 Wisdom</button></div> : <PhaseButton label="Resolve Card" onClick={onResolve} />}</div>);
}

function DarknessResolvedModal({ events, cardNum, totalCards, generalOnly, onNext }) {
  const { card, minions, general, overruns, taints } = events;
  const banner = (<div style={{ background: "linear-gradient(135deg, #5c3d2ecc 0%, #4a2f20cc 100%)", padding: "6px 14px", marginBottom: 10, marginLeft: -10, marginRight: -10, marginTop: -10, borderRadius: "8px 8px 0 0", borderBottom: "2px solid #8b7355", textAlign: "center" }}><span className="hero-banner-name" style={{ fontSize: "0.9em", letterSpacing: "1px" }}>Darkness Spreads</span></div>);
  const cardCounter = totalCards > 1 ? (<div style={{ textAlign: "center", marginBottom: 10 }}><strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#d4af37", fontSize: "0.85em" }}>Resolve Card {cardNum} of {totalCards}</strong>{generalOnly && <span style={{ color: "#fbbf24", fontSize: "0.8em", marginLeft: 8, fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>(General Advance Only)</span>}</div>) : (<div style={{ textAlign: "center", marginBottom: 10 }}><strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: "#d4af37", fontSize: "0.85em" }}>Resolve Card</strong></div>);
  return (<div><StepIndicator currentStep={3} /><div className="modal-heading" style={{ textAlign: "center", color: "#d4af37", fontSize: "1.15em", marginBottom: 4 }}>Step 3 — 🌙 Night</div>
    {cardCounter}
    <ParchmentBox>{banner}
      {card && card.type === "regular" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <DarknessLocationCard location={card.location1} color={card.faction1} count={card.minions1} strikethrough={generalOnly} />
          <DarknessLocationCard location={card.location2} color={card.faction2} count={card.minions2} strikethrough={generalOnly} />
        </div>
      )}
      {card && card.type === "regular" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <DarknessLocationCard location={card.location3} color={card.general} count={card.minions3} isGeneral generalPosition={card._generalPosition} />
        </div>
      )}

      {/* ── Results separator ── */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px solid rgba(139,115,85,0.4)" }}>

        {/* Minion Movement */}
        <div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.85em", marginBottom: 6 }}>Minion Movement</div>
        {minions && minions.map((m, i) => {
          const mc = generalColors[m.color] || "#888";
          const hasOverrun = !!m.overrun;
          const genName = generalNames[m.color] || factionNames[m.color];
          const borderColor = hasOverrun ? "#dc2626" : mc;
          const bgColor = hasOverrun ? "rgba(220,38,38,0.08)" : "rgba(139,115,85,0.1)";
          return (
            <div key={i} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 5, padding: "5px 10px", margin: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.9em", color: mc }}>+{m.count} {factionNames[m.color]}</span>
                <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.85em", color: "#2c1810" }}>→ {m.location}</span>
              </div>
              {hasOverrun && (
                <div style={{ marginTop: 6, padding: "6px 8px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 4 }}>
                  <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.85em", color: "#b91c1c", marginBottom: 4 }}>OVERRUN at {m.location}!</div>
                  <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginBottom: 4 }}>{genName} minions spread to connected locations</div>
                  {/* Source taint - original location at max */}
                  {m.overrun.sourceTaint && (
                    <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginLeft: 8, marginTop: 2 }}>
                      <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: mc }}>{genName}:</strong>{" "}
                      {(() => {
                        const st = m.overrun.sourceTaint;
                        const wouldBe = st.wouldBeMinions || m.count;
                        const placed = st.minionsPlaced != null ? st.minionsPlaced : 0;
                        const notPlaced = wouldBe - placed;
                        const parts = [];
                        if (placed > 0) parts.push(<span key="p">{placed} {m.color} minion{placed !== 1 ? "s" : ""} placed</span>);
                        if (notPlaced > 0) parts.push(<span key="np">{notPlaced} {m.color} minion{notPlaced !== 1 ? "s" : ""} <span style={{ color: "#b91c1c", fontWeight: "bold" }}>NOT placed</span></span>);
                        return parts.reduce((acc, el, idx) => idx === 0 ? [el] : [...acc, ", ", el], []);
                      })()}
                      {" "}→ {m.location} <span style={{ color: "#666" }}>({m.overrun.sourceTaint.reason})</span>
                      <span style={{ color: "#7e22ce", fontWeight: "bold" }}> Taint Crystal placed!</span>
                    </div>
                  )}
                  {/* Spread items */}
                  {m.overrun.spread.map((s, si) => (
                    <div key={si} style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginLeft: 8, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      <MinionToken color={s.color} count={1} />
                      {s.taint ? (
                        <span>
                          <strong style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: generalColors[s.color] || mc }}>{genName}:</strong>{" "}
                          1 {s.color} minion <span style={{ color: "#b91c1c", fontWeight: "bold" }}>NOT placed</span> → {s.location} <span style={{ color: "#666" }}>({s.taint.reason})</span>
                          <span style={{ color: "#7e22ce", fontWeight: "bold" }}> Taint Crystal placed!</span>
                        </span>
                      ) : (
                        <span>{genName}: 1 {s.color} minion → {s.location}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* General Movement */}
        {general && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(139,115,85,0.3)" }}>
            <div className="hero-section-label" style={{ color: "#2c1810", fontSize: "0.85em", marginBottom: 6 }}>General Movement</div>
            {general.advances === false ? (
              <div style={{ background: "rgba(139,115,85,0.1)", border: "1px solid rgba(139,115,85,0.3)", borderRadius: 5, padding: "5px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: generalColors[general.color], borderRadius: "50%", border: "2px solid rgba(0,0,0,0.4)", boxShadow: "0 1px 4px rgba(0,0,0,0.4), inset 0 0 6px rgba(255,255,255,0.15)", fontSize: "0.7em" }}>{general.icon}</span>
                    <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: generalColors[general.color] }}>{general.name}</span>
                  </span>
                  <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.85em", color: "#2c1810" }}>→ {general.attemptedLocation}</span>
                </div>
                <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.75em", color: "#b91c1c", marginTop: 4 }}>✗ GENERAL DOES NOT ADVANCE</div>
                <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginTop: 2 }}>
                  ({general.reason})
                  {general.nextRequired && <><br />Next required: {general.nextRequired}</>}
                  <br />No minions placed
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 5, padding: "5px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: generalColors[general.color], borderRadius: "50%", border: "2px solid rgba(0,0,0,0.4)", boxShadow: "0 1px 4px rgba(0,0,0,0.4), inset 0 0 6px rgba(255,255,255,0.15)", fontSize: "0.7em" }}>{general.icon}</span>
                    <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, color: generalColors[general.color] }}>{general.name}</span>
                  </span>
                  <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.85em", color: "#2c1810" }}>{general.from} → {general.to}</span>
                </div>
                <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 900, fontSize: "0.75em", color: "#dc2626", marginTop: 4 }}>✓ GENERAL ADVANCES</div>
                {general.minions > 0 && (
                  <div style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontSize: "0.75em", color: "#3d2b1f", lineHeight: 1.5, marginTop: 2 }}>
                    +{general.minions} minions placed at {general.to}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </ParchmentBox>
    <PhaseButton label={cardNum >= totalCards ? "End Night Phase" : "Draw Next Card"} onClick={onNext} /></div>);
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
export default function AllModals() {
  const [section, setSection] = useState("hero");
  // Hero modal state
  const [heroView, setHeroView] = useState("selection");
  const [selectedHeroes, setSelectedHeroes] = useState([3, 4]);
  const [detailHero, setDetailHero] = useState(null);
  const [listHero, setListHero] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [detailQuest, setDetailQuest] = useState(null);
  // EOT state
  const [step, setStep] = useState("daytime");
  const [eotHeroIdx, setEotHeroIdx] = useState(0);
  const [damageKey, setDamageKey] = useState("minionDamage");
  const [bonusToggles, setBonusToggles] = useState({ thievery: false, quest: false });
  const [showHealing, setShowHealing] = useState(true);
  const [nightMode, setNightMode] = useState("allquiet");
  const [darknessCardKey, setDarknessCardKey] = useState("regular");
  const [nightCardNum, setNightCardNum] = useState(1);
  const [nightGeneralOnly, setNightGeneralOnly] = useState(false);
  const [nightResolveKey, setNightResolveKey] = useState("normal");

  const sampleCards2 = [{ name: "Bounty Bay", color: "blue", type: "Magic Gate", icon: "🌀", dice: 1 }, { name: "Scorpion Canyon", color: "red", type: "Eagle", icon: "🦅", dice: 2 }, { name: "Dark Woods", color: "black", type: "Horse", icon: "🐎", dice: 1 }, { name: "Gryphon Forest", color: "green", type: "Eagle", icon: "🦅", dice: 2 }, { name: "Hammer of Valor", color: "any", type: "Special", icon: "🌟", dice: 2, special: true, description: "Move any hero to any location" }, { name: "Battle Luck", color: "any", type: "Special", icon: "🌟", dice: 1, special: true, description: "Re-roll all failed dice in combat" }];
  const toggleSelection = (i) => setSelectedHeroes(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 4 ? [...prev, i] : prev);
  const eotHero = eotHeroes[eotHeroIdx];
  const heroIsWizard = eotHeroIdx === 3;
  const healingResults = [
    { general: "Gorgutt", color: "green", icon: "👺", woundType: "minor", healed: true, amount: 1, health: 4, maxHealth: 5, description: "Healed 1 wound" },
    { general: "Sapphire", color: "blue", icon: "🐉", woundType: "major", healed: false, amount: 0, health: 2, maxHealth: 5, description: "Start healing after the Sorceress's next turn" },
    { general: "Varkolak", color: "black", icon: "💀", woundType: "minor", healed: false, amount: 0, health: 3, maxHealth: 5, description: "Start healing after the Paladin's next turn" },
  ];

  return (
    <div style={{ background: "linear-gradient(135deg, #1a0f0a 0%, #2c1810 100%)", minHeight: "100vh", padding: "20px 12px", fontFamily: "'Crimson Text', Georgia, 'Times New Roman', serif", color: "#e8dcc8" }}>
      <GlobalStyles />

      {/* TOP SECTION SWITCHER */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: "1.3em", fontWeight: "bold", color: "#d4af37", marginBottom: 10, fontFamily: "'Cinzel', Georgia, serif" }}>Defenders of the Realm — UI Mockups</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
          {[["hero", "🛡️ Hero Modals"], ["eot", "🌙 End of Turn"]].map(([k, l]) => (
            <button key={k} onClick={() => setSection(k)} style={{ padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "0.9em", fontFamily: "'Cinzel', Georgia, serif", background: section === k ? "linear-gradient(135deg, #d4af37, #b8960c)" : "rgba(212,175,55,0.15)", color: section === k ? "#1a0f0a" : "#d4af37", border: "2px solid #d4af37", boxShadow: section === k ? "0 0 12px rgba(212,175,55,0.4)" : "none" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ════════ HERO MODALS SECTION ════════ */}
      {section === "hero" && (<>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {[["selection","⚔️ Selection"],["list","📋 List"],["detail","🛡️ Details"],["card","🎴 Cards"],["quest","📜 Quests"]].map(([k,l])=>(
              <button key={k} onClick={()=>{ setHeroView(k); if(k==="detail"&&!detailHero) setDetailHero(sampleHeroes[selectedHeroes[0]]); if(k==="list"&&!listHero) setListHero(sampleHeroes[selectedHeroes[0]]); if(k==="card"&&!detailCard) setDetailCard(sampleCards2[0]); if(k==="quest"&&!detailQuest) setDetailQuest(sampleHeroes[3].quests[0]); }} style={{ padding:"7px 14px",borderRadius:6,cursor:"pointer",fontWeight:"bold",fontSize:"0.8em",background:heroView===k?"#d4af37":"rgba(212,175,55,0.2)",color:heroView===k?"#1a0f0a":"#d4af37",border:"2px solid #d4af37" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "2px solid #d4af37", borderRadius: 12, padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            {heroView === "selection" && (<><h2 className="modal-heading" style={{ textAlign: "center", color: "#d4af37", margin: "0 0 5px 0", fontSize: "1.3em" }}>⚔️ Hero Selection</h2><p style={{ textAlign: "center", marginBottom: 15, fontSize: "0.9em", color: "#a0937d" }}>Select heroes (1-4) — {selectedHeroes.length}/4</p>{sampleHeroes.map((h,i)=>(<HeroSelectCard key={i} hero={h} selected={selectedHeroes.includes(i)} onClick={()=>toggleSelection(i)}/>))}<button style={{ width:"100%",marginTop:10,padding:"12px",borderRadius:8,cursor:"pointer",fontWeight:"bold",fontSize:"1em",fontFamily:"'Comic Sans MS', 'Comic Sans', cursive",background:selectedHeroes.length>0?"linear-gradient(135deg, #d4af37, #b8960c)":"#444",color:selectedHeroes.length>0?"#1a0f0a":"#888",border:selectedHeroes.length>0?"2px solid #d4af37":"2px solid #666"}}>⚔️ Start Game ({selectedHeroes.length})</button></>)}
            {heroView === "list" && (<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}><h2 className="modal-heading" style={{color:"#d4af37",margin:0,fontSize:"1.2em"}}>👥 Heroes</h2><button style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,color:"#fff",background:"rgba(100,100,100,0.9)",border:"2px solid #666",borderRadius:"50%"}}>×</button></div>{(()=>{const h=listHero||sampleHeroes[selectedHeroes[0]];return h?<HeroListCard hero={h} isActive={true} onCardsClick={()=>{if(h.cards.length>0){setDetailCard(h.cards[0]);setHeroView("card");}}} onQuestsClick={()=>{if(h.quests.length>0){setDetailQuest(h.quests[0]);setHeroView("quest");}}}/>:null;})()}<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>{sampleHeroes.filter((_,i)=>selectedHeroes.includes(i)).map((h,i)=>(<button key={i} onClick={()=>setListHero(h)} className="hero-banner-name" style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",background:h.color,color:"#fff",fontSize:"0.75em",border:(listHero||sampleHeroes[selectedHeroes[0]]).name===h.name?"3px solid #d4af37":"2px solid rgba(0,0,0,0.3)",boxShadow:(listHero||sampleHeroes[selectedHeroes[0]]).name===h.name?"0 0 12px rgba(212,175,55,0.5)":"0 2px 6px rgba(0,0,0,0.4)"}}>{h.symbol} {h.name}</button>))}</div></>)}
            {heroView === "detail" && detailHero && (<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}><h2 className="modal-heading" style={{color:"#d4af37",margin:0,fontSize:"1.2em"}}>🛡️ Hero Details</h2><button onClick={()=>setHeroView("list")} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,color:"#fff",background:"rgba(100,100,100,0.9)",border:"2px solid #666",borderRadius:"50%"}}>×</button></div><HeroDetailCard hero={detailHero} onCardClick={(c)=>{setDetailCard(c);setHeroView("card");}} onQuestClick={(q)=>{setDetailQuest(q);setHeroView("quest");}}/><div style={{display:"flex",gap:6,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>{sampleHeroes.filter((_,i)=>selectedHeroes.includes(i)).map((h,i)=>(<button key={i} onClick={()=>setDetailHero(h)} className="hero-banner-name" style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",background:h.color,color:"#fff",fontSize:"0.75em",border:detailHero.name===h.name?"3px solid #d4af37":"2px solid rgba(0,0,0,0.3)",boxShadow:detailHero.name===h.name?"0 0 12px rgba(212,175,55,0.5)":"0 2px 6px rgba(0,0,0,0.4)"}}>{h.symbol} {h.name}</button>))}</div></>)}
            {heroView === "card" && detailCard && (<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}><h2 className="modal-heading" style={{color:"#d4af37",margin:0,fontSize:"1.2em"}}>🎴 Card Details</h2><button onClick={()=>setHeroView("detail")} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,color:"#fff",background:"rgba(100,100,100,0.9)",border:"2px solid #666",borderRadius:"50%"}}>×</button></div><CardDetailModal card={detailCard}/><div style={{display:"flex",gap:6,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>{sampleCards2.map((c,i)=>{const cColor=c.special?"#6d28a8":(cardColorMap[c.color]?.border||"#8b7355");return(<button key={i} onClick={()=>setDetailCard(c)} className="hero-banner-name" style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",background:cColor,color:"#fff",fontSize:"0.75em",border:detailCard.name===c.name?"3px solid #d4af37":"2px solid rgba(0,0,0,0.3)",boxShadow:detailCard.name===c.name?"0 0 12px rgba(212,175,55,0.5)":"0 2px 6px rgba(0,0,0,0.4)"}}>{c.icon} {c.name}</button>);})}</div></>)}
            {heroView === "quest" && detailQuest && (<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}><h2 className="modal-heading" style={{color:"#d4af37",margin:0,fontSize:"1.2em"}}>📜 Quest Details</h2><button onClick={()=>setHeroView("detail")} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,color:"#fff",background:"rgba(100,100,100,0.9)",border:"2px solid #666",borderRadius:"50%"}}>×</button></div><QuestDetailModal quest={detailQuest}/><div style={{display:"flex",gap:6,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>{sampleHeroes.flatMap(h=>h.quests).filter(q=>q.name).map((q,i)=>(<button key={i} onClick={()=>setDetailQuest(q)} className="hero-banner-name" style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",background:"#b91c1c",color:"#fff",fontSize:"0.75em",border:detailQuest.name===q.name?"3px solid #d4af37":"2px solid rgba(0,0,0,0.3)",boxShadow:detailQuest.name===q.name?"0 0 12px rgba(212,175,55,0.5)":"0 2px 6px rgba(0,0,0,0.4)"}}>📜 {q.name}</button>))}</div></>)}
          </div>
        </div>
      </>)}

      {/* ════════ END OF TURN SECTION ════════ */}
      {section === "eot" && (<>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 6 }}>
            {[["daytime","☀️ Step 1"],["evening","🌅 Step 2"],["handlimit","✋ Hand Limit"],["night","🌙 Step 3"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setStep(k);if(k==="night")setNightMode("allquiet");}} style={{padding:"7px 14px",borderRadius:6,cursor:"pointer",fontWeight:"bold",fontSize:"0.8em",background:step===k?"#d4af37":"rgba(212,175,55,0.2)",color:step===k?"#1a0f0a":"#d4af37",border:"2px solid #d4af37",fontFamily:"'Comic Sans MS', 'Comic Sans', cursive"}}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 6 }}>
            {eotHeroes.map((h,i)=>(<button key={i} onClick={()=>setEotHeroIdx(i)} className="hero-banner-name" style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:h.color,fontSize:"0.72em",border:eotHeroIdx===i?"3px solid #d4af37":"2px solid rgba(0,0,0,0.3)",boxShadow:eotHeroIdx===i?"0 0 12px rgba(212,175,55,0.5)":"0 2px 6px rgba(0,0,0,0.4)"}}>{h.symbol} {h.name}</button>))}
          </div>
          {step==="daytime"&&<div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>{Object.entries(damageScenarios).map(([k,v])=>(<button key={k} onClick={()=>setDamageKey(k)} style={{padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:"0.7em",background:damageKey===k?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)",color:damageKey===k?"#d4af37":"#888",border:damageKey===k?"1px solid #d4af37":"1px solid #444"}}>{v.label}</button>))}<button onClick={()=>setShowHealing(p=>!p)} style={{padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:"0.7em",background:showHealing?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)",color:showHealing?"#d4af37":"#888",border:showHealing?"1px solid #d4af37":"1px solid #444"}}>🖤 Healing</button></div>}
          {step==="evening"&&<div style={{display:"flex",gap:6,justifyContent:"center"}}>{[["thievery","🗡️ Thievery"],["quest","📜 Quest"]].map(([k,l])=>(<button key={k} onClick={()=>setBonusToggles(p=>({...p,[k]:!p[k]}))} style={{padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:"0.7em",background:bonusToggles[k]?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)",color:bonusToggles[k]?"#d4af37":"#888",border:bonusToggles[k]?"1px solid #d4af37":"1px solid #444"}}>{l}</button>))}</div>}
          {step==="night"&&<div>
            <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginBottom:4}}>{[["allquiet","🌅 All Quiet"],["draw","🃏 Draw"],["resolved","📜 Results"]].map(([k,l])=>(<button key={k} onClick={()=>setNightMode(k)} style={{padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:"0.7em",background:nightMode===k?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.05)",color:nightMode===k?"#a78bfa":"#888",border:nightMode===k?"1px solid #a78bfa":"1px solid #444"}}>{l}</button>))}</div>
            {nightMode==="draw"&&<div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>{Object.entries(sampleDarknessCards).map(([k,v])=>(<button key={k} onClick={()=>setDarknessCardKey(k)} style={{padding:"3px 6px",borderRadius:4,cursor:"pointer",fontSize:"0.65em",background:darknessCardKey===k?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)",color:darknessCardKey===k?"#d4af37":"#888",border:darknessCardKey===k?"1px solid #d4af37":"1px solid #444"}}>{v.label}</button>))}<button onClick={()=>setNightGeneralOnly(!nightGeneralOnly)} style={{padding:"3px 6px",borderRadius:4,cursor:"pointer",fontSize:"0.65em",background:nightGeneralOnly?"rgba(251,191,36,0.3)":"rgba(255,255,255,0.05)",color:nightGeneralOnly?"#fbbf24":"#888",border:nightGeneralOnly?"1px solid #fbbf24":"1px solid #444"}}>Gen.Only</button></div>}
            {nightMode==="resolved"&&<div style={{display:"flex",gap:4,justifyContent:"center"}}>{[["normal","Normal"],["withOverrun","Overrun"],["blocked","Blocked"]].map(([k,l])=>(<button key={k} onClick={()=>setNightResolveKey(k)} style={{padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:"0.7em",background:nightResolveKey===k?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)",color:nightResolveKey===k?"#d4af37":"#888",border:nightResolveKey===k?"1px solid #d4af37":"1px solid #444"}}>{l}</button>))}</div>}
          </div>}
        </div>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "2px solid #d4af37", borderRadius: 12, padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", animation: "pulseGlow 3s ease-in-out infinite" }}>
            {step==="daytime"&&<DaytimeModal hero={eotHero} damageInfo={damageScenarios[damageKey]} healingResults={showHealing ? healingResults : []} onContinue={()=>setStep("evening")}/>}
            {step==="evening"&&<EveningModal hero={eotHero} drawnCards={sampleDrawnCards} thieveryBonus={bonusToggles.thievery} questBonus={bonusToggles.quest} onContinue={()=>{if(eotHero.cards.length>10)setStep("handlimit");else{setStep("night");setNightMode("draw");}}}/>}
            {step==="handlimit"&&<HandLimitModal hero={handLimitRogue} onConfirm={()=>{setStep("night");setNightMode("draw");}}/>}
            {step==="night"&&nightMode==="allquiet"&&<div><StepIndicator currentStep={3}/><div className="modal-heading" style={{textAlign:"center",color:"#d4af37",fontSize:"1.15em",marginBottom:12}}>Step 3 — 🌙 Night</div><ParchmentBox><div style={{background:"linear-gradient(135deg, #5c3d2ecc 0%, #4a2f20cc 100%)",padding:"6px 14px",marginBottom:10,marginLeft:-10,marginRight:-10,marginTop:-10,borderRadius:"8px 8px 0 0",borderBottom:"2px solid #8b7355",textAlign:"center"}}><span className="hero-banner-name" style={{fontSize:"0.9em",letterSpacing:"1px"}}>Darkness Spreads</span></div><div style={{padding:15,textAlign:"center"}}><div style={{fontSize:"1.2em",color:"#6d28a8",fontWeight:"bold",fontFamily:"'Cinzel', Georgia, serif"}}>🌅 All Is Quiet</div><div style={{color:"#3d2b1f",marginTop:8,fontSize:"0.75em",fontFamily:"'Comic Sans MS', 'Comic Sans', cursive"}}>No Darkness Spreads cards drawn this turn.</div></div><div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(139,115,85,0.3)"}}><div className="hero-section-label" style={{color:"#2c1810",fontSize:"0.85em",marginBottom:6}}>Special Card Played</div><div style={{background:"linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)",border:"3px solid #6d28a8",borderRadius:10,overflow:"hidden",boxShadow:"0 0 10px rgba(109,40,168,0.5), inset 0 0 0 1px rgba(139,115,85,0.3)"}}><div style={{background:"linear-gradient(135deg, #6d28a8cc 0%, #6d28a899 100%)",padding:"8px 14px",borderBottom:"2px solid #8b7355",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div className="hero-banner-name">🌟 All Is Quiet</div></div><div style={{padding:"12px 16px"}}><div className="hi-title" style={{fontSize:"0.75em",lineHeight:1.5,marginBottom:10}}><span style={{fontFamily:"'Cinzel', Georgia, serif",fontWeight:900,color:"#6d28a8"}}>Special:</span> <span style={{color:"#3d2b1f",fontFamily:"'Comic Sans MS', 'Comic Sans', cursive"}}>Do not draw any Darkness Spreads cards this turn</span></div><div style={{textAlign:"center",marginBottom:8}}><GeneralToken color="green" /><div style={{fontFamily:"'Cinzel', Georgia, serif",fontWeight:900,fontSize:"0.8em",color:"#16a34a",marginTop:4}}>{colorToGeneral.green.name}</div></div><div style={{textAlign:"center"}}>{Array.from({length:2}).map((_,i)=>(<span key={i} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:36,background:"#16a34a",borderRadius:6,margin:3,fontSize:"1.2em",border:"2px solid #8b7355"}}>🎲</span>))}</div></div></div></div></ParchmentBox><PhaseButton label="Continue" onClick={()=>setStep("daytime")}/></div>}
            {step==="night"&&nightMode==="draw"&&<DarknessDrawModal card={sampleDarknessCards[darknessCardKey]} cardNum={nightCardNum} totalCards={2} generalOnly={nightGeneralOnly} heroIsWizard={heroIsWizard} onResolve={()=>setNightMode("resolved")} onWisdom={()=>alert("🔮 Wisdom: Card discarded!")}/>}
            {step==="night"&&nightMode==="resolved"&&<DarknessResolvedModal events={sampleResolvedEvents[nightResolveKey]} cardNum={nightCardNum} totalCards={2} generalOnly={nightGeneralOnly} onNext={()=>{if(nightCardNum<2){setNightCardNum(n=>n+1);setNightMode("draw");}else{setNightCardNum(1);setStep("daytime");}}}/>}
          </div>
        </div>
      </>)}
    </div>
  );
}
