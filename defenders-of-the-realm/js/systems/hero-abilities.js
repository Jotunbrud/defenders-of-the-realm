// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Hero Abilities & Special Skills
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    showEagleAttackStyleModal() {
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.name !== 'Eagle Rider') return false;
        
        console.log('=== showEagleAttackStyleModal: Eagle Rider turn start ===');
        document.getElementById('eagle-attack-style-modal').classList.add('active');
        return true; // Modal was shown
    },
    
    selectEagleAttackStyle(style) {
        this.eagleRiderAttackStyle = style;
        this.eagleRiderRerollUsed = false;
        const hero = this.heroes[this.currentPlayerIndex];
        const styleName = style === 'sky' ? '☁️ Sky Attack' : '⚔️ Ground Attack';
        this.addLog(`${hero.name} chose ${styleName} for this turn.`);
        
        document.getElementById('eagle-attack-style-modal').classList.remove('active');
        
        // Update hero display to show current attack style
        this.renderHeroes();
        this.updateGameStatus();
    },
    
    // Check if Eagle Rider needs attack style modal at turn start
    // Returns true if modal was shown (caller should wait for selection)
    _checkEagleRiderTurnStart() {
        const hero = this.heroes[this.currentPlayerIndex];
        if (hero.name === 'Eagle Rider') {
            this.eagleRiderAttackStyle = null; // Reset for new selection
            this.eagleRiderRerollUsed = false;
            return this.showEagleAttackStyleModal();
        }
        // Don't clear attack style for non-Eagle Rider heroes
        // Eagle Rider's style persists so group attacks respect Sky Attack
        this.eagleRiderRerollUsed = false;
        
        // Chain to Shape Shifter check for Sorceress
        this._checkShapeShifterTurnStart();
        return false;
    },
    
    // Sorceress Shape Shifter: choose a faction form at start of turn
    _checkShapeShifterTurnStart() {
        const hero = this.heroes[this.currentPlayerIndex];
        console.log('[SHAPESHIFT] _checkShapeShifterTurnStart called, hero:', hero.name);
        if (hero.name !== 'Sorceress') {
            this.shapeshiftForm = null;
            return;
        }
        
        // Reset form at start of turn — player must choose each turn
        this.shapeshiftForm = null;
        
        this._showShapeShifterModal();
    },
    
    _showShapeShifterModal() {
        console.log('[SHAPESHIFT] Showing Shape Shifter modal');
        
        // Reset visual state from previous turn
        this._ssSelectedColor = null;
        ['green', 'black', 'red', 'blue'].forEach(c => {
            const el = document.getElementById(`ss-opt-${c}`);
            if (el) {
                el.classList.remove('ss-active');
                el.style.background = 'rgba(0,0,0,0.3)';
                const factionHex = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
                el.style.borderColor = factionHex[c];
            }
        });
        const btn = document.getElementById('ss-confirm-btn');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.style.background = '#666';
            btn.className = 'btn';
        }
        
        document.getElementById('shapeshift-modal').classList.add('active');
    },
    
    selectShapeshiftForm(color) {
        const hero = this.heroes[this.currentPlayerIndex];
        document.getElementById('shapeshift-modal').classList.remove('active');
        
        // Reset ambush tracking for new turn
        this.ambushMinionUsed = false;
        this.ambushGeneralUsed = false;
        
        if (color) {
            const factionNames = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            const factionIcons = { green: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;border:1.5px solid #000;vertical-align:middle;"></span>', black: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1f2937;border:1.5px solid #000;vertical-align:middle;"></span>', red: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:1.5px solid #000;vertical-align:middle;"></span>', blue: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;border:1.5px solid #000;vertical-align:middle;"></span>' };
            
            this.shapeshiftForm = color;
            this.addLog(`⚡ Shape Shifter: ${hero.name} takes ${factionNames[color]} form ${factionIcons[color]}`);
        } else {
            this.shapeshiftForm = null;
            this.addLog(`⚡ Shape Shifter: ${hero.name} remains in normal form`);
        }
        
        this.renderHeroes();
        this.updateGameStatus();
        this.updateMovementButtons();
        this.updateActionButtons();
    },
    
    // Shape Shifter modal: select a faction option (highlight it)
    _ssSelect(color) {
        this._ssSelectedColor = color;
        
        ['green', 'black', 'red', 'blue'].forEach(c => {
            const el = document.getElementById(`ss-opt-${c}`);
            if (el) {
                el.classList.remove('ss-active');
                el.style.background = 'rgba(0,0,0,0.3)';
                // Reset border to faction color
                const factionHex = { green: '#16a34a', black: '#6b7280', red: '#dc2626', blue: '#3b82f6' };
                el.style.borderColor = factionHex[c];
            }
        });
        
        const selected = document.getElementById(`ss-opt-${color}`);
        if (selected) {
            selected.classList.add('ss-active');
            selected.style.background = 'rgba(236,72,153,0.2)';
            selected.style.borderColor = '#fbbf24';
        }
        
        const btn = document.getElementById('ss-confirm-btn');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.background = '';
            btn.className = 'btn btn-primary';
        }
    },
    
    // Shape Shifter modal: confirm selection
    _ssConfirm() {
        const color = this._ssSelectedColor;
        if (!color) return;
        this._ssSelectedColor = null;
        this.selectShapeshiftForm(color);
    },
    
    // Fresh Mount: Check if Eagle Rider ends turn at Monarch City or blue faction location
    // Only triggers when "on the ground" — i.e., Ground Attack style (not Sky Attack)
    _checkFreshMount(hero, damageInfo) {
        if (hero.name !== 'Eagle Rider') return;
        if (this.eagleRiderAttackStyle !== 'ground') return; // Must be on the ground
        
        const loc = this.locationCoords[hero.location];
        const isBlueOrMonarch = hero.location === 'Monarch City' || (loc && loc.faction === 'blue');
        
        if (isBlueOrMonarch) {
            this.eagleRiderFreshMountPending = true;
            damageInfo.freshMountTriggered = true;
            this.addLog(`🦅 Fresh Mount: ${hero.name} rests at ${hero.location} — +1 action next turn!`);
        }
    },
    
    // Fresh Mount: Apply +1 action bonus at start of Eagle Rider's turn
    _applyFreshMountBonus(hero) {
        if (hero.name === 'Eagle Rider' && this.eagleRiderFreshMountPending) {
            this.eagleRiderFreshMountPending = false;
            this.actionsRemaining += 1;
            this.addLog(`🦅 Fresh Mount: ${hero.name} gains +1 action! (${this.actionsRemaining} total)`);
        }
    },
    
    // Mountain Lore: Dwarf gains +1 action when starting turn in a Red location
    _applyMountainLoreBonus(hero) {
        if (hero.name === 'Dwarf') {
            const loc = this.locationCoords[hero.location];
            if (loc && loc.faction === 'red') {
                this.actionsRemaining += 1;
                this.addLog(`⛏️ Mountain Lore: ${hero.name} draws strength from the red mountains of ${hero.location} — +1 action! (${this.actionsRemaining} total)`);
            }
        }
    },
    
    _applyElfSupportBonus(hero) {
        if (hero.name === 'Ranger') {
            const loc = this.locationCoords[hero.location];
            if (loc && loc.faction === 'green') {
                this.actionsRemaining += 1;
                this.addLog(`🏹 Elf Support: ${hero.name} receives aid from the elves of ${hero.location} — +1 action! (${this.actionsRemaining} total)`);
            }
        }
    },
    
    // Ranger Woods Lore: +1 to attack rolls in green locations
    _getWoodsLoreBonus(hero) {
        if (hero.name !== 'Ranger') return 0;
        if (this.rangedAttack) return 0; // Archery cannot combine with Woods Lore
        const loc = this.locationCoords[hero.location];
        return (loc && loc.faction === 'green') ? 1 : 0;
    },
    
    // Cleric Blessed Attacks: +1 to attack rolls vs Undead and Demon minions only
    _getBlessedAttacksBonus(hero, minionColor) {
        if (hero.name !== 'Cleric') return 0;
        return (minionColor === 'black' || minionColor === 'red') ? 1 : 0;
    },
    
    // Quest Magic Item: +1 to all dice in combat (minions and generals) when hero has completed Amulet of the Gods
    _getQuestCombatBonus(hero) {
        if (!hero.questCards) return 0;
        const amulet = hero.questCards.find(q => q.completed && q.mechanic && q.mechanic.rewardType === 'quest_magic_item');
        return amulet ? 1 : 0;
    },
    
    // Check if hero has any completed quest magic item (Amulet, Boots, Helm)
    // Use: hero.questCards items with mechanic.magicItem === true
    _hasQuestMagicItem(hero, itemName = null) {
        if (!hero.questCards) return false;
        return hero.questCards.some(q => q.completed && q.mechanic && q.mechanic.magicItem === true
            && (itemName ? q.name === itemName : true));
    },
    
    // Get all completed magic items for a hero
    _getQuestMagicItems(hero) {
        if (!hero.questCards) return [];
        return hero.questCards.filter(q => q.completed && q.mechanic && q.mechanic.magicItem === true);
    },
    
    // War Banner of Valor: hero ignores Hero Defeated penalties against Generals
    _hasWarBanner(hero) {
        if (!hero.questCards) return false;
        return hero.questCards.some(q => q.completed && q.mechanic && q.mechanic.rewardType === 'ignore_hero_defeated');
    },
    
    // Sorceress Ambush: +2 vs minions (first engage), +1 vs generals (first attack) when shapeshifted into matching faction
    _getAmbushBonus(hero, targetType, targetColor) {
        if (hero.name !== 'Sorceress' || !this.shapeshiftForm) return 0;
        
        if (targetType === 'minion') {
            if (this.ambushMinionUsed) return 0;
            return (this.shapeshiftForm === targetColor) ? 2 : 0;
        }
        
        if (targetType === 'general') {
            if (this.ambushGeneralUsed) return 0;
            // Map shapeshiftForm color to general faction string
            const formToFaction = { green: 'Orc', black: 'Undead', red: 'Demon', blue: 'Dragon' };
            return (formToFaction[this.shapeshiftForm] === targetColor) ? 1 : 0;
        }
        
        return 0;
    },
    
    // Cleric Turn Undead: move all undead minions to adjacent locations when ending turn
    showTurnUndeadModal() {
        const hero = this.heroes[this.currentPlayerIndex];
        const location = hero.location;
        const undeadCount = this.minions[location] ? (this.minions[location].black || 0) : 0;
        
        if (undeadCount <= 0) {
            // All undead moved — show results and continue
            this._finishTurnUndead();
            return;
        }
        
        // Initialize Turn Undead state on first call
        if (!this.turnUndeadState) {
            this.turnUndeadState = {
                heroName: hero.name,
                heroSymbol: hero.symbol,
                sourceLocation: location,
                originalCount: undeadCount,
                movements: [] // { targetLocation, count }
            };
        }
        
        const connected = this.getConnectedLocations(location);
        
        // Filter to locations with available capacity
        const validLocations = connected.filter(loc => {
            const minionsHere = this.minions[loc];
            const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
            const maxCapacity = loc === 'Monarch City' ? 4 : 3;
            return totalMinions < maxCapacity;
        });
        
        // Edge case: no valid locations with space
        if (validLocations.length === 0) {
            this.addLog(`✝️ Turn Undead: All adjacent locations at capacity — ${undeadCount} Undead remain at ${location}`);
            this._finishTurnUndead();
            return;
        }
        
        // Set up activeMovement to highlight connected locations
        this.activeMovement = {
            cardIndex: -1,
            movementType: 'Turn Undead',
            maxMoves: 99,
            movesRemaining: 99,
            startLocation: hero.location,
            cardUsed: null,
            validDestinations: validLocations,
            isTurnUndead: true
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
            indicator.innerHTML = `<span style="color: #6b9bd2;">✝️ Turn Undead</span> — Select an adjacent location to move Undead to<br><span style="font-size: 0.85em;">${undeadCount} Undead minion${undeadCount !== 1 ? 's' : ''} remaining at ${location}</span>`;
        }
    },
    
    _turnUndeadShowPicker(targetLocation) {
        const state = this.turnUndeadState;
        if (!state) return;
        
        const sourceLocation = state.sourceLocation;
        const undeadCount = this.minions[sourceLocation] ? (this.minions[sourceLocation].black || 0) : 0;
        
        if (undeadCount <= 0) return;
        
        // Calculate available space at target
        const targetMinions = this.minions[targetLocation];
        const targetTotal = targetMinions ? Object.values(targetMinions).reduce((a, b) => a + b, 0) : 0;
        const maxCapacity = targetLocation === 'Monarch City' ? 4 : 3;
        const spaceAvailable = maxCapacity - targetTotal;
        
        // Max we can move is minimum of undead remaining and space available
        const maxToMove = Math.min(undeadCount, spaceAvailable);
        
        if (maxToMove <= 0) return;
        
        // Show target location info
        let targetInfo = '';
        if (targetTotal > 0) {
            const parts = [];
            if (targetMinions.green > 0) parts.push(`${targetMinions.green} Orc`);
            if (targetMinions.black > 0) parts.push(`${targetMinions.black} Undead`);
            if (targetMinions.red > 0) parts.push(`${targetMinions.red} Demon`);
            if (targetMinions.blue > 0) parts.push(`${targetMinions.blue} Dragon`);
            targetInfo = `<div style="color: #999; font-size: 0.9em;">Currently: ${parts.join(', ')} (${targetTotal}/${maxCapacity})</div>`;
        } else {
            targetInfo = `<div style="color: #4ade80; font-size: 0.9em;">Currently empty (0/${maxCapacity})</div>`;
        }
        
        const spaceNote = `<div style="color: #d4af37; font-size: 0.85em; margin-top: 4px;">Space available: ${spaceAvailable}</div>`;
        
        // Build quantity selector
        this._turnUndeadTarget = targetLocation;
        this._turnUndeadMoveCount = 1;
        
        let quantityHTML = '';
        if (maxToMove === 1) {
            quantityHTML = `<div style="color: #6b9bd2; font-size: 1.3em; font-weight: bold; margin: 15px 0;">Moving 1 Undead minion</div>`;
        } else {
            const buttons = [];
            for (let i = 1; i <= maxToMove; i++) {
                buttons.push(`<button id="tu-qty-${i}" onclick="game._turnUndeadSetQuantity(${i}, ${maxToMove})" 
                    style="width: 45px; height: 45px; border-radius: 8px; font-size: 1.2em; font-weight: bold; cursor: pointer; transition: all 0.15s; ${i === 1 ? 'background: #1e3a7a; color: #fff; border: 2px solid #6b9bd2;' : 'background: rgba(0,0,0,0.4); color: #6b9bd2; border: 2px solid #666;'}">${i}</button>`);
            }
            quantityHTML = `
                <div style="margin: 15px 0;">
                    <div style="color: #d4af37; margin-bottom: 8px;">How many Undead to move here? (max ${maxToMove})</div>
                    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                        ${buttons.join('')}
                    </div>
                </div>
            `;
        }
        
        const contentHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 1.5em; margin-bottom: 3px;">✝️</div>
                <div style="color: #ffd700; font-weight: bold; font-size: 1.05em;">📍 ${targetLocation}</div>
                ${targetInfo}
                ${spaceNote}
            </div>
            ${quantityHTML}
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn" style="flex: 1; background: #666;" onclick="game._turnUndeadCancelPick()">Back</button>
                <button id="tu-confirm-btn" class="btn btn-primary" style="flex: 1;" onclick="game._turnUndeadConfirm()">Move 1 Undead</button>
            </div>
        `;
        
        this.showInfoModal('✝️ Turn Undead', contentHTML);
        // Hide the default OK button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#tu-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    _turnUndeadSetQuantity(count, maxToMove) {
        this._turnUndeadMoveCount = count;
        
        // Update button styles
        for (let i = 1; i <= maxToMove; i++) {
            const btn = document.getElementById(`tu-qty-${i}`);
            if (btn) {
                if (i === count) {
                    btn.style.background = '#1e3a7a';
                    btn.style.color = '#fff';
                    btn.style.border = '2px solid #6b9bd2';
                } else {
                    btn.style.background = 'rgba(0,0,0,0.4)';
                    btn.style.color = '#6b9bd2';
                    btn.style.border = '2px solid #666';
                }
            }
        }
        
        // Update confirm button
        const confirmBtn = document.getElementById('tu-confirm-btn');
        if (confirmBtn) confirmBtn.textContent = `Move ${count} Undead`;
    },
    
    _turnUndeadCancelPick() {
        this.closeInfoModal();
        // Re-highlight locations
        this.showTurnUndeadModal();
    },
    
    _turnUndeadConfirm() {
        const state = this.turnUndeadState;
        if (!state) return;
        
        const targetLocation = this._turnUndeadTarget;
        const moveCount = this._turnUndeadMoveCount || 1;
        const sourceLocation = state.sourceLocation;
        
        // Initialize target minions if needed
        if (!this.minions[targetLocation]) {
            this.minions[targetLocation] = { red: 0, blue: 0, green: 0, black: 0 };
        }
        
        // Verify capacity one more time
        const targetTotal = Object.values(this.minions[targetLocation]).reduce((a, b) => a + b, 0);
        const maxCapacity = targetLocation === 'Monarch City' ? 4 : 3;
        const spaceAvailable = maxCapacity - targetTotal;
        const actual = Math.min(moveCount, this.minions[sourceLocation].black || 0, spaceAvailable);
        
        if (actual <= 0) return;
        
        // Move undead
        this.minions[sourceLocation].black -= actual;
        this.minions[targetLocation].black += actual;
        
        // Track movement for results
        const existing = state.movements.find(m => m.targetLocation === targetLocation);
        if (existing) {
            existing.count += actual;
        } else {
            state.movements.push({ targetLocation, count: actual });
        }
        
        this.addLog(`✝️ Turn Undead: Moved ${actual} Undead minion${actual !== 1 ? 's' : ''} from ${sourceLocation} to ${targetLocation}`);
        
        this.closeInfoModal();
        
        // Clean up highlights
        this.activeMovement = null;
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        const indicatorEl = document.getElementById('movement-indicator');
        if (indicatorEl) indicatorEl.remove();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        this.renderTokens();
        
        // Check if more undead remain
        const remaining = this.minions[sourceLocation].black || 0;
        if (remaining > 0) {
            // Re-highlight for next move (showTurnUndeadModal will check for valid locations)
            this.showTurnUndeadModal();
        } else {
            this._finishTurnUndead();
        }
    },
    
    _finishTurnUndead() {
        const state = this.turnUndeadState;
        if (!state) {
            this._executeEndTurn(this._turnUndeadFromMap);
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const sourceLocation = state.sourceLocation;
        const totalMoved = state.movements.reduce((sum, m) => sum + m.count, 0);
        const remaining = this.minions[sourceLocation] ? (this.minions[sourceLocation].black || 0) : 0;
        
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
        
        // Build results HTML
        let resultsHTML = '';
        if (totalMoved === 0) {
            resultsHTML = '<div style="color: #999; text-align: center; padding: 10px;">No Undead were moved — all adjacent locations at capacity.</div>';
        } else {
            state.movements.forEach(m => {
                resultsHTML += `<div style="margin: 5px 0 5px 15px; color: #6b7280;">
                    💀 ${m.count} Undead minion${m.count !== 1 ? 's' : ''} → <span style="color: #ffd700;">${m.targetLocation}</span>
                </div>`;
            });
        }
        
        let remainingHTML = '';
        if (remaining > 0) {
            remainingHTML = `<div style="margin-top: 8px; padding: 6px; background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 5px; color: #ef4444; font-size: 0.9em;">
                ⚠️ ${remaining} Undead minion${remaining !== 1 ? 's' : ''} could not be moved — all adjacent locations full
            </div>`;
        }
        
        this.addLog(`✝️ Turn Undead: ${hero.name} moved ${totalMoved} Undead from ${sourceLocation}!${remaining > 0 ? ` (${remaining} remain — no space)` : ''}`);
        
        this.turnUndeadState = null;
        
        // Update everything
        this.renderTokens();
        this.updateGameStatus();
        
        // Show results modal, then continue end of turn when closed
        const fromMap = this._turnUndeadFromMap;
        this.showInfoModal('✝️ Turn Undead — Results', `
            <div style="text-align: center; padding: 10px;">
                <div style="padding: 20px; border: 2px solid #1e3a7a; background: rgba(30,58,122,0.15); border-radius: 8px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">✝️</div>
                    <div style="font-size: 1.3em; color: #6b9bd2; font-weight: bold;">Turn Undead Complete</div>
                    <div style="color: #d4af37; margin-top: 5px;">From <strong>${sourceLocation}</strong></div>
                    <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; text-align: left;">
                        ${resultsHTML}
                        ${remainingHTML}
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #555; color: #ffd700; font-weight: bold; text-align: center;">
                            Total: ${totalMoved} Undead minion${totalMoved !== 1 ? 's' : ''} moved
                        </div>
                    </div>
                </div>
            </div>
        `, () => {
            this._executeEndTurn(fromMap);
        });
    },
    
    // Ranger Archery: get connected locations with minions
    _getRangerArcheryTargets(hero) {
        if (hero.name !== 'Ranger') return [];
        const connected = this.locationConnections[hero.location] || [];
        return connected.filter(loc => {
            const minions = this.minions[loc];
            if (!minions) return false;
            return Object.values(minions).reduce((a, b) => a + b, 0) > 0;
        });
    },
    
});
