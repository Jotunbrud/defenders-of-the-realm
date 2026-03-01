// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Quest Card Definitions
// 21 quest cards with types, requirements, and rewards
// ═══════════════════════════════════════════════════════════════

function createQuestDeck() {
    const questDeck = [];
    let questId = 1;
    // ── MAGIC ITEM QUESTS (4 cards) ──
    
    // 1. Amulet of the Gods
    questDeck.push({
        id: questId++,
        name: 'Amulet of the Gods',
        description: 'Seek the amulet buried deep inside the Dark Woods. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.',
        difficulty: 'Medium',
        reward: 'The power of the amulet adds +1 to all dice in combat, including Generals.',
        effect: 'passive',
        completed: false,
        location: 'Dark Woods',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 4,
            successOn: 6,
            successCount: 1,
            failDiscard: true,
            rewardType: 'quest_magic_item',
            rewardValue: 'Add +1 to all dice in combat against minions and Generals',
            magicItem: true
        }
    });
    
    // 2. Boots of Speed
    questDeck.push({
        id: questId++,
        name: 'Boots of Speed',
        description: 'Seek the enchanted boots hidden in the Mountains of Mist. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.',
        difficulty: 'Medium',
        reward: 'Gain +2 actions per turn.',
        effect: 'passive',
        completed: false,
        location: 'Mountains of Mist',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 4,
            successOn: 6,
            successCount: 1,
            failDiscard: true,
            rewardType: 'bonus_actions',
            rewardValue: 2,
            magicItem: true
        }
    });
    
    // 3. Helm of Power
    questDeck.push({
        id: questId++,
        name: 'Helm of Power',
        description: 'Seek the legendary helm within the Ancient Ruins. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.',
        difficulty: 'Medium',
        reward: 'Draw +1 extra Hero Card each turn.',
        effect: 'passive',
        completed: false,
        location: 'Ancient Ruins',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 4,
            successOn: 6,
            successCount: 1,
            failDiscard: true,
            rewardType: 'bonus_hero_card',
            rewardValue: 1,
            magicItem: true
        }
    });
    
    // 4. War Banner of Valor
    questDeck.push({
        id: questId++,
        name: 'War Banner of Valor',
        description: 'Seek the War Banner along the banks of the Fire River. Spend 1 action and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.',
        difficulty: 'Medium',
        reward: 'Ignore the wounds and other effects of losing a battle to a general.',
        effect: 'passive',
        completed: false,
        location: 'Fire River',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 3,
            successOn: 5,
            successCount: 1,
            failDiscard: false,
            rewardType: 'ignore_hero_defeated',
            rewardValue: 'The hero ignores the Hero Defeated penalties against Generals',
            magicItem: true
        }
    });
    
    // ── IMPLEMENTED QUESTS ──
    
    // Find Magic Gate — Build a Magic Gate at any Red location
    questDeck.push({
        id: questId++,
        name: 'Find Magic Gate',
        description: 'Build a Magic Gate on any Red Location. Spend 1 action and a matching location card to build the gate (standard gate rules apply).',
        difficulty: 'Easy',
        reward: 'Discard this Quest Card to add 2 dice to any combat roll, including a battle against a General.',
        effect: 'active',
        completed: false,
        location: null, // Special: any red location
        mechanic: {
            type: 'build_gate_red',
            actionCost: 1,
            failDiscard: false,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'combat_bonus_dice',
            combatBonusDice: 2,
            requirePresence: false
        }
    });
    
    // Unicorn Steed — Travel to Unicorn Forest
    questDeck.push({
        id: questId++,
        name: 'Unicorn Steed',
        description: 'Travel to the Unicorn Forest and entice a unicorn to become your steed. Spend 1 action per die roll. A roll of 5 or 6 on any of the dice succeeds.',
        difficulty: 'Medium',
        reward: 'You may move as if you always have a Horse. Additionally, the Unicorn Steed grants 1 re-roll of all failed dice each combat.',
        effect: 'passive',
        completed: false,
        location: 'Unicorn Forest',
        mechanic: {
            type: 'variable_dice_roll',
            actionCost: 1,
            successOn: 5,
            successCount: 1,
            failDiscard: false,
            rewardType: 'unicorn_steed',
            rewardValue: 'horse_movement_and_reroll'
        }
    });
    
    // Rumors (Quest) — Visit 3 Inns
    questDeck.push({
        id: questId++,
        name: 'Rumors',
        description: 'Travel to 3 Inns to gather intelligence. Visit Eagle Nest Inn (Blue), Chimera Inn (Black), and Gryphon Inn (Red). No action required — just pass through or end on each location.',
        difficulty: 'Medium',
        reward: 'Draw 4 Hero Cards when Quest is completed.',
        effect: 'active',
        completed: false,
        location: null, // Special: multiple locations
        mechanic: {
            type: 'multi_location_visit',
            actionCost: 0,
            failDiscard: false,
            rewardType: 'draw_hero_cards',
            rewardValue: 4,
            locations: {
                'Eagle Nest Inn': { color: 'blue', visited: false },
                'Chimera Inn': { color: 'black', visited: false },
                'Gryphon Inn': { color: 'red', visited: false }
            }
        }
    });
    
    // Organize Militia — Visit 3 locations and spend 1 action at each
    questDeck.push({
        id: questId++,
        name: 'Organize Militia',
        description: 'Travel to the following locations and spend 1 action at each location organizing the locals: Pleasant Hill (Red), McCorm Highlands (Black), Greenleaf Village (Green).',
        difficulty: 'Medium',
        reward: 'Discard to prevent a general from moving during Darkness Spreads.',
        effect: 'active',
        completed: false,
        location: null, // Special: multiple locations
        mechanic: {
            type: 'multi_location_action',
            actionCost: 1,
            failDiscard: false,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'block_general_advance',
            locations: {
                'Pleasant Hill': { color: 'red', organized: false },
                'McCorm Highlands': { color: 'black', organized: false },
                'Greenleaf Village': { color: 'green', organized: false }
            }
        }
    });
    
    // ── AMAZON ENVOY QUEST (1 card) ──
    // Travel to Land of Amazons, spend 1 action, roll 3 dice (5+ succeeds).
    // On success: roll 1d6, then select that many minions to defeat from locations within 2 spaces.
    questDeck.push({
        id: questId++,
        name: 'Amazon Envoy',
        description: 'Convince the Amazons to send warriors. Spend 1 action in the Land of Amazons and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.',
        difficulty: 'Hard',
        reward: 'Defeat D6 minions within 2 spaces of the Land of Amazons.',
        effect: 'active',
        completed: false,
        location: 'Land of Amazons',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 3,
            successOn: 5,
            successCount: 1,
            failDiscard: true,
            rewardType: 'amazon_envoy_sweep',
            rewardValue: 'Land of Amazons'
        }
    });
    
    // King of the Gryphons
    questDeck.push({
        id: questId++,
        name: 'King of the Gryphons',
        description: "Travel to Gryphon Forest to request assistance from the Gryphon King. Spend 1 action and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.",
        difficulty: 'Medium',
        reward: 'Discard this Quest Card at any time to move up to 2 Heroes to any 2 locations. This move does not count as an action.',
        effect: 'active',
        completed: false,
        location: 'Gryphon Forest',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 3,
            successOn: 5,
            successCount: 1,
            failDiscard: true,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'gryphon_move_heroes'
        }
    });
    
    // Duke Envoy
    questDeck.push({
        id: questId++,
        name: 'Duke Envoy',
        description: 'Convince the Duke to send warriors. Spend 1 action in McCorm Highlands and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.',
        difficulty: 'Hard',
        reward: 'Defeat D6 minions within 2 spaces of McCorm Highlands.',
        effect: 'active',
        completed: false,
        location: 'McCorm Highlands',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 3,
            successOn: 5,
            successCount: 1,
            failDiscard: true,
            rewardType: 'amazon_envoy_sweep',
            rewardValue: 'McCorm Highlands'
        }
    });
    
    // Elf Envoy
    questDeck.push({
        id: questId++,
        name: 'Elf Envoy',
        description: "Convince the Elves to send warriors. Spend 1 action in Heaven's Glade and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.",
        difficulty: 'Hard',
        reward: "Defeat D6 minions within 2 spaces of Heaven's Glade.",
        effect: 'active',
        completed: false,
        location: "Heaven's Glade",
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 3,
            successOn: 5,
            successCount: 1,
            failDiscard: true,
            rewardType: 'amazon_envoy_sweep',
            rewardValue: "Heaven's Glade"
        }
    });
    
    // ── DEFEAT FACTION MINIONS QUEST ──
    
    // Orc Hunter — Defeat 6 Green (Orc) minions in combat
    questDeck.push({
        id: questId++,
        name: 'Orc Hunter',
        description: 'Defeat 6 Orcs. As you fulfill this quest, place each Orc you defeat onto this card for reference.',
        difficulty: 'Medium',
        reward: 'Discard this Quest Card to avoid placing troops in 1 Green Location noted on a Darkness Spreads Card.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'defeat_faction_minions',
            faction: 'green',
            requiredKills: 6,
            currentKills: 0,
            actionCost: 0,
            failDiscard: false,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'block_minion_placement_green'
        }
    });
    
    // Demon Hunter — Defeat 4 Red (Demon) minions in combat
    questDeck.push({
        id: questId++,
        name: 'Demon Hunter',
        description: 'Defeat 4 Demons. As you fulfill this quest, place each Demon you defeat onto this card for reference.',
        difficulty: 'Medium',
        reward: 'Discard this Quest Card to avoid placing troops in 1 Red Location noted on a Darkness Spreads Card.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'defeat_faction_minions',
            faction: 'red',
            requiredKills: 4,
            currentKills: 0,
            actionCost: 0,
            failDiscard: false,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'block_minion_placement_red'
        }
    });
    
    // Dragon Hunter — Defeat 3 Blue (Dragonkin) minions in combat
    questDeck.push({
        id: questId++,
        name: 'Dragon Hunter',
        description: 'Defeat 3 Dragonkin. As you fulfill this quest, place each Dragonkin you defeat onto this card for reference.',
        difficulty: 'Medium',
        reward: 'Discard this Quest Card to avoid placing troops in 1 Blue Location noted on a Darkness Spreads Card.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'defeat_faction_minions',
            faction: 'blue',
            requiredKills: 3,
            currentKills: 0,
            actionCost: 0,
            failDiscard: false,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'block_minion_placement_blue'
        }
    });
    
    // Undead Hunter — Defeat 4 Black (Undead) minions in combat
    questDeck.push({
        id: questId++,
        name: 'Undead Hunter',
        description: 'Defeat 4 Undead. As you fulfill this quest, place each Undead you defeat onto this card for reference.',
        difficulty: 'Medium',
        reward: 'Discard this Quest Card to avoid placing troops in 1 Black Location noted on a Darkness Spreads Card.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'defeat_faction_minions',
            faction: 'black',
            requiredKills: 4,
            currentKills: 0,
            actionCost: 0,
            failDiscard: false,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'block_minion_placement_black'
        }
    });
    
    // ── SCOUT THE GENERAL QUESTS (4 cards) ──
    // Travel to the named general's current location and spend 1 action scouting.
    // Reward: Search the Hero Card deck for the first card matching the general's faction color,
    // add it to your hand, then reshuffle the Hero Card deck.
    
    // Scout Balazarg (Red / Demons)
    questDeck.push({
        id: questId++,
        name: 'Scout the General (Balazarg)',
        description: 'Travel to Balazarg\'s location and spend 1 action scouting.',
        difficulty: 'Medium',
        reward: 'Look through the Hero Card deck and take the first Red Card and add it to your hand. Then reshuffle the Hero Cards.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'scout_general',
            generalName: 'Balazarg',
            faction: 'red',
            actionCost: 1,
            failDiscard: false,
            rewardType: 'scout_draw_card',
            rewardValue: 'red'
        }
    });
    
    // Scout Gorgutt (Green / Orcs)
    questDeck.push({
        id: questId++,
        name: 'Scout the General (Gorgutt)',
        description: 'Travel to Gorgutt\'s location and spend 1 action scouting.',
        difficulty: 'Medium',
        reward: 'Look through the Hero Card deck and take the first Green Card and add it to your hand. Then reshuffle the Hero Cards.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'scout_general',
            generalName: 'Gorgutt',
            faction: 'green',
            actionCost: 1,
            failDiscard: false,
            rewardType: 'scout_draw_card',
            rewardValue: 'green'
        }
    });
    
    // Scout Sapphire (Blue / Dragonkin)
    questDeck.push({
        id: questId++,
        name: 'Scout the General (Sapphire)',
        description: 'Travel to Sapphire\'s location and spend 1 action scouting.',
        difficulty: 'Medium',
        reward: 'Look through the Hero Card deck and take the first Blue Card and add it to your hand. Then reshuffle the Hero Cards.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'scout_general',
            generalName: 'Sapphire',
            faction: 'blue',
            actionCost: 1,
            failDiscard: false,
            rewardType: 'scout_draw_card',
            rewardValue: 'blue'
        }
    });
    
    // Scout Varkolak (Black / Undead)
    questDeck.push({
        id: questId++,
        name: 'Scout the General (Varkolak)',
        description: 'Travel to Varkolak\'s location and spend 1 action scouting.',
        difficulty: 'Medium',
        reward: 'Look through the Hero Card deck and take the first Black Card and add it to your hand. Then reshuffle the Hero Cards.',
        effect: 'active',
        completed: false,
        location: null,
        mechanic: {
            type: 'scout_general',
            generalName: 'Varkolak',
            faction: 'black',
            actionCost: 1,
            failDiscard: false,
            rewardType: 'scout_draw_card',
            rewardValue: 'black'
        }
    });
    
    // ── USE-ANYTIME QUEST CARDS (2 cards) ──
    // These stay on the hero after completion and are discarded when used.
    
    // 5. Crystal of Light — must be at tainted location to use
    questDeck.push({
        id: questId++,
        name: 'Crystal of Light',
        description: 'Seek the Crystal of Light in the Enchanted Glade. Spend 1 action and roll 3 dice. A roll of 5 or 6 on any of the dice succeeds.',
        difficulty: 'Medium',
        reward: 'Remove 1 Tainted Crystal from your current location. Must be present on the tainted space to use.',
        effect: 'active',
        completed: false,
        location: 'Enchanted Glade',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 3,
            successOn: 5,
            successCount: 1,
            failDiscard: true,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'remove_taint',
            requirePresence: true
        }
    });
    
    // 6. Ancient Tree of Magic — can target any tainted location on the map
    questDeck.push({
        id: questId++,
        name: 'Ancient Tree of Magic',
        description: 'Seek the Ancient Tree of Magic in the Greenleaf Village. Spend 1 action and roll 4 dice. A roll of 6 on any of the dice succeeds.',
        difficulty: 'Hard',
        reward: 'Remove 1 Tainted Crystal from any location on the map.',
        effect: 'active',
        completed: false,
        location: 'Greenleaf Village',
        mechanic: {
            type: 'dice_roll',
            actionCost: 1,
            diceCount: 4,
            successOn: 6,
            successCount: 1,
            failDiscard: true,
            rewardType: 'use_quest_card_anytime',
            rewardValue: 'remove_taint',
            requirePresence: false
        }
    });
    return questDeck;
}
