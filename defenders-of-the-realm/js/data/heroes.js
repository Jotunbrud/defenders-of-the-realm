// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Hero Definitions
// All 8 hero classes with stats and abilities
// ═══════════════════════════════════════════════════════════════

const HEROES_DATA = [
    {
        name: 'Paladin',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#6d28a8',
        symbol: '🛡️',
        ability: '<strong>Noble Steed:</strong> May spend an action to travel on horseback (2 spaces) without discarding a horse travel card<br><br><strong>Bravery:</strong> If ending a turn in a location with Undead minions, do not suffer any penalties from fear<br><br><strong>Aura of Righteousness:</strong> Ignore 1 wound from minions and Generals',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Cleric',
        health: 6,
        maxHealth: 6,
        location: 'Monarch City',
        color: '#1e3a7a',
        symbol: '✝️',
        ability: '<strong>Blessed Attacks:</strong> Add +1 to each die roll in attacks against Undead and Demon minions.<br><span style="color: #ef4444;">May not be used in combat with a General.</span><br><br><strong>Turn Undead:</strong> If ending a turn in a location with Undead, move all Undead minions to any adjacent location(s).<br><br><strong>Sanctify Land:</strong> May spend an action in a location with no enemy minions present that is Tainted to heal the land (no cards required). On a roll of 5+ remove the Tainted Crystal.',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Wizard',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#c2410c',
        symbol: '🧙‍♂️',
        ability: '<strong>Teleport:</strong> May spend an action to move to 1 location each turn as if traveling by Magic Gate (no card required)<br><br><strong>Fireball:</strong> Discard a card matching any minion color present to attack ALL minions at the location. A roll of 2+ incinerates each minion, regardless of type.<br><br><strong>Wisdom:</strong> When drawing a Darkness Spreads card, it may be discarded and another one drawn, but the new card must be used.<br><span style="color: #ef4444;">Note: In the Middle and Late War this skill may be used for each Darkness Spreads card drawn.</span>',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Sorceress',
        health: 6,
        maxHealth: 6,
        location: 'Monarch City',
        color: '#fbbf24',
        symbol: '🧙‍♀️',
        ability: '<strong>Shape Shifter:</strong> At the start of the turn, place a minion of the shape you wish to take. Do not lose life tokens when ending turn on a location with enemy minions of the same shape.<br><span style="color: #ef4444;">May not enter Monarch City or any Inn when in enemy form.</span><br><br><strong>Ambush:</strong> If in the same shape as an enemy minion, add +2 to each die rolled against them on the first attack made.<br><span style="color: #ef4444;">May be used against Generals but only add +1.</span><br><br><strong>Visions:</strong> Gain 1 extra die for any Quest rolls and for any Healing of Tainted Lands.',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Druid',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#22c55e',
        symbol: '🌿',
        ability: '<strong>Cleanse Corruption:</strong> Remove taint crystals without discarding cards',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Eagle Rider',
        health: 4,
        maxHealth: 4,
        location: 'Monarch City',
        color: '#6b7b8d',
        symbol: '🦅',
        ability: '<strong>Eagle Flight:</strong> Spend an action to travel 4 spaces without discarding an eagle travel card<br><br><strong>Fresh Mount:</strong> If ending a turn on the ground in Monarch City or any Blue location, gain one action next turn.<br><br><strong>Attacks:</strong> <span style="color: #ef4444;">At the beginning of turn, must choose 1 attack style and may not change it during the turn.</span><br>• <strong>Sky Attack:</strong> May end turn in the same location with enemy minions or Generals but suffers no penalties (fear, damage, or loss of cards).<br>• <strong>Ground Attack:</strong> May re-roll all dice one time each combat against minions and Generals (except Undead General). But rider is considered to be on the ground at the end of the turn and is subject to penalties.',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Dwarf',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#b45309',
        symbol: '⛏️',
        ability: '<strong>Mountain Lore:</strong> When starting a turn in a Red location, gain 1 action for that turn.<br><br><strong>Dragon Slayer:</strong> May re-roll any failed dice in combat against Dragonkin.<br><span style="color: #ef4444;">May be used in combat with Sapphire.</span><br><br><strong>Armor and Toughness:</strong> Ignore 1 wound from minions and Generals.',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Ranger',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#15803d',
        symbol: '🏹',
        ability: '<strong>Woods Lore:</strong> Add +1 to all attack rolls when in a Green location.<br><span style="color: #ef4444;">May be used against Generals.</span><br><br><strong>Archery:</strong> May attack enemy minions 1 space away as if they were in the same location.<br><span style="color: #ef4444;">May not be combined with Woods Lore.</span><br><span style="color: #ef4444;">May not be used against Generals.</span><br><br><strong>Elf Support:</strong> When starting a turn in a Green location, gain 1 Action for that turn.',
        cards: [],
        taint: 0,
        questCards: []
    },
    {
        name: 'Rogue',
        health: 6,
        maxHealth: 6,
        location: 'Monarch City',
        color: '#b91c1c',
        symbol: '🗡️',
        ability: '<strong>Hide In The Shadows:</strong> Does not suffer life token loss when in a location with enemy minions at the end of a turn.<br><span style="color: #ef4444;">Still subject to General and Fear penalties.</span><br><br><strong>Thievery:</strong> When ending turn in a location with a treasure chest, draw 1 extra Hero Card.<br><br><strong>Crafty:</strong> As a Rumor At The Inn Action — call a color and draw 5 cards. Keep all that match the color called as well as all Special cards.<br><span style="color: #ef4444;">Limited to 2 Inn Actions Per Turn.</span>',
        cards: [],
        taint: 0,
        questCards: []
    }
];

