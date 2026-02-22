// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Special Card Effects
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    _startBattleStrategyMinionPhase() {
        const state = this.battleStrategyState;
        const locsWithMinions = this._getLocationsWithMinions();
        
        // If no valid targets or no uses left, move to general phase
        if (locsWithMinions.length === 0 || state.minionsUsesRemaining <= 0) {
            this._startBattleStrategyGeneralPhase();
            return;
        }
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Battle Strategy',
            maxMoves: state.minionsUsesRemaining,
            movesRemaining: state.minionsUsesRemaining,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: locsWithMinions,
            isBattleStrategyMinions: true
        };
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) { boardContainer.style.cursor = 'default'; boardContainer.style.pointerEvents = 'none'; }
        const svg = document.getElementById('game-map');
        if (svg) { svg.style.pointerEvents = 'auto'; }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(locsWithMinions);
    },
    
    _startBattleStrategyGeneralPhase() {
        const state = this.battleStrategyState;
        
        // Find non-defeated generals that can be pushed back
        const pushableGenerals = this.generals.filter(g => {
            if (g.defeated) return false;
            const prevLoc = this._getGeneralPreviousLocation(g);
            return prevLoc !== null;
        });
        
        if (pushableGenerals.length === 0) {
            // No generals to push back — finish
            this._finishBattleStrategy();
            return;
        }
        
        const generalLocations = pushableGenerals.map(g => g.location);
        
        state.phase = 'general';
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Battle Strategy — Push General',
            maxMoves: 1,
            movesRemaining: 1,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: generalLocations,
            isBattleStrategyGeneral: true
        };
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) { boardContainer.style.cursor = 'default'; boardContainer.style.pointerEvents = 'none'; }
        const svg = document.getElementById('game-map');
        if (svg) { svg.style.pointerEvents = 'auto'; }
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(generalLocations);
    },
    
    _getGeneralPreviousLocation(general) {
        // General paths: each array entry is [from, to] moving TOWARD Monarch City
        const generalPaths = {
            'black': [['Dark Woods', 'Windy Pass'], ['Windy Pass', 'Sea Bird Port'], ['Sea Bird Port', 'Father Oak Forest'], ['Father Oak Forest', 'Monarch City']],
            'red': [['Scorpion Canyon', 'Raven Forest'], ['Raven Forest', 'Angel Tear Falls'], ['Angel Tear Falls', 'Bounty Bay'], ['Bounty Bay', 'Monarch City']],
            'green': [['Thorny Woods', 'Amarak Peak'], ['Amarak Peak', 'Eagle Peak Pass'], ['Eagle Peak Pass', 'Orc Valley'], ['Orc Valley', 'Monarch City']],
            'blue': [['Blizzard Mountains', "Heaven's Glade"], ["Heaven's Glade", 'Ancient Ruins'], ['Ancient Ruins', 'Greenleaf Village'], ['Greenleaf Village', 'Monarch City']]
        };
        
        const path = generalPaths[general.color];
        if (!path) return null;
        
        // Find the segment where general.location is the 'to' (destination)
        // The 'from' of that segment is the previous location
        for (let [from, to] of path) {
            if (to === general.location) {
                return from;
            }
        }
        
        // General is at their starting position (first 'from') — can't push back further
        return null;
    },
    
    _finishBattleStrategy() {
        const state = this.battleStrategyState;
        if (!state) return;
        
        // Clean up
        this.activeMovement = null;
        this.battleStrategyState = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) { boardContainer.style.cursor = 'grab'; boardContainer.style.pointerEvents = 'auto'; }
        
        // Build results
        let resultsHTML = '';
        if (state.minionResults.length > 0) {
            resultsHTML += '<div style="font-weight: bold; color: #d4af37; margin-bottom: 6px;">Minions Defeated:</div>';
            state.minionResults.forEach(r => {
                resultsHTML += `<div style="margin: 4px 0; padding: 6px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                    ⚔️ <strong>${r.location}</strong> — ${r.details}
                </div>`;
            });
        }
        if (state.generalResult) {
            resultsHTML += `<div style="margin-top: 10px; padding: 8px; background: rgba(147,51,234,0.15); border: 1px solid #9333ea; border-radius: 6px;">
                🛡️ <strong style="color: ${this.getGeneralColor(state.generalResult.color)};">${state.generalResult.name}</strong> pushed back: ${state.generalResult.from} → ${state.generalResult.to}
            </div>`;
        } else {
            resultsHTML += `<div style="margin-top: 10px; color: #999; font-style: italic;">No generals were pushed back.</div>`;
        }
        
        const locCount = state.minionResults.length;
        this.addLog(`⚔️ Special Card: ${state.heroName} plays Battle Strategy — cleared ${locCount} location${locCount !== 1 ? 's' : ''}${state.generalResult ? ', pushed ' + state.generalResult.name + ' back to ' + state.generalResult.to : ''}! (No action used)`);
        
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal('⚔️ Battle Strategy — Complete!', `
            <div style="text-align: center;">
                <div style="font-size: 2em; margin-bottom: 10px;">⚔️</div>
                ${resultsHTML}
                <div style="color: #d4af37; margin-top: 10px; font-size: 0.9em;">Card played from ${state.heroSymbol} ${state.heroName}'s hand — No action used</div>
            </div>
        `);
    },
    
    executeSkipDarkness(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Set skip flag
        this.skipDarknessThisTurn = true;
        
        this.addLog(`🌅 Special Card: ${cardHero.name} plays All Is Quiet — No Darkness Spreads cards will be drawn this turn!`);
        
        this.showInfoModal('🌅 All Is Quiet', `
            <div style="text-align: center; padding: 10px;">
                <div style="padding: 20px; border: 2px solid #4ade80; background: rgba(74,222,128,0.15); border-radius: 8px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🌅</div>
                    <div style="font-size: 1.3em; color: #4ade80; font-weight: bold;">All Is Quiet</div>
                    <div style="color: #d4af37; margin-top: 8px;">No Darkness Spreads cards will be drawn this turn.</div>
                    <div style="color: #d4af37; margin-top: 5px;">The land rests easy tonight.</div>
                </div>
                <div style="color: #a78bfa; margin-top: 12px; font-size: 0.9em;">Card played from ${cardHero.symbol} ${cardHero.name}'s hand — No action used</div>
            </div>
        `);
        
        this.updateGameStatus();
        this.updateActionButtons();
    },
    
    executeBattleFury(heroIndex, cardIndex) {
        const activeHero = this.heroes[this.currentPlayerIndex];
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        
        // Must be played by the active hero only
        if (heroIndex !== this.currentPlayerIndex) {
            this.showInfoModal('💥 Battle Fury', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">💥</div>
                    <div style="color: #ef4444;">Battle Fury can only be played by the active hero!</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">Currently active: ${activeHero.symbol} ${activeHero.name}</div>
                </div>
            `);
            return;
        }
        
        // Requires 1 action
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('💥 Battle Fury', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">💥</div>
                    <div style="color: #ef4444;">No actions remaining!</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">Battle Fury requires 1 action to play.</div>
                </div>
            `);
            return;
        }
        
        // Check for minions at location
        const location = activeHero.location;
        const minionsObj = this.minions[location];
        const totalMinions = minionsObj ? Object.values(minionsObj).reduce((a, b) => a + b, 0) : 0;
        
        if (totalMinions === 0) {
            this.showInfoModal('💥 Battle Fury', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">💥</div>
                    <div style="color: #ef4444;">No minions at ${location}!</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">There are no enemy minions to defeat.</div>
                </div>
            `);
            return;
        }
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Spend 1 action
        this.actionsRemaining--;
        
        // Collect minion details before clearing
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        let resultsHTML = '';
        const removedDetails = [];
        
        for (const [color, count] of Object.entries(minionsObj)) {
            if (count > 0) {
                const fname = factionNames[color] || color;
                const fcolor = factionColors[color] || '#d4af37';
                removedDetails.push({ name: fname, color: fcolor, count: count });
                resultsHTML += `<div style="margin: 6px 0; font-size: 1.05em;">
                    <span style="color: ${fcolor}; font-weight: bold;">${count} ${fname}</span> minion${count !== 1 ? 's' : ''}
                </div>`;
            }
        }
        
        // Clear all minions
        for (const color in minionsObj) {
            minionsObj[color] = 0;
        }
        
        this.addLog(`💥 Special Card: ${activeHero.name} plays Battle Fury at ${location} — ${totalMinions} minion(s) defeated!`);
        
        this.showInfoModal('💥 Battle Fury', `
            <div style="text-align: center; padding: 10px;">
                <div style="padding: 20px; border: 2px solid #f59e0b; background: rgba(245,158,11,0.15); border-radius: 8px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">💥</div>
                    <div style="font-size: 1.3em; color: #f59e0b; font-weight: bold;">Battle Fury</div>
                    <div style="color: #d4af37; margin-top: 8px; font-size: 1.1em;">All minions at <strong>${location}</strong> defeated!</div>
                    <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        ${resultsHTML}
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #555; color: #ffd700; font-weight: bold;">
                            Total: ${totalMinions} minion${totalMinions !== 1 ? 's' : ''} removed
                        </div>
                    </div>
                </div>
                <div style="color: #a78bfa; margin-top: 12px; font-size: 0.9em;">Card played from ${activeHero.symbol} ${activeHero.name}'s hand — 1 action used</div>
            </div>
        `);
        
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateActionButtons();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            const mapActionsLeft = document.getElementById('map-actions-left');
            if (mapActionsLeft) {
                mapActionsLeft.textContent = this.actionsRemaining;
            }
        }
    },
    
    executeLocalInformation(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        const card = cardHero.cards[cardIndex];
        const location = cardHero.location;
        const locData = this.locationCoords[location];
        
        // Must be at an Inn
        if (!locData || !locData.inn) {
            this.showInfoModal('📜 Local Information', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">📜</div>
                    <div style="color: #ef4444;">${cardHero.name} must be at an Inn to play this card!</div>
                    <div style="color: #999; margin-top: 8px; font-size: 0.9em;">Current location: ${location}</div>
                </div>
            `);
            return;
        }
        
        // Store card info for after color selection
        this._localInfoPending = { heroIndex, cardIndex };
        
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
                <div id="local-info-color-${opt.color}" 
                     onclick="game._localInfoSelectColor('${opt.color}')"
                     style="border: 3px solid ${opt.hex}; cursor: pointer; padding: 14px; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s; text-align: center;"
                     onmouseover="if(!this.classList.contains('li-selected')) this.style.background='rgba(255,255,255,0.1)'"
                     onmouseout="if(!this.classList.contains('li-selected')) this.style.background='rgba(0,0,0,0.3)'">
                    <div style="font-size: 1.5em;">${opt.icon}</div>
                    <div style="color: ${opt.hex}; font-weight: bold; margin-top: 4px;">${opt.label}</div>
                    <div style="color: #999; font-size: 0.85em;">${opt.color.toUpperCase()}</div>
                </div>
            `;
        });
        optionsHTML += '</div>';
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 2em; margin-bottom: 5px;">📜</div>
                <div style="color: #d4af37;">Choose a color — you will draw 5 cards and keep all that match this color, plus any Special cards.</div>
            </div>
            ${optionsHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game._localInfoPending = null; game.closeInfoModal()">Cancel</button>
                <button id="local-info-confirm-btn" class="btn" style="flex: 1; opacity: 0.5; cursor: not-allowed; background: #666;" disabled onclick="game._localInfoConfirmColor()">Confirm</button>
            </div>
        `;
        
        this._localInfoSelectedColor = null;
        this.showInfoModal('📜 Local Information', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#local-info-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _localInfoSelectColor(color) {
        this._localInfoSelectedColor = color;
        
        // Clear all selections
        ['black', 'blue', 'green', 'red'].forEach(c => {
            const el = document.getElementById(`local-info-color-${c}`);
            if (el) {
                el.classList.remove('li-selected');
                el.style.background = 'rgba(0,0,0,0.3)';
            }
        });
        
        // Highlight selected
        const selected = document.getElementById(`local-info-color-${color}`);
        if (selected) {
            selected.classList.add('li-selected');
            selected.style.background = 'rgba(255,215,0,0.2)';
            selected.style.borderColor = '#d4af37';
        }
        
        // Enable confirm button
        const btn = document.getElementById('local-info-confirm-btn');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.background = '';
            btn.className = 'btn btn-primary';
        }
    },
    
    _localInfoConfirmColor() {
        const color = this._localInfoSelectedColor;
        const pending = this._localInfoPending;
        if (!color || !pending) return;
        
        const hero = this.heroes[pending.heroIndex];
        const card = hero.cards[pending.cardIndex];
        
        // Remove the Local Information card from hand (played — removed from game)
        this._playSpecialCard(hero, pending.cardIndex);
        this.updateDeckCounts();
        
        this.closeInfoModal();
        
        // Draw 5 cards
        const drawnCards = [];
        for (let i = 0; i < 5; i++) {
            const c = this.generateRandomCard();
            if (c) drawnCards.push(c);
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
        
        // Build results HTML
        const cardColorMap = { red: '#dc2626', blue: '#2563eb', green: '#16a34a', black: '#1f2937' };
        
        const renderCard = (c, badge) => {
            const borderColor = c.special ? '#9333ea' : (cardColorMap[c.color] || '#8B7355');
            const bgColor = c.special ? 'rgba(147,51,234,0.15)' : 'rgba(0,0,0,0.3)';
            return `<div style="border: 2px solid ${borderColor}; background: ${bgColor}; border-radius: 6px; padding: 8px 10px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.3em;">${c.icon || '🃏'}</span>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${borderColor}; font-size: 0.95em;">${c.name}</div>
                    <div style="font-size: 0.8em; color: #999;">${c.special ? '🌟 Special' : c.type} · ${c.dice} ${c.dice === 1 ? 'die' : 'dice'}</div>
                </div>
                ${badge}
            </div>`;
        };
        
        let cardsHTML = '<div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 5px;">';
        
        kept.forEach(k => {
            const badge = k.reason === 'special' 
                ? '<span style="color: #9333ea; font-weight: bold; font-size: 0.85em;">✓ KEPT (Special)</span>'
                : `<span style="color: ${chosenHex}; font-weight: bold; font-size: 0.85em;">✓ KEPT</span>`;
            cardsHTML += renderCard(k.card, badge);
        });
        
        discarded.forEach(c => {
            cardsHTML += renderCard(c, '<span style="color: #ef4444; font-weight: bold; font-size: 0.85em;">✗ Discarded</span>');
        });
        
        cardsHTML += '</div>';
        
        const summaryHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="font-size: 2em; margin-bottom: 5px;">📜</div>
                <div style="color: #d4af37; margin-bottom: 4px;">Called color: <strong style="color: ${chosenHex};">${chosenName} (${color.toUpperCase()})</strong></div>
                <div style="color: #4ade80; font-size: 0.95em;">${kept.length} card${kept.length !== 1 ? 's' : ''} kept · ${discarded.length} discarded</div>
            </div>
            ${cardsHTML}
            <div style="color: #a78bfa; margin-top: 12px; font-size: 0.9em; text-align: center;">Card played from ${hero.symbol} ${hero.name}'s hand — No action used</div>
        `;
        
        this.addLog(`📜 Special Card: ${hero.name} plays Local Information at ${hero.location} — Called ${chosenName}, drew ${drawnCards.length} cards, kept ${kept.length}`);
        
        this._localInfoPending = null;
        this._localInfoSelectedColor = null;
        
        this.renderHeroes();
        this.updateGameStatus();
        this.updateActionButtons();
        
        this.showInfoModal('📜 Local Information — Results', summaryHTML);
    },
    
    
    executeKingsGuard(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        
        // Get Monarch City + connected locations
        const monarchArea = ['Monarch City', ...(this.locationConnections['Monarch City'] || [])];
        
        // Find which have minions
        const locsWithMinions = monarchArea.filter(locName => {
            const minionsObj = this.minions[locName];
            if (!minionsObj) return false;
            return Object.values(minionsObj).reduce((a, b) => a + b, 0) > 0;
        });
        
        if (locsWithMinions.length === 0) {
            this.showInfoModal('👑 King\'s Guard Attack', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">👑</div>
                    <div style="color: #ef4444;">No minions on or adjacent to Monarch City!</div>
                </div>
            `);
            return;
        }
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Initialize state
        this.kingsGuardState = {
            heroName: cardHero.name,
            heroSymbol: cardHero.symbol,
            maxMinions: 6,
            totalSelected: 0,
            monarchArea: monarchArea,
            removals: [], // { location, color, count }
            currentLocation: null
        };
        
        // Start highlighting
        this._kingsGuardHighlight(locsWithMinions, 'Select a location near Monarch City');
    },
    
    _kingsGuardHighlight(validLocations, message) {
        const state = this.kingsGuardState;
        if (!state) return;
        
        const remaining = state.maxMinions - state.totalSelected;
        
        if (validLocations.length === 0 || remaining <= 0) {
            this._finishKingsGuard();
            return;
        }
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: "King's Guard",
            maxMoves: 99,
            movesRemaining: 99,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: validLocations,
            isKingsGuard: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        const svg = document.getElementById('game-map');
        if (svg) svg.style.pointerEvents = 'auto';
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(validLocations);
        
        // Update movement indicator text
        const indicator = document.getElementById('movement-indicator');
        if (indicator) {
            indicator.innerHTML = `<span style="color: #ffd700;">👑 King's Guard Attack</span> — ${message}<br><span style="font-size: 0.85em;">Minions: ${state.totalSelected} / ${state.maxMinions} selected</span>`;
        }
    },
    
    _kingsGuardShowPicker(locationName) {
        const state = this.kingsGuardState;
        if (!state) return;
        
        state.currentLocation = locationName;
        
        const minionsObj = this.minions[locationName];
        const remaining = state.maxMinions - state.totalSelected;
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        const factionIcons = { green: '🪓', black: '💀', red: '🔥', blue: '🐉' };
        
        // Calculate pending removals at this location
        const pendingForLoc = {};
        state.removals.filter(r => r.location === locationName).forEach(r => {
            pendingForLoc[r.color] = (pendingForLoc[r.color] || 0) + r.count;
        });
        
        this._kgSelected = new Set();
        
        let minionId = 0;
        let listHTML = '<div id="kg-minion-list" style="max-height: 280px; overflow-y: auto; padding-right: 5px;">';
        
        const factionOrder = ['green', 'red', 'black', 'blue'];
        factionOrder.forEach(color => {
            const totalCount = (minionsObj && minionsObj[color]) || 0;
            const alreadyPicked = pendingForLoc[color] || 0;
            const availableCount = Math.max(0, totalCount - alreadyPicked);
            if (availableCount === 0) return;
            const fname = factionNames[color];
            const fcolor = factionColors[color];
            const ficon = factionIcons[color];
            
            for (let i = 0; i < availableCount; i++) {
                const id = `kg-m-${minionId}`;
                listHTML += `
                    <div id="${id}" data-color="${color}" data-mid="${minionId}"
                         onclick="game._kingsGuardToggle(${minionId})"
                         style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin: 3px 0; border: 2px solid ${fcolor}; border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.3); transition: all 0.15s;"
                         onmouseover="if(!this.classList.contains('kg-sel')) this.style.background='rgba(255,255,255,0.08)'"
                         onmouseout="if(!this.classList.contains('kg-sel')) this.style.background='rgba(0,0,0,0.3)'">
                        <span style="font-size: 1.3em;">${ficon}</span>
                        <span style="flex: 1; color: ${fcolor}; font-weight: bold;">${fname} Minion</span>
                        <span id="${id}-check" style="font-size: 1.2em; opacity: 0.3;">☐</span>
                    </div>
                `;
                minionId++;
            }
        });
        
        listHTML += '</div>';
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 1.5em; margin-bottom: 3px;">👑</div>
                <div style="color: #ffd700; font-weight: bold; font-size: 1.05em;">📍 ${locationName}</div>
                <div style="color: #d4af37; margin-top: 4px; font-size: 0.9em;">Select minions to remove at this location.</div>
                <div id="kg-budget-display" style="color: #4ade80; font-weight: bold; margin-top: 6px;">Remaining: ${remaining} / ${state.maxMinions} — Selected: 0 at this location</div>
            </div>
            ${listHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game._kingsGuardFinishEarly()">Finish</button>
                <button id="kg-confirm-btn" class="btn btn-primary" style="flex: 1;" onclick="game._kingsGuardConfirmLocation()">Skip Location</button>
            </div>
        `;
        
        this.showInfoModal("👑 King's Guard Attack", contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#kg-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _kingsGuardToggle(minionId) {
        const state = this.kingsGuardState;
        if (!state) return;
        
        const el = document.getElementById(`kg-m-${minionId}`);
        const check = document.getElementById(`kg-m-${minionId}-check`);
        if (!el) return;
        
        const remaining = state.maxMinions - state.totalSelected;
        
        if (this._kgSelected.has(minionId)) {
            // Deselect
            this._kgSelected.delete(minionId);
            el.classList.remove('kg-sel');
            el.style.background = 'rgba(0,0,0,0.3)';
            if (check) { check.textContent = '☐'; check.style.opacity = '0.3'; check.style.color = ''; }
        } else {
            // Check total limit
            if (this._kgSelected.size >= remaining) return;
            this._kgSelected.add(minionId);
            el.classList.add('kg-sel');
            el.style.background = 'rgba(255,215,0,0.2)';
            if (check) { check.textContent = '☑'; check.style.opacity = '1'; check.style.color = '#4ade80'; }
        }
        
        // Update display
        const newRemaining = remaining - this._kgSelected.size;
        const display = document.getElementById('kg-budget-display');
        if (display) display.textContent = `Remaining: ${newRemaining + (state.maxMinions - state.totalSelected - remaining)} / ${state.maxMinions} — Selected: ${this._kgSelected.size} at this location`;
        
        // Update confirm button
        const btn = document.getElementById('kg-confirm-btn');
        if (btn) {
            btn.textContent = this._kgSelected.size > 0 ? `Confirm (${this._kgSelected.size})` : 'Skip Location';
        }
        
        // Update affordability of unselected
        document.querySelectorAll('#kg-minion-list > div').forEach(div => {
            const mid = parseInt(div.getAttribute('data-mid'));
            if (this._kgSelected.has(mid)) return;
            const canSelect = this._kgSelected.size < remaining;
            div.style.opacity = canSelect ? '1' : '0.4';
            div.style.cursor = canSelect ? 'pointer' : 'not-allowed';
        });
    },
    
    _kingsGuardConfirmLocation() {
        const state = this.kingsGuardState;
        if (!state) return;
        
        const locationName = state.currentLocation;
        
        // Collect selected minions by color
        const colorCounts = {};
        this._kgSelected.forEach(mid => {
            const el = document.getElementById(`kg-m-${mid}`);
            if (!el) return;
            const color = el.getAttribute('data-color');
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        
        // Record removals
        for (const [color, count] of Object.entries(colorCounts)) {
            state.removals.push({ location: locationName, color, count });
            state.totalSelected += count;
        }
        
        this.closeInfoModal();
        
        // Clean up movement highlights
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Check if budget exhausted
        if (state.totalSelected >= state.maxMinions) {
            this._finishKingsGuard();
            return;
        }
        
        // Re-highlight all monarch-area locations that still have minions
        const locsWithMinions = state.monarchArea.filter(locName => {
            const minionsObj = this.minions[locName];
            if (!minionsObj) return false;
            // Subtract any pending removals for this location
            const pendingForLoc = {};
            state.removals.filter(r => r.location === locName).forEach(r => {
                pendingForLoc[r.color] = (pendingForLoc[r.color] || 0) + r.count;
            });
            let remaining = 0;
            for (const [color, count] of Object.entries(minionsObj)) {
                remaining += Math.max(0, count - (pendingForLoc[color] || 0));
            }
            return remaining > 0;
        });
        
        if (locsWithMinions.length === 0) {
            this._finishKingsGuard();
            return;
        }
        
        this._kingsGuardHighlight(locsWithMinions, 'Select another location');
    },
    
    _kingsGuardFinishEarly() {
        const state = this.kingsGuardState;
        if (!state) return;
        
        // Record any current selections
        if (this._kgSelected && this._kgSelected.size > 0) {
            const locationName = state.currentLocation;
            const colorCounts = {};
            this._kgSelected.forEach(mid => {
                const el = document.getElementById(`kg-m-${mid}`);
                if (!el) return;
                const color = el.getAttribute('data-color');
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            });
            for (const [color, count] of Object.entries(colorCounts)) {
                state.removals.push({ location: locationName, color, count });
                state.totalSelected += count;
            }
        }
        
        this.closeInfoModal();
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        this._finishKingsGuard();
    },
    
    _finishKingsGuard() {
        const state = this.kingsGuardState;
        if (!state) return;
        
        // Clean up
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Apply all removals
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        let totalRemoved = 0;
        
        const byLocation = {};
        state.removals.forEach(r => {
            if (!byLocation[r.location]) byLocation[r.location] = [];
            byLocation[r.location].push(r);
            
            if (this.minions[r.location]) {
                this.minions[r.location][r.color] = Math.max(0, (this.minions[r.location][r.color] || 0) - r.count);
            }
            totalRemoved += r.count;
        });
        
        // Build results
        let resultsHTML = '';
        if (totalRemoved === 0) {
            resultsHTML = '<div style="color: #999; text-align: center; padding: 10px;">No minions were removed.</div>';
        } else {
            for (const [locName, removals] of Object.entries(byLocation)) {
                resultsHTML += `<div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 4px;">📍 ${locName}</div>`;
                removals.forEach(r => {
                    const fname = factionNames[r.color] || r.color;
                    const fcolor = factionColors[r.color] || '#d4af37';
                    resultsHTML += `<div style="margin: 3px 0 3px 15px; color: ${fcolor};">${r.count} ${fname} minion${r.count !== 1 ? 's' : ''} removed</div>`;
                });
                resultsHTML += '</div>';
            }
        }
        
        this.addLog(`👑 Special Card: ${state.heroName} plays King's Guard Attack — ${totalRemoved} minion(s) removed near Monarch City!`);
        
        this.kingsGuardState = null;
        
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal("👑 King's Guard Attack — Results", `
            <div style="text-align: center; padding: 10px;">
                <div style="padding: 20px; border: 2px solid #f59e0b; background: rgba(245,158,11,0.15); border-radius: 8px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">👑</div>
                    <div style="font-size: 1.3em; color: #f59e0b; font-weight: bold;">King's Guard Attack Complete</div>
                    <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; text-align: left;">
                        ${resultsHTML}
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #555; color: #ffd700; font-weight: bold; text-align: center;">
                            Total: ${totalRemoved} minion${totalRemoved !== 1 ? 's' : ''} removed
                        </div>
                    </div>
                </div>
                <div style="color: #a78bfa; margin-top: 12px; font-size: 0.9em;">Card played from ${state.heroSymbol} ${state.heroName}'s hand — No action used</div>
            </div>
        `);
    },
    
    
    executeCavalrySweep(heroIndex, cardIndex) {
        const cardHero = this.heroes[heroIndex];
        
        // Find all locations with minions
        const locsWithMinions = [];
        for (const [locName, minionsObj] of Object.entries(this.minions)) {
            const total = Object.values(minionsObj).reduce((a, b) => a + b, 0);
            if (total > 0) locsWithMinions.push(locName);
        }
        
        if (locsWithMinions.length === 0) {
            this.showInfoModal('🐎 Cavalry Sweep', `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🐎</div>
                    <div style="color: #ef4444;">No minions anywhere on the board!</div>
                </div>
            `);
            return;
        }
        
        // Remove card from hand (played — removed from game)
        this._playSpecialCard(cardHero, cardIndex);
        this.updateDeckCounts();
        
        // Initialize state
        this.cavalrySweepState = {
            heroName: cardHero.name,
            heroSymbol: cardHero.symbol,
            budgetMax: 6,
            budgetUsed: 0,
            currentLocation: null,
            removals: [], // { location, color, count, cost }
            visitedLocations: []
        };
        
        // Start highlighting
        this._cavalrySweepHighlight(locsWithMinions, 'Select a starting location with minions');
    },
    
    _cavalrySweepHighlight(validLocations, message) {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        // Filter to only locations that have minions we can afford
        const budgetLeft = state.budgetMax - state.budgetUsed;
        const affordableLocs = validLocations.filter(locName => {
            const minionsObj = this.minions[locName];
            if (!minionsObj) return false;
            // Need at least one minion we can afford (non-dragon = 1, dragon = 2)
            for (const [color, count] of Object.entries(minionsObj)) {
                if (count > 0) {
                    const cost = color === 'blue' ? 2 : 1;
                    if (cost <= budgetLeft) return true;
                }
            }
            return false;
        });
        
        if (affordableLocs.length === 0 || budgetLeft <= 0) {
            this._finishCavalrySweep();
            return;
        }
        
        const currentHero = this.heroes[this.currentPlayerIndex];
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Cavalry Sweep',
            maxMoves: 99,
            movesRemaining: 99,
            startLocation: currentHero.location,
            cardUsed: null,
            validDestinations: affordableLocs,
            isCavalrySweep: true
        };
        
        // Disable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'default';
            boardContainer.style.pointerEvents = 'none';
        }
        const svg = document.getElementById('game-map');
        if (svg) svg.style.pointerEvents = 'auto';
        
        this.showMovementIndicator();
        this.highlightMagicGateLocations(affordableLocs);
        
        // Update movement indicator text
        const indicator = document.getElementById('movement-indicator');
        if (indicator) {
            const remaining = state.budgetMax - state.budgetUsed;
            indicator.innerHTML = `<span style="color: #ffd700;">🐎 Cavalry Sweep</span> — ${message}<br><span style="font-size: 0.85em;">Budget: ${remaining} remaining</span>`;
        }
    },
    
    _cavalrySweepShowPicker(locationName) {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        state.currentLocation = locationName;
        
        const minionsObj = this.minions[locationName];
        const budgetLeft = state.budgetMax - state.budgetUsed;
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        const factionIcons = { green: '🪓', black: '💀', red: '🔥', blue: '🐉' };
        
        this._csSweepSelected = new Set();
        this._csSweepCost = 0;
        this._csSweepMaxPerLoc = 2;
        
        let minionId = 0;
        let listHTML = '<div id="cs-minion-list" style="max-height: 280px; overflow-y: auto; padding-right: 5px;">';
        
        // Sort factions for consistent display
        const factionOrder = ['green', 'red', 'black', 'blue'];
        factionOrder.forEach(color => {
            const count = (minionsObj && minionsObj[color]) || 0;
            if (count === 0) return;
            const fname = factionNames[color];
            const fcolor = factionColors[color];
            const ficon = factionIcons[color];
            const cost = color === 'blue' ? 2 : 1;
            
            for (let i = 0; i < count; i++) {
                const canAfford = cost <= budgetLeft;
                const id = `cs-m-${minionId}`;
                listHTML += `
                    <div id="${id}" data-color="${color}" data-cost="${cost}" data-mid="${minionId}"
                         onclick="game._cavalrySweepToggle(${minionId})"
                         style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin: 3px 0; border: 2px solid ${fcolor}; border-radius: 6px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; background: rgba(0,0,0,0.3); transition: all 0.15s; ${!canAfford ? 'opacity: 0.4;' : ''}"
                         onmouseover="if(!this.classList.contains('cs-sel') && this.style.opacity !== '0.4') this.style.background='rgba(255,255,255,0.08)'"
                         onmouseout="if(!this.classList.contains('cs-sel')) this.style.background='rgba(0,0,0,0.3)'">
                        <span style="font-size: 1.3em;">${ficon}</span>
                        <span style="flex: 1; color: ${fcolor}; font-weight: bold;">${fname} Minion</span>
                        <span style="color: #999; font-size: 0.8em;">${cost === 2 ? '⚠️ Cost: 2' : 'Cost: 1'}</span>
                        <span id="${id}-check" style="font-size: 1.2em; opacity: 0.3;">☐</span>
                    </div>
                `;
                minionId++;
            }
        });
        
        listHTML += '</div>';
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 1.5em; margin-bottom: 3px;">🐎</div>
                <div style="color: #ffd700; font-weight: bold; font-size: 1.05em;">📍 ${locationName}</div>
                <div style="color: #d4af37; margin-top: 4px; font-size: 0.9em;">Select up to 2 minions at this location. <span style="color: #ef4444;">Dragonkin cost 2.</span></div>
                <div id="cs-budget-display" style="color: #4ade80; font-weight: bold; margin-top: 6px;">Budget: ${budgetLeft} / ${state.budgetMax} remaining — Selected: 0 at this location</div>
            </div>
            ${listHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game._cavalrySweepFinishEarly()">Finish Sweep</button>
                <button id="cs-confirm-btn" class="btn btn-primary" style="flex: 1;" onclick="game._cavalrySweepConfirmLocation()">Skip Location</button>
            </div>
        `;
        
        this.showInfoModal('🐎 Cavalry Sweep', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#cs-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _cavalrySweepToggle(minionId) {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        const el = document.getElementById(`cs-m-${minionId}`);
        const check = document.getElementById(`cs-m-${minionId}-check`);
        if (!el) return;
        
        const cost = parseInt(el.getAttribute('data-cost'));
        const budgetLeft = state.budgetMax - state.budgetUsed;
        
        if (this._csSweepSelected.has(minionId)) {
            // Deselect
            this._csSweepSelected.delete(minionId);
            this._csSweepCost -= cost;
            el.classList.remove('cs-sel');
            el.style.background = 'rgba(0,0,0,0.3)';
            if (check) { check.textContent = '☐'; check.style.opacity = '0.3'; check.style.color = ''; }
        } else {
            // Check per-location limit (2 minions)
            if (this._csSweepSelected.size >= this._csSweepMaxPerLoc) return;
            // Check budget
            if (this._csSweepCost + cost > budgetLeft) return;
            
            this._csSweepSelected.add(minionId);
            this._csSweepCost += cost;
            el.classList.add('cs-sel');
            el.style.background = 'rgba(255,215,0,0.2)';
            if (check) { check.textContent = '☑'; check.style.opacity = '1'; check.style.color = '#4ade80'; }
        }
        
        // Update budget display
        const newBudgetLeft = budgetLeft - this._csSweepCost;
        const display = document.getElementById('cs-budget-display');
        if (display) display.textContent = `Budget: ${newBudgetLeft} / ${state.budgetMax} remaining — Selected: ${this._csSweepSelected.size} at this location`;
        
        // Update confirm button text
        const btn = document.getElementById('cs-confirm-btn');
        if (btn) {
            btn.textContent = this._csSweepSelected.size > 0 ? `Confirm (${this._csSweepSelected.size})` : 'Skip Location';
        }
        
        // Update affordability of unselected minions
        document.querySelectorAll('#cs-minion-list > div').forEach(div => {
            const mid = parseInt(div.getAttribute('data-mid'));
            if (this._csSweepSelected.has(mid)) return;
            const c = parseInt(div.getAttribute('data-cost'));
            const canAfford = c <= newBudgetLeft && this._csSweepSelected.size < this._csSweepMaxPerLoc;
            div.style.opacity = canAfford ? '1' : '0.4';
            div.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        });
    },
    
    _cavalrySweepConfirmLocation() {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        const locationName = state.currentLocation;
        
        // Collect selected minions by color
        const colorCounts = {};
        this._csSweepSelected.forEach(mid => {
            const el = document.getElementById(`cs-m-${mid}`);
            if (!el) return;
            const color = el.getAttribute('data-color');
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        
        // Record removals
        for (const [color, count] of Object.entries(colorCounts)) {
            const cost = color === 'blue' ? 2 : 1;
            state.removals.push({ location: locationName, color, count, cost: cost * count });
            state.budgetUsed += cost * count;
        }
        
        state.visitedLocations.push(locationName);
        
        this.closeInfoModal();
        
        // Clean up movement highlights
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Check if budget exhausted
        if (state.budgetUsed >= state.budgetMax) {
            this._finishCavalrySweep();
            return;
        }
        
        // Get connected locations with minions (not already visited)
        const connected = this.locationConnections[locationName] || [];
        const validNext = connected.filter(loc => {
            if (state.visitedLocations.includes(loc)) return false;
            const minionsObj = this.minions[loc];
            if (!minionsObj) return false;
            const total = Object.values(minionsObj).reduce((a, b) => a + b, 0);
            return total > 0;
        });
        
        if (validNext.length === 0) {
            this._finishCavalrySweep();
            return;
        }
        
        // Highlight next locations
        this._cavalrySweepHighlight(validNext, 'Select next adjacent location');
    },
    
    _cavalrySweepFinishEarly() {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        // Still record any selections at current location
        if (this._csSweepSelected && this._csSweepSelected.size > 0) {
            const locationName = state.currentLocation;
            const colorCounts = {};
            this._csSweepSelected.forEach(mid => {
                const el = document.getElementById(`cs-m-${mid}`);
                if (!el) return;
                const color = el.getAttribute('data-color');
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            });
            for (const [color, count] of Object.entries(colorCounts)) {
                const cost = color === 'blue' ? 2 : 1;
                state.removals.push({ location: locationName, color, count, cost: cost * count });
                state.budgetUsed += cost * count;
            }
        }
        
        this.closeInfoModal();
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        this._finishCavalrySweep();
    },
    
    _finishCavalrySweep() {
        const state = this.cavalrySweepState;
        if (!state) return;
        
        // Clean up movement state
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Apply all removals
        const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
        const factionColors = { green: '#16a34a', black: '#6b7280', red: '#ef4444', blue: '#3b82f6' };
        let totalRemoved = 0;
        let totalCost = 0;
        
        // Group by location for display
        const byLocation = {};
        state.removals.forEach(r => {
            if (!byLocation[r.location]) byLocation[r.location] = [];
            byLocation[r.location].push(r);
            
            // Apply removal to board
            if (this.minions[r.location]) {
                this.minions[r.location][r.color] = Math.max(0, (this.minions[r.location][r.color] || 0) - r.count);
            }
            totalRemoved += r.count;
            totalCost += r.cost;
        });
        
        // Build results HTML
        let resultsHTML = '';
        if (totalRemoved === 0) {
            resultsHTML = '<div style="color: #999; text-align: center; padding: 10px;">No minions were removed.</div>';
        } else {
            for (const [locName, removals] of Object.entries(byLocation)) {
                resultsHTML += `<div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 4px;">📍 ${locName}</div>`;
                removals.forEach(r => {
                    const fname = factionNames[r.color] || r.color;
                    const fcolor = factionColors[r.color] || '#d4af37';
                    const costNote = r.color === 'blue' ? ` <span style="color: #ef4444; font-size: 0.85em;">(cost: ${r.cost})</span>` : '';
                    resultsHTML += `<div style="margin: 3px 0 3px 15px; color: ${fcolor};">${r.count} ${fname} minion${r.count !== 1 ? 's' : ''} removed${costNote}</div>`;
                });
                resultsHTML += '</div>';
            }
        }
        
        this.addLog(`🐎 Special Card: ${state.heroName} plays Cavalry Sweep — ${totalRemoved} minion(s) removed (cost: ${totalCost}/${state.budgetMax})!`);
        
        this.cavalrySweepState = null;
        
        // Update everything
        this.renderMap();
        this.renderTokens();
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
        
        this.showInfoModal('🐎 Cavalry Sweep — Results', `
            <div style="text-align: center; padding: 10px;">
                <div style="padding: 20px; border: 2px solid #f59e0b; background: rgba(245,158,11,0.15); border-radius: 8px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🐎</div>
                    <div style="font-size: 1.3em; color: #f59e0b; font-weight: bold;">Cavalry Sweep Complete</div>
                    <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; text-align: left;">
                        ${resultsHTML}
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #555; color: #ffd700; font-weight: bold; text-align: center;">
                            Total: ${totalRemoved} minion${totalRemoved !== 1 ? 's' : ''} removed (budget: ${totalCost}/${state.budgetMax} used)
                        </div>
                    </div>
                </div>
                <div style="color: #a78bfa; margin-top: 12px; font-size: 0.9em;">Card played from ${state.heroSymbol} ${state.heroName}'s hand — No action used</div>
            </div>
        `);
    },
    
    
    // ===== DARK VISIONS SPECIAL CARD =====
    executeDarkVisions(heroIndex, cardIndex) {
        const hero = this.heroes[heroIndex];
        const card = hero.cards[cardIndex];
        
        // Draw up to 5 from darkness deck
        const drawnCards = [];
        const maxDraw = Math.min(5, this.darknessDeck.length);
        for (let i = 0; i < maxDraw; i++) {
            drawnCards.push(this.darknessDeck.shift());
        }
        
        if (drawnCards.length === 0) {
            this.showInfoModal('🔮 Dark Visions', '<div style="color: #ef4444; text-align: center;">The Darkness Spreads deck is empty!</div>');
            // Put card back (not consumed)
            return;
        }
        
        // Remove the special card from hero's hand (played — removed from game)
        this._playSpecialCard(hero, cardIndex);
        
        // Store state
        this._darkVisionsState = {
            heroName: hero.name,
            heroSymbol: hero.symbol,
            drawnCards: drawnCards,
            discarded: new Set(), // indices of cards to discard
            keptOrder: drawnCards.map((_, i) => i) // indices in display order
        };
        
        this.addLog(`🔮 ${hero.name} plays Dark Visions — reveals ${drawnCards.length} Darkness Spreads card(s)`);
        
        this._darkVisionsRender();
        this.renderHeroes();
        this.updateDeckCounts();
    },
    
    _darkVisionsGetCardSummary(card) {
        if (card.type === 'all_quiet') {
            return { title: '🌅 All is Quiet', color: '#4ade80', lines: ['No minions spread, no generals move'] };
        }
        if (card.type === 'monarch_city_special') {
            return { title: '🏰 Monarch City', color: '#fbbf24', lines: [
                '<span style="color:#ef4444;">SPECIAL</span> — 1 minion of each adjacent color → Monarch City',
                'Reshuffle all decks. No generals move.'
            ]};
        }
        if (card.type === 'patrol') {
            const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
            const generalColor = this.getGeneralColor(card.general);
            const isWarParty = card.patrolType === 'orc_war_party';
            const patrolDesc = isWarParty
                ? '1 orc → each location with exactly 1 orc'
                : '1 orc → each empty green location';
            const patrolIcon = isWarParty ? '⚔️' : '🥾';
            const genLine = card.minions3 === 0
                ? `<span style="color:${generalColor};">${generalName}</span> → ${card.location3} (no minions)`
                : `<span style="color:${generalColor};">${generalName}</span> — ${card.minions3} minion(s) → ${card.location3}`;
            return { title: `${patrolIcon} ${card.patrolName}`, color: isWarParty ? '#dc2626' : '#16a34a', lines: [patrolDesc, genLine] };
        }
        // Regular card
        const f1 = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
        const f2 = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
        const gen = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
        const c1 = this.getGeneralColor(card.faction1);
        const c2 = this.getGeneralColor(card.faction2);
        const gc = this.getGeneralColor(card.general);
        return { title: '🌙 Darkness Spreads', color: '#7c3aed', lines: [
            `<span style="color:${c1};">${f1}</span>: ${card.minions1} → ${card.location1}`,
            `<span style="color:${c2};">${f2}</span>: ${card.minions2} → ${card.location2}`,
            `<span style="color:${gc};">General ${gen}</span>: ${card.minions3} → ${card.location3}`
        ]};
    },
    
    _darkVisionsRender() {
        const state = this._darkVisionsState;
        if (!state) return;
        
        // Build kept list (exclude discarded, in user order)
        const keptIndices = state.keptOrder.filter(i => !state.discarded.has(i));
        const discardedIndices = [...state.discarded].sort((a, b) => a - b);
        
        let cardsHTML = '';
        
        // Render kept cards with reorder controls
        if (keptIndices.length > 0) {
            cardsHTML += `<div style="margin-bottom: 8px; color: #4ade80; font-weight: bold; font-size: 0.9em;">📥 KEEPING (${keptIndices.length}) — Top of Deck ↑</div>`;
            keptIndices.forEach((cardIdx, pos) => {
                const card = state.drawnCards[cardIdx];
                const summary = this._darkVisionsGetCardSummary(card);
                const isFirst = pos === 0;
                const isLast = pos === keptIndices.length - 1;
                
                cardsHTML += `
                    <div style="display: flex; align-items: stretch; margin: 4px 0; border: 2px solid ${summary.color}; border-radius: 6px; overflow: hidden; background: rgba(0,0,0,0.3);">
                        <div style="display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 4px; background: rgba(0,0,0,0.3); min-width: 32px;">
                            <button onclick="game._darkVisionsMoveUp(${cardIdx})" style="background: ${isFirst ? '#333' : '#555'}; color: ${isFirst ? '#666' : '#fff'}; border: none; border-radius: 3px; cursor: ${isFirst ? 'default' : 'pointer'}; font-size: 0.8em; padding: 2px 4px;" ${isFirst ? 'disabled' : ''}>▲</button>
                            <button onclick="game._darkVisionsMoveDown(${cardIdx})" style="background: ${isLast ? '#333' : '#555'}; color: ${isLast ? '#666' : '#fff'}; border: none; border-radius: 3px; cursor: ${isLast ? 'default' : 'pointer'}; font-size: 0.8em; padding: 2px 4px;" ${isLast ? 'disabled' : ''}>▼</button>
                        </div>
                        <div style="flex: 1; padding: 8px;">
                            <div style="font-weight: bold; color: ${summary.color}; font-size: 0.95em; margin-bottom: 3px;">
                                <span style="color: #888; font-size: 0.8em;">#${pos + 1}</span> ${summary.title}
                            </div>
                            ${summary.lines.map(l => `<div style="font-size: 0.85em; color: #ccc; padding: 1px 0;">${l}</div>`).join('')}
                        </div>
                        <div style="display: flex; align-items: center; padding: 0 8px;">
                            <button onclick="game._darkVisionsToggleDiscard(${cardIdx})" 
                                style="background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 6px 10px; font-size: 0.85em; white-space: nowrap;">
                                ✕ Discard
                            </button>
                        </div>
                    </div>`;
            });
            cardsHTML += `<div style="text-align: center; color: #666; font-size: 0.8em; margin: 2px 0 10px;">↑ Drawn first &nbsp;&nbsp;|&nbsp;&nbsp; Drawn last ↓</div>`;
        }
        
        // Render discarded cards
        if (discardedIndices.length > 0) {
            cardsHTML += `<div style="margin: 8px 0 4px; color: #ef4444; font-weight: bold; font-size: 0.9em;">🗑️ DISCARDING (${discardedIndices.length})</div>`;
            discardedIndices.forEach(cardIdx => {
                const card = state.drawnCards[cardIdx];
                const summary = this._darkVisionsGetCardSummary(card);
                cardsHTML += `
                    <div style="display: flex; align-items: center; margin: 4px 0; border: 2px dashed #555; border-radius: 6px; background: rgba(0,0,0,0.2); opacity: 0.6;">
                        <div style="flex: 1; padding: 8px;">
                            <div style="font-weight: bold; color: #888; font-size: 0.95em; text-decoration: line-through;">${summary.title}</div>
                        </div>
                        <div style="display: flex; align-items: center; padding: 0 8px;">
                            <button onclick="game._darkVisionsToggleDiscard(${cardIdx})" 
                                style="background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 6px 10px; font-size: 0.85em; white-space: nowrap;">
                                ↩ Keep
                            </button>
                        </div>
                    </div>`;
            });
        }
        
        const totalKept = keptIndices.length;
        const totalDiscarded = discardedIndices.length;
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="color: #d4af37; font-size: 0.95em;">
                    ${state.heroSymbol} ${state.heroName} peers into the darkness...
                </div>
                <div style="color: #999; font-size: 0.85em; margin-top: 4px;">
                    Select cards to discard. Reorder kept cards with ▲▼ arrows. #1 is drawn first.
                </div>
            </div>
            <div style="max-height: 380px; overflow-y: auto; padding: 2px;">
                ${cardsHTML}
            </div>
            <div style="margin-top: 12px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; text-align: center;">
                <span style="color: #4ade80;">${totalKept} kept</span> &nbsp;|&nbsp; <span style="color: #ef4444;">${totalDiscarded} discarded</span>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
                <button class="btn" style="flex: 1; background: #dc2626;" onclick="game._darkVisionsDiscardAll()">Discard All ${state.drawnCards.length}</button>
                <button class="btn btn-primary" style="flex: 1;" onclick="game._darkVisionsConfirm()">Confirm</button>
            </div>
        `;
        
        this.showInfoModal('🔮 Dark Visions', contentHTML);
        // Hide the default OK button
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && !defaultBtn.querySelector('.btn-primary[onclick*="darkVisions"]')) {
            defaultBtn.style.display = 'none';
        }
        // Hide the modal close X button
        const closeBtn = document.querySelector('#info-modal .modal-close-btn');
        if (closeBtn) closeBtn.style.display = 'none';
    },
    
    _darkVisionsToggleDiscard(cardIdx) {
        const state = this._darkVisionsState;
        if (!state) return;
        
        if (state.discarded.has(cardIdx)) {
            state.discarded.delete(cardIdx);
            // Add back to end of kept order
            if (!state.keptOrder.includes(cardIdx)) {
                state.keptOrder.push(cardIdx);
            }
        } else {
            state.discarded.add(cardIdx);
            // Remove from kept order
            state.keptOrder = state.keptOrder.filter(i => i !== cardIdx);
        }
        this._darkVisionsRender();
    },
    
    _darkVisionsMoveUp(cardIdx) {
        const state = this._darkVisionsState;
        if (!state) return;
        
        const keptOnly = state.keptOrder.filter(i => !state.discarded.has(i));
        const pos = keptOnly.indexOf(cardIdx);
        if (pos <= 0) return;
        
        // Swap in keptOrder
        const fullPos = state.keptOrder.indexOf(cardIdx);
        const prevKeptIdx = keptOnly[pos - 1];
        const prevFullPos = state.keptOrder.indexOf(prevKeptIdx);
        
        state.keptOrder[fullPos] = prevKeptIdx;
        state.keptOrder[prevFullPos] = cardIdx;
        
        this._darkVisionsRender();
    },
    
    _darkVisionsMoveDown(cardIdx) {
        const state = this._darkVisionsState;
        if (!state) return;
        
        const keptOnly = state.keptOrder.filter(i => !state.discarded.has(i));
        const pos = keptOnly.indexOf(cardIdx);
        if (pos < 0 || pos >= keptOnly.length - 1) return;
        
        // Swap in keptOrder
        const fullPos = state.keptOrder.indexOf(cardIdx);
        const nextKeptIdx = keptOnly[pos + 1];
        const nextFullPos = state.keptOrder.indexOf(nextKeptIdx);
        
        state.keptOrder[fullPos] = nextKeptIdx;
        state.keptOrder[nextFullPos] = cardIdx;
        
        this._darkVisionsRender();
    },
    
    _darkVisionsDiscardAll() {
        const state = this._darkVisionsState;
        if (!state) return;
        
        state.drawnCards.forEach((_, i) => state.discarded.add(i));
        state.keptOrder = [];
        this._darkVisionsRender();
    },
    
    _darkVisionsConfirm() {
        const state = this._darkVisionsState;
        if (!state) return;
        
        const keptIndices = state.keptOrder.filter(i => !state.discarded.has(i));
        const discardedIndices = [...state.discarded];
        
        // Put kept cards back on TOP of darkness deck in order (first in list = first drawn)
        // unshift in reverse so index 0 ends up on top
        for (let i = keptIndices.length - 1; i >= 0; i--) {
            this.darknessDeck.unshift(state.drawnCards[keptIndices[i]]);
        }
        
        // Discarded cards increase discard pile count
        this.darknessDiscardPile += discardedIndices.length;
        
        // Log results
        const keptNames = keptIndices.map(i => {
            const c = state.drawnCards[i];
            return this._darkVisionsGetCardSummary(c).title;
        });
        const discardedNames = discardedIndices.map(i => {
            const c = state.drawnCards[i];
            return this._darkVisionsGetCardSummary(c).title;
        });
        
        if (keptIndices.length > 0) {
            this.addLog(`  ↩ Returned ${keptIndices.length} card(s) to top of deck`);
        }
        if (discardedIndices.length > 0) {
            this.addLog(`  🗑️ Discarded ${discardedIndices.length} card(s): ${discardedNames.join(', ')}`);
        }
        
        this._darkVisionsState = null;
        this.updateDeckCounts();
        this.closeInfoModal();
        
        // Restore close button
        const closeBtn = document.querySelector('#info-modal .modal-close-btn');
        if (closeBtn) closeBtn.style.display = '';
        
        // Show summary
        let summaryHTML = '<div style="text-align: left; max-height: 300px; overflow-y: auto;">';
        if (keptIndices.length > 0) {
            summaryHTML += '<div style="color: #4ade80; font-weight: bold; margin-bottom: 6px;">📥 Returned to deck (draw order):</div>';
            keptNames.forEach((name, i) => {
                summaryHTML += `<div style="margin: 3px 0 3px 10px; color: #ccc;"><span style="color: #888;">#${i + 1}</span> ${name}</div>`;
            });
        }
        if (discardedIndices.length > 0) {
            summaryHTML += `<div style="color: #ef4444; font-weight: bold; margin: ${keptIndices.length > 0 ? '10px' : '0'} 0 6px;">🗑️ Discarded:</div>`;
            discardedNames.forEach(name => {
                summaryHTML += `<div style="margin: 3px 0 3px 10px; color: #888; text-decoration: line-through;">${name}</div>`;
            });
        }
        summaryHTML += '</div>';
        
        setTimeout(() => {
            this.showInfoModal('🔮 Dark Visions — Complete', summaryHTML);
        }, 300);
    },
    
    
    // ===== MILITIA SECURES AREA =====
    _findMilitiaSecuresCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'militia_secures') {
                    return { hero, heroIndex: i, cardIndex: j };
                }
            }
        }
        return null;
    },
    
    _militiaSecuresShowPicker() {
        const card = this.darknessCurrentCard;
        if (!card || !card.faction1) return;
        
        const f1Name = this.generals.find(g => g.color === card.faction1)?.name || 'Unknown';
        const f2Name = this.generals.find(g => g.color === card.faction2)?.name || 'Unknown';
        const c1 = this.getGeneralColor(card.faction1);
        const c2 = this.getGeneralColor(card.faction2);
        const w1 = this.predictMinionOutcome(card.faction1, card.minions1, card.location1);
        const w2 = this.predictMinionOutcome(card.faction2, card.minions2, card.location2);
        
        const warn1 = w1.length > 0 ? `<div style="margin-top: 4px;">${this.renderPredictionTags(w1)}</div>` : '';
        const warn2 = w2.length > 0 ? `<div style="margin-top: 4px;">${this.renderPredictionTags(w2)}</div>` : '';
        
        const militiaHolder = this._findMilitiaSecuresCard();
        const holderText = militiaHolder ? `${militiaHolder.hero.symbol} ${militiaHolder.hero.name}` : '';
        
        const pickerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 1.5em; margin-bottom: 8px;">🛡️</div>
                <div style="color: #d4af37; margin-bottom: 4px;">Choose which minion placement to cancel:</div>
                <div style="color: #888; font-size: 0.85em;">Card from ${holderText}'s hand will be consumed</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin: 15px 0;">
                <div onclick="game._militiaSecuresConfirm(1)" 
                     style="cursor: pointer; padding: 14px; border: 2px solid ${c1}; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="color: ${c1}; font-weight: bold; font-size: 1.05em;">Minion 1: ${f1Name}</div>
                    <div style="color: #ccc; margin-top: 4px;">${card.minions1} minion${card.minions1 > 1 ? 's' : ''} → ${card.location1}</div>
                    ${warn1}
                </div>
                <div onclick="game._militiaSecuresConfirm(2)" 
                     style="cursor: pointer; padding: 14px; border: 2px solid ${c2}; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="color: ${c2}; font-weight: bold; font-size: 1.05em;">Minion 2: ${f2Name}</div>
                    <div style="color: #ccc; margin-top: 4px;">${card.minions2} minion${card.minions2 > 1 ? 's' : ''} → ${card.location2}</div>
                    ${warn2}
                </div>
            </div>
            <div style="text-align: center;">
                <button class="btn" style="background: #666; min-width: 120px;" onclick="game.closeInfoModal()">Cancel</button>
            </div>
        `;
        
        this.showInfoModal('🛡️ Militia Secures Area', pickerHTML);
        // Hide default OK button
        const defaultBtn = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtn && !defaultBtn.querySelector('.btn[onclick*="closeInfoModal"]')) {
            defaultBtn.style.display = 'none';
        }
    },
    
    _militiaSecuresConfirm(slot) {
        const militiaHolder = this._findMilitiaSecuresCard();
        if (!militiaHolder) return;
        
        const card = this.darknessCurrentCard;
        const faction = slot === 1 ? card.faction1 : card.faction2;
        const location = slot === 1 ? card.location1 : card.location2;
        const count = slot === 1 ? card.minions1 : card.minions2;
        const factionName = this.generals.find(g => g.color === faction)?.name || 'Unknown';
        
        // Remove card from hero's hand (played — removed from game)
        this._playSpecialCard(militiaHolder.hero, militiaHolder.cardIndex);
        
        // Store secured slot
        this.militiaSecuredSlot = slot;
        
        this.addLog(`🛡️ ${militiaHolder.hero.name} plays Militia Secures Area — cancels ${factionName} placement (${count} @ ${location})`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Re-render the preview with the secured slot shown
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
    },
    
    // ===== STRONG DEFENSES =====
    _findStrongDefensesCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'strong_defenses') {
                    return { hero, heroIndex: i, cardIndex: j };
                }
            }
        }
        return null;
    },
    
    _strongDefensesConfirm() {
        const holder = this._findStrongDefensesCard();
        if (!holder) return;
        
        const card = this.darknessCurrentCard;
        const generalName = this.generals.find(g => g.color === card.general)?.name || 'Unknown';
        
        // Remove card from hero's hand (played — removed from game)
        this._playSpecialCard(holder.hero, holder.cardIndex);
        
        // Store blocked state
        this.strongDefensesActive = true;
        
        this.addLog(`🏰 ${holder.hero.name} plays Strong Defenses — prevents ${generalName} from moving to ${card.location3}`);
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Re-render the preview with blocked general shown
        const cardNum = this.darknessCardsDrawn;
        const totalCards = this.darknessCardsToDraw;
        const generalOnly = this.darknessCurrentGeneralOnly;
        this.showDarknessCardPreview(card, cardNum, totalCards, generalOnly);
    },
    
    
    // ===== GENERAL WOUND SYSTEM =====
    _getWoundType(general) {
        // Sapphire ignores wound system (regeneration)
        if (general.combatSkill === 'regeneration') return null;
        if (general.defeated) return null;
        if (general.health >= general.maxHealth) return null;
        
        // Major wound thresholds
        if (general.name === 'Gorgutt' && general.health <= 2) return 'major';
        if (general.name === 'Balazarg' && general.health <= 1) return 'major';
        // Varkolak cannot have major wounds
        if (general.name === 'Varkolak') return 'minor';
        
        return 'minor';
    },
    
    _setGeneralWound(general, attackerPlayerIndex) {
        // Sapphire ignores wound system
        if (general.combatSkill === 'regeneration') {
            delete this.generalWounds[general.color];
            return;
        }
        if (general.defeated) {
            delete this.generalWounds[general.color];
            return;
        }
        if (general.health >= general.maxHealth) {
            delete this.generalWounds[general.color];
            return;
        }
        
        const woundType = this._getWoundType(general);
        if (!woundType) {
            delete this.generalWounds[general.color];
            return;
        }
        
        const numHeroes = this.heroes.length;
        // Minor: heals at end of NEXT player's turn (skip attacker's own turn end)
        // Major: heals after full round + attacker completes a new turn
        // +1 accounts for the attacker's own turn end being the first decrement
        const countdown = woundType === 'major' ? (numHeroes + 1) : 2;
        
        this.generalWounds[general.color] = {
            type: woundType,
            healingCountdown: countdown,
            woundedByPlayerIndex: attackerPlayerIndex
        };
        
        this.addLog(`  ⚔️ ${general.name} has ${woundType === 'major' ? 'MAJOR' : 'Minor'} Wounds (${general.health}/${general.maxHealth})`);
    },
    
    _processGeneralHealing() {
        const healingResults = [];
        
        for (const general of this.generals) {
            if (general.defeated) continue;
            if (general.combatSkill === 'regeneration') continue; // Sapphire ignores
            
            const wound = this.generalWounds[general.color];
            if (!wound) continue;
            
            // Already at max health - clear wound
            if (general.health >= general.maxHealth) {
                delete this.generalWounds[general.color];
                continue;
            }
            
            // Decrement countdown if still waiting
            if (wound.healingCountdown > 0) {
                wound.healingCountdown--;
            }
            
            if (wound.healingCountdown > 0) {
                // Still waiting to begin healing
                healingResults.push({
                    general: general,
                    wound: wound,
                    healed: false,
                    waiting: true
                });
            } else {
                // Active healing — heal 1 HP
                const oldHealth = general.health;
                general.health = Math.min(general.health + 1, general.maxHealth);
                const healedAmount = general.health - oldHealth;
                
                // Check if wound type changed after healing
                const newWoundType = this._getWoundType(general);
                if (!newWoundType || general.health >= general.maxHealth) {
                    // Fully healed
                    const oldType = wound.type;
                    delete this.generalWounds[general.color];
                    healingResults.push({
                        general: general,
                        wound: { type: oldType },
                        healed: true,
                        healedAmount: healedAmount,
                        fullyHealed: general.health >= general.maxHealth
                    });
                    if (healedAmount > 0) {
                        this.addLog(`💚 ${general.name} heals ${healedAmount} HP → ${general.health}/${general.maxHealth} (Fully healed!)`);
                    }
                } else {
                    // Still wounded, update type if changed
                    if (newWoundType !== wound.type) {
                        wound.type = newWoundType;
                    }
                    healingResults.push({
                        general: general,
                        wound: wound,
                        healed: true,
                        healedAmount: healedAmount,
                        fullyHealed: false
                    });
                    if (healedAmount > 0) {
                        this.addLog(`💚 ${general.name} heals ${healedAmount} HP → ${general.health}/${general.maxHealth} (${wound.type} wounds)`);
                    }
                }
            }
        }
        
        return healingResults;
    },
    
    _buildHealingHTML(healingResults) {
        if (healingResults.length === 0) return '';
        
        let html = `<div style="margin: 12px 0; padding: 10px; border: 2px solid #a78bfa; background: rgba(167,139,250,0.1); border-radius: 8px;">
            <div style="font-weight: bold; color: #a78bfa; margin-bottom: 8px; font-size: 0.95em;">⚔️ General Wounds</div>`;
        
        healingResults.forEach(result => {
            const g = result.general;
            const gc = this.getGeneralColor(g.color);
            const woundColor = result.wound.type === 'major' ? '#ef4444' : '#f59e0b';
            const woundLabel = result.wound.type === 'major' ? 'MAJOR WOUNDS' : 'Minor Wounds';
            
            if (result.spyBlocked) {
                html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid #7c3aed; background: rgba(124,58,237,0.15); border-radius: 3px;">
                    <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                    <span style="color: #a78bfa; margin-left: 6px;">👤 Spy In The Camp — Healing blocked!</span>
                    <span style="color: ${woundColor}; font-size: 0.85em; margin-left: 6px;">(${woundLabel} — ${g.health}/${g.maxHealth})</span>
                </div>`;
            } else if (result.healed) {
                if (result.fullyHealed) {
                    html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid #4ade80; background: rgba(0,0,0,0.2); border-radius: 3px;">
                        <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                        <span style="color: #4ade80; margin-left: 6px;">+${result.healedAmount} HP → ${g.health}/${g.maxHealth} — Fully Healed!</span>
                    </div>`;
                } else {
                    html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid ${woundColor}; background: rgba(0,0,0,0.2); border-radius: 3px;">
                        <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                        <span style="color: #4ade80; margin-left: 6px;">+${result.healedAmount} HP → ${g.health}/${g.maxHealth}</span>
                        <span style="color: ${woundColor}; font-size: 0.85em; margin-left: 6px;">(${woundLabel})</span>
                    </div>`;
                }
            } else {
                // Still waiting for countdown
                const turnsLeft = result.wound.healingCountdown;
                html += `<div style="padding: 6px 8px; margin: 4px 0; border-left: 3px solid ${woundColor}; background: rgba(0,0,0,0.2); border-radius: 3px;">
                    <span style="color: ${gc}; font-weight: bold;">${g.symbol} ${g.name}</span>
                    <span style="color: ${woundColor}; font-size: 0.85em; margin-left: 6px;">${woundLabel} — ${g.health}/${g.maxHealth}</span>
                    <span style="color: #999; font-size: 0.85em; margin-left: 4px;">— Healing in ${turnsLeft} turn${turnsLeft !== 1 ? 's' : ''}</span>
                </div>`;
            }
        });
        
        html += '</div>';
        return html;
    },
    
    // ===== SPY IN THE CAMP =====
    _findSpyInCampCard() {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            for (let j = 0; j < hero.cards.length; j++) {
                if (hero.cards[j].specialAction === 'spy_in_camp') {
                    return { hero, heroIndex: i, cardIndex: j };
                }
            }
        }
        return null;
    },
    
    _getWoundedGeneralsForSpy() {
        // Returns generals that have wounds and would heal this turn (countdown === 0 after decrement)
        // OR are already actively healing (countdown already 0)
        return this.generals.filter(g => {
            if (g.defeated) return false;
            if (g.combatSkill === 'regeneration') return false;
            const wound = this.generalWounds[g.color];
            if (!wound) return false;
            // Show if the general has any wound status (even if still counting down)
            return true;
        });
    },
    
    _spyInCampShowPicker() {
        const woundedGenerals = this._getWoundedGeneralsForSpy();
        if (woundedGenerals.length === 0) return;
        
        const spyHolder = this._findSpyInCampCard();
        const holderText = spyHolder ? `${spyHolder.hero.symbol} ${spyHolder.hero.name}` : '';
        
        let generalsHTML = '';
        woundedGenerals.forEach(g => {
            const gc = this.getGeneralColor(g.color);
            const wound = this.generalWounds[g.color];
            const woundColor = wound.type === 'major' ? '#ef4444' : '#f59e0b';
            const woundLabel = wound.type === 'major' ? 'MAJOR WOUNDS' : 'Minor Wounds';
            const healStatus = wound.healingCountdown > 0 
                ? `Healing in ${wound.healingCountdown} turn${wound.healingCountdown !== 1 ? 's' : ''}`
                : 'Currently healing';
            const statusColor = wound.healingCountdown > 0 ? '#999' : '#4ade80';
            
            generalsHTML += `
                <div onclick="game._spyInCampConfirm('${g.color}')" 
                     style="cursor: pointer; padding: 14px; border: 2px solid ${gc}; border-radius: 8px; background: rgba(0,0,0,0.3); transition: all 0.2s; margin-bottom: 8px;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                    <div style="color: ${gc}; font-weight: bold; font-size: 1.05em;">${g.symbol} ${g.name}</div>
                    <div style="color: #ccc; margin-top: 4px;">${g.health}/${g.maxHealth} HP — <span style="color: ${woundColor};">${woundLabel}</span></div>
                    <div style="color: ${statusColor}; font-size: 0.9em; margin-top: 2px;">${healStatus}</div>
                </div>`;
        });
        
        const pickerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 1.5em; margin-bottom: 8px;">👤</div>
                <div style="color: #d4af37; margin-bottom: 4px;">Choose a General to block healing:</div>
                <div style="color: #888; font-size: 0.85em;">Card from ${holderText}'s hand will be consumed</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0; margin: 15px 0;">
                ${generalsHTML}
            </div>
            <div style="text-align: center;">
                <button class="btn" style="background: #666; min-width: 120px;" onclick="game.closeInfoModal()">Cancel</button>
            </div>
        `;
        
        this.showInfoModal('👤 Spy In The Camp', pickerHTML);
    },
    
    _spyInCampConfirm(generalColor) {
        const spyHolder = this._findSpyInCampCard();
        if (!spyHolder) return;
        
        const general = this.generals.find(g => g.color === generalColor);
        if (!general) return;
        
        // Remove card from hero's hand (played — removed from game)
        this._playSpecialCard(spyHolder.hero, spyHolder.cardIndex);
        
        // Store blocked general for this turn
        this.spyBlockedGeneral = generalColor;
        
        this.addLog(`👤 ${spyHolder.hero.name} plays Spy In The Camp — blocks ${general.name} from healing this turn`);
        
        // Reverse the healing that already happened for this general in stored results
        if (this._daytimeHealingResults) {
            const resultIdx = this._daytimeHealingResults.findIndex(r => r.general.color === generalColor);
            if (resultIdx !== -1) {
                const result = this._daytimeHealingResults[resultIdx];
                if (result.healed && result.healedAmount > 0) {
                    // Undo the HP gain
                    general.health -= result.healedAmount;
                    // If wound was cleared because it fully healed, restore it
                    if (result.fullyHealed || !this.generalWounds[generalColor]) {
                        this.generalWounds[generalColor] = { 
                            type: result.wound.type, 
                            healingCountdown: 0,
                            woundedByPlayerIndex: result.wound.woundedByPlayerIndex
                        };
                    }
                }
                // Mark result as spy blocked
                result.spyBlocked = true;
                result.healed = false;
                result.healedAmount = 0;
                result.fullyHealed = false;
                // Update wound reference to current state
                result.wound = this.generalWounds[generalColor];
            }
        }
        
        this.closeInfoModal();
        this.renderHeroes();
        this.updateDeckCounts();
        
        // Re-run the daytime modal to show updated state (healing won't re-process due to _daytimeHealingDone flag)
        const hero = this.endOfTurnState.hero;
        const damageInfo = this.endOfTurnState.damageInfo;
        this.showDaytimeModal(hero, damageInfo);
    },
    

});
