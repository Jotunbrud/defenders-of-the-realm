import { useState } from "react";

const sampleHeroes = [
  { name: "Cleric", symbol: "✝️", maxHealth: 6, color: "#1e3a7a",
    ability: `<strong>Blessed Attacks:</strong> Add +1 to each die roll in attacks against Undead and Demon minions.<br><span style="color: #8b0000;">May not be used in combat with a General.</span><br><br><strong>Turn Undead:</strong> If ending a turn in a location with Undead, move all Undead minions to any adjacent location(s).<br><br><strong>Sanctify Land:</strong> May spend an action in a location with no enemy minions present that is Tainted to heal the land (no cards required). On a roll of 5+ remove the Tainted Crystal.` },
  { name: "Dwarf", symbol: "⛏️", maxHealth: 5, color: "#b45309",
    ability: `<strong>Mountain Lore:</strong> When starting a turn in a Red location, gain 1 action for that turn.<br><br><strong>Dragon Slayer:</strong> May re-roll any failed dice in combat against Dragonkin.<br><span style="color: #8b0000;">May be used in combat with Sapphire.</span><br><br><strong>Armor and Toughness:</strong> Ignore 1 wound from minions and Generals.` },
  { name: "Eagle Rider", symbol: "🦅", maxHealth: 4, color: "#6b7b8d",
    ability: `<strong>Eagle Flight:</strong> Spend an action to travel 4 spaces without discarding an eagle travel card<br><br><strong>Fresh Mount:</strong> If ending a turn on the ground in Monarch City or any Blue location, gain one action next turn<br><br><strong>Attacks:</strong> <span style="color: #8b0000;">At the beginning of turn, must choose 1 attack style.</span><br>• <strong>Sky Attack:</strong> No end-of-turn penalties<br>• <strong>Ground Attack:</strong> Re-roll all dice once per combat` },
  { name: "Paladin", symbol: "🛡️", maxHealth: 5, color: "#6d28a8",
    ability: `<strong>Noble Steed:</strong> May spend an action to travel on horseback (2 spaces) without discarding a horse travel card<br><br><strong>Bravery:</strong> If ending a turn in a location with Undead minions, do not suffer any penalties from fear<br><br><strong>Aura of Righteousness:</strong> Ignore 1 wound from minions and Generals` },
  { name: "Ranger", symbol: "🏹", maxHealth: 5, color: "#15803d",
    ability: `<strong>Woods Lore:</strong> Add +1 to all attack rolls when in a Green location.<br><span style="color: #8b0000;">May be used against Generals.</span><br><br><strong>Archery:</strong> May attack enemy minions 1 space away as if they were in the same location.<br><span style="color: #8b0000;">May not be combined with Woods Lore. May not be used against Generals.</span><br><br><strong>Elf Support:</strong> When starting a turn in a Green location, gain 1 Action for that turn.` },
  { name: "Rogue", symbol: "🗡️", maxHealth: 6, color: "#b91c1c",
    ability: `<strong>Hide In The Shadows:</strong> Does not suffer life token loss when in a location with enemy minions at the end of a turn.<br><span style="color: #8b0000;">Still subject to General and Fear penalties.</span><br><br><strong>Thievery:</strong> When ending turn in a location with a treasure chest, draw 1 extra Hero Card.<br><br><strong>Crafty:</strong> As a Rumor At The Inn Action — call a color and draw 5 cards. Keep all that match the color called as well as all Special cards.` },
  { name: "Sorceress", symbol: "🧙‍♀️", maxHealth: 6, color: "#a68a0d",
    ability: `<strong>Shape Shifter:</strong> At the start of the turn, place a minion of the shape you wish to take. Do not lose life tokens when ending turn on a location with enemy minions of the same shape.<br><span style="color: #8b0000;">May not enter Monarch City or any Inn when in enemy form.</span><br><br><strong>Ambush:</strong> If in the same shape as an enemy minion, add +2 to each die rolled against them on the first attack made.<br><br><strong>Visions:</strong> Gain 1 extra die for any Quest rolls and for any Healing of Tainted Lands.` },
  { name: "Wizard", symbol: "🧙‍♂️", maxHealth: 5, color: "#c2410c",
    ability: `<strong>Teleport:</strong> May spend an action to move to 1 location each turn as if traveling by Magic Gate<br><br><strong>Fireball:</strong> Discard a card matching any minion color present to attack ALL minions at the location. A roll of 2+ incinerates each minion.<br><br><strong>Wisdom:</strong> When drawing a Darkness Spreads card, it may be discarded and another one drawn` },
];

function BoardGameCard({ hero, isActive }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%)",
      border: isActive ? "3px solid #d4af37" : "3px solid #8b7355",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: isActive
        ? "0 0 16px rgba(212,175,55,0.5), inset 0 0 0 1px rgba(139,115,85,0.3)"
        : "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(139,115,85,0.3)",
      cursor: "pointer",
      transition: "all 0.3s",
      marginBottom: 10,
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${hero.color}cc 0%, ${hero.color}99 100%)`,
        padding: "6px 14px",
        borderBottom: "2px solid #8b7355",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontSize: "1.05em", fontWeight: "bold", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", letterSpacing: "0.5px" }}>
          {hero.symbol} {hero.name}
        </div>
        <div style={{ fontSize: "0.85em", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", fontWeight: "bold" }}>
          ❤️ {hero.maxHealth}
        </div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: "0.85em", color: "#3d2b1f", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: hero.ability }} />
      </div>
    </div>
  );
}

export default function HeroCardMockups() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a0f0a 0%, #2c1810 100%)",
      minHeight: "100vh",
      padding: "20px 12px",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#e8dcc8",
    }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "1.2em", fontWeight: "bold", color: "#d4af37", marginBottom: 4 }}>Official Hero Colors</div>
        <div style={{ fontSize: "0.8em", color: "#8b7355" }}>Matching Dwarf/Ranger shade intensity</div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        {sampleHeroes.map((h, i) => (
          <div key={i}>
            <div style={{ fontSize: "0.7em", color: "#8b7355", marginBottom: 2, marginLeft: 4 }}>
              {h.name}: {h.color}
            </div>
            <BoardGameCard hero={h} isActive={i === 0} />
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 500, margin: "20px auto 0", padding: 16, background: "rgba(139,115,85,0.15)", border: "1px solid #8b7355", borderRadius: 8 }}>
        <div style={{ fontWeight: "bold", color: "#d4af37", marginBottom: 8 }}>Color Reference</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: "0.85em" }}>
          {sampleHeroes.map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: h.color, border: "1px solid rgba(255,255,255,0.2)" }} />
              <span>{h.name}: {h.color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}