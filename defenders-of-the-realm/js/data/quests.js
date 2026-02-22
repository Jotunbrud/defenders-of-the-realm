// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Quest Card Definitions
// 24 quest cards with types, requirements, and rewards
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
    
    // ── PLACEHOLDER QUESTS (20 cards) ──
    // These use the standard dice_roll mechanic but have no implemented reward yet.
    // rewardType: 'placeholder' — completion logs success but grants no mechanical benefit.
    
    const placeholderQuests = [
        { name: 'Dragon Scale Shield', location: 'Blizzard Mountains', description: 'Search the frozen peaks for a shield forged from dragon scales.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Elven Cloak of Shadows', location: 'Father Oak Forest', description: 'Seek the ancient elven cloak hidden among the great oaks.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Staff of the Archmage', location: 'Enchanted Glade', description: 'Channel the arcane energies of the glade to restore the staff.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Ring of the Phoenix', location: 'Scorpion Canyon', description: 'Brave the scorching canyon to recover the legendary ring.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Horn of Summoning', location: 'Eagle Peak Pass', description: 'Sound the ancient horn atop Eagle Peak to rally allies.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Crystal of Clarity', location: 'Crystal Hills', description: 'Attune to the crystal veins in the hills to gain insight.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Tome of Lost Knowledge', location: 'Whispering Woods', description: 'Decipher the whispers of the woods to unlock the tome.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Gauntlets of Might', location: 'Orc Valley', description: 'Forge the gauntlets in the fires of Orc Valley.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Potion of Restoration', location: 'Unicorn Forest', description: 'Gather ingredients from the sacred unicorn groves.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 4, failDiscard: true },
        { name: 'Map of Hidden Paths', location: 'Wolf Pass', description: 'Navigate the treacherous pass to uncover secret routes.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Blessed Chalice', location: 'Angel Tear Falls', description: 'Fill the chalice with the waters of Angel Tear Falls.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Shadow Blade', location: 'Ghost Marsh', description: 'Retrieve the cursed blade from the depths of the marsh.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Talisman of Warding', location: 'Cursed Plateau', description: 'Perform the ritual of warding atop the cursed plateau.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Compass of the Wanderer', location: 'Sea Bird Port', description: 'Calibrate the ancient compass using the port\'s lighthouse.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 4, failDiscard: true },
        { name: 'Cloak of the North Wind', location: 'Amarak Peak', description: 'Brave the icy summit to claim the enchanted cloak.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true },
        { name: 'Serpent Fang Dagger', location: 'Serpent Swamp', description: 'Extract a fang from the great serpent of the swamp.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Lantern of Truth', location: 'Raven Forest', description: 'Ignite the lantern with the ghostly flames of Raven Forest.', reward: 'Placeholder — reward not yet implemented.', diceCount: 3, successOn: 5, failDiscard: true },
        { name: 'Crown of the Ancients', location: 'Dancing Stone', description: 'Solve the riddle of the dancing stones to claim the crown.', reward: 'Placeholder — reward not yet implemented.', diceCount: 4, successOn: 6, failDiscard: true }
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
