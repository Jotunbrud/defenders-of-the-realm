// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Hero Actions (Heal, Draw, Rumors)
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    healAction() {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const location = hero.location;
        
        // Check for minions or generals at location
        const minionsHere = this.minions[location];
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        const generalHere = this.generals.find(g => !g.defeated && g.location === location);
        
        // Full heal at Inn (regardless of enemies)
        if (this.locationCoords[location].type === 'inn') {
            hero.health = hero.maxHealth;
            this.actionsRemaining--;
            this.addLog(`${hero.name} fully healed at ${location}!`);
            this.renderHeroes();
            this.updateGameStatus();
            return;
        }
        
        // Full heal at Monarch City ONLY if safe
        if (location === 'Monarch City' && totalMinions === 0 && !generalHere) {
            hero.health = hero.maxHealth;
            this.actionsRemaining--;
            this.addLog(`${hero.name} fully healed at ${location}!`);
            this.renderHeroes();
            this.updateGameStatus();
            return;
        }
        
        // Heal 2 wounds at safe location (no minions or generals)
        if (totalMinions === 0 && !generalHere) {
            const healAmount = Math.min(2, hero.maxHealth - hero.health);
            hero.health += healAmount;
            this.actionsRemaining--;
            this.addLog(`${hero.name} healed ${healAmount} wounds`);
            this.renderHeroes();
            this.updateGameStatus();
            return;
        }
        
        // Cannot heal with enemies present
        this.showInfoModal('⚠️', '<div>Cannot heal - minions or general present! (Inns allow healing with enemies present)</div>');
    },
    
    healingWoundsAction() {
        // Action button version - calls healAtLocation with current location
        const hero = this.heroes[this.currentPlayerIndex];
        this.healAtLocation(hero.location);
    },
    
    healAtLocation(locationName) {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        if (hero.health >= hero.maxHealth) {
            this.showInfoModal('⚠️', '<div>Already at full health!</div>');
            return;
        }
        
        // Check for minions or generals at location
        const minionsHere = this.minions[locationName];
        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
        const generalHere = this.generals.find(g => !g.defeated && g.location === locationName);
        
        // Full heal at Inn (regardless of enemies)
        if (this.locationCoords[locationName].type === 'inn') {
            hero.health = hero.maxHealth;
            this.actionsRemaining--;
            this.addLog(`${hero.name} fully healed at ${locationName}!`);
            this.hideTooltip(true);
            this.renderHeroes();
            this.updateGameStatus();
            
            // Update map if open
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                const mapActionsLeft = document.getElementById('map-actions-left');
                if (mapActionsLeft) {
                    mapActionsLeft.textContent = this.actionsRemaining;
                }
                
                // Update action buttons since hero is now healed
                this.updateActionButtons();
            }
            return;
        }
        
        // Full heal at Monarch City ONLY if safe
        if (locationName === 'Monarch City' && totalMinions === 0 && !generalHere) {
            hero.health = hero.maxHealth;
            this.actionsRemaining--;
            this.addLog(`${hero.name} fully healed at ${locationName}!`);
            this.hideTooltip(true);
            this.renderHeroes();
            this.updateGameStatus();
            
            // Update map if open
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                const mapActionsLeft = document.getElementById('map-actions-left');
                if (mapActionsLeft) {
                    mapActionsLeft.textContent = this.actionsRemaining;
                }
                
                // Update action buttons since hero is now healed
                this.updateActionButtons();
            }
            return;
        }
        
        // Heal 2 wounds at safe location (no minions or generals)
        if (totalMinions === 0 && !generalHere) {
            const healAmount = Math.min(2, hero.maxHealth - hero.health);
            hero.health += healAmount;
            this.actionsRemaining--;
            this.addLog(`${hero.name} healed ${healAmount} wound${healAmount > 1 ? 's' : ''} at ${locationName}`);
            this.hideTooltip(true);
            this.renderHeroes();
            this.updateGameStatus();
            
            // Update map if open
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                const mapActionsLeft = document.getElementById('map-actions-left');
                if (mapActionsLeft) {
                    mapActionsLeft.textContent = this.actionsRemaining;
                }
                
                // Update action buttons since hero may be fully healed now
                this.updateActionButtons();
            }
            return;
        }
        
        // Cannot heal with enemies present
        this.showInfoModal('⚠️', '<div>Cannot heal - minions or general present! (Inns allow healing with enemies present)</div>');
    },
    
    drawCard() {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        const randomCard = this.generateRandomCard();
        if (!randomCard) {
            this.showInfoModal('⚠️', '<div>Hero deck is empty!</div>');
            return;
        }
        
        hero.cards.push(randomCard);
        this.actionsRemaining--;
        this.addLog(`${hero.name} drew: ${randomCard.name}`);
        this.updateGameStatus();
        this.renderHeroes();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
        }
        
        // Show card modal
        this.showCardDrawn(randomCard);
    },
    
    showCardDrawn(card) {
        const cardDisplay = document.getElementById('card-display');
        
        const borderColor = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        }[card.color] || '#8B7355';
        
        // Map color to general name
        const colorToGeneral = {
            'red': 'Balazarg (Demons)',
            'blue': 'Sapphire (Dragonkin)',
            'green': 'Gorgutt (Orcs)',
            'black': 'Varkolak (Undead)'
        };
        
        const diceHTML = card.dice > 0 ? 
            Array(card.dice).fill(0).map(() => 
                `<div class="card-die" style="background: ${borderColor}; color: #fff;">🎲</div>`
            ).join('') : '';
        
        cardDisplay.innerHTML = `
            <div class="card-visual" style="border-color: ${borderColor};">
                <div class="card-title">${card.icon} ${card.name}</div>
                <div style="text-align: center; margin: 8px 0;">
                    <div style="color: ${borderColor}; font-size: 1.1em; font-weight: bold;">
                        ${card.type}
                    </div>
                </div>
                ${card.dice > 0 ? `
                    <div style="text-align: center; margin: 10px 0;">
                        <div style="color: #d4af37; font-size: 0.9em; margin-bottom: 5px;">Combat Dice</div>
                        <div class="card-dice">${diceHTML}</div>
                    </div>
                ` : ''}
                <div style="text-align: center; margin: 10px 0; color: ${borderColor}; font-weight: bold;">
                    vs ${colorToGeneral[card.color] || 'Any General'}
                </div>
                <div class="card-effect" style="font-size: 0.9em; color: #ccc;">
                    Use at ${card.name} location or to fight ${card.color} generals
                </div>
            </div>
        `;
        
        document.getElementById('card-modal').classList.add('active');
    },
    
    closeCardModal() {
        document.getElementById('card-modal').classList.remove('active');
    },
    
    rumorsAction() {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        // Check if rumors used more than twice this turn
        if (this.rumorsUsedThisTurn >= 2) {
            this.showInfoModal('⚠️', '<div>You can only use Rumors twice per turn!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const location = this.locationCoords[hero.location];
        
        if (!location || location.type !== 'inn') {
            this.showInfoModal('⚠️', '<div>You must be at an Inn to perform the Rumors action!</div>');
            return;
        }
        
        // Hide tooltip if called from map
        this.hideTooltip(true);
        
        // Show color selection modal
        const colorOptions = [
            { color: 'black', label: 'Undead', hex: '#6b7280', icon: '💀' },
            { color: 'blue', label: 'Dragonkin', hex: '#3b82f6', icon: '🐉' },
            { color: 'green', label: 'Orcs', hex: '#16a34a', icon: '🪓' },
            { color: 'red', label: 'Demons', hex: '#dc2626', icon: '🔥' }
        ];
        
        let optionsHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">';
        colorOptions.forEach(opt => {
            optionsHTML += `
                <div id="rumors-color-${opt.color}" 
                     onclick="game._rumorsSelectColor('${opt.color}')"
                     style="border: 3px solid ${opt.hex}; cursor: pointer; padding: 14px; border-radius: 8px; background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%); transition: all 0.2s; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
                     onmouseover="if(!this.classList.contains('rum-selected')) this.style.boxShadow='0 4px 12px rgba(0,0,0,0.5)'"
                     onmouseout="if(!this.classList.contains('rum-selected')) this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)'">
                    <div style="font-size: 1.5em;">${opt.icon}</div>
                    <div style="color: ${opt.hex}; font-weight: bold; margin-top: 4px; font-family:'Cinzel',Georgia,serif;">${opt.label}</div>
                    <div style="color: #6b5b4a; font-size: 0.85em;">${opt.color.toUpperCase()}</div>
                </div>
            `;
        });
        optionsHTML += '</div>';
        
        const contentHTML = `
            <div class="modal-heading" style="text-align: center; font-size:0.85em; color:#d4af37; margin-bottom: 10px;">
                Choose a color — you will draw 2 cards and keep all that match this color, plus any Special cards. Non-matching cards are discarded.
            </div>
            ${optionsHTML}
            <div id="rumors-confirm-btn-row" style="display: none;">
                <button id="rumors-confirm-btn" class="phase-btn" onclick="game._rumorsConfirmColor()">Confirm</button>
            </div>
            <button class="phase-btn" onclick="game._rumorsSelectedColor = null; game.closeInfoModal()">Continue</button>
        `;
        
        this._rumorsSelectedColor = null;
        this.showInfoModal('🍺 Rumors at the Inn', contentHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '12px'; }
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#rumors-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _rumorsSelectColor(color) {
        this._rumorsSelectedColor = color;
        
        // Clear all selections
        ['black', 'blue', 'green', 'red'].forEach(c => {
            const el = document.getElementById(`rumors-color-${c}`);
            if (el) {
                el.classList.remove('rum-selected');
                el.style.borderColor = '';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            }
        });
        
        // Highlight selected
        const selected = document.getElementById(`rumors-color-${color}`);
        if (selected) {
            selected.classList.add('rum-selected');
            selected.style.borderColor = '#d4af37';
            selected.style.boxShadow = '0 0 12px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.4)';
        }
        
        // Show confirm button
        const btnRow = document.getElementById('rumors-confirm-btn-row');
        if (btnRow) btnRow.style.display = 'block';
    },
    
    _rumorsConfirmColor() {
        const color = this._rumorsSelectedColor;
        if (!color) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        this.closeInfoModal();
        
        // Increment rumors counter and use action
        this.rumorsUsedThisTurn++;
        this.actionsRemaining--;
        
        // Draw 2 cards
        const drawnCards = [];
        for (let i = 0; i < 2; i++) {
            const c = this.generateRandomCard();
            if (c) drawnCards.push(c);
        }
        
        if (drawnCards.length === 0) {
            this.showInfoModal('⚠️', '<div>Hero deck is empty!</div>');
            return;
        }
        
        const colorNames = { black: 'Undead', blue: 'Dragonkin', green: 'Orcs', red: 'Demons' };
        const colorHexes = { black: '#6b7280', blue: '#3b82f6', green: '#16a34a', red: '#dc2626' };
        const chosenName = colorNames[color] || color;
        const chosenHex = colorHexes[color] || '#d4af37';
        
        // Partition: keep matching color + special cards
        const kept = [];
        const discarded = [];
        
        drawnCards.forEach(c => {
            if (c.special) {
                kept.push({ card: c, reason: 'special' });
            } else if (c.color === color) {
                kept.push({ card: c, reason: 'color' });
            } else {
                discarded.push(c);
            }
        });
        
        // Add kept cards to hero's hand
        kept.forEach(k => hero.cards.push(k.card));
        
        // Discard the rest
        this.heroDiscardPile += discarded.length;
        this.updateDeckCounts();
        
        this.addLog(`🍺 Rumors: ${hero.name} called ${chosenName}, drew ${drawnCards.length} cards, kept ${kept.length}`);
        
        this.updateGameStatus();
        this.renderHeroes();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
            this.updateMovementButtons();
            this.updateActionButtons();
        }
        
        // Build results HTML
        const cardColorMap = { red: '#dc2626', blue: '#2563eb', green: '#16a34a', black: '#1f2937' };
        
        const renderCard = (c, badge) => {
            const cc = c.special ? { border: '#6d28a8', text: '#6d28a8' } : { border: cardColorMap[c.color] || '#8B7355', text: cardColorMap[c.color] || '#8B7355' };
            return `<div style="background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%); border: 3px solid ${cc.border}; border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <span style="font-size: 1.3em;">${c.icon || '🃏'}</span>
                <div style="flex: 1;">
                    <div style="font-family:'Cinzel',Georgia,serif; font-weight:900; font-size:0.8em; color:${cc.text};">${c.name}</div>
                    <div style="font-size: 0.75em; color: #6b5b4a;">${c.special ? '🌟 Special' : c.type} · ${c.dice} ${c.dice === 1 ? 'die' : 'dice'}</div>
                </div>
                ${badge}
            </div>`;
        };
        
        let cardsResultHTML = '<div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 5px;">';
        
        kept.forEach(k => {
            const badge = k.reason === 'special' 
                ? '<span style="font-family:\'Cinzel\',Georgia,serif; font-weight:900; color: #6d28a8; font-size: 0.75em;">✓ KEPT</span>'
                : `<span style="font-family:'Cinzel',Georgia,serif; font-weight:900; color: #15803d; font-size: 0.75em;">✓ KEPT</span>`;
            cardsResultHTML += renderCard(k.card, badge);
        });
        
        discarded.forEach(c => {
            cardsResultHTML += renderCard(c, '<span style="font-family:\'Cinzel\',Georgia,serif; font-weight:900; color: #b91c1c; font-size: 0.75em;">✗ Discarded</span>');
        });
        
        cardsResultHTML += '</div>';
        
        const summaryHTML = `
            <div class="modal-heading" style="text-align: center; font-size:0.85em; color:#d4af37; margin-bottom: 12px;">
                Called color: <strong style="color: ${chosenHex};">${chosenName} (${color.toUpperCase()})</strong><br>
                <span style="color: #d4af37;">${kept.length} card${kept.length !== 1 ? 's' : ''} kept · ${discarded.length} discarded</span>
            </div>
            ${cardsResultHTML}
            <div class="modal-heading" style="text-align: center; font-size:0.78em; color:#d4af37; margin-top: 12px;">1 action used · ${2 - this.rumorsUsedThisTurn} Inn action${2 - this.rumorsUsedThisTurn !== 1 ? 's' : ''} remaining this turn</div>
        `;
        
        this._rumorsSelectedColor = null;
        
        this.showInfoModal('🍺 Rumors — Results', summaryHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '12px'; }
    },
    
    // Rogue Crafty: Draw 5 cards at Inn, keep matching color + specials (like Local Information)
    craftyAction() {
        // Cancel any active movement
        if (this.activeMovement) {
            this.clearMovementMode();
        }
        
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        if (hero.name !== 'Rogue') {
            this.showInfoModal('⚠️', '<div>Only the Rogue can use Crafty!</div>');
            return;
        }
        
        // Shared counter with Rumors
        if (this.rumorsUsedThisTurn >= 2) {
            this.showInfoModal('⚠️', '<div>You can only use Inn actions twice per turn!</div>');
            return;
        }
        
        const location = this.locationCoords[hero.location];
        if (!location || location.type !== 'inn') {
            this.showInfoModal('⚠️', '<div>You must be at an Inn to use Crafty!</div>');
            return;
        }
        
        // Hide tooltip if called from map
        this.hideTooltip(true);
        
        // Show color selection modal (same as Local Information)
        const colorOptions = [
            { color: 'black', label: 'Undead', hex: '#6b7280', icon: '💀' },
            { color: 'blue', label: 'Dragonkin', hex: '#3b82f6', icon: '🐉' },
            { color: 'green', label: 'Orcs', hex: '#16a34a', icon: '🪓' },
            { color: 'red', label: 'Demons', hex: '#dc2626', icon: '🔥' }
        ];
        
        let optionsHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">';
        colorOptions.forEach(opt => {
            optionsHTML += `
                <div id="crafty-color-${opt.color}" 
                     onclick="game._craftySelectColor('${opt.color}')"
                     style="border: 3px solid ${opt.hex}; cursor: pointer; padding: 14px; border-radius: 8px; background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%); transition: all 0.2s; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
                     onmouseover="if(!this.classList.contains('crf-selected')) this.style.boxShadow='0 4px 12px rgba(0,0,0,0.5)'"
                     onmouseout="if(!this.classList.contains('crf-selected')) this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)'">
                    <div style="font-size: 1.5em;">${opt.icon}</div>
                    <div style="color: ${opt.hex}; font-weight: bold; margin-top: 4px; font-family:'Cinzel',Georgia,serif;">${opt.label}</div>
                    <div style="color: #6b5b4a; font-size: 0.85em;">${opt.color.toUpperCase()}</div>
                </div>
            `;
        });
        optionsHTML += '</div>';
        
        const contentHTML = `
            <div class="modal-heading" style="text-align: center; font-size:0.85em; color:#d4af37; margin-bottom: 10px;">
                Choose a color — you will draw <strong>5 cards</strong> and keep all that match this color, plus any Special cards. Non-matching cards are discarded.
            </div>
            ${optionsHTML}
            <div id="crafty-confirm-btn-row" style="display: none;">
                <button id="crafty-confirm-btn" class="phase-btn" onclick="game._craftyConfirmColor()">Confirm</button>
            </div>
            <button class="phase-btn" onclick="game._craftySelectedColor = null; game.closeInfoModal()">Continue</button>
        `;
        
        this._craftySelectedColor = null;
        this.showInfoModal('🗡️ Crafty', contentHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '12px'; }
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#crafty-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _craftySelectColor(color) {
        this._craftySelectedColor = color;
        
        ['black', 'blue', 'green', 'red'].forEach(c => {
            const el = document.getElementById(`crafty-color-${c}`);
            if (el) {
                el.classList.remove('crf-selected');
                el.style.borderColor = '';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            }
        });
        
        const selected = document.getElementById(`crafty-color-${color}`);
        if (selected) {
            selected.classList.add('crf-selected');
            selected.style.borderColor = '#d4af37';
            selected.style.boxShadow = '0 0 12px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.4)';
        }
        
        const btnRow = document.getElementById('crafty-confirm-btn-row');
        if (btnRow) btnRow.style.display = 'block';
    },
    
    _craftyConfirmColor() {
        const color = this._craftySelectedColor;
        if (!color) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        this.closeInfoModal();
        
        // Uses shared Inn action counter
        this.rumorsUsedThisTurn++;
        this.actionsRemaining--;
        
        // Draw 5 cards (like Local Information)
        const drawnCards = [];
        for (let i = 0; i < 5; i++) {
            const c = this.generateRandomCard();
            if (c) drawnCards.push(c);
        }
        
        if (drawnCards.length === 0) {
            this.showInfoModal('⚠️', '<div>Hero deck is empty!</div>');
            return;
        }
        
        const colorNames = { black: 'Undead', blue: 'Dragonkin', green: 'Orcs', red: 'Demons' };
        const colorHexes = { black: '#6b7280', blue: '#3b82f6', green: '#16a34a', red: '#dc2626' };
        const chosenName = colorNames[color] || color;
        const chosenHex = colorHexes[color] || '#d4af37';
        
        // Partition: keep matching color + special cards
        const kept = [];
        const discarded = [];
        
        drawnCards.forEach(c => {
            if (c.special) {
                kept.push({ card: c, reason: 'special' });
            } else if (c.color === color) {
                kept.push({ card: c, reason: 'color' });
            } else {
                discarded.push(c);
            }
        });
        
        // Add kept cards to hero's hand
        kept.forEach(k => hero.cards.push(k.card));
        
        // Discard the rest
        this.heroDiscardPile += discarded.length;
        this.updateDeckCounts();
        
        this.addLog(`🗡️ Crafty: ${hero.name} called ${chosenName}, drew ${drawnCards.length} cards, kept ${kept.length}`);
        
        this.updateGameStatus();
        this.renderHeroes();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
            this.updateMovementButtons();
            this.updateActionButtons();
        }
        
        // Build results HTML (same format as Local Information)
        const cardColorMap = { red: '#dc2626', blue: '#2563eb', green: '#16a34a', black: '#1f2937' };
        
        const renderCard = (c, badge) => {
            const cc = c.special ? { border: '#6d28a8', text: '#6d28a8' } : { border: cardColorMap[c.color] || '#8B7355', text: cardColorMap[c.color] || '#8B7355' };
            return `<div style="background: linear-gradient(135deg, #f0e6d3 0%, #ddd0b8 50%, #c8bb9f 100%); border: 3px solid ${cc.border}; border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <span style="font-size: 1.3em;">${c.icon || '🃏'}</span>
                <div style="flex: 1;">
                    <div style="font-family:'Cinzel',Georgia,serif; font-weight:900; font-size:0.8em; color:${cc.text};">${c.name}</div>
                    <div style="font-size: 0.75em; color: #6b5b4a;">${c.special ? '🌟 Special' : c.type} · ${c.dice} ${c.dice === 1 ? 'die' : 'dice'}</div>
                </div>
                ${badge}
            </div>`;
        };
        
        let cardsResultHTML = '<div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 5px;">';
        
        kept.forEach(k => {
            const badge = k.reason === 'special' 
                ? '<span style="font-family:\'Cinzel\',Georgia,serif; font-weight:900; color: #6d28a8; font-size: 0.75em;">✓ KEPT</span>'
                : `<span style="font-family:'Cinzel',Georgia,serif; font-weight:900; color: #15803d; font-size: 0.75em;">✓ KEPT</span>`;
            cardsResultHTML += renderCard(k.card, badge);
        });
        
        discarded.forEach(c => {
            cardsResultHTML += renderCard(c, '<span style="font-family:\'Cinzel\',Georgia,serif; font-weight:900; color: #b91c1c; font-size: 0.75em;">✗ Discarded</span>');
        });
        
        cardsResultHTML += '</div>';
        
        const summaryHTML = `
            <div class="modal-heading" style="text-align: center; font-size:0.85em; color:#d4af37; margin-bottom: 12px;">
                Called color: <strong style="color: ${chosenHex};">${chosenName} (${color.toUpperCase()})</strong><br>
                <span style="color: #d4af37;">${kept.length} card${kept.length !== 1 ? 's' : ''} kept · ${discarded.length} discarded</span>
            </div>
            ${cardsResultHTML}
            <div class="modal-heading" style="text-align: center; font-size:0.78em; color:#d4af37; margin-top: 12px;">1 action used · ${2 - this.rumorsUsedThisTurn} Inn action${2 - this.rumorsUsedThisTurn !== 1 ? 's' : ''} remaining this turn</div>
        `;
        
        this._craftySelectedColor = null;
        
        this.showInfoModal('🗡️ Crafty — Results', summaryHTML);
        const titleEl = document.getElementById('info-modal-title');
        if (titleEl) { titleEl.className = 'modal-heading'; titleEl.style.textAlign = 'center'; titleEl.style.fontSize = '1.15em'; titleEl.style.marginBottom = '12px'; }
    },
    
    showRumorsModal(card1, card2) {
        // Legacy — no longer used for Rumors, kept for compatibility
        const modal = document.getElementById('rumors-modal');
        const content = document.getElementById('rumors-content');
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        const colorToGeneralWithFaction = {
            'red': 'Balazarg (Demons)',
            'blue': 'Sapphire (Dragonkin)',
            'green': 'Gorgutt (Orcs)',
            'black': 'Varkolak (Undead)'
        };
        
        const cardsHTML = [card1, card2].map(card => {
            const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
            const generalWithFaction = colorToGeneralWithFaction[card.color] || 'Any General';
            const cardIcon = card.icon || '🎴';
            return `
                <div style="flex: 1; padding: 15px; margin: 5px; border: 3px solid ${borderColor}; border-radius: 8px; background: rgba(0,0,0,0.5);">
                    <div style="text-align: center; font-size: 1.5em; margin-bottom: 8px;">
                        ${cardIcon}
                    </div>
                    <div style="font-size: 1.1em; font-weight: bold; color: ${borderColor}; margin-bottom: 8px; text-align: center;">
                        ${card.name}
                    </div>
                    <div style="text-align: center; margin: 8px 0;">
                        ${Array(card.dice).fill(0).map(() => 
                            `<span style="display: inline-block; width: 24px; height: 24px; background: ${borderColor}; border-radius: 4px; margin: 2px; line-height: 24px; text-align: center; font-weight: bold;">🎲</span>`
                        ).join('')}
                    </div>
                    <div style="font-size: 0.9em; color: #d4af37; text-align: center;">
                        ${card.special ? "🌟 Special" : "vs " + generalWithFaction}
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div style="margin: 20px 0;">
                <div style="font-size: 1.1em; color: #ffd700; font-weight: bold; margin-bottom: 10px; text-align: center;">
                    🎴 Cards Drawn:
                </div>
                <div style="display: flex; gap: 10px;">
                    ${cardsHTML}
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    },
    
    closeRumorsModal() {
        document.getElementById('rumors-modal').classList.remove('active');
    },
    
    showGeneralRewardModal(generalName, heroRewards) {
        const modal = document.getElementById('general-reward-modal');
        const content = document.getElementById('general-reward-content');
        
        const cardColorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'black': '#1f2937'
        };
        
        const colorToGeneralWithFaction = {
            'red': 'Balazarg (Demons)',
            'blue': 'Sapphire (Dragonkin)',
            'green': 'Gorgutt (Orcs)',
            'black': 'Varkolak (Undead)'
        };
        
        const rewardText = heroRewards.length === 1 
            ? `${heroRewards[0].hero.name} receives 3 cards as reward:`
            : `${heroRewards.length} contributing heroes receive 3 cards each:`;
        
        let html = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 1.3em; color: #ffd700; margin-bottom: 10px;">
                    ${generalName} has been vanquished!
                </div>
                <div style="color: #d4af37;">
                    ${rewardText}
                </div>
            </div>
        `;
        
        heroRewards.forEach(reward => {
            const hero = reward.hero;
            const cards = reward.cards;
            
            html += `
                <div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border: 2px solid ${hero.color};">
                    <div style="font-size: 1.1em; color: ${hero.color}; font-weight: bold; margin-bottom: 10px;">
                        ${hero.symbol} ${hero.name}
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
            `;
            
            cards.forEach(card => {
                const borderColor = (card.special ? '#9333ea' : (cardColorMap[card.color] || '#8B7355'));
                const generalWithFaction = colorToGeneralWithFaction[card.color] || 'Any General';
                const cardIcon = card.icon || '🎴';
                html += `
                    <div style="flex: 1; min-width: 150px; max-width: 200px; padding: 15px; margin: 5px; border: 3px solid ${borderColor}; border-radius: 8px; background: rgba(0,0,0,0.5);">
                        <div style="text-align: center; font-size: 1.5em; margin-bottom: 8px;">
                            ${cardIcon}
                        </div>
                        <div style="font-size: 1.1em; font-weight: bold; color: ${borderColor}; margin-bottom: 8px; text-align: center;">
                            ${card.name}
                        </div>
                        <div style="text-align: center; margin: 8px 0;">
                            ${Array(card.dice).fill(0).map(() => 
                                `<span style="display: inline-block; width: 24px; height: 24px; background: ${borderColor}; border-radius: 4px; margin: 2px; line-height: 24px; text-align: center; font-weight: bold;">🎲</span>`
                            ).join('')}
                        </div>
                        <div style="font-size: 0.9em; color: #d4af37; text-align: center;">
                            ${card.special ? "🌟 Special" : "vs " + generalWithFaction}
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        content.innerHTML = html;
        modal.classList.add('active');
    },
    
    closeGeneralRewardModal() {
        document.getElementById('general-reward-modal').classList.remove('active');
        this.pendingRewardCards = null;
        
        // Check if all generals defeated (victory condition)
        if (this.pendingVictory) {
            this.pendingVictory = false;
            this.showVictoryModal();
        }
    },
    
    showVictoryModal() {
        const modal = document.getElementById('victory-modal');
        const content = document.getElementById('victory-content');
        
        const isFlawless = this.defeatList.length === 0;
        const titleText = isFlawless ? 'FLAWLESS VICTORY!' : 'TAINTED VICTORY...';
        const titleColor = isFlawless ? '#ffd700' : '#ef4444';
        const subtitleText = isFlawless 
            ? 'The Heroes Have Defended the Realm Without Defeat!'
            : 'The Realm Is Saved... But At A Cost.';
        const emoji = isFlawless ? '🏆' : '⚔️';
        
        let defeatSection = '';
        if (!isFlawless) {
            const defeatLines = this.defeatList.map(d => 
                `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid #ef4444; background: rgba(0,0,0,0.3); border-radius: 3px;">💀 ${d}</div>`
            ).join('');
            defeatSection = `
                <div style="margin: 20px 0; padding: 15px; border: 2px solid #ef4444; background: rgba(239,68,68,0.1); border-radius: 8px;">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 10px;">Lose Conditions Triggered (${this.defeatList.length}):</div>
                    ${defeatLines}
                </div>`;
        }
        
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3em; margin-bottom: 20px;">
                    ${emoji}
                </div>
                <div style="font-size: 2em; color: ${titleColor}; font-weight: bold; margin-bottom: 20px;">
                    ${titleText}
                </div>
                <div style="font-size: 1.3em; color: #d4af37; margin-bottom: 30px;">
                    ${subtitleText}
                </div>
                <div style="margin: 30px 0; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                    <div style="font-size: 1.1em; margin-bottom: 15px;">
                        All four generals have been vanquished:
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <div style="color: #1f2937;">⚔️ Varkolak (Undead)</div>
                        <div style="color: #dc2626;">⚔️ Balazarg (Demons)</div>
                        <div style="color: #16a34a;">⚔️ Gorgutt (Orcs)</div>
                        <div style="color: #2563eb;">⚔️ Sapphire (Dragonkin)</div>
                    </div>
                </div>
                ${defeatSection}
                <div style="margin-top: 30px;">
                    <button class="btn btn-primary" onclick="location.reload()" style="font-size: 1.1em; padding: 12px 30px; margin: 5px;">
                        🎮 New Game
                    </button>
                    <button class="btn" onclick="window.close()" style="font-size: 1.1em; padding: 12px 30px; margin: 5px;">
                        ✕ Quit
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        this.addLog(isFlawless ? '=== FLAWLESS VICTORY! THE REALM IS SAVED! ===' : '=== TAINTED VICTORY... THE REALM IS SAVED, BUT AT A COST ===');
    },
    
    closeVictoryModal() {
        // Victory modal doesn't close - player must choose New Game or Quit
    },
    
});
