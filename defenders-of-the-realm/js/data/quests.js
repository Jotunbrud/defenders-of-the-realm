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
    
    // ── PLACEHOLDER QUESTS (9 cards) ──
    // These use the standard dice_roll mechanic but have no implemented reward yet.
    // rewardType: 'placeholder' — completion logs success but grants no mechanical benefit.
    
    const placeholderQuests = [
        { name: 'Horn of Summoning', location: 'Eagle Peak Pass', description: 'Sound the ancient horn atop Eagle Peak to rally allies.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Tome of Lost Knowledge', location: 'Whispering Woods', description: 'Decipher the whispers of the woods to unlock the tome.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Blessed Chalice', location: 'Angel Tear Falls', description: 'Fill the chalice with the waters of Angel Tear Falls.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Shadow Blade', location: 'Ghost Marsh', description: 'Retrieve the cursed blade from the depths of the marsh.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Talisman of Warding', location: 'Cursed Plateau', description: 'Perform the ritual of warding atop the cursed plateau.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true }
    ];
    
    placeholderQuests.forEach(pq => {
        questDeck.push({
            id: questId++,
            name: pq.name,
            description: pq.description + ` Spend 1 action and roll ${pq.diceCount} dice. A roll of ${pq.successOn}+ on any die succeeds.`,
            difficulty: 'Medium',
            reward: pq.reward,
            effect: 'passive',
            completed: false,
            location: pq.location,
            mechanic: {
                type: 'dice_roll',
                actionCost: 1,
                diceCount: pq.diceCount,
                successOn: pq.successOn,
                successCount: 1,
                failDiscard: pq.failDiscard,
                rewardType: 'placeholder',
                rewardValue: 'Not yet implemented'
            }
        });
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