// ═══════════════════════════════════════════════════════════════
// HERO EXPANSION — Additional heroes unlocked via setup screen
// ═══════════════════════════════════════════════════════════════

const EXPANSION_HEROES_DATA = [
    {
        name: 'Barbarian',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#7f1d1d',
        symbol: '🪓',
        ability: '<strong>Battle Rage:</strong> May spend action points prior to attack roll to modify the dice. Add +1 to the die rolled for each action point spent.<br><span style="color: #ef4444;">May not be used when attacking a General.</span><br><br><strong>Famed Warrior:</strong> If two or more enemies are defeated with the first attack in a location, remove 1 enemy minion from each adjacent location as they flee.<br><span style="color: #ef4444;">Enemies at a location with a General do not flee.</span><br><br><strong>Local Support:</strong> If ending turn at an Inn or Black location, draw 3 Hero Cards, choose 2 and discard 1.',
        cards: [],
        taint: 0,
        questCards: [],
        expansion: 'hero_expansion'
    },
    {
        name: 'Errant Paladin',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#8b5cf6',
        symbol: '⚜️',
        ability: '<strong>Noble Steed:</strong> May spend an action to travel on horseback (2 spaces) without discarding a horse travel card<br><br><strong>Bravery:</strong> If ending a turn in a location with Undead minions, do not suffer any penalties from fear<br><br><strong>Aura of Righteousness:</strong> Ignore 1 wound from minions and Generals<br><br><strong>Broadsword of Might:</strong> Rolling doubles of any number when attacking 2 or more minions defeats all minions at a location.',
        cards: [],
        taint: 0,
        questCards: [],
        expansion: 'hero_expansion'
    },
    {
        name: 'Noble Dwarf',
        health: 5,
        maxHealth: 5,
        location: 'Monarch City',
        color: '#92400e',
        symbol: '⚒️',
        ability: '<strong>Mountain Lore:</strong> When starting a turn in a Red location, gain 1 action for that turn.<br><br><strong>Dragon Slayer:</strong> May re-roll any failed dice in combat against Dragonkin.<br><span style="color: #ef4444;">May be used in combat with Sapphire.</span><br><br><strong>Armor and Toughness:</strong> Ignore 1 wound from minions and Generals.<br><br><strong>Dwarven Rum:</strong> When ending your turn at the same location as another Hero, you and the other Heroes present <strong>MAY</strong> draw 1 Hero Card. If the card drawn matches the color of your Location, the drawing Hero loses 1 Action on their next turn.',
        cards: [],
        taint: 0,
        questCards: [],
        expansion: 'hero_expansion'
    },
];
