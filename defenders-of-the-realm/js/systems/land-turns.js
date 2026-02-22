// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Land Management & Turn Flow
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    closeCardModal() {
        document.getElementById('card-modal').classList.remove('active');
        
        // If there's a queued card, show it
        if (this.queuedCard) {
            const card = this.queuedCard;
            this.queuedCard = null;
            setTimeout(() => this.showCardDrawn(card), 300);
        }
    },
    
    healLandCrystal() {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const location = hero.location;
        
        // Check if there's a taint crystal at this location
        if (!this.taintCrystals[location] || this.taintCrystals[location] === 0) {
            this.showInfoModal('⚠️', '<div>No taint crystal at this location!</div>');
            return;
        }
        
        // Check for minions blocking
        const minionsHere = this.minions[location];
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        
        if (totalMinions > 0) {
            this.showInfoModal('⚠️', '<div>You must defeat all minions before healing the land!</div>');
            return;
        }
        
        // Check for general blocking
        const generalHere = this.generals.find(g => g.location === location && !g.defeated);
        
        if (generalHere) {
            this.showInfoModal('⚠️', '<div>You must defeat the general before healing the land!</div>');
            return;
        }
        
        this.healLandFromLocation(location);
    },
    
    // ==========================================
    // BUILD MAGIC GATE ACTION
    // ==========================================
    
    buildMagicGate() {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const locationName = hero.location;
        const locationData = this.locationCoords[locationName];
        
        if (!locationData) {
            this.showInfoModal('⚠️', '<div>Invalid location!</div>');
            return;
        }
        
        if (locationData.magicGate) {
            this.showInfoModal('⚠️', '<div>A Magic Gate already exists at this location!</div>');
            return;
        }
        
        // Find all cards matching this location name
        const matchingCards = [];
        hero.cards.forEach((card, index) => {
            if (card.name === locationName) {
                matchingCards.push({ card, index });
            }
        });
        
        if (matchingCards.length === 0) {
            this.showInfoModal('⚠️', `<div>You need a hero card matching "${locationName}" to build a Magic Gate here!</div>`);
            return;
        }
        
        // Close any tooltip
        this.hideTooltip(true);
        
        // Store for confirm step
        this.buildGateMatchingCards = matchingCards;
        this.buildGateSelectedIndex = null;
        
        // Show modal to select which card to discard
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        let cardsHTML = matchingCards.map(({ card, index }, i) => {
            const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
            const cardIcon = card.icon || '🎴';
            return `
                <div id="build-gate-card-${i}" onclick="game.selectBuildGateCard(${i}, ${index})" 
                     style="padding: 12px; margin: 5px; border: 3px solid ${borderColor}; border-radius: 8px; 
                            background: rgba(0,0,0,0.5); cursor: pointer; text-align: center; min-width: 100px;
                            transition: all 0.2s; position: relative;">
                    <div style="font-size: 1.3em;">${cardIcon}</div>
                    <div style="font-size: 0.95em; font-weight: bold; color: ${borderColor};">${card.name}</div>
                    <div style="font-size: 0.8em; color: #999;">${card.type} • ${card.dice} dice</div>
                    <div id="build-gate-check-${i}" style="display: none; position: absolute; top: -5px; right: -5px; 
                         background: #9333ea; border-radius: 50%; width: 22px; height: 22px; line-height: 22px; 
                         font-size: 14px; text-align: center;">✓</div>
                </div>
            `;
        }).join('');
        
        const modalHTML = `
            <div class="modal-title" style="margin-bottom: 5px;">💫 Build Magic Gate</div>
            <div style="text-align: center; font-size: 1em; color: #d4af37; margin-bottom: 15px;">
                Building at <strong>${locationName}</strong>
            </div>
            <div style="text-align: center; padding: 10px; background: rgba(147, 51, 234, 0.15); border: 2px solid #9333ea; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #c084fc; font-size: 0.95em;">
                    Select a card to discard to build the gate:
                </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 15px;">
                ${cardsHTML}
            </div>
            <div style="text-align: center;">
                <button id="build-gate-confirm-btn" class="btn" disabled onclick="game.confirmBuildMagicGate()" 
                        style="opacity: 0.5; padding: 10px 30px; font-size: 1.1em;">
                    Confirm
                </button>
            </div>
        `;
        
        this.showInfoModal('', modalHTML);
        
        // Hide the default Continue button since we have our own Confirm button
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && defaultBtn.querySelector('button[onclick="game.closeInfoModal()"]')) {
            defaultBtn.style.display = 'none';
        }
    },
    
    selectBuildGateCard(displayIndex, cardIndex) {
        const matchingCards = this.buildGateMatchingCards;
        
        // Deselect previous
        for (let i = 0; i < matchingCards.length; i++) {
            const cardEl = document.getElementById(`build-gate-card-${i}`);
            const checkEl = document.getElementById(`build-gate-check-${i}`);
            if (cardEl) { cardEl.style.opacity = '1'; cardEl.style.transform = ''; }
            if (checkEl) checkEl.style.display = 'none';
        }
        
        // Select this one
        const cardEl = document.getElementById(`build-gate-card-${displayIndex}`);
        const checkEl = document.getElementById(`build-gate-check-${displayIndex}`);
        if (cardEl) { cardEl.style.opacity = '0.7'; cardEl.style.transform = 'scale(0.95)'; }
        if (checkEl) checkEl.style.display = 'block';
        
        this.buildGateSelectedIndex = cardIndex;
        
        // Enable confirm button
        const confirmBtn = document.getElementById('build-gate-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.style.opacity = '1';
        }
    },
    
    confirmBuildMagicGate() {
        const cardIndex = this.buildGateSelectedIndex;
        if (cardIndex === null || cardIndex === undefined) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        const locationName = hero.location;
        const locationData = this.locationCoords[locationName];
        const card = hero.cards[cardIndex];
        
        if (!card || card.name !== locationName) {
            this.showInfoModal('⚠️', '<div>Invalid card selection!</div>');
            return;
        }
        
        // Close modal
        this.closeInfoModal();
        
        // Discard the card
        hero.cards.splice(cardIndex, 1);
        this.heroDiscardPile++;
        this.updateDeckCounts();
        
        // Build the gate
        locationData.magicGate = true;
        locationData.builtGate = true;
        
        // Use action
        this.actionsRemaining--;
        
        this.addLog(`💫 ${hero.name} built a Magic Gate at ${locationName}! (discarded ${card.name} - ${card.type})`);
        
        // Re-render map to show the new gate icon (must call renderMap, not just renderTokens)
        this.renderMap();
        this.renderTokens();
        this.updateGameStatus();
        this.updateActionButtons();
        this.updateMovementButtons();
        
        // Show confirmation
        this.showInfoModal('💫 Magic Gate Built!', `
            <div style="text-align: center;">
                <div style="font-size: 2em; margin: 10px 0;">🌀</div>
                <div style="color: #c084fc; font-size: 1.1em; margin-bottom: 10px;">
                    A Magic Gate now stands at <strong>${locationName}</strong>!
                </div>
                <div style="font-size: 0.9em; color: #999;">
                    Heroes can now travel to this location using Magic Gate cards.
                </div>
            </div>
        `);
    },
    
    healLandFromLocation(locationName) {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Check if there's a taint crystal at this location
        if (!this.taintCrystals[locationName] || this.taintCrystals[locationName] === 0) {
            this.showInfoModal('⚠️', '<div>No taint crystal at this location!</div>');
            return;
        }
        
        const locationData = this.locationCoords[locationName];
        const locationColor = locationData.faction;
        
        // Druid and Cleric can remove without card
        if (hero.name === 'Druid' || hero.name === 'Cleric') {
            const abilityLabel = hero.name === 'Druid' ? 'Druid Taint Removal' : 'Cleric Sanctify Land';
            const roll1 = Math.floor(Math.random() * 6) + 1;
            const roll2 = Math.floor(Math.random() * 6) + 1;
            const success = (roll1 >= 5 || roll2 >= 5);
            
            // Create dice display
            const diceHTML = `
                <div style="margin: 20px 0;">
                    <div style="color: #d4af37; margin-bottom: 12px; font-size: 1.1em;">
                        <strong>${abilityLabel} at ${locationName}</strong>
                    </div>
                    <div style="color: #9333ea; margin-bottom: 8px;">
                        Roll 2 dice - Need 5 or 6 on either die
                    </div>
                    <div style="display: flex; gap: 15px; justify-content: center; margin: 15px 0;">
                        <div class="die-result ${roll1 >= 5 ? 'hit' : 'miss'}" style="font-size: 2em;">
                            ${roll1}
                        </div>
                        <div class="die-result ${roll2 >= 5 ? 'hit' : 'miss'}" style="font-size: 2em;">
                            ${roll2}
                        </div>
                    </div>
                </div>
            `;
            
            if (success) {
                this.taintCrystals[locationName]--;
                if (this.taintCrystals[locationName] <= 0) {
                    delete this.taintCrystals[locationName];
                }
                this.taintCrystalsRemaining++;
                this.addLog(`${hero.name} removed taint crystal at ${locationName}! (${roll1}, ${roll2})`);
                this.showCombatResults(diceHTML, `✨ SUCCESS! Taint Crystal Removed! ✨`);
            } else {
                this.addLog(`${hero.name} failed to heal the land at ${locationName}. (${roll1}, ${roll2})`);
                this.showCombatResults(diceHTML, `❌ Failed - Taint remains`);
            }
            
            this.actionsRemaining--;
            this.hideTooltip(true);
            this.updateGameStatus();
            this.renderTokens();
            
            // Update action buttons if map is open
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                this.updateActionButtons();
            }
            return;
        }
        
        // Other heroes need matching color card
        const matchingCards = hero.cards.filter(card => card.color === locationColor);
        
        if (matchingCards.length === 0) {
            this.showInfoModal('⚠️', `<div>Need a ${locationColor} card for this ${locationColor} location!</div>`);
            return;
        }
        
        // Show card selection modal
        this.showTaintRemovalCardSelection(locationName, matchingCards);
    },
    
    showTaintRemovalCardSelection(locationName, matchingCards) {
        const hero = this.heroes[this.currentPlayerIndex];
        const locationData = this.locationCoords[locationName];
        const locationColor = locationData.faction;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '15000';
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        const cardsHTML = matchingCards.map((card, index) => {
            const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
            return `
                <div onclick="game.executeTaintRemoval('${locationName.replace(/'/g, "\\'")}', ${index})" 
                     style="border: 3px solid ${borderColor}; cursor: pointer; padding: 10px; border-radius: 8px; text-align: center; background: rgba(0,0,0,0.3); transition: background 0.2s;"
                     onmouseover="this.style.background='rgba(255,215,0,0.2)'" 
                     onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="font-size: 2em; margin-bottom: 5px;">${card.icon || '🎴'}</div>
                    <div style="font-weight: bold; color: ${borderColor};">${card.name}</div>
                    <div style="font-size: 0.9em; color: #999; margin-top: 3px;">🎲 ${card.dice} ${card.dice === 1 ? 'die' : 'dice'}</div>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2 class="modal-title">🌳 Heal the Land</h2>
                <p style="margin-bottom: 15px; text-align: center; color: #9333ea;">
                    Select a ${locationColor} card to discard at ${locationName}
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; max-height: 300px; overflow-y: auto;">
                    ${cardsHTML}
                </div>
                <button class="btn" style="margin-top: 15px; width: 100%; background: #666;" onclick="this.closest('.modal').remove()">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store matching cards for executeTaintRemoval
        this.taintRemovalCards = matchingCards;
        this.taintRemovalLocation = locationName;
    },
    
    executeTaintRemoval(locationName, cardIndex) {
        const hero = this.heroes[this.currentPlayerIndex];
        const matchingCards = this.taintRemovalCards;
        
        if (!matchingCards || cardIndex < 0 || cardIndex >= matchingCards.length) {
            return;
        }
        
        const cardToRemove = matchingCards[cardIndex];
        const actualCardIndex = hero.cards.indexOf(cardToRemove);
        hero.cards.splice(actualCardIndex, 1);
        this.heroDiscardPile++;
        
        // Sorceress Visions: +1 extra die for healing tainted lands
        const visionsBonus = hero.name === 'Sorceress' ? 1 : 0;
        const totalDice = 2 + visionsBonus;
        if (visionsBonus > 0) {
            this.addLog(`⚡ Visions: ${hero.name} rolls ${totalDice} dice instead of 2!`);
        }
        
        const rolls = [];
        let success = false;
        for (let i = 0; i < totalDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            if (roll >= 5) success = true;
            rolls.push(roll);
        }
        
        const visionsNote = visionsBonus > 0 ? `<div style="color: #ec4899; margin-bottom: 8px; font-size: 0.9em;">⚡ Visions: +1 bonus die!</div>` : '';
        
        // Create dice display
        const diceHTML = `
            <div style="margin: 20px 0;">
                <div style="color: #d4af37; margin-bottom: 12px; font-size: 1.1em;">
                    <strong>Taint Removal at ${locationName}</strong>
                </div>
                <div style="color: #ffd700; margin-bottom: 8px;">
                    Discarded: ${cardToRemove.name}
                </div>
                <div style="color: #9333ea; margin-bottom: 8px;">
                    Roll ${totalDice} dice - Need 5 or 6 on any die
                </div>
                ${visionsNote}
                <div style="display: flex; gap: 15px; justify-content: center; margin: 15px 0;">
                    ${rolls.map(r => `<div class="die-result ${r >= 5 ? 'hit' : 'miss'}" style="font-size: 2em;">${r}</div>`).join('')}
                </div>
            </div>
        `;
        
        if (success) {
            this.taintCrystals[locationName]--;
            if (this.taintCrystals[locationName] <= 0) {
                delete this.taintCrystals[locationName];
            }
            this.taintCrystalsRemaining++;
            this.addLog(`Taint removed at ${locationName}! Discarded ${cardToRemove.name}. (${rolls.join(', ')})`);
            this.showCombatResults(diceHTML, `✨ SUCCESS! Taint Crystal Removed! ✨`);
        } else {
            this.addLog(`Failed at ${locationName}! Lost ${cardToRemove.name}. (${rolls.join(', ')})`);
            this.showCombatResults(diceHTML, `❌ Failed - Card Lost, Taint Remains`);
        }
        
        // Close the card selection modal
        const modals = document.querySelectorAll('.modal');
        modals.forEach(m => {
            if (m.querySelector('.modal-title')?.textContent?.includes('Heal the Land')) {
                m.remove();
            }
        });
        
        this.actionsRemaining--;
        this.hideTooltip(true);
        this.updateGameStatus();
        this.renderHeroes();
        this.renderTokens();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
            
            // Update action buttons since taint crystal was removed
            this.updateActionButtons();
        }
    },
    
    heroDefeated(heroIndex) {
        const hero = this.heroes[heroIndex];
        hero.health = 0; // Clamp to 0
        this.addLog(`💀 ${hero.name} has been defeated!`);
        
        // Discard all cards
        const cardCount = hero.cards.length;
        hero.cards = [];
        this.heroDiscardPile += cardCount;
        
        // Discard all quest cards
        const questCount = hero.questCards ? hero.questCards.length : 0;
        if (questCount > 0) {
            this.questDiscardPile += questCount;
            hero.questCards = [];
            this.addLog(`📜 ${hero.name} loses ${questCount} quest card(s)!`);
            this.updateDeckCounts();
        }
        
        // Close any open modals that might be behind the death modal
        document.querySelectorAll('.modal.active').forEach(m => {
            if (m.id !== 'hero-death-modal' && m.id !== 'map-modal') {
                m.classList.remove('active');
            }
        });
        
        // Show hero selection modal
        const availableHeroes = [
            { name: 'Paladin', symbol: '🛡️' },
            { name: 'Cleric', symbol: '✝️' },
            { name: 'Wizard', symbol: '🧙‍♂️' },
            { name: 'Sorceress', symbol: '🧙‍♀️' },
            { name: 'Eagle Rider', symbol: '🦅' },
            { name: 'Dwarf', symbol: '⛏️' },
            { name: 'Ranger', symbol: '🏹' },
            { name: 'Rogue', symbol: '🗡️' }
        ].filter(h => !this.heroes.some(existing => existing.name === h.name && existing !== hero));
        
        // Store current hero info for potential respawn
        this.defeatedHero = {
            index: heroIndex,
            originalName: hero.name,
            cardCount: cardCount
        };
        
        const content = document.getElementById('hero-death-content');
        content.innerHTML = `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 3em; margin-bottom: 10px;">${hero.symbol}</div>
                <div style="font-size: 1.3em; color: #ef4444; font-weight: bold; margin-bottom: 10px;">
                    ${hero.name} has fallen!
                </div>
                <div style="color: #d4af37; margin-bottom: 5px;">
                    Health reduced to 0
                </div>
                <div style="color: #999;">
                    ${cardCount} card(s) discarded
                </div>
            </div>
            ${availableHeroes.length > 0 ? 
                '<div style="color: #d4af37; text-align: center; margin: 15px 0; font-weight: bold;">Select a new hero or respawn the same hero:</div>' :
                '<div style="color: #ef4444; text-align: center; margin: 15px 0;">No new heroes available - respawn same hero</div>'
            }
        `;
        
        const grid = document.getElementById('hero-selection-grid');
        if (availableHeroes.length > 0) {
            grid.innerHTML = availableHeroes.map(h => `
                <div class="btn btn-primary" onclick="game.selectNewHero('${h.name}')" 
                     style="padding: 20px; text-align: center; cursor: pointer;">
                    <div style="font-size: 2em;">${h.symbol}</div>
                    <div style="font-weight: bold; margin-top: 5px;">${h.name}</div>
                </div>
            `).join('');
            grid.style.display = 'grid';
        } else {
            grid.style.display = 'none';
        }
        
        document.getElementById('hero-death-modal').classList.add('active');
    },
    
    selectNewHero(heroName) {
        const heroIndex = this.defeatedHero.index;
        const hero = this.heroes[heroIndex];
        
        const heroTemplate = {
            'Paladin': { health: 5, maxHealth: 5, color: '#3b82f6', symbol: '🛡️', ability: '<strong>Noble Steed:</strong> May spend an action to travel on horseback (2 spaces) without discarding a horse travel card<br><br><strong>Bravery:</strong> If ending a turn in a location with Undead minions, do not suffer any penalties from fear<br><br><strong>Aura of Righteousness:</strong> Ignore 1 wound from minions and Generals' },
            'Cleric': { health: 6, maxHealth: 6, color: '#fbbf24', symbol: '✝️', ability: '<strong>Blessed Attacks:</strong> Add +1 to each die roll in attacks against Undead and Demon minions.<br><span style="color: #ef4444;">May not be used in combat with a General.</span><br><br><strong>Turn Undead:</strong> If ending a turn in a location with Undead, move all Undead minions to any adjacent location(s).<br><br><strong>Sanctify Land:</strong> May spend an action in a location with no enemy minions present that is Tainted to heal the land (no cards required). On a roll of 5+ remove the Tainted Crystal.' },
            'Wizard': { health: 5, maxHealth: 5, color: '#8b5cf6', symbol: '🧙‍♂️', ability: '<strong>Teleport:</strong> May spend an action to move to 1 location each turn as if traveling by Magic Gate (no card required)<br><br><strong>Fireball:</strong> Discard a card matching any minion color present to attack ALL minions at the location. A roll of 2+ incinerates each minion, regardless of type.<br><br><strong>Wisdom:</strong> When drawing a Darkness Spreads card, it may be discarded and another one drawn, but the new card must be used.<br><span style="color: #ef4444;">Note: In the Middle and Late War this skill may be used for each Darkness Spreads card drawn.</span>' },
            'Sorceress': { health: 5, maxHealth: 5, color: '#ec4899', symbol: '🧙‍♀️', ability: '<strong>Shape Shifter:</strong> At the start of the turn, place a minion of the shape you wish to take. Do not lose life tokens when ending turn on a location with enemy minions of the same shape.<br><span style="color: #ef4444;">May not enter Monarch City or any Inn when in enemy form.</span><br><br><strong>Ambush:</strong> If in the same shape as an enemy minion, add +2 to each die rolled against them on the first attack made.<br><span style="color: #ef4444;">May be used against Generals but only add +1.</span><br><br><strong>Visions:</strong> Gain 1 extra die for any Quest rolls and for any Healing of Tainted Lands.' },
            'Druid': { health: 5, maxHealth: 5, color: '#22c55e', symbol: '🌿', ability: '<strong>Cleanse Corruption:</strong> Remove taint crystals without discarding cards' },
            'Eagle Rider': { health: 4, maxHealth: 4, color: '#0ea5e9', symbol: '🦅', ability: '<strong>Eagle Flight:</strong> Spend an action to travel 4 spaces without discarding an eagle travel card<br><br><strong>Fresh Mount:</strong> If ending a turn on the ground in Monarch City or any Blue location, gain one action next turn.<br><br><strong>Attacks:</strong> <span style="color: #ef4444;">At the beginning of turn, must choose 1 attack style and may not change it during the turn.</span><br>• <strong>Sky Attack:</strong> May end turn in the same location with enemy minions or Generals but suffers no penalties (fear, damage, or loss of cards).<br>• <strong>Ground Attack:</strong> May re-roll all dice one time each combat against minions and Generals (except Undead General). But rider is considered to be on the ground at the end of the turn and is subject to penalties.' },
            'Dwarf': { health: 5, maxHealth: 5, color: '#b45309', symbol: '⛏️', ability: '<strong>Mountain Lore:</strong> When starting a turn in a Red location, gain 1 action for that turn.<br><br><strong>Dragon Slayer:</strong> May re-roll any failed dice in combat against Dragonkin.<br><span style="color: #ef4444;">May be used in combat with Sapphire.</span><br><br><strong>Armor and Toughness:</strong> Ignore 1 wound from minions and Generals.' },
            'Ranger': { health: 5, maxHealth: 5, color: '#15803d', symbol: '🏹', ability: '<strong>Woods Lore:</strong> Add +1 to all attack rolls when in a Green location.<br><span style="color: #ef4444;">May be used against Generals.</span><br><br><strong>Archery:</strong> May attack enemy minions 1 space away as if they were in the same location.<br><span style="color: #ef4444;">May not be combined with Woods Lore.</span><br><span style="color: #ef4444;">May not be used against Generals.</span><br><br><strong>Elf Support:</strong> When starting a turn in a Green location, gain 1 Action for that turn.' },
            'Rogue': { health: 6, maxHealth: 6, color: '#7c3aed', symbol: '🗡️', ability: '<strong>Hide In The Shadows:</strong> Does not suffer life token loss when in a location with enemy minions at the end of a turn.<br><span style="color: #ef4444;">Still subject to General and Fear penalties.</span><br><br><strong>Thievery:</strong> When ending turn in a location with a treasure chest, draw 1 extra Hero Card.<br><br><strong>Crafty:</strong> As a Rumor At The Inn Action — call a color and draw 5 cards. Keep all that match the color called as well as all Special cards.<br><span style="color: #ef4444;">Limited to 2 Inn Actions Per Turn.</span>' }
        };
        
        const template = heroTemplate[heroName];
        hero.name = heroName;
        hero.health = template.health;
        hero.maxHealth = template.maxHealth;
        hero.symbol = template.symbol;
        hero.color = template.color;
        hero.ability = template.ability;
        hero.location = 'Monarch City';
        hero.cards = [];
        
        // Give 2 starting cards
        for (let i = 0; i < 2; i++) {
            const card = this.generateRandomCard();
            if (card) hero.cards.push(card);
        }
        
        this.addLog(`${this.defeatedHero.originalName} replaced by ${heroName} at Monarch City with 2 cards`);
        
        // Draw a new quest card
        hero.questCards = [];
        const newQuest = this.drawQuestCard(heroIndex);
        if (newQuest) {
            this.addLog(`📜 ${heroName} draws quest: ${newQuest.name}`);
        }
        
        document.getElementById('hero-death-modal').classList.remove('active');
        this.renderHeroes();
        this.renderTokens();
        this.updateGameStatus();
        
        this.resumeAfterDeath();
    },
    
    respawnSameHero() {
        const heroIndex = this.defeatedHero.index;
        const hero = this.heroes[heroIndex];
        
        hero.health = hero.maxHealth;
        hero.location = 'Monarch City';
        hero.cards = [];
        
        // Give 2 starting cards
        for (let i = 0; i < 2; i++) {
            const card = this.generateRandomCard();
            if (card) hero.cards.push(card);
        }
        
        this.addLog(`${hero.name} respawns at Monarch City with 2 cards`);
        
        // Draw a new quest card
        hero.questCards = [];
        const newQuest = this.drawQuestCard(heroIndex);
        if (newQuest) {
            this.addLog(`📜 ${hero.name} draws quest: ${newQuest.name}`);
        }
        
        document.getElementById('hero-death-modal').classList.remove('active');
        this.renderHeroes();
        this.renderTokens();
        this.updateGameStatus();
        
        this.resumeAfterDeath();
    },
    
    resumeAfterDeath() {
        const context = this.heroDeathContext || 'combat';
        this.heroDeathContext = null;
        
        if (context === 'endTurn' || context === 'endTurnFromMap') {
            // Hero died during end of turn - skip card draw, proceed to night phase
            const hero = this.heroes[this.defeatedHero.index];
            this.endOfTurnState = {
                hero: hero,
                damageInfo: { totalDamage: 0, minionDamage: 0, fearDamage: 0, auraReduction: 0, fearBlocked: false, minions: {} },
                fromMap: context === 'endTurnFromMap'
            };
            // Go straight to night phase (skip daytime/evening since hero just died)
            this.proceedToNightPhase();
        } else {
            // Combat death - just update map if open
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                this.updateMapStatus();
                this.updateMovementButtons();
                this.updateActionButtons();
            }
        }
    },
    
    heroRespawn(heroIndex) {
        const hero = this.heroes[heroIndex];
        hero.health = 5; // Full health
        hero.location = 'Monarch City'; // Respawn at capital
        hero.taintTokens = 0; // Clear taint
        
        this.addLog(`${hero.name} respawns at Monarch City with 5 health`);
        this.renderHeroes();
        this.renderTokens();
    },
    
    endTurn() {
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Cleric Turn Undead: move undead minions before end-of-turn damage
        if (hero.name === 'Cleric') {
            const minionsHere = this.minions[hero.location];
            const undeadCount = minionsHere ? (minionsHere.black || 0) : 0;
            if (undeadCount > 0) {
                this._turnUndeadFromMap = false;
                this.showTurnUndeadModal();
                return;
            }
        }
        
        this._executeEndTurn(false);
    },
    
    _executeEndTurn(fromMap) {
        const hero = this.heroes[this.currentPlayerIndex];
        const minionsAtLocation = this.minions[hero.location];
        
        // Reset Night Phase passive card states (these are Step 3 only)
        this.strongDefensesActive = false;
        this.militiaSecuredSlot = null;
        
        // Calculate damage from minions
        let damageInfo = {
            totalDamage: 0,
            minionDamage: 0,
            fearDamage: 0,
            auraReduction: 0,
            fearBlocked: false,
            skyAttackProtected: false,
            minions: {}
        };
        
        // Eagle Rider Sky Attack: No end-of-turn penalties
        if (hero.name === 'Eagle Rider' && this.eagleRiderAttackStyle === 'sky') {
            damageInfo.skyAttackProtected = true;
            // Still count minions for display but deal no damage
            if (minionsAtLocation) {
                for (let [color, count] of Object.entries(minionsAtLocation)) {
                    if (count > 0) {
                        damageInfo.minions[color] = count;
                    }
                }
            }
            // Fresh Mount check
            this._checkFreshMount(hero, damageInfo);
            this.endOfTurnState = {
                hero: hero,
                damageInfo: damageInfo,
                fromMap: fromMap
            };
            this.showDaytimeModal(hero, damageInfo);
            return;
        }
        
        if (minionsAtLocation) {
            for (let [color, count] of Object.entries(minionsAtLocation)) {
                if (count > 0) {
                    damageInfo.minions[color] = count;
                    damageInfo.minionDamage += count;
                }
            }
            
            // Rogue Hide In The Shadows: no minion wound damage, but still subject to Fear
            if (hero.name === 'Rogue' && damageInfo.minionDamage > 0) {
                damageInfo.shadowHidden = true;
                damageInfo.minionDamageBlocked = damageInfo.minionDamage;
                damageInfo.minionDamage = 0;
            }
            
            // Sorceress Shape Shifter: immune to wounds from shapeshifted faction minions
            if (hero.name === 'Sorceress' && this.shapeshiftForm && damageInfo.minionDamage > 0) {
                const shiftedCount = minionsAtLocation[this.shapeshiftForm] || 0;
                if (shiftedCount > 0) {
                    damageInfo.shapeshiftProtected = true;
                    damageInfo.shapeshiftForm = this.shapeshiftForm;
                    damageInfo.shapeshiftDamageBlocked = shiftedCount;
                    damageInfo.minionDamage = Math.max(0, damageInfo.minionDamage - shiftedCount);
                }
            }
            
            if (minionsAtLocation.black > 0 && hero.name !== 'Paladin') {
                damageInfo.fearDamage = 1;
            }
            if (minionsAtLocation.black > 0 && hero.name === 'Paladin') {
                damageInfo.fearBlocked = true;
            }
            
            damageInfo.totalDamage = damageInfo.minionDamage + damageInfo.fearDamage;
            
            if ((hero.name === 'Paladin' || hero.name === 'Dwarf') && damageInfo.totalDamage > 0) {
                damageInfo.auraReduction = 1;
                damageInfo.totalDamage = Math.max(0, damageInfo.totalDamage - 1);
            }
            
            if (damageInfo.totalDamage > 0) {
                hero.health -= damageInfo.totalDamage;
                this.addLog(`${hero.name} took ${damageInfo.totalDamage} damage at ${hero.location}!`);
                
                if (hero.health <= 0) {
                    hero.health = 0;
                    this.heroDeathContext = fromMap ? 'endTurnFromMap' : 'endTurn';
                    this.heroDefeated(this.currentPlayerIndex);
                    return;
                }
            }
        }
        
        // Fresh Mount check
        this._checkFreshMount(hero, damageInfo);
        
        // Store state for multi-phase end of turn (card draw deferred to Step 2)
        this.endOfTurnState = {
            hero: hero,
            damageInfo: damageInfo,
            fromMap: fromMap
        };
        
        // Show Step 1 - Daytime modal
        this.showDaytimeModal(hero, damageInfo);
    },
    
    endTurnFromMap() {
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Cleric Turn Undead: move undead minions before end-of-turn damage
        if (hero.name === 'Cleric') {
            const minionsHere = this.minions[hero.location];
            const undeadCount = minionsHere ? (minionsHere.black || 0) : 0;
            if (undeadCount > 0) {
                this._turnUndeadFromMap = true;
                this.showTurnUndeadModal();
                return;
            }
        }
        
        this._executeEndTurn(true);
    },
    
    darknessPhase() {
        // Determine how many cards to draw based on war status
        this.darknessCardsToDraw = this.warStatus === 'late' ? 3 : (this.warStatus === 'mid' ? 2 : 1);
        this.darknessCardsDrawn = 0;
        this.darknessAllEvents = [];
        this.darknessCardPhase = null; // 'preview' or 'resolved'
        this.darknessCurrentCard = null;
        this.darknessCurrentGeneralOnly = false;
        this.darknessCurrentEvents = [];
    },
    
    drawNextDarknessCard() {
        // Reset Wizard Wisdom flag - each new card position allows fresh use
        this.wizardWisdomRedraw = false;
        // Clear militia secured state for new card
        this.militiaSecuredSlot = null;
        // Clear strong defenses state for new card
        this.strongDefensesActive = false;
        
        this.darknessCardsDrawn++;
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        
        // Determine if this card is general-only
        const generalOnly = (this.warStatus === 'mid' && cardNum === 2) || 
                           (this.warStatus === 'late' && cardNum === 3);
        this.darknessCurrentGeneralOnly = generalOnly;
        
        // Reshuffle if deck is empty
        if (!this.darknessDeck || this.darknessDeck.length === 0) {
            if (this.darknessDiscardPile > 0) {
                this.darknessDeck = this.createDarknessDeck();
                this.darknessDiscardPile = 0;
                this.addLog('--- Darkness Spreads deck reshuffled from discard pile ---');
            } else {
                this.darknessDeck = this.createDarknessDeck();
                this.addLog('--- Darkness Spreads deck reshuffled ---');
            }
        }
        
        // Draw one card
        const card = this.darknessDeck.shift();
        this.darknessDiscardPile++;
        this.darknessCurrentCard = card;
        this.darknessCurrentEvents = [];
        this.darknessCardPhase = 'preview';
        this.updateDeckCounts();
        
        // Check if any hero can interact with the darkness preview
        // Currently: Wizard's Wisdom ability (discard & redraw)
        const canAffectDarkness = this._canAffectDarknessCard(card);
        
        if (canAffectDarkness) {
            // Show the card preview (with Wisdom button etc.)
            this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
        } else {
            // No one can affect it — skip preview, resolve immediately, show results
            this.resolveDarknessCard();
        }
    },
    
    _canAffectDarknessCard(card) {
        // All is Quiet darkness deck cards have nothing to interact with
        if (card.type === 'all_quiet') return false;
        // Monarch City Special has no general movement and no interactable placements
        if (card.type === 'monarch_city_special') return false;
        
        // Wizard's Wisdom: can discard and redraw (if not already a redraw)
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero && hero.name === 'Wizard' && !this.wizardWisdomRedraw) return true;
        
        // Militia Secures Area: any hero with the card, regular darkness cards only (have faction1 but no special type)
        const isRegularCard = card.faction1 && !card.type;
        if (isRegularCard && this._findMilitiaSecuresCard()) return true;
        
        // Strong Defenses: any hero with the card, any card with a general (regular + patrol)
        const hasGeneral = card.general && card.general !== '';
        if (hasGeneral && this._findStrongDefensesCard()) return true;
        
        return false;
    },
    
    predictMinionOutcome(faction, count, locationName) {
        const warnings = [];
        const currentMinions = this.minions[locationName] || {};
        const sameColorCount = currentMinions[faction] || 0;
        
        // Monarch City never triggers overruns or taint
        const isMonarchCity = locationName === 'Monarch City';
        
        // Check 25-token exhaustion
        let totalFactionOnBoard = 0;
        for (let loc in this.minions) {
            totalFactionOnBoard += (this.minions[loc][faction] || 0);
        }
        if (totalFactionOnBoard >= 25) {
            warnings.push({ type: 'exhausted', text: 'No minions remaining — lose condition', color: '#ef4444' });
            return warnings;
        }
        
        if (!isMonarchCity) {
            const spaceAvailable = 3 - sameColorCount;
            if (spaceAvailable <= 0) {
                if (this.overrunsDisabled) {
                    warnings.push({ type: 'capped', text: 'Minions capped at 3 (overruns off)', color: '#f59e0b' });
                } else {
                    warnings.push({ type: 'overrun', text: 'Overrun will be triggered', color: '#ef4444' });
                }
                warnings.push({ type: 'taint', text: 'Taint Crystal will be placed', color: '#9333ea' });
            } else if (count > spaceAvailable) {
                if (this.overrunsDisabled) {
                    warnings.push({ type: 'capped', text: 'Minions capped at 3 (overruns off)', color: '#f59e0b' });
                } else {
                    warnings.push({ type: 'overrun', text: 'Overrun will be triggered', color: '#ef4444' });
                }
                warnings.push({ type: 'taint', text: 'Taint Crystal will be placed', color: '#9333ea' });
            }
        }
        
        return warnings;
    },
    
    predictGeneralOutcome(generalColor, minionCount, targetLocation) {
        const general = this.generals.find(g => g.color === generalColor);
        if (!general) return [];
        
        const warnings = [];
        
        if (general.defeated) {
            warnings.push({ type: 'defeated', text: 'General already defeated', color: '#4ade80' });
            return warnings;
        }
        
        // Major Wounds: General cannot advance
        const wound = this.generalWounds[general.color];
        if (wound && wound.type === 'major') {
            warnings.push({ type: 'major_wound', text: 'Major Wounds — Cannot advance!', color: '#ef4444' });
            return warnings;
        }
        
        if (targetLocation === 'Monarch City') {
            const nextOnPath = this.getColoredPathTowardMonarchCity(general);
            if (nextOnPath === 'Monarch City') {
                warnings.push({ type: 'monarch', text: 'General will reach Monarch City!', color: '#ef4444' });
            } else {
                warnings.push({ type: 'blocked', text: 'General will not advance', color: '#888' });
            }
        } else if (targetLocation === 'Next Location') {
            if (general.isTestGeneral) {
                return warnings;
            }
            const nextLoc = this.getColoredPathTowardMonarchCity(general);
            if (nextLoc) {
                if (nextLoc === 'Monarch City') {
                    warnings.push({ type: 'monarch', text: 'General will reach Monarch City!', color: '#ef4444' });
                } else {
                    warnings.push({ type: 'advance', text: 'General will advance', color: '#4ade80' });
                }
            } else {
                warnings.push({ type: 'blocked', text: 'General will not advance', color: '#888' });
            }
        } else {
            if (general.isTestGeneral) return warnings;
            const nextOnPath = this.getColoredPathTowardMonarchCity(general);
            if (nextOnPath === targetLocation) {
                if (targetLocation === 'Monarch City') {
                    warnings.push({ type: 'monarch', text: 'General will reach Monarch City!', color: '#ef4444' });
                } else {
                    warnings.push({ type: 'advance', text: 'General will advance', color: '#4ade80' });
                }
            } else {
                warnings.push({ type: 'blocked', text: 'General will not advance', color: '#888' });
            }
        }
        
        return warnings;
    },
    
    renderPredictionTags(warnings) {
        if (!warnings || warnings.length === 0) return '';
        return warnings.map(w => {
            const borderColor = w.type === 'overrun' || w.type === 'monarch' || w.type === 'exhausted' ? '#ef4444' :
                               w.type === 'taint' ? '#9333ea' :
                               w.type === 'advance' || w.type === 'defeated' ? '#4ade80' : '#666';
            return `<div style="margin-top: 4px; padding: 3px 8px; border-left: 2px solid ${borderColor}; font-size: 0.85em;">
                <span style="color: ${w.color};">${w.text}</span>
            </div>`;
        }).join('');
    },
    
    showDarknessCardPreview(card, cardNum, totalCards, generalOnly) {
        const content = document.getElementById('end-of-turn-content');
        const btn = document.getElementById('end-of-turn-btn');
        
        let cardHeader = '';
        if (totalCards > 1) {
            const modeText = generalOnly ? 'General Advance Only' : 'Full Card';
            const modeColor = generalOnly ? '#fbbf24' : '#4ade80';
            cardHeader = `<div style="text-align: center; margin-bottom: 10px;">
                <strong style="color: #d4af37; font-size: 1.1em;">Card ${cardNum} of ${totalCards}</strong>
                <span style="color: ${modeColor}; font-size: 0.95em; margin-left: 8px;">(${modeText})</span>
            </div>`;
        }
        
        let cardContent = '';
        
        if (card.type === 'all_quiet') {
            cardContent = `
                <div style="padding: 15px; text-align: center; border: 2px solid #4ade80; background: rgba(74,222,128,0.15); border-radius: 8px;">
                    <div style="font-size: 1.3em; color: #4ade80; font-weight: bold;">🌅 All is Quiet</div>
                    <div style="color: #d4af37; margin-top: 5px;">${card.description}</div>
                </div>`;
        } else if (card.type === 'patrol') {
            const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
            const generalColor = this.getGeneralColor(card.general);
            const isWarParty = card.patrolType === 'orc_war_party';
            
            // Predict patrol outcomes
            let patrolWarnings = '';
            if (!generalOnly) {
                let overrunCount = 0;
                let taintCount = 0;
                for (let locationName in this.locationCoords) {
                    const coords = this.locationCoords[locationName];
                    if (isWarParty) {
                        // Orc War Party: locations with exactly 1 orc and no other minions
                        const minionsAtLocation = this.minions[locationName];
                        if (minionsAtLocation) {
                            const greenCount = minionsAtLocation['green'] || 0;
                            const otherCount = Object.entries(minionsAtLocation).filter(([c]) => c !== 'green').reduce((s, [, n]) => s + n, 0);
                            if (greenCount === 1 && otherCount === 0) {
                                const pw = this.predictMinionOutcome('green', 1, locationName);
                                pw.forEach(w => { if (w.type === 'overrun') overrunCount++; if (w.type === 'taint') taintCount++; });
                            }
                        }
                    } else {
                        // Standard Orc Patrols: empty green locations
                        if (coords.faction === 'green') {
                            const minionsAtLocation = this.minions[locationName];
                            if (!minionsAtLocation || !minionsAtLocation['green'] || minionsAtLocation['green'] === 0) {
                                const pw = this.predictMinionOutcome('green', 1, locationName);
                                pw.forEach(w => { if (w.type === 'overrun') overrunCount++; if (w.type === 'taint') taintCount++; });
                            }
                        }
                    }
                }
                if (overrunCount > 0) patrolWarnings += `<div style="margin-top: 4px; padding: 4px 8px; border: 1px solid #ef4444; background: rgba(239,68,68,0.15); border-radius: 3px; font-size: 0.85em;"><span style="color: #ef4444;">${overrunCount} location${overrunCount > 1 ? 's' : ''} will trigger Overrun</span></div>`;
                if (taintCount > 0) patrolWarnings += `<div style="margin-top: 4px; padding: 4px 8px; border: 1px solid #9333ea; background: rgba(147,51,234,0.15); border-radius: 3px; font-size: 0.85em;"><span style="color: #9333ea;">${taintCount} Taint Crystal${taintCount > 1 ? 's' : ''} will be placed</span></div>`;
            }
            
            const patrolDesc = isWarParty
                ? 'Add 1 orc to each location with exactly 1 orc and no other minions'
                : 'Add 1 green minion to each empty green location';
            const patrolIcon = isWarParty ? '⚔️' : '🥾';
            const patrolBorderColor = isWarParty ? '#dc2626' : '#16a34a';
            const patrolBgColor = isWarParty ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)';
            
            const generalLine = card.minions3 === 0
                ? `<strong style="color: ${generalColor};">General:</strong> <strong style="color: ${generalColor};">${generalName}</strong> advances → <strong>${card.location3}</strong> (no minions)`
                : `<strong style="color: ${generalColor};">General:</strong> <strong style="color: ${generalColor};">${generalName}</strong> — ${card.minions3} minion${card.minions3 > 1 ? 's' : ''} → <strong>${card.location3}</strong>`;
            
            const sdBlockedPatrol = this.strongDefensesActive;
            const sdStylePatrol = sdBlockedPatrol ? 'opacity: 0.4; text-decoration: line-through;' : '';
            const sdLabelPatrol = sdBlockedPatrol ? '<div style="color: #f59e0b; font-size: 0.85em; margin-top: 4px;">🏰 Strong Defenses — General movement cancelled</div>' : '';
            const generalWarnings = sdBlockedPatrol ? [] : this.predictGeneralOutcome(card.general, card.minions3, card.location3);
            
            cardContent = `
                <div style="padding: 12px; border: 2px solid ${patrolBorderColor}; background: ${patrolBgColor}; border-radius: 8px;">
                    <div style="text-align: center; font-size: 1.1em; color: ${patrolBorderColor}; font-weight: bold; margin-bottom: 8px;">${patrolIcon} ${card.patrolName}</div>
                    ${!generalOnly ? `<div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${patrolBorderColor}; background: rgba(0,0,0,0.3); border-radius: 3px;">
                        <strong style="color: ${patrolBorderColor};">Patrol:</strong> ${patrolDesc}
                        ${patrolWarnings}
                    </div>` : `<div style="padding: 8px; margin: 5px 0; border-left: 3px solid #fbbf24; background: rgba(251,191,36,0.1); border-radius: 3px;">
                        <span style="color: #fbbf24;">⏭️ Patrol skipped (General Advance Only)</span>
                    </div>`}
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${sdBlockedPatrol ? '#f59e0b' : generalColor}; background: rgba(0,0,0,0.3); border-radius: 3px; ${sdStylePatrol}">
                        ${generalLine}
                        ${!sdBlockedPatrol ? this.renderPredictionTags(generalWarnings) : ''}
                        ${sdLabelPatrol}
                    </div>
                </div>`;
        } else if (card.type === 'monarch_city_special') {
            // Predict which colors will place minions
            const monarchConnected = this.locationConnections['Monarch City'] || [];
            const colorsPresent = new Set();
            const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
            const factionIcons = { green: '🪓', black: '💀', red: '🔥', blue: '🐉' };
            
            monarchConnected.forEach(loc => {
                const minionsObj = this.minions[loc];
                if (!minionsObj) return;
                for (const [color, count] of Object.entries(minionsObj)) {
                    if (count > 0) colorsPresent.add(color);
                }
            });
            
            let minionLines = '';
            if (colorsPresent.size === 0) {
                minionLines = '<div style="color: #4ade80; padding: 4px 0;">No minions adjacent — nothing placed</div>';
            } else {
                ['green', 'red', 'black', 'blue'].forEach(color => {
                    if (!colorsPresent.has(color)) return;
                    const fname = factionNames[color];
                    const fcolor = factionColors[color];
                    const ficon = factionIcons[color];
                    minionLines += `<div style="color: ${fcolor}; padding: 2px 0;">${ficon} +1 ${fname} minion → Monarch City</div>`;
                });
            }
            
            cardContent = `
                <div style="padding: 12px; border: 2px solid #fbbf24; background: rgba(251,191,36,0.15); border-radius: 8px;">
                    <div style="text-align: center; font-size: 1.1em; color: #fbbf24; font-weight: bold; margin-bottom: 8px;">🏰 Monarch City</div>
                    <div style="text-align: center; color: #ef4444; font-weight: bold; font-size: 0.9em; margin-bottom: 8px;">⚠️ SPECIAL</div>
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #fbbf24; background: rgba(0,0,0,0.3); border-radius: 3px;">
                        <strong style="color: #fbbf24;">Minions:</strong> Place 1 minion of each color adjacent to Monarch City
                        <div style="margin-top: 6px; padding-left: 8px;">${minionLines}</div>
                        <div style="margin-top: 4px; color: #ef4444; font-size: 0.85em; font-weight: bold;">No Overruns can occur</div>
                    </div>
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #a78bfa; background: rgba(0,0,0,0.3); border-radius: 3px;">
                        <strong style="color: #a78bfa;">🔄 Reshuffle All Decks</strong>
                    </div>
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid #ef4444; background: rgba(0,0,0,0.3); border-radius: 3px;">
                        <span style="color: #ef4444; font-weight: bold;">🚫 No Generals Move</span>
                    </div>
                </div>`;
        } else {
            // Regular card
            const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
            const faction1Name = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
            const faction2Name = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
            const color1 = this.getGeneralColor(card.faction1);
            const color2 = this.getGeneralColor(card.faction2);
            const generalColor = this.getGeneralColor(card.general);
            
            const skippedStyle = generalOnly ? 'opacity: 0.4; text-decoration: line-through;' : '';
            const skipLabel = generalOnly ? '<span style="color: #fbbf24; font-size: 0.8em; margin-left: 5px;">(skipped)</span>' : '';
            
            // Militia Secures Area: mark secured slot
            const militia1 = this.militiaSecuredSlot === 1;
            const militia2 = this.militiaSecuredSlot === 2;
            const m1Style = militia1 ? 'opacity: 0.4; text-decoration: line-through;' : skippedStyle;
            const m1Label = militia1 ? '<div style="color: #4ade80; font-size: 0.85em; margin-top: 4px;">🛡️ Militia Secures Area — Placement cancelled</div>' : '';
            const m2Style = militia2 ? 'opacity: 0.4; text-decoration: line-through;' : skippedStyle;
            const m2Label = militia2 ? '<div style="color: #4ade80; font-size: 0.85em; margin-top: 4px;">🛡️ Militia Secures Area — Placement cancelled</div>' : '';
            
            // Predict outcomes
            const minion1Warnings = !generalOnly && !militia1 ? this.predictMinionOutcome(card.faction1, card.minions1, card.location1) : [];
            const minion2Warnings = !generalOnly && !militia2 ? this.predictMinionOutcome(card.faction2, card.minions2, card.location2) : [];
            
            // Strong Defenses: mark blocked general
            const sdBlocked = this.strongDefensesActive;
            const sdStyle = sdBlocked ? 'opacity: 0.4; text-decoration: line-through;' : '';
            const sdLabel = sdBlocked ? '<div style="color: #f59e0b; font-size: 0.85em; margin-top: 4px;">🏰 Strong Defenses — General movement cancelled</div>' : '';
            const generalWarnings = sdBlocked ? [] : this.predictGeneralOutcome(card.general, card.minions3, card.location3);
            
            cardContent = `
                <div style="padding: 12px; border: 2px solid #7c3aed; background: rgba(124,58,237,0.1); border-radius: 8px;">
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${militia1 ? '#16a34a' : color1}; background: rgba(0,0,0,0.3); border-radius: 3px; ${m1Style}">
                        <strong style="color: ${color1};">Minion 1:</strong> <strong style="color: ${color1};">${faction1Name}</strong> — ${card.minions1} minion${card.minions1 > 1 ? 's' : ''} → <strong>${card.location1}</strong>${skipLabel}
                        ${!generalOnly && !militia1 ? this.renderPredictionTags(minion1Warnings) : ''}
                        ${m1Label}
                    </div>
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${militia2 ? '#16a34a' : color2}; background: rgba(0,0,0,0.3); border-radius: 3px; ${m2Style}">
                        <strong style="color: ${color2};">Minion 2:</strong> <strong style="color: ${color2};">${faction2Name}</strong> — ${card.minions2} minion${card.minions2 > 1 ? 's' : ''} → <strong>${card.location2}</strong>${skipLabel}
                        ${!generalOnly && !militia2 ? this.renderPredictionTags(minion2Warnings) : ''}
                        ${m2Label}
                    </div>
                    <div style="padding: 8px; margin: 5px 0; border-left: 3px solid ${sdBlocked ? '#f59e0b' : generalColor}; background: rgba(0,0,0,0.3); border-radius: 3px; ${sdStyle}">
                        <strong style="color: ${generalColor};">General:</strong> <strong style="color: ${generalColor};">${generalName}</strong> — ${card.minions3} minion${card.minions3 > 1 ? 's' : ''} → <strong>${card.location3}</strong>
                        ${!sdBlocked ? this.renderPredictionTags(generalWarnings) : ''}
                        ${sdLabel}
                    </div>
                </div>`;
        }
        
        content.innerHTML = `
            <div class="modal-title" style="margin-bottom: 5px;">Step 3 - 🌙 Night</div>
            <div style="text-align: center; font-size: 1.1em; color: #a78bfa; font-weight: bold; margin-bottom: 15px;">Darkness Spreads — Draw Card</div>
            ${cardHeader}
            ${cardContent}
        `;
        
        // Change button to "Resolve Card"
        if (btn) {
            if (card.type === 'all_quiet') {
                btn.textContent = this.darknessCardsDrawn < this.darknessCardsToDraw ? 'Draw Next Card' : 'End Night Phase';
                this.darknessCardPhase = 'resolved'; // Nothing to resolve
                // Log it
                this.addLog(`--- DARKNESS SPREADS ---`);
                this.addLog(`Card: All is Quiet - ${card.description}`);
                this.darknessAllEvents.push({ type: 'all_quiet', description: card.description });
            } else {
                btn.textContent = 'Resolve Card';
            }
            
            // Wizard Wisdom: Add discard button if Wizard is current hero and this is not a re-draw
            const btnContainer = btn.parentElement;
            const existingWisdomBtn = document.getElementById('wisdom-discard-btn');
            if (existingWisdomBtn) existingWisdomBtn.remove();
            const existingMilitiaBtn = document.getElementById('militia-secures-btn');
            if (existingMilitiaBtn) existingMilitiaBtn.remove();
            
            const hero = this.heroes[this.currentPlayerIndex];
            
            // Track how many special buttons we have
            let hasSpecialButtons = false;
            
            if (hero && hero.name === 'Wizard' && !this.wizardWisdomRedraw && card.type !== 'all_quiet') {
                hasSpecialButtons = true;
                btnContainer.style.display = 'flex';
                btnContainer.style.gap = '10px';
                btnContainer.style.justifyContent = 'center';
                btn.style.flex = '1';
                
                const wisdomBtn = document.createElement('button');
                wisdomBtn.id = 'wisdom-discard-btn';
                wisdomBtn.className = 'btn btn-primary';
                wisdomBtn.style.cssText = 'flex: 1; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-color: #8b5cf6;';
                wisdomBtn.textContent = '🔮 Discard (Wisdom)';
                wisdomBtn.onclick = () => game.wizardWisdomDiscard();
                btnContainer.appendChild(wisdomBtn);
            }
            
            // Militia Secures Area & Strong Defenses: Only available during Step 3 (Night Phase)
            if (this._endOfTurnModalMode === 'darkness_card') {
            
            // Militia Secures Area: Show if ANY hero has the card and this is a regular card with minion placements
            const militiaHolder = this._findMilitiaSecuresCard();
            const canUseMilitia = militiaHolder && !generalOnly && !this.militiaSecuredSlot 
                && (card.type === 'regular' || (!card.type && card.faction1)) // regular cards have faction1
                && card.type !== 'all_quiet' && card.type !== 'patrol' && card.type !== 'monarch_city_special';
            
            if (canUseMilitia) {
                if (!hasSpecialButtons) {
                    btnContainer.style.display = 'flex';
                    btnContainer.style.gap = '10px';
                    btnContainer.style.justifyContent = 'center';
                    btn.style.flex = '1';
                }
                hasSpecialButtons = true;
                
                const militiaBtn = document.createElement('button');
                militiaBtn.id = 'militia-secures-btn';
                militiaBtn.className = 'btn btn-primary';
                militiaBtn.style.cssText = 'flex: 1; background: linear-gradient(135deg, #4b5563, #374151); border-color: #6b7280;';
                militiaBtn.textContent = `🛡️ Militia (${militiaHolder.hero.symbol})`;
                militiaBtn.onclick = () => game._militiaSecuresShowPicker();
                btnContainer.appendChild(militiaBtn);
            }
            
            // Strong Defenses: Show if ANY hero has the card and this card has general movement
            const existingStrongBtn = document.getElementById('strong-defenses-btn');
            if (existingStrongBtn) existingStrongBtn.remove();
            
            const strongHolder = this._findStrongDefensesCard();
            const hasGeneral = card.general && card.general !== '';
            const canUseStrong = strongHolder && hasGeneral && !this.strongDefensesActive
                && card.type !== 'all_quiet' && card.type !== 'monarch_city_special';
            
            if (canUseStrong) {
                if (!hasSpecialButtons) {
                    btnContainer.style.display = 'flex';
                    btnContainer.style.gap = '10px';
                    btnContainer.style.justifyContent = 'center';
                    btn.style.flex = '1';
                }
                hasSpecialButtons = true;
                
                const strongBtn = document.createElement('button');
                strongBtn.id = 'strong-defenses-btn';
                strongBtn.className = 'btn btn-primary';
                strongBtn.style.cssText = 'flex: 1; background: linear-gradient(135deg, #b45309, #92400e); border-color: #f59e0b;';
                const genName = this.generals.find(g => g.color === card.general)?.name || 'General';
                strongBtn.textContent = `🏰 Block ${genName} (${strongHolder.hero.symbol})`;
                strongBtn.onclick = () => game._strongDefensesConfirm();
                btnContainer.appendChild(strongBtn);
            }
            
            // Show militia secured indicator if already active
            if (this.militiaSecuredSlot) {
                const securedDiv = document.createElement('div');
                securedDiv.style.cssText = 'text-align: center; margin-top: 8px; padding: 6px; background: rgba(22,163,74,0.2); border: 1px solid #16a34a; border-radius: 4px;';
                securedDiv.innerHTML = `<span style="color: #4ade80; font-size: 0.9em;">🛡️ Militia Secures Area active — Minion ${this.militiaSecuredSlot} placement will be cancelled</span>`;
                content.appendChild(securedDiv);
            }
            
            // Show strong defenses indicator if already active
            if (this.strongDefensesActive) {
                const sdDiv = document.createElement('div');
                sdDiv.style.cssText = 'text-align: center; margin-top: 8px; padding: 6px; background: rgba(245,158,11,0.2); border: 1px solid #f59e0b; border-radius: 4px;';
                const genName = this.generals.find(g => g.color === card.general)?.name || 'General';
                sdDiv.innerHTML = `<span style="color: #f59e0b; font-size: 0.9em;">🏰 Strong Defenses active — ${genName} movement will be cancelled</span>`;
                content.appendChild(sdDiv);
            }
            
            if (!hasSpecialButtons && !this.militiaSecuredSlot && !this.strongDefensesActive) {
                // Reset container to centered single button
                btnContainer.style.display = '';
                btnContainer.style.gap = '';
                btnContainer.style.justifyContent = '';
                btn.style.flex = '';
            }
            
            } // End of Step 3 guard for Militia/Strong Defenses
        }
        
        // Mode already set to 'darkness_card' by proceedToNightPhase
    },
    
    wizardWisdomDiscard() {
        const hero = this.heroes[this.currentPlayerIndex];
        if (!hero || hero.name !== 'Wizard') return;
        
        const discardedCard = this.darknessCurrentCard;
        this.wizardWisdomRedraw = true;
        
        // Log the discard
        let cardDesc = '';
        if (discardedCard.type === 'patrol' || discardedCard.type === 'monarch_city_special') {
            cardDesc = discardedCard.patrolName;
        } else {
            const generalName = this.generals.find(g => g.color === discardedCard.general)?.name || 'Unknown';
            cardDesc = `${generalName} card`;
        }
        this.addLog(`🔮 Wisdom: Wizard discards "${cardDesc}" and draws a new Darkness Spreads card.`);
        
        // Reshuffle if deck is empty
        if (!this.darknessDeck || this.darknessDeck.length === 0) {
            if (this.darknessDiscardPile > 0) {
                this.darknessDeck = this.createDarknessDeck();
                this.darknessDiscardPile = 0;
                this.addLog('--- Darkness Spreads deck reshuffled from discard pile ---');
            } else {
                this.darknessDeck = this.createDarknessDeck();
                this.addLog('--- Darkness Spreads deck reshuffled ---');
            }
        }
        
        // Draw replacement card
        const newCard = this.darknessDeck.shift();
        this.darknessDiscardPile++; // Discarded card goes to discard pile too
        this.darknessCurrentCard = newCard;
        this.darknessCurrentEvents = [];
        this.darknessCardPhase = 'preview';
        this.updateDeckCounts();
        
        // Show the new card preview (wizardWisdomRedraw = true prevents another Wisdom button)
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showDarknessCardPreview(newCard, cardNum, totalCards, generalOnly);
    },
    
    resolveDarknessCard() {
        const card = this.darknessCurrentCard;
        const generalOnly = this.darknessCurrentGeneralOnly;
        const events = [];
        
        try {
        // Handle all_quiet cards (no minions or general movement)
        if (card.type === 'all_quiet') {
            this.addLog(`--- DARKNESS SPREADS ---`);
            this.addLog(`Card: All is Quiet - ${card.description}`);
            this.darknessAllEvents.push({ type: 'all_quiet', description: card.description });
            this.darknessCardPhase = 'resolved';
            this.showDarknessCardResults(events);
            return;
        }
        
        // Process the card
        if (card.type === 'patrol') {
            this.addLog(`--- DARKNESS SPREADS ---`);
            const isWarParty = card.patrolType === 'orc_war_party';
            if (generalOnly) {
                this.addLog(`Card: ${card.patrolName} (GENERAL ONLY - patrol skipped)`);
            } else if (isWarParty) {
                this.addLog(`Card: ${card.patrolName} - Add 1 orc to each location with exactly 1 orc and no other minions`);
                let patrolCount = 0;
                for (let locationName in this.locationCoords) {
                    const minionsAtLocation = this.minions[locationName];
                    if (minionsAtLocation) {
                        const greenCount = minionsAtLocation['green'] || 0;
                        const otherCount = Object.entries(minionsAtLocation).filter(([c]) => c !== 'green').reduce((s, [, n]) => s + n, 0);
                        if (greenCount === 1 && otherCount === 0) {
                            this.processMinionPlacement('green', 1, locationName, events);
                            patrolCount++;
                        }
                    }
                }
                const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
                events.unshift({
                    type: 'patrol',
                    patrolName: card.patrolName,
                    general: generalName,
                    generalColor: card.general,
                    locationsPatrolled: patrolCount
                });
            } else {
                this.addLog(`Card: ${card.patrolName} - Add 1 green minion to each empty green location`);
                let patrolCount = 0;
                for (let locationName in this.locationCoords) {
                    const coords = this.locationCoords[locationName];
                    if (coords.faction === 'green') {
                        const minionsAtLocation = this.minions[locationName];
                        if (!minionsAtLocation || !minionsAtLocation['green'] || minionsAtLocation['green'] === 0) {
                            this.processMinionPlacement('green', 1, locationName, events);
                            patrolCount++;
                        }
                    }
                }
                const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
                events.unshift({
                    type: 'patrol',
                    patrolName: card.patrolName,
                    general: generalName,
                    generalColor: card.general,
                    locationsPatrolled: patrolCount
                });
            }
            // Strong Defenses: skip general movement
            if (this.strongDefensesActive) {
                const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
                events.push({
                    type: 'strong_defenses',
                    general: generalName,
                    color: card.general,
                    minions: card.minions3,
                    location: card.location3
                });
                this.addLog(`  🏰 Strong Defenses: ${generalName} movement to ${card.location3} BLOCKED`);
                this.strongDefensesActive = false;
            } else {
                this.processGeneralMovement(card.general, card.minions3, card.location3, events);
            }
        } else if (card.type === 'monarch_city_special') {
            this.addLog(`--- DARKNESS SPREADS ---`);
            this.addLog(`Card: Monarch City Special — Place 1 minion of each adjacent color, No Overruns, Reshuffle All Decks, No Generals Move`);
            
            // Find which colors have minions adjacent to Monarch City
            const monarchConnected = this.locationConnections['Monarch City'] || [];
            const colorsPresent = new Set();
            
            monarchConnected.forEach(loc => {
                const minionsObj = this.minions[loc];
                if (!minionsObj) return;
                for (const [color, count] of Object.entries(minionsObj)) {
                    if (count > 0) colorsPresent.add(color);
                }
            });
            
            // Place 1 minion of each present color in Monarch City (no overruns)
            const colorsPlaced = [];
            const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            ['green', 'red', 'black', 'blue'].forEach(color => {
                if (!colorsPresent.has(color)) return;
                this.processMinionPlacement(color, 1, 'Monarch City', events, false, true);
                colorsPlaced.push(color);
                this.addLog(`  🏰 +1 ${factionNames[color]} minion placed in Monarch City (no overrun)`);
            });
            
            // Add special event for results display
            events.unshift({
                type: 'monarch_city_special',
                colorsPlaced: colorsPlaced,
                totalPlaced: colorsPlaced.length
            });
            
            // Reshuffle all decks
            this.darknessDeck = this.createDarknessDeck();
            this.heroDeck = this.createHeroDeckFromDiscard();
            this.heroDiscardPile = 0;
            this.updateDeckCounts();
            this.addLog(`🔄 All decks reshuffled!`);
            
            events.push({
                type: 'deck_reshuffle',
                description: 'All decks have been reshuffled'
            });
            
            // No generals move - explicitly add event
            events.push({
                type: 'no_generals',
                description: 'No Generals move this turn'
            });
        } else {
            // Regular card
            const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
            const faction1Name = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
            const faction2Name = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
            this.addLog(`--- DARKNESS SPREADS ---`);
            
            if (generalOnly) {
                this.addLog(`Card: ${generalName} GENERAL ONLY (${card.minions3} @ ${card.location3})`);
                events.push({
                    type: 'general_only_notice',
                    general: generalName,
                    color: card.general,
                    skippedFaction1: faction1Name,
                    skippedMinions1: card.minions1,
                    skippedLocation1: card.location1,
                    skippedFaction2: faction2Name,
                    skippedMinions2: card.minions2,
                    skippedLocation2: card.location2
                });
            } else {
                this.addLog(`Card: ${faction1Name} (${card.minions1} @ ${card.location1}), ${faction2Name} (${card.minions2} @ ${card.location2}), ${generalName} (${card.minions3} @ ${card.location3})`);
                
                // Militia Secures Area: skip secured slot
                if (this.militiaSecuredSlot === 1) {
                    const securedFaction = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
                    events.push({
                        type: 'militia_secured',
                        faction: securedFaction,
                        color: card.faction1,
                        count: card.minions1,
                        location: card.location1
                    });
                    this.addLog(`  🛡️ Militia Secures Area: ${securedFaction} placement (${card.minions1} @ ${card.location1}) CANCELLED`);
                } else {
                    this.processMinionPlacement(card.faction1, card.minions1, card.location1, events);
                }
                
                if (this.militiaSecuredSlot === 2) {
                    const securedFaction = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
                    events.push({
                        type: 'militia_secured',
                        faction: securedFaction,
                        color: card.faction2,
                        count: card.minions2,
                        location: card.location2
                    });
                    this.addLog(`  🛡️ Militia Secures Area: ${securedFaction} placement (${card.minions2} @ ${card.location2}) CANCELLED`);
                } else {
                    this.processMinionPlacement(card.faction2, card.minions2, card.location2, events);
                }
            }
            
            // Clear militia state after resolve
            this.militiaSecuredSlot = null;
            
            // Strong Defenses: skip general movement
            if (this.strongDefensesActive) {
                const genName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
                events.push({
                    type: 'strong_defenses',
                    general: genName,
                    color: card.general,
                    minions: card.minions3,
                    location: card.location3
                });
                this.addLog(`  🏰 Strong Defenses: ${genName} movement to ${card.location3} BLOCKED`);
                this.strongDefensesActive = false;
            } else {
                this.processGeneralMovement(card.general, card.minions3, card.location3, events);
            }
        }
        
        this.darknessCurrentEvents = events;
        this.darknessAllEvents.push(...events);
        this.darknessCardPhase = 'resolved';
        
        this.renderTokens();
        this.renderGenerals();
        this.updateDeckCounts();
        
        // Show resolution results
        this.showDarknessCardResults(events);
        } catch(err) {
            console.error('[RESOLVE] ERROR in resolveDarknessCard:', err);
        }
    },
    
    showDarknessCardResults(events) {
        const content = document.getElementById('end-of-turn-content');
        const btn = document.getElementById('end-of-turn-btn');
        
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        
        let cardHeader = '';
        if (totalCards > 1) {
            const modeText = generalOnly ? 'General Advance Only' : 'Full Card';
            const modeColor = generalOnly ? '#fbbf24' : '#4ade80';
            cardHeader = `<div style="text-align: center; margin-bottom: 10px;">
                <strong style="color: #d4af37; font-size: 1.1em;">Card ${cardNum} of ${totalCards}</strong>
                <span style="color: ${modeColor}; font-size: 0.95em; margin-left: 8px;">(${modeText})</span>
            </div>`;
        }
        
        // Render events using the reusable rendering logic
        let darknessHTML = '<div style="max-height: 350px; overflow-y: auto;">';
        if (events && events.length > 0) {
            darknessHTML += this.renderDarknessEvents(events);
        } else {
            darknessHTML += '<div style="text-align: center; color: #4ade80; font-size: 1.1em; font-weight: bold; padding: 15px;">🌅 All is Quiet - No darkness events</div>';
        }
        darknessHTML += '</div>';
        
        content.innerHTML = `
            <div class="modal-title" style="margin-bottom: 5px;">Step 3 - 🌙 Night</div>
            <div style="text-align: center; font-size: 1.1em; color: #a78bfa; font-weight: bold; margin-bottom: 15px;">Darkness Spreads — Results</div>
            ${cardHeader}
            <div style="padding: 15px; background: rgba(0, 0, 0, 0.4); border: 2px solid #7c3aed; border-radius: 8px;">
                ${darknessHTML}
            </div>
        `;
        
        // Update button text
        if (btn) {
            btn.textContent = cardNum < totalCards ? 'Draw Next Card' : 'End Night Phase';
            
            // Remove Wisdom button if present from preview phase
            const existingWisdomBtn = document.getElementById('wisdom-discard-btn');
            if (existingWisdomBtn) existingWisdomBtn.remove();
            const btnContainer = btn.parentElement;
            btnContainer.style.display = '';
            btnContainer.style.gap = '';
            btnContainer.style.justifyContent = '';
            btn.style.flex = '';
        }
    },
    
});
