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
                const factionHex = { green: '#16a34a', black: '#374151', red: '#dc2626', blue: '#3b82f6' };
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
                const factionHex = { green: '#16a34a', black: '#374151', red: '#dc2626', blue: '#3b82f6' };
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
        // v2: Noble Dwarf shares Mountain Lore with Dwarf
        if (hero.name === 'Dwarf' || hero.name === 'Noble Dwarf') {
            const loc = this.locationCoords[hero.location];
            if (loc && loc.faction === 'red') {
                this.actionsRemaining += 1;
                this.addLog(`⚒️ Mountain Lore: ${hero.name} draws strength from the red mountains of ${hero.location} — +1 action! (${this.actionsRemaining} total)`);
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
        // v2: minimal - no extra verbiage
        if (targetTotal > 0) {
            const parts = [];
            if (targetMinions.green > 0) parts.push(`${targetMinions.green} Orc`);
            if (targetMinions.black > 0) parts.push(`${targetMinions.black} Undead`);
            if (targetMinions.red > 0) parts.push(`${targetMinions.red} Demon`);
            if (targetMinions.blue > 0) parts.push(`${targetMinions.blue} Dragon`);
            targetInfo = `<div class="modal-desc-text" style="font-size:0.8em;color:#3d2b1f;margin-bottom:8px">${parts.join(', ')} (${targetTotal}/${maxCapacity})</div>`;
        }
        
        const spaceNote = '';
        
        // Build quantity selector
        this._turnUndeadTarget = targetLocation;
        this._turnUndeadMoveCount = 0;
        this._turnUndeadSelected = new Set();

        // v2: one pill per undead with checkbox OUTSIDE pill — matching KG outer-flex pattern
        const undeadColor = '#374151';
        const undeadBg = 'rgba(55,65,81,0.1)';
        let pillsHTML = '<div id="tu-minion-list">';
        for (let i = 0; i < maxToMove; i++) {
            pillsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
                    <div id="tu-m-${i}" data-mid="${i}"
                         onclick="game._turnUndeadToggle(${i})"
                         style="flex:1;background:${undeadBg};border:1px solid ${undeadColor};border-radius:5px;padding:5px 10px;cursor:pointer;transition:all 0.15s">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:${undeadColor}"><span class="mdot" style="width:14px;height:14px;background:${undeadColor};margin-right:3px"></span>Undead</span>
                            <span style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810">→ ${targetLocation}</span>
                        </div>
                    </div>
                    <span id="tu-m-${i}-check" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:2px solid ${undeadColor};border-radius:3px;flex-shrink:0;background:transparent;font-size:0.85em;font-weight:900;color:#fff"></span>
                </div>`;
        }
        pillsHTML += '</div>';

        const dieStyle = 'display:inline-flex;align-items:center;justify-content:center;width:50px;height:50px;background:linear-gradient(145deg,#374151,#1f2937);color:#fff;border:2px solid rgba(0,0,0,0.3);border-radius:8px;font-size:1.5em;font-weight:bold;box-shadow:0 3px 6px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.4),0 0 8px rgba(55,65,81,0.25)';
        
        const contentHTML = `
            <div class="modal-title-bar" style="margin-bottom:8px">✝️ Turn Undead</div>
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Move to Location</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.82em;color:#3d2b1f;margin-bottom:8px">Move Undead:</div>
                    <div style="text-align:center;margin-bottom:10px"><div id="tu-remaining-die" style="${dieStyle}">0</div></div>
                    ${pillsHTML}
                </div>
                <div class="card-wrap" style="border-color:#1e3a7a">
                    <div class="card-banner" style="display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:linear-gradient(135deg,#1e3a7acc 0%,#1e3a7a99 100%)">
                        <span class="hero-banner-name">✝️ Turn Undead</span>
                        <span class="hero-banner-name" style="font-size:0.8em">✝️ Cleric</span>
                    </div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Ability:</strong> <span class="modal-desc-text">Move all Undead minions at your location to any adjacent location(s).</span></div>
                    </div>
                </div>
            </div>
            <button id="tu-confirm-btn" class="phb" style="margin-top:12px;opacity:0.4;cursor:not-allowed" disabled onclick="game._turnUndeadConfirm()">Confirm</button>
            <button class="phb phb-cancel" onclick="game._turnUndeadCancelPick()">Back</button>
        `;
        
        this.showInfoModal('✝️ Turn Undead', contentHTML);
        // Hide the default OK button
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv && !defaultBtnDiv.querySelector('#tu-confirm-btn')) defaultBtnDiv.style.display = 'none';
    },
    
    // v2: toggle individual undead pill selection (replaces qty buttons)
    _turnUndeadToggle(minionId) {
        const el = document.getElementById(`tu-m-${minionId}`);
        const check = document.getElementById(`tu-m-${minionId}-check`);
        if (!el) return;

        const undeadColor = '#374151';
        const undeadBg = 'rgba(55,65,81,0.1)';

        if (this._turnUndeadSelected.has(minionId)) {
            // Deselect
            this._turnUndeadSelected.delete(minionId);
            el.style.border = `1px solid ${undeadColor}`;
            el.style.background = undeadBg;
            if (check) { check.textContent = ''; check.style.background = 'transparent'; }
        } else {
            // Select
            this._turnUndeadSelected.add(minionId);
            el.style.border = `2px solid ${undeadColor}`;
            el.style.background = `rgba(55,65,81,0.2)`;
            if (check) { check.textContent = '✓'; check.style.background = undeadColor; }
        }

        const count = this._turnUndeadSelected.size;
        this._turnUndeadMoveCount = count;

        // Update die
        const die = document.getElementById('tu-remaining-die');
        if (die) die.textContent = count;

        // Enable/disable confirm button
        const btn = document.getElementById('tu-confirm-btn');
        if (btn) {
            if (count > 0) {
                btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
            } else {
                btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed';
            }
        }
    },
    
    _turnUndeadCancelPick() {
        this._turnUndeadSelected = new Set();
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
                resultsHTML += `<div style="margin: 5px 0 5px 15px; color: #374151;">
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

    // ── Dwarven Rum ───────────────────────────────────────────
    // fromEndTurn: if true, cancelling skips to _executeEndTurn
    showDwarvenRumModal(fromEndTurn) {
        fromEndTurn = fromEndTurn || false;
        const hero = this.heroes[this.currentPlayerIndex];
        const heroesHere = this.heroes.filter(h => h !== hero && h.health > 0 && h.location === hero.location);
        if (heroesHere.length === 0) {
            if (fromEndTurn) this._executeEndTurn(false);
            return;
        }

        this._dwarvenRumFromEndTurn = fromEndTurn;
        this._dwarvenRumSelected = new Set(); // indices into this.heroes

        // Include Noble Dwarf themselves + co-located heroes
        const participants = [hero, ...heroesHere];

        let heroesHTML = '<div style="display:flex;flex-direction:column;gap:6px">';
        participants.forEach((h, i) => {
            const heroIdx = this.heroes.indexOf(h);
            heroesHTML += `<div id="rum-hero-${heroIdx}" onclick="game._dwarvenRumToggle(${heroIdx})" class="hero-row" style="cursor:pointer">
                <div style="font-size:1.3em">${h.symbol}</div>
                <div style="flex:1;display:flex;align-items:center;justify-content:space-between">
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.9em;color:#3d2b1f">${h.name}</div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.85em;color:#2c1810">${h.location}</div>
                </div>
            </div>`;
        });
        heroesHTML += '</div>';

        const contentHTML = `
            <div class="modal-title-bar" style="margin-bottom:8px">🍻 Dwarven Rum</div>
            <div class="parchment-box">
                <div class="parchment-banner"><span class="hero-banner-name" style="font-size:0.9em">Select Heroes:</span></div>
                <div style="margin-top:10px;margin-bottom:10px">
                    ${heroesHTML}
                </div>
                <div class="card-wrap" style="border-color:#92400e">
                    <div class="card-banner" style="display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:linear-gradient(135deg,#92400ecc 0%,#92400e99 100%)">
                        <span class="hero-banner-name">🍻 Dwarven Rum</span>
                        <span class="hero-banner-name" style="font-size:0.8em">⚒️ Noble Dwarf</span>
                    </div>
                    <div class="card-body">
                        <div style="font-size:0.8em;color:#3d2b1f;line-height:1.5"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:1em;color:#1a0f0a">Ability:</strong> <span class="modal-desc-text">Heroes present <strong>MAY</strong> draw 1 Hero Card. If drawn card matches location color, that hero loses 1 action next turn.</span></div>
                    </div>
                </div>
            </div>
            <button id="rum-confirm-btn" class="phb" style="margin-top:12px;opacity:0.4;cursor:not-allowed" disabled onclick="game._dwarvenRumConfirm()">Confirm</button>
            <button class="phb phb-cancel" onclick="game._dwarvenRumSkip()">Cancel</button>
        `;

        this.showInfoModal('', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';
    },

    _dwarvenRumToggle(heroIdx) {
        const el = document.getElementById(`rum-hero-${heroIdx}`);
        if (!el) return;
        if (this._dwarvenRumSelected.has(heroIdx)) {
            this._dwarvenRumSelected.delete(heroIdx);
            el.style.border = '';
            el.style.background = '';
            el.style.boxShadow = '';
        } else {
            this._dwarvenRumSelected.add(heroIdx);
            el.style.border = '2px solid #d4af37';
            el.style.background = 'rgba(212,175,55,0.2)';
            el.style.boxShadow = '0 0 8px rgba(212,175,55,0.35)';
        }
        const btn = document.getElementById('rum-confirm-btn');
        if (btn) {
            const canConfirm = this._dwarvenRumSelected.size > 0;
            btn.disabled = !canConfirm;
            btn.style.opacity = canConfirm ? '1' : '0.4';
            btn.style.cursor = canConfirm ? 'pointer' : 'not-allowed';
        }
    },

    _dwarvenRumSkip() {
        this.closeInfoModal();
        if (this._dwarvenRumFromEndTurn) {
            this._dwarvenRumFromEndTurn = false;
            this._executeEndTurn(false);
        }
    },

    _dwarvenRumConfirm() {
        this.closeInfoModal();
        this._dwarvenRumUsedThisTurn = true;

        const hero = this.heroes[this.currentPlayerIndex];
        const location = hero.location;
        const locData = this.locationCoords[location];
        const locFaction = locData ? locData.faction : null;
        const locColorHex = { red: '#dc2626', green: '#16a34a', blue: '#3b82f6', black: '#374151' }[locFaction] || '#8b7355';
        const locColorLabel = { red: 'Red', green: 'Green', blue: 'Blue', black: 'Black' }[locFaction] || '';

        // Only process heroes the player selected
        const participants = Array.from(this._dwarvenRumSelected).map(i => this.heroes[i]);

        // Each hero draws 1 card, check if it matches location color
        const results = participants.map(h => {
            const card = this.generateRandomCard();
            const matchesLocation = locFaction && card.color === locFaction;
            if (matchesLocation) {
                // Flag for next turn penalty
                h._dwarvenRumPenalty = (h._dwarvenRumPenalty || 0) + 1;
            } else {
                h.cards.push(card);
            }
            return { hero: h, card, matchesLocation };
        });

        this.renderHeroes();
        this.updateDeckCounts();

        // Build results using same card tile + hero banner pattern as showGeneralRewardModal
        const ccMap = {
            blue: { border: '#3b82f6', text: '#3b82f6' },
            red: { border: '#dc2626', text: '#dc2626' },
            green: { border: '#16a34a', text: '#16a34a' },
            black: { border: '#374151', text: '#374151' },
        };

        let rewardHTML = '';
        results.forEach(r => {
            const cc = r.card.special ? { border: '#6d28a8', text: '#6d28a8' } : (ccMap[r.card.color] || { border: '#6d28a8', text: '#6d28a8' });
            const iconDisplay = r.card.special ? '🌟' : (r.card.icon || '🎴');
            const shadow = r.card.special ? 'box-shadow:0 0 8px rgba(109,40,168,0.4);' : 'box-shadow:0 2px 6px rgba(0,0,0,0.3);';
            const diceHTML = Array.from({ length: r.card.dice }).map(() =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:${cc.border};border-radius:3px;font-size:0.65em;border:1.5px solid rgba(0,0,0,0.3)">🎲</span>`
            ).join('');
            const penaltyBadge = r.matchesLocation
                ? `<div style="font-size:0.75em;line-height:1.5;font-family:'Comic Sans MS',cursive;color:#3d2b1f;margin-top:4px"><strong style="font-family:'Cinzel',Georgia,serif;font-weight:900;color:#b91c1c">🍻 Dwarven Rum:</strong> Loses 1 action next turn</div>`
                : '';
            const cardTile = `
                <div style="flex:1 1 90px;max-width:120px;min-width:80px;background:linear-gradient(135deg,#f0e6d3 0%,#ddd0b8 50%,#c8bb9f 100%);border:3px solid ${cc.border};border-radius:8px;padding:8px 6px;text-align:center;${shadow}">
                    <div style="font-size:1.2em;margin-bottom:2px">${iconDisplay}</div>
                    <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:0.62em;color:${cc.text};line-height:1.2">${r.card.name}</div>
                    <div style="display:flex;justify-content:center;gap:2px;margin-top:4px">${diceHTML}</div>
                </div>`;
            rewardHTML += `
                <div class="parchment-box" style="margin-top:8px">
                    <div class="parchment-banner"><span class="hero-banner-name">${r.hero.symbol} ${r.hero.name} — Card Drawn</span></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:8px 0">
                        ${cardTile}
                    </div>
                    ${penaltyBadge}
                    <div style="text-align:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(139,115,85,0.3)">
                        <span style="font-size:0.82em;color:#2c1810;font-family:'Cinzel',Georgia,serif;font-weight:900">🎴 Total Cards: ${r.hero.cards.length}</span>
                    </div>
                </div>`;
        });

        

        const contentHTML = `
            <div class="modal-title-bar" style="margin-bottom:8px">🍻 Dwarven Rum</div>
            <div style="font-family:'Cinzel',Georgia,serif;font-weight:900;text-align:center;font-size:0.85em;color:#d4af37;margin-bottom:12px">
                DWARVEN RUM AT ${location.toUpperCase()}!<br>
                <span style="font-weight:400;font-size:0.9em;">${results.length} hero${results.length !== 1 ? 'es draw' : ' draws'} 1 card each</span>
            </div>
            ${rewardHTML}
            <button class="phb" style="margin-top:12px" onclick="game._dwarvenRumFinish()">Continue</button>
        `;

        this.showInfoModal('', contentHTML);
        const defaultBtnDiv = document.querySelector('#info-modal .modal-content > div:last-child');
        if (defaultBtnDiv) defaultBtnDiv.style.display = 'none';

        this.addLog(`🍻 Dwarven Rum: ${hero.name} shared drinks at ${location}!`);
    },

    _dwarvenRumFinish() {
        this.closeInfoModal();
        if (this._dwarvenRumFromEndTurn) {
            this._dwarvenRumFromEndTurn = false;
            this._executeEndTurn(false);
        }
    },

});
