// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - General Definitions
// The 4 enemy generals with stats, factions, and combat skills
// Red = Demons (Balazarg), Green = Orcs (Gorgutt), 
// Black = Undead (Varkolak), Blue = Dragons (Sapphire)
// ═══════════════════════════════════════════════════════════════

const GENERALS_DATA = [
    { name: 'Balazarg', color: 'red', symbol: '👹', health: 6, maxHealth: 6, location: 'Scorpion Canyon', defeated: false, faction: 'Demon', heroDefeatedPenalty: { woundsType: 'd3', cardsLost: 'all' }, combatSkill: 'demonic_curse' },
    { name: 'Gorgutt', color: 'green', symbol: '👺', health: 6, maxHealth: 6, location: 'Thorny Woods', defeated: false, faction: 'Orc', heroDefeatedPenalty: { wounds: 2, cardsLost: 2 }, combatSkill: 'parry' },
    { name: 'Varkolak', color: 'black', symbol: '💀', health: 5, maxHealth: 5, location: 'Dark Woods', defeated: false, faction: 'Undead', heroDefeatedPenalty: { woundsType: 'd6', cardsLostType: 'd6' }, combatSkill: 'no_rerolls' },
    { name: 'Sapphire', color: 'blue', symbol: '🐉', health: 4, maxHealth: 4, location: 'Blizzard Mountains', defeated: false, faction: 'Dragon', heroDefeatedPenalty: { wounds: 3, cardsLostType: 'd6' }, combatSkill: 'regeneration' }
];
