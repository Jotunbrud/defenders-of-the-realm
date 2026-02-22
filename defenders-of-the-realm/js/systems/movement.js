// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Movement System & Hero Display
// ═══════════════════════════════════════════════════════════════

Object.assign(game, {
    handleMovementClick(locationName) {
        console.log(`[MOVEMENT] ========== handleMovementClick CALLED ==========`);
        console.log(`[MOVEMENT] Location clicked: ${locationName}`);
        
        if (!this.activeMovement) {
            console.log(`[MOVEMENT] No active movement - returning false`);
            return false;
        }
        
        // Sorceress Shape Shifter: block movement to restricted locations
        if (this._isShapeshiftRestricted(locationName)) {
            this.showInfoModal('⚡ Shape Shifter', '<div style="color: #ef4444;">Cannot enter this location while in enemy form!</div><div style="color: #999; margin-top: 5px; font-size: 0.9em;">Monarch City and Inns are restricted when shape shifted.</div>');
            return true; // Consumed the click
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // Magic Gate teleportation - check against valid destinations list
        if (this.activeMovement.movementType === 'Magic Gate') {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Magic Gate destination`);
                return false;
            }
            
            console.log(`[MOVEMENT] ✅ TELEPORTING from ${hero.location} to ${locationName}`);
            
            const oldLocation = hero.location;
            hero.location = locationName;
            
            // Discard the Magic Gate card
            const card = hero.cards[this.activeMovement.cardIndex];
            hero.cards.splice(this.activeMovement.cardIndex, 1);
            this.heroDiscardPile++;
            this.actionsRemaining--;
            
            this.addLog(`${hero.name} used 🌀 Magic Gate card to teleport: ${oldLocation} → ${locationName} (discarded ${card.name})`);
            
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
            
            // Update everything
            this.renderTokens();
            this.renderHeroes();
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
            
            return true;
        }
        
        // Wizard Teleport - any location, no card discard
        if (this.activeMovement.isWizardTeleport) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Wizard Teleport destination`);
                return false;
            }
            
            console.log(`[MOVEMENT] ✅ WIZARD TELEPORTING from ${hero.location} to ${locationName}`);
            
            const oldLocation = hero.location;
            hero.location = locationName;
            this.actionsRemaining--;
            
            this.wizardTeleportUsedThisTurn = true;
            this.addLog(`${hero.name} teleported to ${locationName} (wizard ability - no card consumed)`);
            
            // Clean up movement state
            this.activeMovement = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicator2 = document.getElementById('movement-indicator');
            if (indicator2) indicator2.remove();
            
            // Re-enable map dragging
            const boardContainer2 = document.getElementById('board-container');
            if (boardContainer2) {
                boardContainer2.style.cursor = 'grab';
                boardContainer2.style.pointerEvents = 'auto';
            }
            
            // Update everything
            this.renderTokens();
            this.renderHeroes();
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
            
            // Check for combat
            this.checkForCombatAtLocation(locationName);
            
            return true;
        }
        
        // Special Magic Gate - place gate at clicked location
        if (this.activeMovement.isSpecialMagicGate) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Magic Gate placement location`);
                return false;
            }
            
            const cardInfo = this.specialMagicGateCard;
            if (!cardInfo) return false;
            
            const cardHero = this.heroes[cardInfo.heroIndex];
            const card = cardHero.cards[cardInfo.cardIndex];
            if (!card) return false;
            
            console.log(`[MOVEMENT] ✅ Placing Special Magic Gate at ${locationName}`);
            
            // Place the magic gate
            const locData = this.locationCoords[locationName];
            locData.magicGate = true;
            locData.builtGate = true;
            
            // Remove card from hero's hand (played — removed from game)
            this._playSpecialCard(cardHero, cardInfo.cardIndex);
            this.updateDeckCounts();
            
            this.addLog(`🌟 Special Card: ${cardHero.name} plays Magic Gate to create a gate at ${locationName}! (No action used)`);
            
            // Clean up movement state
            this.activeMovement = null;
            this.specialMagicGateCard = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicator3 = document.getElementById('movement-indicator');
            if (indicator3) indicator3.remove();
            
            // Re-enable map dragging
            const boardContainer3 = document.getElementById('board-container');
            if (boardContainer3) {
                boardContainer3.style.cursor = 'grab';
                boardContainer3.style.pointerEvents = 'auto';
            }
            
            // Re-render map to show new gate icon
            this.renderMap();
            this.renderTokens();
            this.renderHeroes();
            this.updateGameStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
            
            // Show confirmation
            this.showInfoModal('💫 Magic Gate Placed!', `
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🌀</div>
                    <div style="color: #9333ea; font-size: 1.1em; font-weight: bold;">Magic Gate created at ${locationName}!</div>
                    <div style="color: #d4af37; margin-top: 8px; font-size: 0.9em;">Card played from ${cardHero.symbol} ${cardHero.name}'s hand — No action used</div>
                </div>
            `);
            
            return true;
        }
        
        // Special Move Hero (Hammer of Valor) - move selected hero to clicked location
        if (this.activeMovement.isSpecialMoveHero) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Hammer of Valor destination`);
                return false;
            }
            
            const moveInfo = this.specialMoveHeroCard;
            if (!moveInfo) return false;
            
            const cardHero = this.heroes[moveInfo.heroIndex];
            const card = cardHero.cards[moveInfo.cardIndex];
            const targetHero = this.heroes[moveInfo.targetHeroIndex];
            if (!card || !targetHero) return false;
            
            const oldLocation = targetHero.location;
            console.log(`[MOVEMENT] ✅ Hammer of Valor: Moving ${targetHero.name} from ${oldLocation} to ${locationName}`);
            
            // Move the target hero
            targetHero.location = locationName;
            
            // Remove card from card holder's hand (played — removed from game)
            this._playSpecialCard(cardHero, moveInfo.cardIndex);
            this.updateDeckCounts();
            
            this.addLog(`🔨 Special Card: ${cardHero.name} plays Hammer of Valor to move ${targetHero.name} from ${oldLocation} to ${locationName}! (No action used)`);
            
            // Clean up movement state
            this.activeMovement = null;
            this.specialMoveHeroCard = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicator4 = document.getElementById('movement-indicator');
            if (indicator4) indicator4.remove();
            
            // Re-enable map dragging
            const boardContainer4 = document.getElementById('board-container');
            if (boardContainer4) {
                boardContainer4.style.cursor = 'grab';
                boardContainer4.style.pointerEvents = 'auto';
            }
            
            // Update everything
            this.renderTokens();
            this.renderHeroes();
            this.updateMapStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
            
            // Show confirmation
            this.showInfoModal('🔨 Hero Moved!', `
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 10px;">${targetHero.symbol}</div>
                    <div style="color: #9333ea; font-size: 1.1em; font-weight: bold;">${targetHero.name} moved to ${locationName}!</div>
                    <div style="color: #d4af37; margin-top: 8px; font-size: 0.9em;">Card played from ${cardHero.symbol} ${cardHero.name}'s hand — No action used</div>
                </div>
            `);
            
            // Check for combat at destination for the moved hero
            if (moveInfo.targetHeroIndex === this.currentPlayerIndex) {
                this.checkForCombatAtLocation(locationName);
            }
            
            return true;
        }
        
        // Special Purify (Spell of Purity) - remove all taint from clicked location
        if (this.activeMovement.isSpecialPurify) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Spell of Purity location`);
                return false;
            }
            
            const purifyInfo = this.specialPurifyCard;
            if (!purifyInfo) return false;
            
            const cardHero = this.heroes[purifyInfo.heroIndex];
            const card = cardHero.cards[purifyInfo.cardIndex];
            if (!card) return false;
            
            const crystalsRemoved = this.taintCrystals[locationName] || 0;
            console.log(`[MOVEMENT] ✅ Spell of Purity: Removing ${crystalsRemoved} taint crystal(s) from ${locationName}`);
            
            // Remove all taint crystals from location
            this.taintCrystalsRemaining += crystalsRemoved;
            delete this.taintCrystals[locationName];
            
            // Remove card from card holder's hand (played — removed from game)
            this._playSpecialCard(cardHero, purifyInfo.cardIndex);
            this.updateDeckCounts();
            
            this.addLog(`✨ Special Card: ${cardHero.name} plays Spell of Purity — removed ${crystalsRemoved} Taint Crystal${crystalsRemoved !== 1 ? 's' : ''} from ${locationName}! (No action used)`);
            
            // Clean up movement state
            this.activeMovement = null;
            this.specialPurifyCard = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicator5 = document.getElementById('movement-indicator');
            if (indicator5) indicator5.remove();
            
            // Re-enable map dragging
            const boardContainer5 = document.getElementById('board-container');
            if (boardContainer5) {
                boardContainer5.style.cursor = 'grab';
                boardContainer5.style.pointerEvents = 'auto';
            }
            
            // Update everything
            this.renderMap();
            this.renderTokens();
            this.renderHeroes();
            this.updateGameStatus();
            this.updateMovementButtons();
            this.updateActionButtons();
            
            // Show confirmation
            this.showInfoModal('✨ Land Purified!', `
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 10px;">✨</div>
                    <div style="color: #9333ea; font-size: 1.1em; font-weight: bold;">${crystalsRemoved} Taint Crystal${crystalsRemoved !== 1 ? 's' : ''} removed from ${locationName}!</div>
                    <div style="color: #d4af37; margin-top: 8px; font-size: 0.9em;">Card played from ${cardHero.symbol} ${cardHero.name}'s hand — No action used</div>
                </div>
            `);
            
            return true;
        }
        
        // Elven Archers - remove all minions from clicked green location
        if (this.activeMovement.isElvenArchers) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Elven Archers target`);
                return false;
            }
            
            const state = this.elvenArchersState;
            if (!state) return false;
            
            // Count and remove all minions at this green location
            const minionsHere = this.minions[locationName];
            let totalRemoved = 0;
            const factionDetails = [];
            
            if (minionsHere) {
                const factionNames = { 'red': 'Demons', 'blue': 'Dragonkin', 'green': 'Orcs', 'black': 'Undead' };
                const factionColors = { 'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'black': '#6b7280' };
                for (let [color, count] of Object.entries(minionsHere)) {
                    if (count > 0) {
                        factionDetails.push(`<span style="color: ${factionColors[color] || '#999'};">${count} ${factionNames[color] || color}</span>`);
                        totalRemoved += count;
                        minionsHere[color] = 0;
                    }
                }
            }
            
            console.log(`[MOVEMENT] ✅ Elven Archers: Cleared ${totalRemoved} minion(s) from ${locationName}`);
            
            state.results.push({
                location: locationName,
                details: totalRemoved > 0 ? `${totalRemoved} minion${totalRemoved !== 1 ? 's' : ''} removed (${factionDetails.join(', ')})` : 'No minions'
            });
            state.usesRemaining--;
            
            // Update map immediately
            this.renderMap();
            this.renderTokens();
            this.renderHeroes();
            this.updateGameStatus();
            
            // Clean up current movement state before potentially re-entering
            this.activeMovement = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicatorEA = document.getElementById('movement-indicator');
            if (indicatorEA) indicatorEA.remove();
            
            // Continue to next use or finish
            this._startElvenArchersHighlight();
            
            return true;
        }
        
        // King's Guard Attack: open minion picker at clicked location
        if (this.activeMovement.isKingsGuard) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid King's Guard target`);
                return false;
            }
            
            if (!this.kingsGuardState) return false;
            
            // Clean up highlights
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicatorKG = document.getElementById('movement-indicator');
            if (indicatorKG) indicatorKG.remove();
            
            // Open the minion picker for this location
            this._kingsGuardShowPicker(locationName);
            return true;
        }
        
        // Cavalry Sweep: open minion picker at clicked location
        if (this.activeMovement.isCavalrySweep) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Cavalry Sweep target`);
                return false;
            }
            
            if (!this.cavalrySweepState) return false;
            
            // Clean up highlights but keep activeMovement alive for state
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicatorCS = document.getElementById('movement-indicator');
            if (indicatorCS) indicatorCS.remove();
            
            // Open the minion picker for this location
            this._cavalrySweepShowPicker(locationName);
            return true;
        }
        
        // Turn Undead: open picker at clicked location
        if (this.activeMovement.isTurnUndead) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                console.log(`[MOVEMENT] ❌ Not a valid Turn Undead target`);
                return false;
            }
            
            if (!this.turnUndeadState) return false;
            
            // Clean up highlights but keep activeMovement alive for state
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicatorTU = document.getElementById('movement-indicator');
            if (indicatorTU) indicatorTU.remove();
            
            // Open the picker for this target location
            this._turnUndeadShowPicker(locationName);
            return true;
        }
        
        // Battle Strategy — Minion Phase: clear all minions from clicked location
        if (this.activeMovement.isBattleStrategyMinions) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                return false;
            }
            
            const state = this.battleStrategyState;
            if (!state) return false;
            
            const minionsHere = this.minions[locationName];
            let totalRemoved = 0;
            const factionDetails = [];
            
            if (minionsHere) {
                const factionNames = { 'red': 'Demons', 'blue': 'Dragonkin', 'green': 'Orcs', 'black': 'Undead' };
                const factionColors = { 'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'black': '#6b7280' };
                for (let [color, count] of Object.entries(minionsHere)) {
                    if (count > 0) {
                        factionDetails.push(`<span style="color: ${factionColors[color] || '#999'};">${count} ${factionNames[color] || color}</span>`);
                        totalRemoved += count;
                        minionsHere[color] = 0;
                    }
                }
            }
            
            state.minionResults.push({
                location: locationName,
                details: `${totalRemoved} minion${totalRemoved !== 1 ? 's' : ''} removed (${factionDetails.join(', ')})`
            });
            state.minionsUsesRemaining--;
            
            this.renderMap();
            this.renderTokens();
            this.renderHeroes();
            this.updateGameStatus();
            
            // Clean up current movement state
            this.activeMovement = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicatorBS = document.getElementById('movement-indicator');
            if (indicatorBS) indicatorBS.remove();
            
            // Continue minion phase or move to general phase
            this._startBattleStrategyMinionPhase();
            
            return true;
        }
        
        // Battle Strategy — General Phase: push selected general back
        if (this.activeMovement.isBattleStrategyGeneral) {
            if (!this.activeMovement.validDestinations || !this.activeMovement.validDestinations.includes(locationName)) {
                return false;
            }
            
            const state = this.battleStrategyState;
            if (!state) return false;
            
            // Find general at this location
            const general = this.generals.find(g => g.location === locationName && !g.defeated);
            if (!general) return false;
            
            const prevLoc = this._getGeneralPreviousLocation(general);
            if (!prevLoc) return false;
            
            const oldLocation = general.location;
            general.location = prevLoc;
            
            state.generalResult = {
                name: general.name,
                color: general.color,
                from: oldLocation,
                to: prevLoc
            };
            
            this.addLog(`🛡️ ${general.name} PUSHED BACK: ${oldLocation} → ${prevLoc} (Battle Strategy)`);
            
            // Clean up and finish
            this.activeMovement = null;
            document.querySelectorAll('.location-highlight').forEach(el => el.remove());
            const indicatorBSG = document.getElementById('movement-indicator');
            if (indicatorBSG) indicatorBSG.remove();
            
            const boardContainerBSG = document.getElementById('board-container');
            if (boardContainerBSG) { boardContainerBSG.style.cursor = 'grab'; boardContainerBSG.style.pointerEvents = 'auto'; }
            
            this._finishBattleStrategy();
            
            return true;
        }
        
        // Check if hero has mysteriously moved from start location
        if (hero.location !== this.activeMovement.startLocation && this.activeMovement.movesRemaining === this.activeMovement.maxMoves) {
            console.error(`[MOVEMENT] 🚨 BUG DETECTED! Hero moved from ${this.activeMovement.startLocation} to ${hero.location} WITHOUT going through movement system!`);
            console.error(`[MOVEMENT] This is the FIRST click (movesRemaining = maxMoves), but hero already moved!`);
            // Reset hero to correct location
            hero.location = this.activeMovement.startLocation;
            console.log(`[MOVEMENT] Reset hero back to ${this.activeMovement.startLocation}`);
            this.renderTokens();
        }
        
        console.log(`[MOVEMENT] Click on ${locationName}`);
        console.log(`[MOVEMENT] Hero currently at: ${hero.location}`);
        console.log(`[MOVEMENT] Moves remaining BEFORE: ${this.activeMovement.movesRemaining}`);
        
        // Check if location is reachable
        const reachable = this.getConnectedLocations(hero.location);
        console.log(`[MOVEMENT] Reachable from ${hero.location}:`, reachable);
        console.log(`[MOVEMENT] Is ${locationName} in reachable list?`, reachable.includes(locationName));
        
        if (!reachable.includes(locationName)) {
            console.log(`[MOVEMENT] ❌ NOT REACHABLE - movement not consumed`);
            return false; // Not reachable, don't consume the click
        }
        
        console.log(`[MOVEMENT] ✅ MOVING from ${hero.location} to ${locationName}`);
        
        // Move hero
        const oldLocation = hero.location;
        hero.location = locationName;
        this.activeMovement.movesRemaining--;
        
        console.log(`[MOVEMENT] Moves remaining AFTER: ${this.activeMovement.movesRemaining}`);
        
        this.addLog(`${hero.name} moved: ${oldLocation} → ${locationName} (${this.activeMovement.movementType}: ${this.activeMovement.movesRemaining} moves left)`);
        
        // Update map
        this.renderTokens();
        
        // Update map header info
        this.updateMapStatus();
        
        // Check if movement is complete
        if (this.activeMovement.movesRemaining <= 0) {
            console.log(`[MOVEMENT] 🏁 Movement complete!`);
            this.completeMovement();
            return true;
        }
        
        // Update indicator and highlights for NEXT move
        console.log(`[MOVEMENT] 🔄 Updating for next move...`);
        this.showMovementIndicator();
        this.highlightReachableLocations();
        
        return true; // Movement consumed the click
    },
    
    completeMovement() {
        if (!this.activeMovement) return;
        
        const hero = this.heroes[this.currentPlayerIndex];
        const movement = this.activeMovement;
        
        // Discard the card (only if not foot movement)
        if (movement.cardIndex >= 0 && movement.cardUsed) {
            hero.cards.splice(movement.cardIndex, 1);
            this.heroDiscardPile++;
        }
        
        // Use action
        this.actionsRemaining--;
        
        // Log appropriate message
        if (movement.cardUsed) {
            this.addLog(`${hero.name} completed ${movement.movementType} movement using ${movement.cardUsed.icon} ${movement.cardUsed.name}`);
        } else {
            this.addLog(`${hero.name} completed ${movement.movementType} movement`);
        }
        
        // Clear movement state
        this.clearMovementMode();
        
        // Update display
        this.updateGameStatus();
        this.renderHeroes();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            
            // Update movement buttons since card was used or action consumed
            this.updateMovementButtons();
            this.updateActionButtons();
        }
        
        // Check for combat
        this.checkForCombatAtLocation(hero.location);
    },
    
    cancelMovement() {
        if (!this.activeMovement) return;
        
        // Special handling for Elven Archers - card already consumed, finish with results so far
        if (this.activeMovement.isElvenArchers && this.elvenArchersState) {
            this._finishElvenArchers();
            return;
        }
        
        // Special handling for Battle Strategy - card already consumed, finish with results so far
        if ((this.activeMovement.isBattleStrategyMinions || this.activeMovement.isBattleStrategyGeneral) && this.battleStrategyState) {
            this._finishBattleStrategy();
            return;
        }
        
        // Special handling for Cavalry Sweep - card already consumed, finish with results so far
        if (this.activeMovement.isCavalrySweep && this.cavalrySweepState) {
            this._finishCavalrySweep();
            return;
        }
        
        // Turn Undead cannot be cancelled - must move all undead
        if (this.activeMovement.isTurnUndead && this.turnUndeadState) {
            this.showInfoModal('⚠️', '<div>You must move all Undead minions before ending your turn!</div>');
            return;
        }
        
        // Special handling for King's Guard - card already consumed, finish with results so far
        if (this.activeMovement.isKingsGuard && this.kingsGuardState) {
            this._finishKingsGuard();
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        
        // If any moves were made, we still consumed the action and card
        if (this.activeMovement.movesRemaining < this.activeMovement.maxMoves) {
            // Discard the card (only if there is one)
            if (this.activeMovement.cardIndex >= 0 && this.activeMovement.cardUsed) {
                hero.cards.splice(this.activeMovement.cardIndex, 1);
                this.heroDiscardPile++;
            }
            
            // Use action
            this.actionsRemaining--;
            
            this.addLog(`${hero.name} cancelled ${this.activeMovement.movementType} movement (action used)`);
            
            // Update display
            this.updateGameStatus();
            this.renderHeroes();
            
            // Update map
            const mapModal = document.getElementById('map-modal');
            if (mapModal && mapModal.classList.contains('active')) {
                const mapActionsLeft = document.getElementById('map-actions-left');
                if (mapActionsLeft) {
                    mapActionsLeft.textContent = this.actionsRemaining;
                }
                
                // Update action buttons since action was consumed
                this.updateActionButtons();
            }
        } else {
            // No moves made yet, just cancel
            this.addLog(`${hero.name} cancelled ${this.activeMovement.movementType} movement (no action used)`);
        }
        
        this.clearMovementMode();
    },
    
    clearMovementMode() {
        // Also clear archery targeting if active
        if (this.archeryTargeting) {
            this.archeryTargeting = false;
            this._archeryValidTargets = null;
            const archInd = document.getElementById('archery-indicator');
            if (archInd) archInd.remove();
        }
        
        // Clear quest use mode if active
        if (this.questUseMode) {
            this.clearQuestUseMode();
        }
        
        // Remove movement indicator
        const indicator = document.getElementById('movement-indicator');
        if (indicator) indicator.remove();
        
        // Remove highlights
        document.querySelectorAll('.location-highlight').forEach(el => el.remove());
        
        // Remove quest view highlights
        this._closeQuestView();
        
        // Re-enable map dragging
        const boardContainer = document.getElementById('board-container');
        if (boardContainer) {
            boardContainer.style.cursor = 'grab';
            boardContainer.style.pointerEvents = 'auto';
        }
        
        // Clear state
        this.activeMovement = null;
        this.specialMagicGateCard = null;
        this.specialMoveHeroCard = null;
        this.specialPurifyCard = null;
        this.elvenArchersState = null;
        this.battleStrategyState = null;
        this.cavalrySweepState = null;
        this.turnUndeadState = null;
        this._hammerCard = null;
        this._hammerSelectedHero = null;
    },
    
    getReachableLocations(startLocation, maxDistance) {
        // BFS to find all locations within maxDistance connected by paths
        const visited = new Set();
        const queue = [{ location: startLocation, distance: 0 }];
        const reachable = [];
        
        while (queue.length > 0) {
            const { location, distance } = queue.shift();
            
            if (visited.has(location)) continue;
            visited.add(location);
            
            if (distance > 0 && distance <= maxDistance) {
                reachable.push(location);
            }
            
            if (distance < maxDistance) {
                // Find connected locations (need to define connections based on paths)
                const coords = this.locationCoords[location];
                if (coords) {
                    // For now, get all locations (we'll need to implement path connections)
                    // Temporary: allow movement to any location within range
                    for (let [neighborName, neighborCoords] of Object.entries(this.locationCoords)) {
                        if (neighborName !== location && !visited.has(neighborName)) {
                            const dist = Math.sqrt(
                                Math.pow(coords.x - neighborCoords.x, 2) + 
                                Math.pow(coords.y - neighborCoords.y, 2)
                            );
                            // Consider locations within ~150px as "connected"
                            if (dist <= 150 * (distance + 1)) {
                                queue.push({ location: neighborName, distance: distance + 1 });
                            }
                        }
                    }
                }
            }
        }
        
        return reachable;
    },
    
    showDestinationSelection(cardIndex, destinations, movementType) {
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'destination-modal';
        modal.style.zIndex = '17000';
        
        let locationsHTML = '';
        destinations.forEach(locationName => {
            if (locationName === hero.location) return; // Skip current location
            
            const minionsHere = this.minions[locationName];
            const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;
            const generalHere = this.generals.find(g => g.location === locationName && !g.defeated);
            
            let locationInfo = '';
            if (totalMinions > 0) {
                locationInfo += ` (${totalMinions} minions)`;
            }
            if (generalHere) {
                locationInfo += ` (👹 ${generalHere.name})`;
            }
            
            locationsHTML += `
                <button class="btn btn-primary" onclick="game.executeMovementCard(${cardIndex}, '${locationName.replace(/'/g, "\\'")}')" 
                        style="width: 100%; margin: 5px 0; text-align: left;">
                    📍 ${locationName}${locationInfo}
                </button>
            `;
        });
        
        const typeIcon = movementType === 'Magic Gate' ? '🌀' : movementType === 'Horse' ? '🐎' : '🦅';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <h2 class="modal-title">${typeIcon} Select Destination</h2>
                <p style="text-align: center; color: #d4af37; margin-bottom: 15px;">
                    Using: <strong>${card.icon} ${card.name}</strong>
                </p>
                <div style="margin: 10px 0;">
                    ${locationsHTML}
                </div>
                <button class="btn" onclick="this.closest('.modal').remove()" style="width: 100%; margin-top: 15px;">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    executeMovementCard(cardIndex, destinationLocation) {
        if (this.actionsRemaining <= 0) {
            this.showInfoModal('⚠️', '<div>No actions remaining!</div>');
            return;
        }
        
        const hero = this.heroes[this.currentPlayerIndex];
        const card = hero.cards[cardIndex];
        
        // Remove the card
        hero.cards.splice(cardIndex, 1);
        this.heroDiscardPile++;
        
        // Move hero
        const oldLocation = hero.location;
        hero.location = destinationLocation;
        this.actionsRemaining--;
        
        this.addLog(`${hero.name} used ${card.icon} ${card.type} card to move: ${oldLocation} → ${destinationLocation} (discarded ${card.name})`);
        
        // Close modal
        const modal = document.getElementById('destination-modal');
        if (modal) modal.remove();
        
        // Update display
        this.updateGameStatus();
        this.renderTokens();
        this.renderHeroes();
        
        // Update map if open
        const mapModal = document.getElementById('map-modal');
        if (mapModal && mapModal.classList.contains('active')) {
            this.updateMapStatus();
            
            // Update action buttons since location changed
            this.updateActionButtons();
        }
        
        // Check for combat
        this.checkForCombatAtLocation(destinationLocation);
    },
    
    closeWizardTeleport() {
        document.getElementById('wizard-teleport-modal').classList.remove('active');
    },
    
    showTooltip(message, event) {
        const tooltip = document.getElementById('hover-tooltip');
        
        // Don't show if there's a stationary tooltip open
        if (tooltip.getAttribute('data-stationary') === 'true') {
            return;
        }
        
        const content = document.getElementById('tooltip-content');
        
        content.innerHTML = `<div class="tooltip-stat">${message}</div>`;
        tooltip.classList.add('active');
        tooltip.setAttribute('data-stationary', 'false');
        this.updateTooltipPosition(event);
    },
    
    showHeroesModal() {
        this.renderHeroes();
        document.getElementById('heroes-modal').classList.add('active');
    },
    
    closeHeroesModal(event) {
        // Don't close if clicking on the tooltip
        if (event && event.target.closest('#hover-tooltip')) {
            console.log('Clicked on tooltip, not closing modal');
            return;
        }
        
        if (!event || event.target.id === 'heroes-modal') {
            document.getElementById('heroes-modal').classList.remove('active');
            // Also close the tooltip when closing heroes modal
            this.hideTooltip(true);
        }
    },
    
    showHeroDetail(index) {
        const hero = this.heroes[index];
        const detailContent = document.getElementById('hero-detail-content');
        
        const cardsHTML = hero.cards.length > 0 
            ? hero.cards.map(card => `<div class="card-item">🎴 ${card}</div>`).join('')
            : '<div class="card-item" style="opacity: 0.7;">No cards</div>';
        
        // Eagle Rider attack style indicator
        let attackStyleHTML = '';
        if (hero.name === 'Eagle Rider') {
            const style = this.eagleRiderAttackStyle;
            const skySelected = style === 'sky';
            const groundSelected = style === 'ground';
            const skyBorder = skySelected ? '3px solid #60a5fa' : '1px solid #555';
            const groundBorder = groundSelected ? '3px solid #f59e0b' : '1px solid #555';
            const skyBg = skySelected ? 'rgba(96, 165, 250, 0.2)' : 'rgba(0,0,0,0.2)';
            const groundBg = groundSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0,0,0,0.2)';
            const skyOpacity = skySelected ? '1' : '0.5';
            const groundOpacity = groundSelected ? '1' : '0.5';
            
            attackStyleHTML = `
                <div class="ability-section" style="margin-top: 10px;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px;">🎯 Current Attack Style</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="padding: 10px 12px; border-radius: 8px; border: ${skyBorder}; background: ${skyBg}; opacity: ${skyOpacity};">
                            <div style="font-weight: bold; color: #60a5fa; margin-bottom: 3px;">
                                ${skySelected ? '▶ ' : ''}☁️ Sky Attack
                            </div>
                            <div style="font-size: 0.85em; color: #d4af37;">No end-of-turn penalties (fear, damage, or card loss)</div>
                        </div>
                        <div style="padding: 10px 12px; border-radius: 8px; border: ${groundBorder}; background: ${groundBg}; opacity: ${groundOpacity};">
                            <div style="font-weight: bold; color: #f59e0b; margin-bottom: 3px;">
                                ${groundSelected ? '▶ ' : ''}⚔️ Ground Attack
                            </div>
                            <div style="font-size: 0.85em; color: #d4af37;">Re-roll all dice once per combat (except vs Undead General)</div>
                        </div>
                    </div>
                    ${!style ? '<div style="margin-top: 6px; color: #ef4444; font-size: 0.9em;">⚠️ No style selected yet</div>' : ''}
                </div>
            `;
        }
        
        // Action tokens display for current hero
        const isCurrentHero = index === this.currentPlayerIndex;
        const heroDetailQuestBonus = this._getQuestActionBonus(hero);
        const currentActions = isCurrentHero ? this.actionsRemaining : (hero.health + heroDetailQuestBonus);
        const maxActions = isCurrentHero ? Math.max(hero.health + heroDetailQuestBonus, this.actionsRemaining) : (hero.health + heroDetailQuestBonus);
        let actionTokensHTML = '';
        for (let i = 0; i < maxActions; i++) {
            if (i < currentActions) {
                if (i >= hero.health && i < hero.health + heroDetailQuestBonus) {
                    actionTokensHTML += `<span style="font-size: 1.2em; filter: hue-rotate(300deg);" title="Bonus action (Boots of Speed)">⚡</span>`;
                } else if (i >= hero.health + heroDetailQuestBonus) {
                    const bonusSource = hero.name === 'Eagle Rider' ? 'Fresh Mount' : hero.name === 'Dwarf' ? 'Mountain Lore' : 'Bonus';
                    actionTokensHTML += `<span style="font-size: 1.2em; filter: hue-rotate(180deg);" title="Bonus action (${bonusSource})">⚡</span>`;
                } else {
                    actionTokensHTML += '<span style="font-size: 1.2em;">⚡</span>';
                }
            } else {
                actionTokensHTML += '<span style="font-size: 1.2em; opacity: 0.3; filter: grayscale(100%);">⚡</span>';
            }
        }
        const bonusActionNote = (isCurrentHero && this.actionsRemaining > hero.health) 
            ? `<div style="font-size: 0.8em; color: #0ea5e9; margin-top: 4px;">${heroDetailQuestBonus > 0 ? '📜 Includes Boots of Speed bonus' : hero.name === 'Dwarf' ? '⛏️ Includes Mountain Lore bonus' : '🦅 Includes Fresh Mount bonus'}</div>` 
            : '';
        
        detailContent.innerHTML = `
            <div class="hero-detail-card" style="background: linear-gradient(135deg, ${hero.color}dd 0%, ${hero.color}aa 100%);">
                ${this.getHeroPixelArt(hero.name)}
                <div class="hero-name">${hero.symbol} ${hero.name}</div>
                
                <div class="hero-stats">
                    <div class="stat">
                        <div style="font-size: 1.2em;">❤️</div>
                        <div>Life Tokens</div>
                        <div style="font-size: 1.2em; font-weight: bold;">${hero.health}/${hero.maxHealth}</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 1.2em;">⚡</div>
                        <div>Actions</div>
                        <div style="font-size: 1.2em; font-weight: bold;">${currentActions}/${maxActions}</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 1.2em;">💀</div>
                        <div>Taint</div>
                        <div style="font-size: 1.2em; font-weight: bold;">${hero.taint}</div>
                    </div>
                </div>
                
                <div class="ability-section" style="margin-top: 5px;">
                    <div style="text-align: center;">${actionTokensHTML}</div>
                    ${bonusActionNote}
                </div>
                
                <div class="ability-section">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px;">⚡ Special Ability</div>
                    <div>${hero.ability}</div>
                </div>
                
                ${attackStyleHTML}
                
                <div class="ability-section" style="margin-top: 10px;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">📍 Current Location</div>
                    <div>${hero.location}</div>
                </div>
                
                <div class="cards-section">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px;">🎴 Cards (${hero.cards.length})</div>
                    ${cardsHTML}
                </div>
            </div>
        `;
        
        document.getElementById('heroes-modal').classList.remove('active');
        document.getElementById('hero-detail-modal').classList.add('active');
    },
    
    closeHeroDetail(event) {
        if (!event || event.target.id === 'hero-detail-modal') {
            document.getElementById('hero-detail-modal').classList.remove('active');
        }
    },
    
    toggleLog() {
        const log = document.getElementById('game-log');
        const toggleText = document.getElementById('log-toggle-text');
        
        if (log.style.display === 'none') {
            log.style.display = 'block';
            toggleText.textContent = 'Hide';
        } else {
            log.style.display = 'none';
            toggleText.textContent = 'Show';
        }
    },
    
    showReleaseNotes() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'release-notes-modal';
        modal.style.zIndex = '15000';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <h2 class="modal-title">📋 Release Notes - Version 5.3.0</h2>

                <div style="margin: 20px 0;">
                    <h3 style="color: #ffd700; margin-bottom: 10px;">🎉 MINOR RELEASE - Map Update, GitHub & Netlify Integration</h3>

                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Game Map Update</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Updated game map with improved visual design and layout
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ GitHub Integration</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Integrated project with GitHub repository using Claude Code for streamlined development workflow
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Netlify Deployment</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Deployed game as a web application hosted on Netlify for easy access and sharing
                        </div>
                    </div>

                    <div style="background: rgba(74,222,128,0.1); padding: 15px; border-radius: 8px; border: 1px solid #4ade80; margin-bottom: 15px;">
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            Version 5.3.0 - Minor Release
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                    <button class="btn" style="flex: 1;" onclick="game.showV522ReleaseNotes()">
                        📦 v5.2.2 Release Notes
                    </button>
                    <button class="btn" style="flex: 1;" onclick="game.showV500ReleaseNotes()">
                        📦 v5.0.0 Release Notes
                    </button>
                    <button class="btn" style="flex: 1;" onclick="game.showArchivedReleaseNotes()">
                        📜 Archived Release History
                    </button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    showV522ReleaseNotes() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '16000';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <h2 class="modal-title">📦 v5.2.2 - Quest Cards, All Heroes, Settings & Splash Screen</h2>

                <div style="margin: 20px 0;">
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Quest Card System (24 Cards)</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Full quest deck with 24 unique quest cards drawn at game start and on completion<br>
                            • 4 Magic Item quests with implemented rewards: Amulet of the Gods (+1 combat dice), Boots of Speed (+2 actions), Helm of Power (+1 card draw), War Banner of Valor (ignore defeat penalties)<br>
                            • 2 Taint removal quests: Crystal of Light (remove taint at your location) and Ancient Tree of Magic (remove taint anywhere on the map)<br>
                            • 18 placeholder quests with unique names, locations, flavor text, and varying difficulty<br>
                            • Quest cards viewable on map with location highlighting and pulsing indicators<br>
                            • Dice roll mechanic with success/failure modals and Visions of Darkness reroll support<br>
                            • Magic item bonuses displayed consistently across all combat modals (solo, group, reroll screens)<br>
                            • War Banner protects against Hero Defeated penalties in both solo and group combat
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ All 9 Heroes Added</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Full roster: Paladin, Wizard, Ranger, Eagle Rider, Dwarf, Sorceress, Cleric, Barbarian, Rogue<br>
                            • Each hero has unique abilities, stats, and special combat mechanics<br>
                            • Drag-and-drop hero selection on setup screen with 9 available heroes for up to 4 player slots<br>
                            • Hero-specific combat skills: Eagle Rider Sky/Ground attack, Dwarf Dragon Slayer reroll, Barbarian rage, and more
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Game Settings Modal</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Accessible from the main header via ⚙️ Settings button<br>
                            • Toggle individual lose conditions on/off: General reaches Monarch City, Monarch City overrun, 12 Tainted Crystals, Minion exhaustion<br>
                            • Disable overrun rule (caps minions at 3 per location with no spread)<br>
                            • Lock war tracker at Early War (prevents escalation to Mid/Late War)<br>
                            • Confirm/Cancel workflow — changes only apply when confirmed<br>
                            • All setting changes logged to game log
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Splash Screen</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Animated splash screen on game load with logo and version badge<br>
                            • Fade-in title and subtitle with staggered animation<br>
                            • Click or tap anywhere to proceed to game setup
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },
    
    showV500ReleaseNotes() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '16000';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <h2 class="modal-title">📦 v5.0.0 - General Healing, Full Cards & Game Setup</h2>
                
                <div style="margin: 20px 0;">
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ General Wounds & Healing System</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Minor Wounds (amber): Default when general is damaged but survives<br>
                            • Major Wounds (red): Gorgutt at ≤2 HP, Balazarg at ≤1 HP — blocks advancement<br>
                            • Healing countdown: Minor heals after 2 turns, Major after full round + 1<br>
                            • Heals +1 HP per turn once countdown expires until fully healed<br>
                            • Wound type dynamically updates as health changes<br>
                            • Sapphire excluded (Regeneration), Varkolak always minor wounds<br>
                            • Wound status displayed on general panels, map tooltips, and darkness preview
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Full Hero Card Deck (16 Special Cards)</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • 💫 Magic Gate, 🔨 Hammer of Valor, ✨ Spell of Purity<br>
                            • 🏹 Elven Archers, ⚔️ Battle Strategy, 🌅 All Is Quiet<br>
                            • 🍀 Battle Luck (×2), 💥 Battle Fury, 📜 Local Information<br>
                            • 👑 King's Guard Attack, 🐎 Cavalry Sweep, 🔮 Dark Visions<br>
                            • 🛡️ Militia Secures Area, 🏰 Strong Defenses (Night Phase passives)<br>
                            • 👤 Spy In The Camp (Step 1 passive — block general healing)<br>
                            • Played specials permanently removed from game (not reshuffled)<br>
                            • Reshuffle correctly excludes held + played specials
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Full Darkness Spreads Deck</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • 46 regular cards with dual minion placements + general movement<br>
                            • 3 All Is Quiet cards — no minions spawn, no generals move<br>
                            • 4 Orc Patrol cards — add green minions to empty green locations<br>
                            • 2 Orc War Party cards — reinforce locations with exactly 1 orc<br>
                            • 1 Monarch City special — place 1 minion of each adjacent color
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">✅ Game Setup Rules</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Generals Take Position modal — shows starting locations, minions, and taint<br>
                            • Initial Darkness Spreads — Phase 1: 3 cards × 2 minions per location<br>
                            • Initial Darkness Spreads — Phase 2: 3 cards × 1 minion per location<br>
                            • Overrun-safe draws (cards causing ≥4 minions discarded and redrawn)<br>
                            • Darkness deck fully reshuffled after setup completes
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #fbbf24; font-weight: bold; margin-bottom: 8px;">🐛 Bug Fixes & Improvements</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Fixed NaN minion display from sparse minion objects during setup<br>
                            • Fixed duplicate special cards appearing after deck reshuffle<br>
                            • Fixed healing countdown timing (was healing on attacker's own turn)<br>
                            • Location popup Foot button now uses interactive walking mode<br>
                            • Consistent taint crystal display across all modals
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    showArchivedReleaseNotes() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '16000';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <h2 class="modal-title">📜 Archived Release History</h2>
                
                <div style="margin: 20px 0;">
                    
                    <div style="padding: 15px; background: rgba(255,215,0,0.15); border: 2px solid #ffd700; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #ffd700; font-weight: bold; font-size: 1.1em; margin-bottom: 10px;">v4.0.0 — War Status & Darkness Overhaul</div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin-bottom: 5px;">War Status System</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Three-phase war progression: Early → Mid → Late War<br>
                            • Escalating darkness: 1/2/3 cards per Night Phase<br>
                            • Mid War after 1st general defeated, Late War after 3rd<br>
                            • Extra cards are general-advance-only (minion placements skipped)
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">Night Phase Card-by-Card Flow</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Darkness cards shown one at a time with preview before resolution<br>
                            • Preview shows predicted outcomes (overrun, taint, general advance)<br>
                            • Multi-card draws show "Card X of Y" with mode indicator
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">3-Phase Turn Structure</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Step 1 — Daytime: Minion damage at hero's location<br>
                            • Step 2 — Evening: Draw 2 hero cards, hand limit of 10<br>
                            • Step 3 — Night: Darkness Spreads card-by-card resolution
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">New Gameplay Mechanics</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Overrun Rule: 4th minion spreads to connected locations<br>
                            • Build Magic Gate action (spend action + cards)<br>
                            • Dual-mode Magic Gate travel<br>
                            • Hand limit of 10 cards with discard selection<br>
                            • 25-minion exhaustion lose condition per faction<br>
                            • Per-condition lose tracking with Continue Game option
                        </div>
                    </div>
                    
                    <div style="padding: 15px; background: rgba(255,215,0,0.15); border: 2px solid #ffd700; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #ffd700; font-weight: bold; font-size: 1.1em; margin-bottom: 10px;">v3.1.0 — Group Attack System</div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin-bottom: 5px;">Group Attack on Generals</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Multiple heroes coordinate attacks on the same general<br>
                            • Initiating hero spends action but doesn't need matching cards<br>
                            • Sequential card selection with faction-based filtering<br>
                            • Combined damage applied as single attack<br>
                            • Only contributing heroes share rewards/penalties<br>
                            • Auto-converts to solo attack if only 1 hero participates
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">General Combat Skills</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Balazarg — Demonic Curse: Roll D6 per card, discard on 1<br>
                            • Gorgutt — Parry: Each 1 rolled eliminates 1 hit<br>
                            • Varkolak — No Re-rolls: Blocks special abilities<br>
                            • Sapphire — Regeneration: Heals to full if not one-shot
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">Hero Defeated Penalties</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Balazarg: D3 wounds + ALL cards<br>
                            • Gorgutt: 2 wounds + 2 cards<br>
                            • Varkolak: D6 wounds + D6 cards<br>
                            • Sapphire: 3 wounds + D6 cards<br>
                            • Card discard modal for player choice<br>
                            • Paladin's Aura / Dwarf's Armor reduces penalty wounds by 1
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">Unified Penalty System</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • ALL attacks show penalty modal before applying damage<br>
                            • Consistent experience for solo, group, and converted attacks
                        </div>
                        
                        <div style="color: #d4af37; font-weight: bold; margin: 10px 0 5px 0;">UI/UX Improvements</div>
                        <div style="font-size: 0.9em; color: #d4af37; line-height: 1.5;">
                            • Health renamed to Life Tokens<br>
                            • Faction-specific minion icons<br>
                            • Dice roll visualization with color coding<br>
                            • General info display on main screen<br>
                            • Faction-based card filtering
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v2.4.1</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • Fixed map view real-time updates (hero tokens, action counter)<br>
                            • Fixed mobile tooltip positioning during zoom/pan<br>
                            • Added minion count display<br>
                            • Added defeated general messaging in Darkness Spreads<br>
                            • Added "Next Location" wild card indicator<br>
                            • Restructured main screen layout
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v2.4</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • Fixed taint crystal placement (max 3 minions per location)<br>
                            • Card selection modal for taint removal<br>
                            • Deck reshuffling when empty<br>
                            • Attack buttons on general tooltips<br>
                            • 4 Orc Patrol special cards
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v2.3</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • Darkness Spreads card back image<br>
                            • Wizard teleport works with any card<br>
                            • 3 "All is Quiet" safe cards
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v2.2</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • End-of-turn modal with damage summary<br>
                            • Fixed hero action reset<br>
                            • Minion placement rules (Minions 3 only when general moves)
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v2.1</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • Map animations for darkness events<br>
                            • General movement blocking logic<br>
                            • Complete game logging
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v2.0</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • Excel-validated darkness deck (46 official cards)<br>
                            • Hero abilities properly implemented<br>
                            • Taint crystal mechanics
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 10px;">
                        <div style="color: #999; font-weight: bold; margin-bottom: 5px;">v1.0</div>
                        <div style="font-size: 0.9em; color: #999; line-height: 1.5;">
                            • Initial release with basic gameplay<br>
                            • Map-based movement and combat<br>
                            • 4 playable heroes with unique abilities
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary" style="margin-top: 15px; width: 100%;" onclick="this.closest('.modal').remove()">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    showTips() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '15000';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <button onclick="this.closest('.modal').remove()" class="modal-close-btn">×</button>
                <h2 class="modal-title">💡 Gameplay Tips & Controls</h2>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #ffd700; margin-bottom: 10px;">🗺️ Map Controls</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Desktop</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>Scroll wheel:</strong> Zoom in/out<br>
                            • <strong>Click & drag:</strong> Pan the map<br>
                            • <strong>Click locations:</strong> View details and take actions<br>
                            • <strong>Reset View button:</strong> Return to default zoom
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Mobile</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>Pinch:</strong> Zoom in/out<br>
                            • <strong>Drag with one finger:</strong> Pan the map<br>
                            • <strong>Tap locations:</strong> View details and take actions<br>
                            • <strong>Reset View button:</strong> Return to default zoom
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">⚔️ Combat Tips</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Attacking Minions</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Must clear ALL minions before attacking generals<br>
                            • Each minion defeated on a 5 or 6 (d6)<br>
                            • Use matching color cards for +1 die per card<br>
                            • Sorceress: Shape Shifter form immune to matching faction wounds<br>
                            • Cleric gets +1 to rolls vs Undead & Demon minions<br>
                            • Ranger gets +1 to rolls in green locations<br>
                            • Ranger can attack minions 1 space away (Archery)
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Attacking Generals</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Location must be clear of minions first<br>
                            • Use matching color cards (1 die per card)<br>
                            • Need 5+ to hit, general has 6 health<br>
                            • When defeated, contributing heroes draw 3 cards each!<br>
                            • Sorceress: Shape Shifter — immune to matching faction minion wounds<br>
                            • Ranger gets +1 to rolls in green locations
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">🎴 Card Management</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Drawing Cards</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>End Turn:</strong> Draw 2 cards automatically<br>
                            • <strong>Draw Card button:</strong> Use 1 action to draw 1 card<br>
                            • <strong>Rumors (at Inn):</strong> Draw 3 cards (2 times per turn max)<br>
                            • <strong>Defeat General:</strong> Contributing heroes draw 3 cards each<br>
                            • Deck auto-reshuffles when empty
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Using Cards</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>Combat:</strong> Matching color = bonus dice<br>
                            • <strong>Movement:</strong> Discard matching color to move<br>
                            • <strong>Taint Removal:</strong> Discard matching color (except Druid/Cleric)<br>
                            • <strong>Wizard Teleport:</strong> Discard ANY card to teleport
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">❤️ Healing</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>Safe locations:</strong> Heal 2 wounds (no enemies)<br>
                            • <strong>Inns:</strong> Full heal (even with enemies!)<br>
                            • <strong>Monarch City:</strong> Full heal (only if safe)<br>
                            • Heal button appears on location tooltips when available
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">💎 Taint Crystals</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>Placement:</strong> 3rd red minion OR location at max (3 minions)<br>
                            • <strong>Removal:</strong> Discard matching color card, roll 2d6, need 5+<br>
                            • <strong>Druid:</strong> No card needed! Just roll 2d6<br>
                            • <strong>Cleric:</strong> Sanctify Land — no card needed! Roll 2d6<br>
                            • <strong>Lose condition:</strong> All 12 taint crystals placed = GAME OVER<br>
                            • Remove button appears on location tooltips
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">🎯 Hero Abilities</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>🛡️ Paladin:</strong> Immune to undead fear damage<br>
                            • <strong>✝️ Cleric:</strong> +1 to rolls vs Undead & Demon minions; Turn Undead at end of turn; Sanctify Land without cards<br>
                            • <strong>🧙‍♂️ Wizard:</strong> Teleport with any card (1 action)<br>
                            • <strong>🧙‍♀️ Sorceress:</strong> Shape Shifter — choose faction form, immune to that faction's minion wounds. Ambush — +2/+1 bonus dice. Visions — +1 die for quests and taint healing<br>
                            • <strong>🌿 Druid:</strong> Remove taint without cards<br>
                            • <strong>🏹 Ranger:</strong> +1 to attack rolls in green locations; Archery attacks minions 1 space away; +1 action in green locations<br>
                            • <strong>🗡️ Rogue:</strong> No minion wound damage at end of turn; extra card draw at treasure chests; Crafty draws 5 at Inn
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">📊 Interface Tips</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • <strong>Deck counters:</strong> Shows cards remaining in each deck<br>
                            • <strong>Click hero cards count:</strong> View your hand<br>
                            • <strong>Click generals:</strong> Attack buttons appear if at same location<br>
                            • <strong>Click locations:</strong> All available actions appear<br>
                            • <strong>Game Log:</strong> Toggle to see complete action history<br>
                            • <strong>Changelog:</strong> See all version updates
                        </div>
                    </div>
                    
                    <h3 style="color: #ffd700; margin-bottom: 10px; margin-top: 20px;">⚠️ Win & Lose Conditions</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #4ade80; font-weight: bold; margin-bottom: 8px;">Win Conditions</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • Defeat all 4 generals (Balazarg, Gorgutt, Varkolak, Sapphire)
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="color: #ef4444; font-weight: bold; margin-bottom: 8px;">Lose Conditions</div>
                        <div style="font-size: 0.95em; color: #d4af37; line-height: 1.6;">
                            • All 12 taint crystals placed on the board<br>
                            • Any general reaches Monarch City<br>
                            • All heroes defeated
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary" style="margin-top: 20px; width: 100%;" onclick="this.closest('.modal').remove()">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    showLocationActions(locationName) {
        const hero = this.heroes[this.currentPlayerIndex];
        const location = this.locationCoords[locationName];
        const minionsHere = this.minions[locationName];
        const generalHere = this.generals.find(g => g.location === locationName && !g.defeated);
        const heroIsHere = hero.location === locationName;

        const totalMinions = minionsHere ? Object.values(minionsHere).reduce((a, b) => a + b, 0) : 0;

        // Build location info
        document.getElementById('location-name-title').textContent = locationName;

        let content = `<div style="margin-bottom: 15px;">`;

        if (location.type === 'city') {
            content += `<div style="color: #ffd700;">👑 Monarch City - The heart of the realm</div>`;
        } else if (location.type === 'inn') {
            content += `<div style="color: #d97706;">🍺 Inn - Rumors action available here</div>`;
        } else if (location.type === 'general') {
            content += `<div style="color: #ef4444;">⚠️ General's Lair</div>`;
        }

        if (generalHere) {
            content += `<div style="margin-top: 8px; padding: 8px; background: rgba(220,38,38,0.2); border-radius: 5px;">
                <strong>👹 ${generalHere.name}</strong> (${generalHere.faction})
                <div>Life Tokens: ${generalHere.health}/${generalHere.maxHealth}</div>
            </div>`;
        }

        if (totalMinions > 0) {
            content += `<div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 5px;">
                <strong>Minions:</strong><br>`;
            for (let [color, count] of Object.entries(minionsHere)) {
                if (count > 0) {
                    const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                    content += `${colorName}: ${count}<br>`;
                }
            }
            content += `</div>`;
        }

        const heroesHere = this.heroes.filter(h => h.location === locationName);
        if (heroesHere.length > 0) {
            content += `<div style="margin-top: 8px;">
                <strong>Heroes here:</strong> ${heroesHere.map(h => h.symbol + ' ' + h.name).join(', ')}
            </div>`;
        }

        content += `</div>`;

        document.getElementById('location-actions-content').innerHTML = content;

        // Build action buttons
        const buttonsDiv = document.getElementById('location-action-buttons');
        buttonsDiv.innerHTML = '';

        if (!heroIsHere) {
            const moveBtn = document.createElement('button');
            moveBtn.className = 'btn btn-primary';
            moveBtn.textContent = '🥾 Foot';
            moveBtn.title = `Move to ${locationName} by foot (1 action)`;
            moveBtn.onclick = () => {
                this.closeLocationActions();
                this.moveToLocation(locationName);
            };
            buttonsDiv.appendChild(moveBtn);

            // Ranger Archery: direct ranged attack at connected location
            if (hero.name === 'Ranger' && totalMinions > 0 && this.actionsRemaining > 0 && this.areLocationsConnected(hero.location, locationName)) {
                const archeryBtn = document.createElement('button');
                archeryBtn.className = 'btn btn-primary';
                archeryBtn.textContent = `🏹 Archery`;
                archeryBtn.onclick = () => {
                    this.closeLocationActions();
                    this.engageMinionsAtLocation(locationName);
                };
                buttonsDiv.appendChild(archeryBtn);
            }
        } else {
            // Hero is at this location
            if (totalMinions > 0) {
                const engageMinionsBtn = document.createElement('button');
                engageMinionsBtn.className = 'btn btn-primary';
                engageMinionsBtn.textContent = '⚔️ Engage Minions';
                engageMinionsBtn.onclick = () => {
                    this.closeLocationActions();
                    this.engageMinionsFromMap();
                };
                buttonsDiv.appendChild(engageMinionsBtn);

                // Wizard Fireball button
                if (hero.name === 'Wizard') {
                    const minionColors = Object.entries(minionsHere).filter(([c, n]) => n > 0).map(([c]) => c);
                    const hasMatchingCard = minionColors.some(color => hero.cards.some(card => card.color === color));
                    if (hasMatchingCard) {
                        const fireballBtn = document.createElement('button');
                        fireballBtn.className = 'btn btn-primary';
                        fireballBtn.style.background = '#dc2626';
                        fireballBtn.textContent = '🔥 Fireball';
                        fireballBtn.onclick = () => {
                            this.closeLocationActions();
                            this.wizardFireball();
                        };
                        buttonsDiv.appendChild(fireballBtn);
                    }
                }
            }

            if (generalHere && totalMinions === 0) {
                const attackGeneralBtn = document.createElement('button');
                attackGeneralBtn.className = 'btn btn-danger';
                attackGeneralBtn.textContent = '👹 Attack General';
                attackGeneralBtn.onclick = () => {
                    this.closeLocationActions();
                    this.attackGeneralFromMap();
                };
                buttonsDiv.appendChild(attackGeneralBtn);
            }

            if (location.type === 'inn') {
                const rumorsBtn = document.createElement('button');
                rumorsBtn.className = 'btn btn-primary';
                rumorsBtn.style.background = '#d97706';
                rumorsBtn.textContent = '🍺 Gather Rumors';
                rumorsBtn.onclick = () => {
                    this.closeLocationActions();
                    this.rumorsAction();
                };
                buttonsDiv.appendChild(rumorsBtn);
            }
        }

        document.getElementById('location-actions-modal').classList.add('active');
    },
});
